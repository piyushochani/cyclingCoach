"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "../../../lib/api";

const SPORT_OPTIONS = ["cycling", "running", "duathlon"];
const EXP_LEVELS = ["beginner", "intermediate", "advanced", "elite"];

function Section({ title, subtitle, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl border border-white/[0.06] bg-surface-cards p-6 md:p-8"
    >
      <h2 className="font-barlowCondensed text-lg uppercase tracking-wide text-white">{title}</h2>
      {subtitle && <p className="font-dmSans mt-1 text-sm text-white/30">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </motion.div>
  );
}

function Field({ label, children, fullWidth = false }) {
  return (
    <div className={fullWidth ? "" : "md:max-w-xs"}>
      <label className="font-dmSans mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-white/40">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", disabled = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-xl border border-white/[0.10] bg-[#080808] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-[#FF5500]/50 disabled:cursor-not-allowed disabled:opacity-30 placeholder:text-white/15"
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full appearance-none rounded-xl border border-white/[0.10] bg-[#080808] px-4 py-2.5 pr-8 text-sm text-white outline-none transition-all focus:border-[#FF5500]/50"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-[#080808] text-white">
          {o.charAt(0).toUpperCase() + o.slice(1)}
        </option>
      ))}
    </select>
  );
}

function SaveButton({ onClick, dirty }) {
  return (
    <button
      onClick={onClick}
      disabled={!dirty}
      className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold bg-[#FF5500] hover:bg-[#FF5500]/90 text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
      Save Changes
    </button>
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [goal, setGoal] = useState("");
  const [cyclingYears, setCyclingYears] = useState("");
  const [ftp, setFtp] = useState("");
  const [mainSport, setMainSport] = useState("cycling");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("cyclogenai_user") || "{}");
      setUser(stored);
      setFirstName(stored.firstName || "");
      setLastName(stored.lastName || "");
      setHeightCm(stored.heightCm != null ? String(stored.heightCm) : "");
      setWeightKg(stored.weightKg != null ? String(stored.weightKg) : "");
      setGoal(stored.goal || "");
      setCyclingYears(stored.cyclingYears != null ? String(stored.cyclingYears) : "");
      setFtp(stored.ftp != null ? String(stored.ftp) : "");
      setMainSport(stored.mainSport || "cycling");
      setExperienceLevel(stored.experienceLevel || "beginner");
      setDescription(stored.description || "");
    } catch {}
  }, []);

  const dirty = user && (
    firstName !== (user.firstName || "") ||
    lastName !== (user.lastName || "") ||
    heightCm !== (user.heightCm != null ? String(user.heightCm) : "") ||
    weightKg !== (user.weightKg != null ? String(user.weightKg) : "") ||
    goal !== (user.goal || "") ||
    cyclingYears !== (user.cyclingYears != null ? String(user.cyclingYears) : "") ||
    ftp !== (user.ftp != null ? String(user.ftp) : "") ||
    mainSport !== (user.mainSport || "cycling") ||
    experienceLevel !== (user.experienceLevel || "beginner") ||
    description !== (user.description || "")
  );

  const handleSave = useCallback(async () => {
    if (!user?.email) return;
    setSaving(true);
    setSaved(false);

    const payload = {
      firstName,
      lastName,
      mainSport,
      experienceLevel,
      goal,
      description,
      heightCm: heightCm ? parseFloat(heightCm) : null,
      weightKg: weightKg ? parseFloat(weightKg) : null,
      cyclingYears: cyclingYears ? parseInt(cyclingYears, 10) : 0,
      ftp: ftp ? parseInt(ftp, 10) : null,
    };

    try {
      const updated = await api.put(`/users/${user.email}`, payload);
      localStorage.setItem("cyclogenai_user", JSON.stringify({ ...user, ...payload }));
      setUser({ ...user, ...payload });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }, [user, firstName, lastName, mainSport, experienceLevel, goal, description, heightCm, weightKg, cyclingYears, ftp]);

  return (
    <div className="min-h-screen bg-black">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[62%] top-[-8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.04)_0%,transparent_72%)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-[1] mx-auto max-w-[1320px] px-4 pb-10 pt-[44px] md:px-6 md:pt-[52px] xl:px-8"
      >
        <div className="mb-8 border-b border-white/10 pb-6">
          <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
            Configuration
          </p>
          <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
            <span className="text-[#FF5500]">Settings</span>
          </h1>
        </div>

        <div className="flex flex-col gap-5">
          <Section title="Profile" subtitle="Your basic information" delay={0.05}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="First Name">
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </Field>
              <Field label="Last Name">
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </Field>
              <Field label="Email">
                <Input value={user?.email || ""} disabled placeholder="Email" />
              </Field>
              <Field label="Height (cm)">
                <Input value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="e.g. 178" type="number" />
              </Field>
              <Field label="Weight (kg)">
                <Input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g. 72" type="number" />
              </Field>
            </div>
          </Section>

          <Section title="Cycling Profile" subtitle="Sport preferences and performance" delay={0.1}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Main Sport">
                <Select value={mainSport} onChange={(e) => setMainSport(e.target.value)} options={SPORT_OPTIONS} />
              </Field>
              <Field label="Experience Level">
                <Select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} options={EXP_LEVELS} />
              </Field>
              <Field label="Cycling Years">
                <Input value={cyclingYears} onChange={(e) => setCyclingYears(e.target.value)} placeholder="e.g. 5" type="number" />
              </Field>
              <Field label="FTP (Watts)">
                <Input value={ftp} onChange={(e) => setFtp(e.target.value)} placeholder="e.g. 250" type="number" />
              </Field>
            </div>
          </Section>

          <Section title="Goals & Bio" subtitle="Tell us about yourself" delay={0.15}>
            <Field label="Goal" fullWidth>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Complete a century ride, improve FTP by 10%"
                className="w-full rounded-xl border border-white/[0.10] bg-[#080808] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-[#FF5500]/50 placeholder:text-white/15"
              />
            </Field>
            <div className="mt-4">
              <Field label="Description" fullWidth>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short bio about yourself as an athlete..."
                  rows={3}
                  className="w-full rounded-xl border border-white/[0.10] bg-[#080808] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-[#FF5500]/50 placeholder:text-white/15 resize-none"
                />
              </Field>
            </div>
          </Section>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-surface-cards p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF5500]/10">
                <svg className="h-4 w-4 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="font-dmSans text-sm font-medium text-white/80">Password</p>
                <p className="font-dmSans text-xs text-white/25">Change your account password</p>
              </div>
            </div>
            <Link
              href="/change-password"
              className="rounded-xl border border-white/[0.10] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/50 transition-all hover:border-white/20 hover:text-white"
            >
              Change
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="rounded-2xl border border-white/[0.06] bg-surface-cards p-6"
          >
            <h2 className="font-barlowCondensed text-lg uppercase tracking-wide text-white">About</h2>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-dmSans text-sm text-white/40">App</span>
                <span className="font-dmSans text-sm text-white/70">CyclogenAI</span>
              </div>
              <div className="flex justify-between">
                <span className="font-dmSans text-sm text-white/40">Version</span>
                <span className="font-dmSans text-sm text-white/70">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="font-dmSans text-sm text-white/40">Build</span>
                <span className="font-dmSans text-sm text-white/70">2026</span>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {error && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-dmSans text-sm text-red-400"
                >
                  {error}
                </motion.span>
              )}
              {saved && !error && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-dmSans text-sm text-green-400"
                >
                  Settings saved successfully
                </motion.span>
              )}
            </div>
            <SaveButton onClick={handleSave} dirty={dirty} />
          </div>
        </div>
      </motion.main>
    </div>
  );
}
