"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../../../lib/api";

type SyncStatus = "idle" | "exchanging" | "storing" | "syncing" | "done" | "error";

function StravaCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SyncStatus>("exchanging");
  const [message, setMessage] = useState("Exchanging authorization code for tokens...");

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
      .then(() => {
        if (cancelled) return;
        setStatus("done");
        setMessage("Ready! Redirecting to dashboard...");
        setTimeout(() => router.push("/dashboard"), 1500);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err?.message || "Something went wrong.");
      });

    return () => { cancelled = true; };
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111318] p-6 md:p-8">
        <h1 className="font-barlowCondensed text-3xl uppercase tracking-wide text-white">
          Strava Authorization
        </h1>

        <div className="mt-6 flex flex-col items-center gap-4">
          {/* Spinner */}
          {status !== "error" && (
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#FF5500]" />
          )}

          {/* Error icon */}
          {status === "error" && (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}

          {/* Done icon */}
          {status === "done" && (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          <p className={`text-center font-dmSans text-sm ${
            status === "error" ? "text-red-400" :
            status === "done" ? "text-green-400" :
            "text-white/50"
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
    </div>
  );
}

export default function StravaCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black p-4">
        <p className="font-dmSans text-sm text-white/50">Loading...</p>
      </div>
    }>
      <StravaCallbackInner />
    </Suspense>
  );
}
