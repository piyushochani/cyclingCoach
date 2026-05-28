"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { api } from "../../lib/api";

export default function RaceChatModal({ raceId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    api
      .get(`/races/${raceId}/chat`)
      .then((data) => setMessages(data?.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [raceId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");
    const optimistic = { role: "user", content: msg, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const updated = await api.post(`/races/${raceId}/chat`, { role: "user", content: msg });
      setMessages(updated?.messages || []);
    } catch {
      setMessages((prev) => prev.filter((m) => m !== optimistic));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: "#0D0D0D",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "1.25rem",
          width: "100%",
          maxWidth: 480,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: "1.4rem", fontWeight: 400, letterSpacing: "0.04em", margin: 0, color: "#fff" }}>
            RACE <span style={{ color: "#FF5500" }}>CHAT</span>
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1 }}>
            {"\u2715"}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", marginBottom: "0.75rem", display: "flex", flexDirection: "column", gap: 8, minHeight: 200 }}>
          {loading ? (
            <p style={{ margin: "auto", fontSize: 13, color: "rgba(255,255,255,0.2)" }}>Loading...</p>
          ) : messages.length === 0 ? (
            <p style={{ margin: "auto", fontSize: 13, color: "rgba(255,255,255,0.2)" }}>No messages yet. Start a conversation about this race.</p>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "#FF5500" : "rgba(255,255,255,0.06)",
                color: m.role === "user" ? "#fff" : "rgba(255,255,255,0.85)",
                borderRadius: 12,
                padding: "8px 14px",
                maxWidth: "80%",
                fontSize: 13,
                lineHeight: 1.5,
                borderBottomRightRadius: m.role === "user" ? 4 : 12,
                borderBottomLeftRadius: m.role === "user" ? 12 : 4,
              }}>
                {m.content}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this race..."
            rows={1}
            style={{
              flex: 1,
              background: "#080808",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 14,
              outline: "none",
              resize: "none",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "#FF5500",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Send
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
