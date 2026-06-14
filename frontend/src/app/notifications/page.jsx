"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";


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
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await api.get("/notifications");
      setNotifications(data.notifications || []);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(() => load(), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const markAllRead = useCallback(async () => {
    try {
      await api.post("/notifications/read-all", {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch {}
  }, []);

  const handleNotificationClick = useCallback(async (n) => {
    if (!n.read) {
      try {
        await api.post(`/notifications/${n._id}/read`, {});
        setNotifications(prev => prev.map(p => p._id === n._id ? { ...p, read: true } : p));
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      } catch {}
    }
    if (n.metadata?.link) {
      router.push(n.metadata.link);
    }
  }, [router]);

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

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <svg className="h-8 w-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="font-dmSans text-sm text-white/30">No notifications yet.</p>
            <p className="mt-1 font-dmSans text-xs text-white/20">Your latest updates and alerts will appear here.</p>
          </div>
        )}

        {unread.map((n, i) => (
          <motion.div
            key={n._id || n.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleNotificationClick(n)}
            className="mb-3 cursor-pointer rounded-xl border border-[#FF5500]/20 bg-[#FF5500]/[0.06] p-4 transition hover:bg-[#FF5500]/[0.1]"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{typeIcons[n.type] || "\u2139\uFE0F"}</span>
              <div className="min-w-0 flex-1">
                <p className="font-dmSans text-sm font-semibold text-white">{n.title}</p>
                <p className="mt-0.5 font-dmSans text-xs text-white/50">{n.message}</p>
                {n.metadata?.link && (
                  <span className="mt-1 inline-block font-dmSans text-[10px] text-[#FF5500]/60">Click to view &rarr;</span>
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
            onClick={() => handleNotificationClick(n)}
            className="mb-3 cursor-pointer rounded-xl border border-white/5 bg-white/[0.01] p-4 transition hover:bg-white/[0.03]"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg opacity-40">{typeIcons[n.type] || "\u2139\uFE0F"}</span>
              <div className="min-w-0 flex-1">
                <p className="font-dmSans text-sm font-semibold text-white/50">{n.title}</p>
                <p className="mt-0.5 font-dmSans text-xs text-white/30">{n.message}</p>
                {n.metadata?.link && (
                  <span className="mt-1 inline-block font-dmSans text-[10px] text-[#FF5500]/40">Click to view &rarr;</span>
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
