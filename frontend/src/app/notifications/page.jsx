"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";
import { isAutoSyncEnabled, setAutoSyncEnabled, triggerGlobalSync } from "../../../lib/useAutoSync";

function formatTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const typeIcons = {
  achievement: "\uD83C\uDFC6",
  activity: "\uD83D\uDEB4",
  reminder: "\u23F0",
  system: "\u2139\uFE0F",
  sync: "\uD83D\uDD04",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [syncInfo, setSyncInfo] = useState(null);
  const [autoSyncOn, setAutoSyncOn] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    setAutoSyncOn(isAutoSyncEnabled());
    load();
    api.get("/sync/status").then(setSyncInfo).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await api.get("/notifications");
      setNotifications(data.notifications || []);
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.post("/notifications/read-all", {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch {}
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      load();
      api.get("/sync/status").then(setSyncInfo).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const toggleAutoSync = useCallback(() => {
    const next = !autoSyncOn;
    setAutoSyncOn(next);
    setAutoSyncEnabled(next);
  }, [autoSyncOn]);

  const handleManualSync = useCallback(async () => {
    setSyncing(true);
    await triggerGlobalSync();
    setSyncing(false);
    const updated = await api.get("/sync/status").catch(() => null);
    if (updated) setSyncInfo(updated);
    load();
  }, [load]);

  const needsSync = syncInfo && !syncInfo.isUpToDate;
  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "2.5rem 1.5rem 5rem", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: "2.5rem" }}>
          <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
            Inbox
          </p>
          <h1 className="font-barlowCondensed text-5xl md:text-6xl">
            YOUR <span style={{ color: "#FF5500" }}>NOTIFICATIONS</span>
          </h1>
          <div style={{ width: 36, height: 2, background: "#FF5500", marginBottom: 14, borderRadius: 2 }} />
          <div className="flex items-center justify-between">
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.3)" }}>
              Stay updated with achievements, reminders, and system alerts.
            </p>
            {unread.length > 0 && (
              <button onClick={markAllRead} className="rounded-lg border border-white/10 px-3 py-1.5 font-dmSans text-[11px] text-white/50 transition hover:bg-white/5 hover:text-white">
                Mark all read
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 rounded-xl border p-5 ${
            needsSync
              ? "border-[#FF5500]/30 bg-[#FF5500]/[0.08]"
              : "border-white/5 bg-white/[0.02]"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${needsSync ? "bg-[#FF5500]/15" : "bg-white/5"}`}>
              {needsSync ? (
                <svg className="h-5 w-5 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className={`h-5 w-5 ${autoSyncOn ? "text-green-400" : "text-white/30"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <p className="font-dmSans text-sm font-bold text-white">
                  {needsSync ? "Activities Pending Sync" : "Auto-Sync"}
                </p>
                {!needsSync && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-dmSans text-[10px] font-semibold uppercase tracking-wider ${
                    autoSyncOn ? "bg-green-900/40 text-green-400" : "bg-white/5 text-white/40"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${autoSyncOn ? "bg-green-400" : "bg-white/20"}`} />
                    {autoSyncOn ? "On" : "Off"}
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-dmSans text-xs text-white/50">
                {needsSync
                  ? "Some activities from Strava have not been synced yet. Enable auto-sync to keep your data up to date automatically."
                  : "New activities will be synced automatically every 2 hours."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={toggleAutoSync}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 font-dmSans text-xs font-semibold transition ${
                    autoSyncOn
                      ? "bg-[#FF5500] text-white hover:bg-[#e04a00]"
                      : "border border-white/20 text-white/70 hover:bg-white/5"
                  }`}
                >
                  <div className={`h-3 w-3 rounded-full ${autoSyncOn ? "bg-white" : "bg-white/30"}`} />
                  Auto-sync {autoSyncOn ? "ON" : "OFF"}
                </button>
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="rounded-lg border border-[#FF5500]/40 px-4 py-2 font-dmSans text-xs font-semibold text-[#FF5500] transition hover:bg-[#FF5500]/10 disabled:opacity-40"
                >
                  {syncing ? "Syncing..." : "Sync Now"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {unread.length === 0 && read.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <svg className="h-8 w-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="font-dmSans text-sm text-white/30">No notifications yet.</p>
            <p className="mt-1 font-dmSans text-xs text-white/20">Sync your activities to receive updates here.</p>
          </div>
        )}

        {unread.map((n, i) => (
          <motion.div
            key={n._id || n.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="mb-3 rounded-xl border border-[#FF5500]/20 bg-[#FF5500]/[0.06] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{typeIcons[n.type] || "\u2139\uFE0F"}</span>
              <div className="min-w-0 flex-1">
                <p className="font-dmSans text-sm font-semibold text-white">{n.title}</p>
                <p className="mt-0.5 font-dmSans text-xs text-white/50">{n.message}</p>
                {n.type === "sync" && autoSyncOn && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAutoSync();
                    }}
                    className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-dmSans text-[10px] font-bold uppercase tracking-wider text-white/60 transition hover:bg-[#FF5500] hover:text-white"
                  >
                    Turn Off Auto-Sync
                  </button>
                )}
                <p className="mt-1.5 font-dmSans text-[10px] text-white/25">{formatTime(new Date(n.createdAt).getTime())}</p>
              </div>
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#FF5500]" />
            </div>
          </motion.div>
        ))}

        {unread.length > 0 && read.length > 0 && (
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="font-dmSans text-[11px] uppercase tracking-[0.1em] text-white/30">Earlier</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        )}

        {read.map((n, i) => (
          <motion.div
            key={n._id || n.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="mb-3 rounded-xl border border-white/5 bg-white/[0.01] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg opacity-40">{typeIcons[n.type] || "\u2139\uFE0F"}</span>
              <div className="min-w-0 flex-1">
                <p className="font-dmSans text-sm font-semibold text-white/50">{n.title}</p>
                <p className="mt-0.5 font-dmSans text-xs text-white/30">{n.message}</p>
                {n.type === "sync" && autoSyncOn && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAutoSync();
                    }}
                    className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-dmSans text-[10px] font-bold uppercase tracking-wider text-white/40 transition hover:bg-[#FF5500] hover:text-white"
                  >
                    Turn Off Auto-Sync
                  </button>
                )}
                <p className="mt-1.5 font-dmSans text-[10px] text-white/20">{formatTime(new Date(n.createdAt).getTime())}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
