"use client";

import { useState } from "react";
import { adminApi } from "../../../../../lib/admin-api";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [segment, setSegment] = useState("all");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult("");
    setLoading(true);
    try {
      const res = await adminApi.post<{ sent: number; message: string }>(
        "/admin/notifications/broadcast",
        { title, message, segment },
      );
      setResult(`Sent to ${res.sent} users`);
      setTitle("");
      setMessage("");
    } catch (err: unknown) {
      setResult(err instanceof Error ? err.message : "Broadcast failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-barlowCondensed text-3xl uppercase tracking-[0.04em] text-white">
        Broadcast Notification
      </h1>
      <p className="mt-1 font-dmSans text-sm text-white/40">
        Send a system notification to all users or a segment
      </p>

      <form onSubmit={handleBroadcast} className="mt-8 max-w-lg space-y-4">
        <div>
          <label className="font-dmSans text-xs uppercase tracking-[0.14em] text-white/40">Segment</label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-[#111318] px-4 py-2 font-dmSans text-sm text-white"
          >
            <option value="all">All users</option>
            <option value="pro">Pro users only</option>
            <option value="free">Free users only</option>
          </select>
        </div>
        <div>
          <label className="font-dmSans text-xs uppercase tracking-[0.14em] text-white/40">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-dmSans text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="font-dmSans text-xs uppercase tracking-[0.14em] text-white/40">Message</label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-dmSans text-sm text-white outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#FF5500] px-6 py-2 font-dmSans text-sm text-white disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Broadcast"}
        </button>
      </form>

      {result && (
        <p className="mt-4 font-dmSans text-sm text-white/70">{result}</p>
      )}
    </div>
  );
}
