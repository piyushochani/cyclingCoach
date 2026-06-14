"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../../../lib/api";
import FirstSyncTutorial from "../../../../../components/layout/FirstSyncTutorial";
import OnboardingChat from "../../../../../components/layout/OnboardingChat";

type SyncStatus = "idle" | "exchanging" | "storing" | "syncing" | "done" | "error" | "profile";

function StravaCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SyncStatus>("exchanging");
  const [message, setMessage] = useState("Exchanging authorization code for tokens...");
  const [tutorialDone, setTutorialDone] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [goal, setGoal] = useState("");
  const [cyclingYears, setCyclingYears] = useState("");
  const [ftp, setFtp] = useState("");
  const [maxHr, setMaxHr] = useState("");
  const [age, setAge] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/50 focus:bg-white/10";

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      setMessage("No authorization code received from Strava.");
      return;
    }

    let cancelled = false;

    api
      .post("/strava/exchange", { code })
      .then((data: any) => {
        if (cancelled) return;
        setStatus("storing");
        setMessage("Tokens obtained! Storing them...");

        return api.post("/strava/store-tokens", {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        });
      })
      .then(() => {
        if (cancelled) return;
        setStatus("syncing");
        setMessage("First sync in progress...");
        return api.post("/sync/refresh", {});
      })
      .then(async () => {
        if (cancelled) return;
        try {
          const stored = localStorage.getItem("cyclogenai_user");
          if (stored) {
            const u = JSON.parse(stored);
            if (u.email) {
              const alreadyDone = localStorage.getItem("cyclogenai_onboarding_done") === "true" || !!u.onboardingSummary;
              const result: any = await api.post(`/users/${u.email}/training-start`, {});
              u.trainingStart = new Date().toISOString();
              localStorage.setItem("cyclogenai_user", JSON.stringify(u));
              if (!alreadyDone && result?.firstAuth) {
                setShowOnboarding(true);
                return;
              }
            }
          }
        } catch {}
        setStatus("profile");
      })
      .catch((err: any) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err?.message || "Something went wrong.");
      });

    return () => { cancelled = true; };
  }, [searchParams, router]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const stored = localStorage.getItem("cyclogenai_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.email) {
          const update: Record<string, any> = {};
          if (heightCm) update.heightCm = Number(heightCm);
          if (weightKg) update.weightKg = Number(weightKg);
          if (goal) update.goal = goal;
          if (cyclingYears) update.cyclingYears = Number(cyclingYears);
          if (ftp) update.ftp = Number(ftp);
          if (maxHr) update.maxHeartrate = Number(maxHr);
          if (age) {
            const dob = new Date(age);
            const today = new Date();
            let computedAge = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) computedAge--;
            if (computedAge > 0) update.age = computedAge;
          }
          const updated = await api.put(`/users/${u.email}`, update);
          Object.assign(u, updated);
          localStorage.setItem("cyclogenai_user", JSON.stringify(u));
        }
      }
    } catch {}
    setSavingProfile(false);
    router.push("/dashboard");
  };

  const skip = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0C0F] p-4">
      <style>{`
        .callback-scroll::-webkit-scrollbar { width: 5px; }
        .callback-scroll::-webkit-scrollbar-track { background: transparent; }
        .callback-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 999px; }
      `}</style>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,85,0,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,85,0,0.06),transparent_24%)]" />

      {status !== "profile" ? (
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111318] p-6 md:p-8">
          <h1 className="font-barlowCondensed text-3xl uppercase tracking-wide text-white">
            Strava Authorization
          </h1>

          <div className="mt-6 flex flex-col items-center gap-4">
            {status !== "error" && (
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#FF5500]" />
            )}

            {status === "error" && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}

            <p className={`text-center font-dmSans text-sm ${
              status === "error" ? "text-red-400" : "text-white/50"
            }`}>
              {message}
            </p>

            {status === "error" && (
              <p className="text-center font-dmSans text-xs text-white/30">
                Try again from the Refresh button in the navbar.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111318] p-6 md:p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/20">
              <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-barlowCondensed text-3xl uppercase tracking-wide text-white">
              Sync complete
            </h1>
            <p className="mt-1 font-dmSans text-sm text-white/50">
              Your rides are imported. Optionally fill in your profile details.
            </p>
          </div>

          <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1 callback-scroll">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Max Heart Rate</label>
                <input type="number" value={maxHr} onChange={(e) => setMaxHr(e.target.value)} className={inputClass} placeholder="185" />
              </div>
              <div>
                <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">Date of Birth</label>
                <input type="date" value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} />
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
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={skip}
              className="flex-1 rounded-xl border border-white/10 px-4 py-3 font-dmSans text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
            >
              Skip
            </button>
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="flex-1 rounded-xl bg-[#FF5500] px-4 py-3 font-dmSans text-sm font-semibold text-white transition hover:bg-[#e04a00] disabled:opacity-50"
            >
              {savingProfile ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {showOnboarding && (
        <OnboardingChat onComplete={() => { setShowOnboarding(false); setStatus("profile"); }} />
      )}

      {status === "profile" && !tutorialDone && localStorage.getItem("cyclogenai_tutorial_shown") !== "true" && (
        <FirstSyncTutorial onDismiss={() => setTutorialDone(true)} />
      )}
    </div>
  );
}

export default function StravaCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0A0C0F] p-4">
        <p className="font-dmSans text-sm text-white/50">Loading...</p>
      </div>
    }>
      <StravaCallbackInner />
    </Suspense>
  );
}
