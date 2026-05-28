"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem("cycloai_signed_in") === "true") {
      router.replace("/dashboard");
    }
  }, [router]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [goal, setGoal] = useState("");
  const [cyclingYears, setCyclingYears] = useState("");
  const [ftp, setFtp] = useState("");
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
      await api.post("/auth/signup-verify", {
        email, code, password,
        firstName,
        lastName,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        goal,
        cyclingYears: cyclingYears ? Number(cyclingYears) : undefined,
        ftp: ftp ? Number(ftp) : undefined,
      });
      localStorage.setItem("cycloai_signed_in", "true");
      localStorage.setItem("cycloai_user", JSON.stringify({ firstName, lastName: lastName || "", email, goal }));
      localStorage.setItem("cycloai_session_ts", String(Date.now()));
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#7C8CFF]/50 focus:bg-white/10";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0C0F] px-4 py-8">
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
              <h1 className="font-barlowCondensed text-4xl uppercase tracking-[0.04em] text-white">Create account</h1>
              <p className="mt-2 font-dmSans text-sm text-white/50">Enter your email to get started</p>

              <form onSubmit={requestOtp} className="mt-8 flex flex-col gap-5">
                <div>
                  <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
                </div>

                {error && <p className="font-dmSans text-sm text-red-400">{error}</p>}

                <button type="submit" disabled={loading}
                  className="rounded-xl bg-[linear-gradient(135deg,#7C8CFF,#6EE7F9)] px-6 py-3.5 font-dmSans text-sm font-semibold text-[#0A0C0F] shadow-[0_18px_40px_rgba(124,140,255,0.25)] transition hover:scale-[1.02] disabled:opacity-50">
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-barlowCondensed text-4xl uppercase tracking-[0.04em] text-white">Complete profile</h1>
              <p className="mt-2 font-dmSans text-sm text-white/50">
                Code sent to <span className="text-white/70">{email}</span>
              </p>

              <form onSubmit={verifySignup} className="mt-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Height (cm)</label>
                    <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={inputClass} placeholder="175" />
                  </div>
                  <div>
                    <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Weight (kg)</label>
                    <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className={inputClass} placeholder="70" />
                  </div>
                </div>

                <div>
                  <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Goal</label>
                  <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} className={inputClass} placeholder="e.g. Complete a century ride, improve FTP" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Years Cycling</label>
                    <input type="number" value={cyclingYears} onChange={(e) => setCyclingYears(e.target.value)} className={inputClass} placeholder="3" />
                  </div>
                  <div>
                    <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">FTP (watts)</label>
                    <input type="number" value={ftp} onChange={(e) => setFtp(e.target.value)} className={inputClass} placeholder="250" />
                  </div>
                </div>

                <div>
                  <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Password *</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Min. 6 characters" />
                </div>

                {error && <p className="font-dmSans text-sm text-red-400">{error}</p>}

                <button type="submit" disabled={loading}
                  className="rounded-xl bg-[linear-gradient(135deg,#7C8CFF,#6EE7F9)] px-6 py-3.5 font-dmSans text-sm font-semibold text-[#0A0C0F] shadow-[0_18px_40px_rgba(124,140,255,0.25)] transition hover:scale-[1.02] disabled:opacity-50">
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <p className="mt-4 text-center font-dmSans text-sm text-white/40">
                <button onClick={() => { setStep(0); setCode(""); setError(""); }} className="text-[#C9D1FF] transition hover:text-white">
                  Change email
                </button>
              </p>
            </>
          )}

          {step === 0 && (
            <p className="mt-6 text-center font-dmSans text-sm text-white/40">
              Already have an account?{" "}
              <Link href="/login" className="text-[#C9D1FF] transition hover:text-white">Log in</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
