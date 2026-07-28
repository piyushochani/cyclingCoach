"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "../../../../../lib/admin-api";

interface UserRow {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: string;
  lastSyncAt?: string;
  createdAt: string;
}

interface UsersResponse {
  users: UserRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (tier) params.set("tier", tier);

    adminApi
      .get<UsersResponse>(`/admin/users?${params}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search, tier]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div>
      <h1 className="font-barlowCondensed text-3xl uppercase tracking-[0.04em] text-white">
        Users
      </h1>

      <form onSubmit={handleSearch} className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-dmSans text-sm text-white outline-none focus:border-[#FF5500]/50"
        />
        <select
          value={tier}
          onChange={(e) => { setTier(e.target.value); setPage(1); }}
          className="rounded-lg border border-white/10 bg-[#111318] px-4 py-2 font-dmSans text-sm text-white outline-none"
        >
          <option value="">All tiers</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-[#FF5500] px-4 py-2 font-dmSans text-sm text-white"
        >
          Search
        </button>
      </form>

      {error && <p className="mt-4 font-dmSans text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="mt-8 font-dmSans text-sm text-white/40">Loading users...</p>
      ) : data ? (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[640px] font-dmSans text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/40">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Last Sync</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${user._id}`} className="text-[#FF5500] hover:underline">
                        {user.firstName} {user.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-white/70">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs uppercase ${
                        user.subscriptionTier === "pro"
                          ? "bg-[#FF5500]/20 text-[#FF5500]"
                          : "bg-white/10 text-white/50"
                      }`}>
                        {user.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50">
                      {user.lastSyncAt ? new Date(user.lastSyncAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-white/50">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-4 font-dmSans text-sm text-white/50">
            <span>
              Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
            </span>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="disabled:opacity-30"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= data.pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
