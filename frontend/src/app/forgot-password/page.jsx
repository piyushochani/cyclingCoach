"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Email is required"); return; }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password-request", { email });
      setOtpSent(true);
    } catch (err) {
      setError(err.message || "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  const goToPassword = (e) => {
    e.preventDefault();
    setError("");
    if (!code) { setError("Please enter the OTP code"); return; }
    setStep(1);
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (!password) { setError("Please enter a new password"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password-reset", { email, code, password });
      router.push("/login");
    } catch (err) {
      setError(err.message || "Reset failed");
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

          {step === 0 ? (
            <>
              <h1 className="font-barlowCondensed text-4xl uppercase tracking-[0.04em] text-white">Reset password</h1>
              <p className="mt-2 font-dmSans text-sm text-white/50">
                {otpSent
                  ? <>Code sent to <span className="text-white/70">{email}</span> &mdash; enter it below</>
                  : "Enter your email to receive a reset code"}
              </p>

              <form onSubmit={otpSent ? goToPassword : requestOtp} className="mt-8 flex flex-col gap-5">
                <div>
                  <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setOtpSent(false); setCode(""); setError(""); }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#7C8CFF]/50 focus:bg-white/10"
                    placeholder="you@example.com"
                  />
                </div>

                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">OTP Code</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#7C8CFF]/50 focus:bg-white/10 text-center text-xl tracking-[0.3em]"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-[linear-gradient(135deg,#7C8CFF,#6EE7F9)] px-6 py-3.5 font-dmSans text-sm font-semibold text-[#0A0C0F] shadow-[0_18px_40px_rgba(124,140,255,0.25)] transition hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading
                    ? "Sending..."
                    : (otpSent ? "Next" : "Send Reset Code")}
                </button>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-dmSans text-sm text-red-400"
                  >
                    {error}
                  </motion.p>
                )}
              </form>

              <p className="mt-6 text-center font-dmSans text-sm text-white/40">
                <Link href="/login" className="text-[#C9D1FF] transition hover:text-white">Back to login</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="font-barlowCondensed text-4xl uppercase tracking-[0.04em] text-white">Enter new password</h1>
              <p className="mt-2 font-dmSans text-sm text-white/50">
                Set a new password for <span className="text-white/70">{email}</span>
              </p>

              <form onSubmit={resetPassword} className="mt-8 flex flex-col gap-5">
                <div>
                  <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#7C8CFF]/50 focus:bg-white/10"
                    placeholder="Min. 6 characters"
                  />
                </div>

                {error && <p className="font-dmSans text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-[linear-gradient(135deg,#7C8CFF,#6EE7F9)] px-6 py-3.5 font-dmSans text-sm font-semibold text-[#0A0C0F] shadow-[0_18px_40px_rgba(124,140,255,0.25)] transition hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <p className="mt-2 text-center font-dmSans text-sm text-white/40">
                  <button type="button" onClick={() => { setStep(0); setError(""); }} className="text-[#C9D1FF] transition hover:text-white">
                    Back
                  </button>
                </p>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
