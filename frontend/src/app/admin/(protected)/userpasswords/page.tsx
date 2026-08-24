"use client";

import { useEffect, useState } from "react";
import { adminApi } from "../../../../../lib/admin-api";

interface UserRow {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: string;
  createdAt: string;
}

interface ResetResult {
  message: string;
  email: string;
  generatedPassword?: string;
}

export default function AdminUserPasswordsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<{ users: UserRow[] }>("/userpasswords")
      .then((res) => {
        if (!cancelled) setUsers(res.users || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
    );
  });

  const handleReset = async () => {
    if (!selected) return;
    setActionError("");
    setResult(null);
    if (newPassword && newPassword.length < 6) {
      setActionError("Password must be at least 6 characters");
      return;
    }
    setResetting(true);
    try {
      const res = await adminApi.post<ResetResult>("/userpasswords/reset", {
        userId: selected._id,
        newPassword: newPassword || undefined,
      });
      setResult(res);
      setNewPassword("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div>
      <h1 className="font-barlowCondensed text-3xl uppercase tracking-[0.04em] text-white">
        User Passwords
      </h1>
      <p className="mt-2 font-dmSans text-sm text-white/50">
        Reset any user&apos;s password. Leave the new password blank to auto-generate a temporary one.
      </p>

      <form onSubmit={(e) => e.preventDefault()} className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-dmSans text-sm text-white outline-none focus:border-[#FF5500]/50"
        />
      </form>

      {error && <p className="mt-4 font-dmSans text-sm text-red-400">{error}</p>}

      {selected && (
        <div className="mt-6 rounded-xl border border-[#FF5500]/20 bg-[#FF5500]/[0.04] p-5">
          <p className="font-dmSans text-sm text-white/70">
            Reset password for{" "}
            <span className="text-white">
              {selected.firstName} {selected.lastName}
            </span>{" "}
            <span className="text-white/40">({selected.email})</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="New password (blank = auto-generate)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-72 rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-dmSans text-sm text-white outline-none focus:border-[#FF5500]/50"
            />
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="rounded-lg bg-[#FF5500] px-4 py-2 font-dmSans text-sm font-semibold text-white transition hover:bg-[#e04a00] disabled:opacity-50"
            >
              {resetting ? "Resetting..." : "Reset Password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setResult(null);
                setActionError("");
                setNewPassword("");
              }}
              className="rounded-lg border border-white/10 px-4 py-2 font-dmSans text-sm text-white/60 transition hover:text-white"
            >
              Cancel
            </button>
          </div>

          {actionError && (
            <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 font-dmSans text-sm text-red-400">
              {actionError}
            </p>
          )}

          {result && (
            <div className="mt-3 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3">
              <p className="font-dmSans text-sm text-green-400">{result.message}</p>
              {result.generatedPassword && (
                <p className="mt-2 flex flex-wrap items-center gap-3 font-dmSans text-sm text-white/70">
                  Temporary password:{" "}
                  <code className="rounded bg-black/40 px-2 py-1 text-[#FF5500]">
                    {result.generatedPassword}
                  </code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(result.generatedPassword!)}
                    className="text-xs uppercase tracking-wide text-white/40 underline underline-offset-2 hover:text-white"
                  >
                    Copy
                  </button>
                </p>
              )}
              <p className="mt-2 font-dmSans text-xs text-white/40">
                Share it with the user securely — they should change it after logging in.
              </p>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="mt-8 font-dmSans text-sm text-white/40">Loading users...</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] font-dmSans text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/40">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/80">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3 text-white/70">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs uppercase ${
                        user.subscriptionTier === "pro"
                          ? "bg-[#FF5500]/20 text-[#FF5500]"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {user.subscriptionTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/50">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(user);
                        setResult(null);
                        setActionError("");
                        setNewPassword("");
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        selected?._id === user._id
                          ? "bg-[#FF5500]/15 text-[#FF5500]"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      Reset
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/40">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
