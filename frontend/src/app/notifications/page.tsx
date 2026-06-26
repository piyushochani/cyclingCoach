"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface RenewalStatus {
  needsRenewal: boolean;
  daysUntilExpiry: number;
  validUntil: string | null;
  currentPlan: string | null;
  autoRenew: boolean;
  prices: Record<string, number>;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [renewal, setRenewal] = useState<RenewalStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notifData, renewalData] = await Promise.all([
        api.get<{ notifications: NotificationItem[]; unreadCount: number }>("/notifications").catch(() => ({ notifications: [], unreadCount: 0 })),
        api.get<RenewalStatus>("/subscription/renewal-status").catch(() => null),
      ]);
      setNotifications(notifData.notifications || []);
      setUnreadCount(notifData.unreadCount || 0);
      setRenewal(renewalData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleMarkRead = async (id: string) => {
    await api.post(`/notifications/${id}/read`, {});
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await api.post("/notifications/read-all", {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const daysLeft = renewal?.daysUntilExpiry ?? -1;

  const TYPE_ICONS: Record<string, string> = {
    achievement: "\uD83C\uDFC6",
    activity: "\uD83D\uDEB4",
    reminder: "\u23F0",
    system: "\u2699\uFE0F",
    sync: "\uD83D\uDD04",
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[62%] top-[-8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,85,0,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,85,0,0.04)_0%,transparent_72%)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-[1] mx-auto max-w-[1000px] px-4 pb-16 pt-[44px] md:px-8 md:pt-[52px]"
      >
        <div className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">Updates</p>
            <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
              <span className="text-[#FF5500]">Notifications</span>
            </h1>
            <div className="mt-3 h-[2px] w-9 rounded-full bg-[#FF5500]" />
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/60 transition hover:border-white/20 hover:text-white"
            >
              Mark All Read ({unreadCount})
            </button>
          )}
        </div>

        {/* Subscription expiry banner */}
        {renewal && daysLeft <= 7 && (
          <div className={`mb-6 rounded-xl border p-5 ${
            daysLeft <= 0 ? "border-red-500/30 bg-red-500/10" : "border-orange-500/30 bg-orange-500/10"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{daysLeft <= 0 ? "\u26A0\uFE0F" : "\u23F3"}</span>
              <div>
                <p className={`font-dmSans text-sm font-bold ${daysLeft <= 0 ? "text-red-400" : "text-orange-400"}`}>
                  {daysLeft <= 0 ? "Subscription Expired" : "Subscription Expiring Soon"}
                </p>
                <p className="font-dmSans text-xs text-white/50 mt-0.5">
                  {daysLeft <= 0
                    ? "Your plan has expired. Renew now to continue using CyclogenAI features."
                    : `Your plan expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Renew to avoid interruption.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#0D0D0D] px-5 py-16 text-center">
            <span className="text-4xl">\uD83D\uDCEB</span>
            <p className="mt-4 font-dmSans text-sm text-white/40">No notifications yet.</p>
            <p className="font-dmSans text-xs text-white/20 mt-1">Notifications about sync, achievements, and reminders will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-4 rounded-xl border px-5 py-4 transition-all duration-200 ${
                  notif.read
                    ? "border-white/5 bg-[#0D0D0D] opacity-60"
                    : "border-white/10 bg-[#0D0D0D] hover:border-[#FF5500]/20"
                }`}
              >
                <span className="text-xl mt-0.5">{TYPE_ICONS[notif.type] || "\uD83D\uDD14"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-dmSans text-sm font-semibold ${notif.read ? "text-white/50" : "text-white"}`}>
                      {notif.title}
                    </p>
                    {!notif.read && <span className="h-2 w-2 rounded-full bg-[#FF5500]" />}
                  </div>
                  <p className="font-dmSans text-sm text-white/40 mt-0.5">{notif.message}</p>
                  <p className="font-dmSans text-[10px] text-white/20 mt-1.5">
                    {new Date(notif.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {!notif.read && (
                  <button onClick={() => handleMarkRead(notif._id)}
                    className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30 transition hover:border-white/20 hover:text-white"
                  >
                    Read
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.main>
    </div>
  );
}
