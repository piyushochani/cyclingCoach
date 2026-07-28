"use client";

import { useEffect, useState } from "react";
import { adminApi } from "../../../../../lib/admin-api";

interface AuditEntry {
  _id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  adminUsername: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .get<AuditEntry[]>("/admin/audit-log?limit=100")
      .then(setEntries)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="font-dmSans text-sm text-red-400">{error}</p>;

  return (
    <div>
      <h1 className="font-barlowCondensed text-3xl uppercase tracking-[0.04em] text-white">
        Audit Log
      </h1>
      <p className="mt-1 font-dmSans text-sm text-white/40">
        Recent admin actions
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[720px] font-dmSans text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/40">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry._id} className="border-b border-white/5">
                <td className="px-4 py-3 text-white/50">
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-white/70">{entry.adminUsername}</td>
                <td className="px-4 py-3 text-[#FF5500]">{entry.action}</td>
                <td className="px-4 py-3 text-white/50">
                  {entry.targetType ? `${entry.targetType}:${entry.targetId || ""}` : "—"}
                </td>
                <td className="px-4 py-3 text-white/40">
                  {entry.metadata ? JSON.stringify(entry.metadata) : "—"}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/30">
                  No audit entries yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
