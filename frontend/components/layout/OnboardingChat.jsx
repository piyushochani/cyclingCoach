"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";

const questions = [
  { key: "goal", label: "What's your main cycling goal right now?", placeholder: "e.g. Complete a century, improve FTP, race a gran fondo..." },
  { key: "experience", label: "How long have you been cycling seriously?", placeholder: "e.g. 2 years, just started, racing for 5 years..." },
  { key: "schedule", label: "How many hours per week can you train?", placeholder: "e.g. 6-8 hours, mostly weekends, 10+ hours..." },
  { key: "focus", label: "What aspect of cycling do you want to improve most?", placeholder: "e.g. Climbing, sprinting, endurance, power..." },
  { key: "weakness", label: "Any specific weaknesses or past injuries I should know about?", placeholder: "e.g. Bad knees on steep climbs, lower back pain, no sprint..." },
];

const OnboardingChat = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    if (show) inputRef.current?.focus();
  }, [step, show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const updated = { ...answers, [questions[step].key]: input.trim() };
    setAnswers(updated);
    setInput("");

    if (step < questions.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish(updated);
    }
  };

  const finish = async (allAnswers) => {
    setSaving(true);
    const summary = Object.entries(allAnswers)
      .map(([key, val]) => `${questions.find((q) => q.key === key)?.label}: ${val}`)
      .join("\n");
    try {
      const stored = localStorage.getItem("cycloai_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.email) {
          await api.post(`/users/${u.email}/onboarding-summary`, { summary });
          u.onboardingSummary = summary;
          localStorage.setItem("cycloai_user", JSON.stringify(u));
        }
      }
    } catch {}
    setSaving(false);
    setShow(false);
    localStorage.setItem("cycloai_onboarding_done", "true");
    onComplete?.();
  };

  const skip = () => {
    localStorage.setItem("cycloai_onboarding_done", "true");
    setShow(false);
    onComplete?.();
  };

  const progress = ((step + 1) / questions.length) * 100;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#111318] p-6 md:p-8 shadow-2xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-dmSans text-[10px] uppercase tracking-[0.16em] text-white/30">
                Step {step + 1} of {questions.length}
              </span>
              <button onClick={skip} className="font-dmSans text-xs text-white/30 transition hover:text-white/60">
                Skip
              </button>
            </div>

            <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-[#FF5500]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5500]/10">
              <svg className="h-5 w-5 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>

            <h2 className="font-barlowCondensed text-2xl uppercase tracking-wide text-white">
              Tell me about yourself
            </h2>
            <p className="mt-2 font-dmSans text-sm text-white/50">
              {questions[step].label}
            </p>

            <form onSubmit={handleSubmit} className="mt-6">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={questions[step].placeholder}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/40 resize-none"
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={!input.trim() || saving}
                  className="rounded-xl bg-[#FF5500] px-6 py-2.5 font-dmSans text-sm font-bold text-white transition hover:bg-[#e04a00] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : step < questions.length - 1 ? "Next →" : "Done"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingChat;
