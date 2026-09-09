"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api, postSyncAndWait } from "./api";

const SYNC_INTERVAL_MS = 5 * 60 * 1000;
const STORAGE_KEY = "cyclogenai_last_sync";
const STORAGE_STATUS_KEY = "cyclogenai_sync_status";
const AUTO_SYNC_ENABLED_KEY = "cyclogenai_auto_sync_enabled";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export function isAutoSyncEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem("cyclogenai_user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u.autoSyncEnabled !== undefined) return u.autoSyncEnabled;
    }
    const val = localStorage.getItem(AUTO_SYNC_ENABLED_KEY);
    return val === null ? true : val === "true";
  } catch {
    return true;
  }
}

export function setAutoSyncEnabled(enabled: boolean) {
  try {
    const raw = localStorage.getItem("cyclogenai_user");
    if (raw) {
      const u = JSON.parse(raw);
      u.autoSyncEnabled = enabled;
      localStorage.setItem("cyclogenai_user", JSON.stringify(u));
      if (u.email) {
        api.put('/users/' + encodeURIComponent(u.email), { autoSyncEnabled: enabled }).catch(() => {});
      }
    }
    localStorage.setItem(AUTO_SYNC_ENABLED_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent("auto-sync-toggle", { detail: enabled }));
  } catch {}
}

export function getSyncStatus(): SyncStatus {
  if (typeof window === "undefined") return "idle";
  try {
    return (localStorage.getItem(STORAGE_STATUS_KEY) as SyncStatus) || "idle";
  } catch {
    return "idle";
  }
}

export function getLastSyncTimeFormatted(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const ts = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString();
  } catch {
    return null;
  }
}

function setSyncStatus(status: SyncStatus) {
  try {
    localStorage.setItem(STORAGE_STATUS_KEY, status);
    window.dispatchEvent(new CustomEvent("sync-status-change", { detail: status }));
  } catch {}
}

function setLastSyncTime(ts: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(ts));
    window.dispatchEvent(new CustomEvent("sync-completed", { detail: ts }));
    window.dispatchEvent(new CustomEvent("data-refetch"));
  } catch {}
}

/** Kick off background data loading after login or signup (non-blocking). */
export function triggerBackgroundSyncAfterAuth(isSignup = false): void {
  if (typeof window === "undefined") return;

  // Preload AI training plans for new accounts.
  if (isSignup) {
    api.post("/analysis/ensure-plans", {}).catch(() => {});
  }

  const user = (() => {
    try {
      const raw = localStorage.getItem("cyclogenai_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const hasStrava = user?.stravaUpdatedAt || user?.isStravaUpToDate;
  if (hasStrava || !isSignup) {
    triggerGlobalSync().then((ok) => {
      if (ok) window.dispatchEvent(new CustomEvent("notifications-updated"));
    });
  }
}

export async function triggerGlobalSync(): Promise<boolean> {
  const current = getSyncStatus();
  if (current === "syncing") return false;

  try {
    const stored = localStorage.getItem("cyclogenai_user");
    if (!stored) { console.error("Sync failed: no user in localStorage"); throw new Error("Not logged in"); }
    const localUser = JSON.parse(stored);

    if (localUser.email && !localUser._id && !localUser.id) {
      try {
        const fresh = await api.get(`/users/${localUser.email}`);
        Object.assign(localUser, fresh);
        localStorage.setItem("cyclogenai_user", JSON.stringify(localUser));
      } catch (e) {
        console.warn("Could not refresh user data from backend:", e);
      }
    }

    const id = localUser._id || localUser.id;
    if (!id) { console.error("Sync failed: user has no _id or id in localStorage"); throw new Error("User ID missing — log out and log in again"); }
  } catch (e) {
    setSyncStatus("error");
    setTimeout(() => setSyncStatus("idle"), 6000);
    return false;
  }

  setSyncStatus("syncing");
  try {
    await postSyncAndWait("/sync/refresh");
    api.post("/best-efforts/refresh", {}).catch(() => {});
    const now = Date.now();
    setLastSyncTime(now);
    setSyncStatus("success");
    try {
      const syncStatus: any = await api.get("/sync/status");
      const stored = localStorage.getItem("cyclogenai_user");
      if (stored) {
        const user = JSON.parse(stored);
        user.stravaUpdatedAt = syncStatus.updatedAt;
        user.isStravaUpToDate = syncStatus.isUpToDate;
        localStorage.setItem("cyclogenai_user", JSON.stringify(user));
      }
    } catch {}
    setTimeout(() => setSyncStatus("idle"), 4000);
    return true;
  } catch (e) {
    console.error("Sync refresh failed:", e);
    setSyncStatus("error");
    setTimeout(() => setSyncStatus("idle"), 6000);
    return false;
  }
}

async function triggerIncrementalSync(): Promise<boolean> {
  const current = getSyncStatus();
  if (current === "syncing") return false;
  try {
    await postSyncAndWait("/sync/incremental");
    setLastSyncTime(Date.now());
    return true;
  } catch {
    return false;
  }
}

export function useAutoSync() {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus);
  const [lastSynced, setLastSynced] = useState<string | null>(getLastSyncTimeFormatted);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getLastSync = useCallback((): number => {
    if (typeof window === "undefined") return 0;
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    } catch {
      return 0;
    }
  }, []);

  useEffect(() => {
    // Sync immediately on mount (sign-in)
    const last = getLastSync();
    if (!last || Date.now() - last > SYNC_INTERVAL_MS) {
      triggerGlobalSync().then(() => {
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      });
    }

    // Sync every 5 min (analysis happens on backend when new activities found)
    const interval = setInterval(() => {
      triggerIncrementalSync().then((ok) => {
        if (ok) window.dispatchEvent(new CustomEvent("notifications-updated"));
      });
    }, SYNC_INTERVAL_MS);

    timerRef.current = interval;

    const onStatusChange = (e: Event) => {
      setStatus((e as CustomEvent).detail as SyncStatus);
    };
    const onCompleted = () => {
      setLastSynced(getLastSyncTimeFormatted());
    };

    window.addEventListener("sync-status-change", onStatusChange);
    window.addEventListener("sync-completed", onCompleted);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("sync-status-change", onStatusChange);
      window.removeEventListener("sync-completed", onCompleted);
    };
  }, [getLastSync]);

  const manualSync = useCallback(async () => {
    await triggerGlobalSync();
  }, []);

  return { status, lastSynced, triggerSync: manualSync };
}
