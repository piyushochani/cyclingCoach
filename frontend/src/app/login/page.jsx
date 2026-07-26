"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";
import { completeAuthSession, isAuthenticated } from "../../../lib/auth";
import { triggerBackgroundSyncAfterAuth } from "../../../lib/useAutoSync";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, ...user } = res;
      completeAuthSession(token, user);
      triggerBackgroundSyncAfterAuth(false);
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password");
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
            <Link href="/" className="inline-flex items-center gap-2">
              <img src="/images/new_cyclogenAI_logo.png" alt="Cyclogen" className="h-15 w-40" />
            </Link>
            <div className="mt-3">
              <Link href="/" className="font-dmSans text-xs text-white/30 transition hover:text-white/50">&larr; Back to home</Link>
            </div>
          </div>

          <h1 className="font-barlowCondensed text-3xl uppercase tracking-[0.04em] text-white">
            Welcome back
          </h1>
          <p className="mt-2 font-dmSans text-sm text-white/50">
            Log in to your training account
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div>
              <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/50 focus:bg-white/10"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/50 focus:bg-white/10"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p className="font-dmSans text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative overflow-hidden rounded-xl bg-[#FF5500] px-6 py-3.5 font-dmSans text-sm font-semibold text-white shadow-[0_8px_30px_rgba(255,85,0,0.3)] transition hover:bg-[#e04a00] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Logging in...
                </span>
              ) : "Log In"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="font-dmSans text-sm text-white/40 transition hover:text-white/60">
              Forgot password?
            </Link>
          </div>

          <p className="mt-4 text-center font-dmSans text-sm text-white/40">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#FF5500] transition hover:text-white">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
