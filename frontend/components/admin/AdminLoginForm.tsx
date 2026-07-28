"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "../../lib/admin-api";
import { completeAdminSession } from "../../lib/admin-auth";

export default function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await adminApi.post<{ token: string; username: string }>("/admin/auth/login", {
        username,
        password,
      });
      completeAdminSession(res.token, res.username);
      router.replace("/admin/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0C0F] px-4">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,85,0,0.08),transparent_28%)]" />
      <div className="relative w-full max-w-md rounded-[24px] border border-white/10 bg-[#111318]/90 p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
        <p className="font-barlowCondensed text-xs uppercase tracking-[0.2em] text-[#FF5500]">
          Admin Panel
        </p>
        <h1 className="mt-2 font-barlowCondensed text-3xl uppercase tracking-[0.04em] text-white">
          Sign in
        </h1>
        <p className="mt-2 font-dmSans text-sm text-white/50">
          Authorized personnel only
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div>
            <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none focus:border-[#FF5500]/50"
            />
          </div>
          <div>
            <label className="font-dmSans text-xs uppercase tracking-[0.16em] text-white/40">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none focus:border-[#FF5500]/50"
            />
          </div>
          {error && (
            <p className="font-dmSans text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#FF5500] py-3 font-dmSans text-sm font-medium text-white transition hover:bg-[#FF5500]/90 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
