"use client";

import { useEffect, useState } from "react";
import { adminApi } from "../../../../../lib/admin-api";

interface HealthData {
  ok: boolean;
  checkedAt: string;
  mongo: string;
  redis: string;
  llmProvider: string;
  llmModel: string;
  stravaConfigured: boolean;
}

interface GeminiData {
  checkedAt: string;
  summary: { total: number; valid: number; exhausted: number; invalid: number };
  keys: Array<{ keyMasked: string; valid: boolean; exhausted: boolean; error?: string }>;
}

export default function AdminSystemPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [gemini, setGemini] = useState<GeminiData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      adminApi.get<HealthData>("/admin/system/health"),
      adminApi.get<GeminiData>("/admin/system/gemini"),
    ])
      .then(([h, g]) => {
        setHealth(h);
        setGemini(g);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="font-dmSans text-sm text-red-400">{error}</p>;

  return (
    <div>
      <h1 className="font-barlowCondensed text-3xl uppercase tracking-[0.04em] text-white">
        System Health
      </h1>

      {health && (
        <section className="mt-8 rounded-xl border border-white/10 p-5">
          <h2 className="font-dmSans text-xs uppercase tracking-[0.14em] text-white/40">Infrastructure</h2>
          <dl className="mt-4 grid gap-3 font-dmSans text-sm sm:grid-cols-2">
            <div className="flex justify-between rounded-lg bg-white/[0.03] px-4 py-3">
              <dt className="text-white/40">API</dt>
              <dd className={health.ok ? "text-green-400" : "text-red-400"}>{health.ok ? "OK" : "Down"}</dd>
            </div>
            <div className="flex justify-between rounded-lg bg-white/[0.03] px-4 py-3">
              <dt className="text-white/40">MongoDB</dt>
              <dd className={health.mongo === "connected" ? "text-green-400" : "text-red-400"}>{health.mongo}</dd>
            </div>
            <div className="flex justify-between rounded-lg bg-white/[0.03] px-4 py-3">
              <dt className="text-white/40">Queue</dt>
              <dd className="text-white/70">{health.redis}</dd>
            </div>
            <div className="flex justify-between rounded-lg bg-white/[0.03] px-4 py-3">
              <dt className="text-white/40">LLM Provider</dt>
              <dd className="text-white/70">{health.llmProvider}</dd>
            </div>
            <div className="flex justify-between rounded-lg bg-white/[0.03] px-4 py-3">
              <dt className="text-white/40">LLM Model</dt>
              <dd className="text-white/70">{health.llmModel}</dd>
            </div>
            <div className="flex justify-between rounded-lg bg-white/[0.03] px-4 py-3">
              <dt className="text-white/40">Strava Configured</dt>
              <dd className={health.stravaConfigured ? "text-green-400" : "text-yellow-400"}>
                {health.stravaConfigured ? "Yes" : "No"}
              </dd>
            </div>
          </dl>
          <p className="mt-3 font-dmSans text-xs text-white/30">
            Checked {new Date(health.checkedAt).toLocaleString()}
          </p>
        </section>
      )}

      {gemini && (
        <section className="mt-8 rounded-xl border border-white/10 p-5">
          <h2 className="font-dmSans text-xs uppercase tracking-[0.14em] text-white/40">Gemini Keys</h2>
          <div className="mt-4 flex gap-4 font-dmSans text-sm">
            <span className="text-white/50">Total: {gemini.summary.total}</span>
            <span className="text-green-400">Valid: {gemini.summary.valid}</span>
            <span className="text-yellow-400">Exhausted: {gemini.summary.exhausted}</span>
            <span className="text-red-400">Invalid: {gemini.summary.invalid}</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full font-dmSans text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/40">
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">Valid</th>
                  <th className="px-3 py-2">Exhausted</th>
                  <th className="px-3 py-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {gemini.keys.map((k, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="px-3 py-2 text-white/70">{k.keyMasked}</td>
                    <td className="px-3 py-2">{k.valid ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">{k.exhausted ? "Yes" : "No"}</td>
                    <td className="px-3 py-2 text-white/40">{k.error || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
