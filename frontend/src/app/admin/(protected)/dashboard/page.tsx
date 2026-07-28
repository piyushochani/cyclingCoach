"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "../../../../../lib/admin-api";

interface DashboardStats {
  checkedAt: string;
  users: {
    total: number;
    signups7d: number;
    signups30d: number;
    free: number;
    pro: number;
    stravaConnected: number;
    staleSync: number;
  };
  activities: { total: number };
  subscriptions: Record<string, number>;
  gemini: { total: number; valid: number; exhausted: number; invalid: number };
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="font-dmSans text-xs uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-2 font-barlowCondensed text-3xl text-white">{value}</p>
      {sub && <p className="mt-1 font-dmSans text-xs text-white/40">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .get<DashboardStats>("/admin/dashboard")
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="font-dmSans text-sm text-white/40">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="font-dmSans text-sm text-red-400">{error}</p>;
  }

  if (!stats) return null;

  return (
    <div>
      <h1 className="font-barlowCondensed text-3xl uppercase tracking-[0.04em] text-white">
        Dashboard
      </h1>
      <p className="mt-1 font-dmSans text-sm text-white/40">
        Last updated {new Date(stats.checkedAt).toLocaleString()}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.users.total} />
        <StatCard label="Signups (7d)" value={stats.users.signups7d} />
        <StatCard label="Signups (30d)" value={stats.users.signups30d} />
        <StatCard label="Total Activities" value={stats.activities.total} />
        <StatCard label="Free Users" value={stats.users.free} />
        <StatCard label="Pro Users" value={stats.users.pro} />
        <StatCard label="Strava Connected" value={stats.users.stravaConnected} />
        <StatCard label="Stale Syncs" value={stats.users.staleSync} sub=">7 days, auto-sync on" />
        <StatCard label="Gemini Keys Valid" value={`${stats.gemini.valid}/${stats.gemini.total}`} />
        <StatCard label="Gemini Exhausted" value={stats.gemini.exhausted} />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/admin/users"
          className="rounded-lg border border-white/10 px-4 py-2 font-dmSans text-sm text-white/70 transition hover:border-[#FF5500]/40 hover:text-white"
        >
          Manage Users
        </Link>
        <Link
          href="/admin/system"
          className="rounded-lg border border-white/10 px-4 py-2 font-dmSans text-sm text-white/70 transition hover:border-[#FF5500]/40 hover:text-white"
        >
          System Health
        </Link>
        <Link
          href="/admin/notifications"
          className="rounded-lg border border-white/10 px-4 py-2 font-dmSans text-sm text-white/70 transition hover:border-[#FF5500]/40 hover:text-white"
        >
          Broadcast Notification
        </Link>
      </div>
    </div>
  );
}
