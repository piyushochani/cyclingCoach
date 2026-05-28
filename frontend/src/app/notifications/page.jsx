"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const NOTIF_KEY = "cycloai_notifications";

const seedNotifications = [
  { id: "n1", title: "New Personal Best!", message: "You achieved a new 20-minute power record of 320W.", timestamp: Date.now() - 60000, read: false, type: "achievement" },
  { id: "n2", title: "Activity Uploaded", message: "Today's ride has been synced from Strava.", timestamp: Date.now() - 120000, read: false, type: "activity" },
  { id: "n3", title: "Race Reminder", message: "Your next race 'Gran Fondo' starts in 2 days.", timestamp: Date.now() - 3600000, read: false, type: "reminder" },
  { id: "n4", title: "Welcome to CycloAI", message: "We're glad to have you onboard! Start by connecting your Strava.", timestamp: Date.now() - 86400000, read: true, type: "system" },
  { id: "n5", title: "Weekly Summary", message: "You rode 185km this week, 12% more than last week.", timestamp: Date.now() - 172800000, read: true, type: "system" },
];

function loadNotifications() {
  try {
    const stored = localStorage.getItem(NOTIF_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  localStorage.setItem(NOTIF_KEY, JSON.stringify(seedNotifications));
  return seedNotifications;
}

function saveNotifications(list) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
}

const typeIcons = {
  achievement: "\uD83C\uDFC6",
  activity: "\uD83D\uDEB4",
  reminder: "\u23F0",
  system: "\u2139\uFE0F",
};

function formatTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const markedRef = useRef(false);

  useEffect(() => {
    setNotifications(loadNotifications());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (elapsed >= 3000 && !markedRef.current) {
      markedRef.current = true;
      const notifs = loadNotifications();
      const updated = notifs.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      setNotifications(updated);
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    }
  }, [elapsed]);

  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "2.5rem 1.5rem 5rem", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: "2.5rem" }}>
          <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#FF5500" }}>
            Inbox
          </p>
          <h1 style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: "clamp(3rem, 7vw, 5rem)", fontWeight: 400, letterSpacing: "0.04em", lineHeight: 0.95, margin: "0 0 14px", color: "#fff" }}>
            YOUR <span style={{ color: "#FF5500" }}>NOTIFICATIONS</span>
          </h1>
          <div style={{ width: 36, height: 2, background: "#FF5500", marginBottom: 14, borderRadius: 2 }} />
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.3)" }}>
            Stay updated with achievements, reminders, and system alerts.
          </p>
        </motion.div>

      {unread.map((n, i) => (
        <motion.div
          key={n.id}
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
              <p className="mt-1.5 font-dmSans text-[10px] text-white/25">{formatTime(n.timestamp)}</p>
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
          key={n.id}
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
              <p className="mt-1.5 font-dmSans text-[10px] text-white/20">{formatTime(n.timestamp)}</p>
            </div>
          </div>
        </motion.div>
      ))}

      {notifications.length === 0 && (
        <p className="font-dmSans text-white/30">No notifications yet.</p>
      )}
      </div>
    </div>
  );
}
