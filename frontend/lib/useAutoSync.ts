"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "./api";

const SYNC_INTERVAL_MS = 30 * 60 * 1000;
const STORAGE_KEY = "cycloai_last_sync";
const STORAGE_STATUS_KEY = "cycloai_sync_status";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

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
  } catch {}
}

export async function triggerGlobalSync(): Promise<boolean> {
  const current = getSyncStatus();
  if (current === "syncing") return false;
  setSyncStatus("syncing");
  try {
    await api.post("/sync/refresh", {});
    await api.get("/best-efforts");
    const now = Date.now();
    setLastSyncTime(now);
    setSyncStatus("success");
    setTimeout(() => setSyncStatus("idle"), 4000);
    return true;
  } catch {
    setSyncStatus("error");
    setTimeout(() => setSyncStatus("idle"), 6000);
    return false;
  }
}

async function triggerIncrementalSync(): Promise<boolean> {
  const current = getSyncStatus();
  if (current === "syncing") return false;
  try {
    await api.post("/sync/incremental", {});
    const now = Date.now();
    setLastSyncTime(now);
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
    const last = getLastSync();
    const elapsed = Date.now() - last;
    const shouldAutoSync = last !== 0 && elapsed > SYNC_INTERVAL_MS;

    if (shouldAutoSync) {
      triggerIncrementalSync();
    }

    const interval = setInterval(() => {
      const lastCheck = getLastSync();
      if (Date.now() - lastCheck > SYNC_INTERVAL_MS) {
        triggerIncrementalSync();
      }
    }, SYNC_INTERVAL_MS);

    timerRef.current = interval;

    const onStatusChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as SyncStatus;
      setStatus(detail);
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
