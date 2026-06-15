"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";

export default function ChangePasswordPage() {
  const router = useRouter();

  const storedUser = typeof window !== "undefined"
    ? (() => { try { return JSON.parse(localStorage.getItem("cyclogenai_user") || "{}"); } catch { return {}; } })()
    : {};

  const [email] = useState(storedUser.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/change-password", { email, currentPassword, newPassword });
      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0C0F] px-4">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,85,0,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,85,0,0.06),transparent_24%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-[24px] border border-white/10 bg-[#111318]/90 p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mb-8 text-center">
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              <img src="/images/cyclogen_logo.png" alt="Cyclogen" className="h-8 w-auto" />
              <span className="font-barlowCondensed text-2xl uppercase tracking-[0.08em] text-white">
                CyclogenAI
              </span>
            </Link>
          </div>

          <h1 className="font-barlowCondensed text-4xl uppercase tracking-[0.04em] text-white">Change password</h1>
          <p className="mt-2 font-dmSans text-sm text-white/50">Enter your current and new password</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div>
              <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 font-dmSans text-sm text-white/50 outline-none"
              />
            </div>

            <div>
              <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/50 focus:bg-white/10"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/50 focus:bg-white/10"
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/50 focus:bg-white/10"
                placeholder="Re-enter new password"
              />
            </div>

            {error && <p className="font-dmSans text-sm text-red-400">{error}</p>}
            {success && <p className="font-dmSans text-sm text-green-400">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#FF5500] px-6 py-3.5 font-dmSans text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,85,0,0.25)] transition hover:bg-[#e04a00] disabled:opacity-50"
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>

          <p className="mt-6 text-center font-dmSans text-sm text-white/40">
            <Link href="/dashboard" className="text-[#FF5500] transition hover:text-white">Back to dashboard</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
