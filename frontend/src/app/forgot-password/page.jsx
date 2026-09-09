"use client";

import React, { useState, useEffect } from "react";
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
  const [otpEnabled, setOtpEnabled] = useState(true);

  useEffect(() => {
    api.get("/auth/config").then((c) => setOtpEnabled(c?.otpEnabled !== false)).catch(() => {});
  }, []);

  const SUPPORT_EMAIL = "ochanipiyush07@gmail.com";
  const gmailComposeUrl = () => {
    const subject = "Password reset request - CyclogenAI";
    const body = `Hi,\n\nI have forgotten my password for my CyclogenAI account.\n\nAccount email: ${email || "<your account email>"}\n\nPlease help me regain access.\n\nThanks`;
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

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
      const user = await api.post("/auth/forgot-password-reset", { email, code, password });
      localStorage.setItem("cyclogenai_user", JSON.stringify(user));
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0C0F] px-4">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,85,0,0.1),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,85,0,0.06),transparent_28%)]" />
      <div className="pointer-events-none fixed left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,85,0,0.04),transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-[24px] border border-[#FF5500]/15 bg-[#111318]/95 p-8 shadow-[0_0_60px_rgba(255,85,0,0.08)] backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center">
            <Link href="/">
              <img src="/images/new_cyclogenAI_logo.png" alt="Cyclogen" className="h-15 w-40" />
            </Link>
            <div className="mt-3">
              <Link href="/" className="font-dmSans text-xs text-white/30 transition hover:text-white/50">&larr; Back to home</Link>
            </div>
          </div>

          {step === 0 ? (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF5500]/10">
                  <svg className="h-6 w-6 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h1 className="font-barlowCondensed text-4xl uppercase tracking-[0.04em] text-white">
                  Reset <span className="text-[#FF5500]">Password</span>
                </h1>
                <div className="mx-auto mt-2 h-[2px] w-12 rounded-full bg-[#FF5500]" />
                <p className="mt-4 font-dmSans text-sm text-white/50">
                  {otpSent
                    ? <>Code sent to <span className="text-white/70">{email}</span> &mdash; enter it below</>
                    : "Enter your email to receive a reset code"}
                </p>
              </div>

              <form onSubmit={otpSent ? goToPassword : requestOtp} className="flex flex-col gap-5">
                <div>
                  <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setOtpSent(false); setCode(""); setError(""); }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/50 focus:bg-[#FF5500]/5 focus:shadow-[0_0_20px_rgba(255,85,0,0.06)]"
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
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/50 focus:bg-[#FF5500]/5 focus:shadow-[0_0_20px_rgba(255,85,0,0.06)] text-center text-xl tracking-[0.3em]"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </motion.div>
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
                      Sending...
                    </span>
                  ) : (otpSent ? "Next" : "Send Reset Code")}
                </button>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 font-dmSans text-sm text-red-400"
                  >
                    {error}
                  </motion.p>
                )}
              </form>

              {!otpEnabled && (
                <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="font-dmSans text-sm text-amber-300/90">
                    Demo project notice: OTP email verification is unavailable for non-domain (demo) projects, so reset codes can&apos;t be emailed right now.
                  </p>
                  <p className="mt-2 font-dmSans text-sm text-white/50">
                    For now, send us a mail from your account address and the admin will reset your password manually.
                  </p>
                  <a
                    href={gmailComposeUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#FF5500] px-4 py-2.5 font-dmSans text-sm font-semibold text-white shadow-[0_8px_30px_rgba(255,85,0,0.3)] transition hover:bg-[#e04a00]"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email {SUPPORT_EMAIL}
                  </a>
                </div>
              )}

              <p className="mt-6 text-center font-dmSans text-sm text-white/40">
                <Link href="/login" className="text-[#FF5500] transition hover:text-white underline underline-offset-2 decoration-[#FF5500]/30 hover:decoration-[#FF5500]">Back to login</Link>
              </p>
            </>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF5500]/10">
                  <svg className="h-6 w-6 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="font-barlowCondensed text-4xl uppercase tracking-[0.04em] text-white">
                  New <span className="text-[#FF5500]">Password</span>
                </h1>
                <div className="mx-auto mt-2 h-[2px] w-12 rounded-full bg-[#FF5500]" />
                <p className="mt-4 font-dmSans text-sm text-white/50">
                  Set a new password for <span className="text-white/70">{email}</span>
                </p>
              </div>

              <form onSubmit={resetPassword} className="flex flex-col gap-5">
                <div>
                  <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/50 focus:bg-[#FF5500]/5 focus:shadow-[0_0_20px_rgba(255,85,0,0.06)]"
                    placeholder="Min. 6 characters"
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 font-dmSans text-sm text-red-400"
                  >
                    {error}
                  </motion.p>
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
                      Resetting...
                    </span>
                  ) : "Reset Password"}
                </button>

                <p className="mt-2 text-center font-dmSans text-sm text-white/40">
                  <button type="button" onClick={() => { setStep(0); setError(""); }} className="text-[#FF5500] transition hover:text-white underline underline-offset-2 decoration-[#FF5500]/30 hover:decoration-[#FF5500]">
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
