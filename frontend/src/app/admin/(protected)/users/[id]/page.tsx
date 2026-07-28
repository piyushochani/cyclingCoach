"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi } from "../../../../../../lib/admin-api";

interface UserDetail {
  user: Record<string, unknown> & {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    subscriptionTier: string;
    ftp?: number;
    goal?: string;
    lastSyncAt?: string;
    isStravaUpToDate?: boolean;
    autoSyncEnabled?: boolean;
    telegramChatId?: string;
    onboardingSummary?: string;
    createdAt: string;
  };
  counts: { activities: number; races: number; plans: number; notifications: number };
  subscription: Record<string, unknown>;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");

  const load = () => {
    setLoading(true);
    adminApi
      .get<UserDetail>(`/admin/users/${id}`)
      .then(setDetail)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    setActionMsg("");
    try {
      await fn();
      setActionMsg(`${label} succeeded`);
      load();
    } catch (err: unknown) {
      setActionMsg(err instanceof Error ? err.message : `${label} failed`);
    }
  };

  if (loading) return <p className="font-dmSans text-sm text-white/40">Loading user...</p>;
  if (error) return <p className="font-dmSans text-sm text-red-400">{error}</p>;
  if (!detail) return null;

  const { user, counts, subscription } = detail;

  return (
    <div>
      <Link href="/admin/users" className="font-dmSans text-sm text-white/40 hover:text-white">
        &larr; Back to users
      </Link>
      <h1 className="mt-4 font-barlowCondensed text-3xl uppercase tracking-[0.04em] text-white">
        {user.firstName} {user.lastName}
      </h1>
      <p className="font-dmSans text-sm text-white/50">{user.email}</p>

      {actionMsg && (
        <p className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-dmSans text-sm text-white/70">
          {actionMsg}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 p-5">
          <h2 className="font-dmSans text-xs uppercase tracking-[0.14em] text-white/40">Profile</h2>
          <dl className="mt-4 space-y-2 font-dmSans text-sm">
            <div className="flex justify-between"><dt className="text-white/40">Tier</dt><dd>{user.subscriptionTier}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">FTP</dt><dd>{user.ftp ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Goal</dt><dd>{user.goal || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Auto Sync</dt><dd>{user.autoSyncEnabled ? "On" : "Off"}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Strava Up to Date</dt><dd>{user.isStravaUpToDate ? "Yes" : "No"}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Last Sync</dt><dd>{user.lastSyncAt ? new Date(user.lastSyncAt).toLocaleString() : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Telegram</dt><dd>{user.telegramChatId || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Joined</dt><dd>{new Date(user.createdAt).toLocaleDateString()}</dd></div>
          </dl>
        </section>

        <section className="rounded-xl border border-white/10 p-5">
          <h2 className="font-dmSans text-xs uppercase tracking-[0.14em] text-white/40">Counts</h2>
          <dl className="mt-4 space-y-2 font-dmSans text-sm">
            <div className="flex justify-between"><dt className="text-white/40">Activities</dt><dd>{counts.activities}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Races</dt><dd>{counts.races}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Plans</dt><dd>{counts.plans}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Notifications</dt><dd>{counts.notifications}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Sub Status</dt><dd>{String(subscription.status || "active")}</dd></div>
          </dl>
        </section>
      </div>

      {user.onboardingSummary && (
        <section className="mt-6 rounded-xl border border-white/10 p-5">
          <h2 className="font-dmSans text-xs uppercase tracking-[0.14em] text-white/40">Onboarding Summary</h2>
          <p className="mt-3 font-dmSans text-sm text-white/70">{user.onboardingSummary}</p>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-white/10 p-5">
        <h2 className="font-dmSans text-xs uppercase tracking-[0.14em] text-white/40">Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => runAction("Tier change to pro", () =>
              adminApi.patch(`/admin/users/${id}/subscription`, { tier: "pro" })
            )}
            className="rounded-lg border border-[#FF5500]/40 px-4 py-2 font-dmSans text-sm text-[#FF5500]"
          >
            Grant Pro
          </button>
          <button
            type="button"
            onClick={() => runAction("Tier change to free", () =>
              adminApi.patch(`/admin/users/${id}/subscription`, { tier: "free" })
            )}
            className="rounded-lg border border-white/10 px-4 py-2 font-dmSans text-sm text-white/70"
          >
            Revoke Pro
          </button>
          <button
            type="button"
            onClick={() => runAction("Full sync", () => adminApi.post(`/admin/users/${id}/sync`))}
            className="rounded-lg border border-white/10 px-4 py-2 font-dmSans text-sm text-white/70"
          >
            Trigger Full Sync
          </button>
          <button
            type="button"
            onClick={() => runAction("Incremental sync", () =>
              adminApi.post(`/admin/users/${id}/sync/incremental`)
            )}
            className="rounded-lg border border-white/10 px-4 py-2 font-dmSans text-sm text-white/70"
          >
            Trigger Incremental Sync
          </button>
          <button
            type="button"
            onClick={() => runAction("Auto-sync toggle", () =>
              adminApi.patch(`/admin/users/${id}/auto-sync`, { enabled: !user.autoSyncEnabled })
            )}
            className="rounded-lg border border-white/10 px-4 py-2 font-dmSans text-sm text-white/70"
          >
            Toggle Auto Sync
          </button>
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="font-dmSans text-xs uppercase tracking-[0.14em] text-white/40">Send Notification</h3>
          <div className="mt-3 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Title"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-dmSans text-sm text-white outline-none"
            />
            <textarea
              placeholder="Message"
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              rows={3}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-dmSans text-sm text-white outline-none"
            />
            <button
              type="button"
              onClick={() => runAction("Notification sent", () =>
                adminApi.post(`/admin/users/${id}/notification`, {
                  title: notifTitle,
                  message: notifMessage,
                }).then(() => { setNotifTitle(""); setNotifMessage(""); })
              )}
              className="self-start rounded-lg bg-[#FF5500] px-4 py-2 font-dmSans text-sm text-white"
            >
              Send Notification
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
