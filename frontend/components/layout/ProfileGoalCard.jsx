"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { api } from "../../lib/api";
import {
  getUserDisplayName,
  getUserInitials,
  formatExperienceLevel,
  formatSportLabel,
} from "../../lib/component-data";

const ProfileGoalCard = ({ user, activities }) => {
  const name = getUserDisplayName(user);
  const email = user?.email || "";
  const initials = getUserInitials(user);
  const sport = formatSportLabel(user?.mainSport);
  const level = formatExperienceLevel(user?.experienceLevel);

  const [profileImage, setProfileImage] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const u = JSON.parse(localStorage.getItem("cyclogenai_user") || "{}");
        return u.profileImage || null;
      } catch { return null; }
    }
    return null;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageMessage, setImageMessage] = useState("");
  const fileRef = useRef(null);
  const menuRef = useRef(null);

  const displayedImage = profileImage || user?.profileImage;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const u = JSON.parse(localStorage.getItem("cyclogenai_user") || "{}");
        return u.weeklyGoalKm ?? 100;
      } catch { return 100; }
    }
    return 100;
  });
  const [saving, setSaving] = useState(false);

  const currentWeekDistance = useMemo(() => {
    if (!activities || activities.length === 0) return 0;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return activities
      .filter((a) => a.date && new Date(a.date) >= weekStart)
      .reduce((s, a) => s + ((a.distance || 0) / 1000), 0);
  }, [activities]);

  const percentage = Math.min(100, (currentWeekDistance / weeklyGoal) * 100);
  const remaining = Math.max(0, weeklyGoal - currentWeekDistance);

  const data = [
    { name: "Achieved", value: percentage },
    { name: "Remaining", value: 100 - percentage },
  ];

  const COLORS = ["#FF6B00", "rgba(255,255,255,0.06)"];

  const handleSetGoal = async () => {
    const val = parseFloat(goalInput);
    if (!(val > 0)) return;
    setSaving(true);
    try {
      const u = JSON.parse(localStorage.getItem("cyclogenai_user") || "{}");
      const email = u.email;
      if (email) {
        const updated = await api.put('/users/' + encodeURIComponent(email), { weeklyGoalKm: val });
        localStorage.setItem("cyclogenai_user", JSON.stringify(updated));
      }
      setWeeklyGoal(val);
    } catch (e) { console.error("Failed to save goal", e); }
    setSaving(false);
    setShowModal(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = typeof ev.target?.result === "string" ? ev.target.result : "";
      if (!dataUrl) return;
      setUploading(true);
      setImageMessage("");
      try {
        const u = JSON.parse(localStorage.getItem("cyclogenai_user") || "{}");
        const email = u.email;
        if (!email) {
          setImageMessage("User email not found. Try refreshing.");
          return;
        }
        const result = await api.post(`/users/${encodeURIComponent(email)}/upload-image`, { image: dataUrl });
        const updated = { ...u, profileImage: result.profileImage };
        localStorage.setItem("cyclogenai_user", JSON.stringify(updated));
        setProfileImage(result.profileImage);
        window.dispatchEvent(
          new CustomEvent('auth-session-changed', { detail: { user: updated } }),
        );
        setImageMessage("Profile image updated");
      } catch (err) {
        setImageMessage(err?.message || "Failed to upload image.");
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] p-6 md:p-7"
      >
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full border border-[#FF7A1A]/10" />
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#FF7A1A]/10" />

        {/* Edit menu */}
        <div className="absolute right-4 top-4 z-20" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-[#FF6B00]/40 hover:bg-white/10 hover:text-white"
            title="Edit profile"
            aria-label="Edit profile"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 w-52 rounded-xl border border-white/10 bg-[#111318] py-2 shadow-2xl backdrop-blur-xl"
              >
                <button
                  onClick={() => { setMenuOpen(false); setGoalInput(String(weeklyGoal)); setShowModal(true); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 font-dmSans text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <svg className="h-4 w-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Set Goal
                </button>
                <button
                  onClick={() => { setMenuOpen(false); fileRef.current?.click(); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 font-dmSans text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <svg className="h-4 w-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Change Profile Image
                </button>
                <input
                  type="file"
                  ref={fileRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 h-[110px] w-[110px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={53}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-[10px] flex items-center justify-center overflow-hidden rounded-full border-4 border-black bg-[#111111]">
              {displayedImage ? (
                <img src={displayedImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-[#FF7A1A]">{initials}</span>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-[#FF5500]" />
                </div>
              )}
            </div>
          </div>

          {imageMessage && (
            <p className="mb-2 font-dmSans text-xs text-white/50">{imageMessage}</p>
          )}

          <h2 className="font-dmSans text-2xl font-semibold text-white">{name}</h2>
          <p className="mt-1 font-dmSans text-sm text-white/50">
            {sport} · {level}
          </p>
          {email && (
            <p className="mt-1 font-dmSans text-xs text-white/30">{email}</p>
          )}

          <div className="mt-5 w-full border-t border-white/10 pt-4">
            <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-white/40">
              Weekly Goal
            </p>
            <p className="mt-1 font-dmSans text-sm font-semibold text-white">
              {currentWeekDistance.toFixed(2)} km / {weeklyGoal} km
              <span className="ml-2 text-xs font-normal text-white/40">
                ({percentage.toFixed(1)}%)
              </span>
            </p>
            {remaining > 0 ? (
              <p className="mt-1 font-dmSans text-xs text-white/30">
                {remaining.toFixed(2)} km remaining
              </p>
            ) : (
              <p className="mt-1 flex items-center justify-center gap-1 font-dmSans text-xs text-[#FF6B00]">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Goal achieved!
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#111318] p-6 shadow-2xl"
          >
            <h3 className="font-dmSans text-sm font-semibold text-white">Set Weekly Goal</h3>
            <p className="font-dmSans mt-1 text-xs text-white/40">Target distance in kilometers for this week.</p>
            <input
              type="number"
              step="0.1"
              min="1"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="mt-4 w-full rounded-xl border border-white/[0.08] bg-black px-4 py-3 font-jetbrainsMono text-sm text-white outline-none transition focus:border-[#FF6B00]/50"
              placeholder="e.g. 150"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 font-dmSans text-sm text-white/50 transition hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={handleSetGoal}
                className="flex-1 rounded-xl bg-[#FF6B00] px-4 py-2.5 font-dmSans text-sm font-bold text-black transition hover:bg-[#FF6B00]/90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Goal"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ProfileGoalCard;