"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("cycloai_signed_in") === "true") {
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
      const user = await api.post("/auth/login", { email, password });
      localStorage.setItem("cycloai_signed_in", "true");
      localStorage.setItem("cycloai_user", JSON.stringify(user));
      localStorage.setItem("cycloai_session_ts", String(Date.now()));
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0C0F] px-4">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,140,255,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(110,231,249,0.06),transparent_24%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-[24px] border border-white/10 bg-[#111318]/90 p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <svg className="h-8 w-8 text-[#7C8CFF]" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="8" />
                <circle cx="50" cy="50" r="11" stroke="currentColor" strokeWidth="6" />
                <path d="M50 9v14M50 77v14M9 50h14M77 50h14M22 22l10 10M68 68l10 10M78 22 68 32M22 78l10-10" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
              </svg>
              <span className="font-barlowCondensed text-2xl uppercase tracking-[0.08em] text-white">
                CycloAI
              </span>
            </Link>
          </div>

          <h1 className="font-barlowCondensed text-4xl uppercase tracking-[0.04em] text-white">
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
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#7C8CFF]/50 focus:bg-white/10"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#7C8CFF]/50 focus:bg-white/10"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p className="font-dmSans text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[linear-gradient(135deg,#7C8CFF,#6EE7F9)] px-6 py-3.5 font-dmSans text-sm font-semibold text-[#0A0C0F] shadow-[0_18px_40px_rgba(124,140,255,0.25)] transition hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="font-dmSans text-sm text-white/40 transition hover:text-white/60">
              Forgot password?
            </Link>
          </div>

          <p className="mt-4 text-center font-dmSans text-sm text-white/40">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#C9D1FF] transition hover:text-white">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
