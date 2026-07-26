"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";
import { completeAuthSession, isAuthenticated } from "../../../lib/auth";
import { triggerBackgroundSyncAfterAuth } from "../../../lib/useAutoSync";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Email is required"); return; }
    setLoading(true);
    try {
      await api.post("/auth/signup-request", { email });
      setStep(1);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifySignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!firstName || !password || !code) { setError("First name, password, and OTP are required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/signup-verify", {
        email, code, password,
        firstName,
        lastName,
      });
      const { token, ...user } = res;
      completeAuthSession(token, user, { isSignup: true });
      triggerBackgroundSyncAfterAuth(true);
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/50 focus:bg-white/10";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0C0F] px-4 py-8">
      <style>{`
        .signup-scroll::-webkit-scrollbar { width: 5px; }
        .signup-scroll::-webkit-scrollbar-track { background: transparent; }
        .signup-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 999px; }
        .signup-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,85,0,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,85,0,0.06),transparent_24%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-[24px] border border-white/10 bg-[#111318]/90 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <img src="/images/cyclogen_logo.png" alt="Cyclogen" className="h-15 w-40" />
            </Link>
            <div className="mt-3">
              <Link href="/" className="font-dmSans text-xs text-white/30 transition hover:text-white/50">&larr; Back to home</Link>
            </div>
          </div>

          {step === 0 ? (
            <>
              <h1 className="font-barlowCondensed text-3xl uppercase tracking-[0.04em] text-white">Create account</h1>
              <p className="mt-2 font-dmSans text-sm text-white/50">Enter your email to get started</p>

              <form onSubmit={requestOtp} className="mt-8 flex flex-col gap-5">
                <div>
                  <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
                </div>

                {error && <p className="font-dmSans text-sm text-red-400">{error}</p>}

                <button type="submit" disabled={loading}
                  className="relative overflow-hidden rounded-xl bg-[#FF5500] px-6 py-3.5 font-dmSans text-sm font-semibold text-white shadow-[0_8px_30px_rgba(255,85,0,0.3)] transition hover:bg-[#e04a00] active:scale-[0.98] disabled:opacity-50">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </span>
                  ) : "Send OTP"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-barlowCondensed text-3xl uppercase tracking-[0.04em] text-white">Complete profile</h1>
              <p className="mt-1 font-dmSans text-sm text-white/50">
                Code sent to <span className="text-white/70">{email}</span>
              </p>

              <form onSubmit={verifySignup} className="mt-4 flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1 signup-scroll">
                <div>
                  <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">OTP Code</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                    className={`${inputClass} text-center text-xl tracking-[0.3em]`} placeholder="000000" maxLength={6} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">First Name *</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="John" />
                  </div>
                  <div>
                    <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Last Name</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Doe" />
                  </div>
                </div>

                <div>
                  <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Password *</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Min. 6 characters" />
                </div>

                {error && <p className="font-dmSans text-sm text-red-400">{error}</p>}

                <button type="submit" disabled={loading}
                  className="relative overflow-hidden rounded-xl bg-[#FF5500] px-6 py-3.5 font-dmSans text-sm font-semibold text-white shadow-[0_8px_30px_rgba(255,85,0,0.3)] transition hover:bg-[#e04a00] active:scale-[0.98] disabled:opacity-50">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : "Create Account"}
                </button>
              </form>

              <p className="mt-4 text-center font-dmSans text-sm text-white/40">
                <button onClick={() => { setStep(0); setCode(""); setError(""); }} className="text-[#FF5500] transition hover:text-white">
                  Change email
                </button>
              </p>
            </>
          )}

          {step === 0 && (
            <p className="mt-6 text-center font-dmSans text-sm text-white/40">
              Already have an account?{" "}
              <Link href="/login" className="text-[#FF5500] transition hover:text-white">Log in</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
