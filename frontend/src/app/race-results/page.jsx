"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";
import { useDataRefetch } from "../../../lib/useDataRefetch";
import RaceChatModal from "../../../components/ui/RaceChatModal";
import SeasonSummaryStrip from "../../../components/layout/SeasonSummaryStrip";

const TYPE_OPTIONS = ["All", "Road", "Crit", "Time Trial", "Circuit", "Gravel"];
const TERRAIN_OPTIONS = ["", "Flat", "Rolling", "Hilly", "Mountainous"];
const SORT_OPTIONS = [
  { label: "Date", value: "date" },
  { label: "Distance", value: "distance" },
  { label: "Position", value: "position" },
];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const formatDate = (raw) => {
  if (!raw) return "\u2014";
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatCurrency = (val) =>
  val.toLocaleString("en-US", { style: "currency", currency: "USD" });

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.38)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={onChange}
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            background: "#0D0D0D",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "10px 38px 10px 14px",
            fontSize: 14,
            fontWeight: 500,
            outline: "none",
            minWidth: 150,
            boxShadow: "none",
          }}
        >
          {options.map((o) => {
            const option = typeof o === "string" ? { label: o, value: o } : o;
            return (
              <option
                key={option.value}
                value={option.value}
                style={{ backgroundColor: "#0D0D0D", color: "#FFFFFF" }}
              >
                {option.label}
              </option>
            );
          })}
        </select>
        <span
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "rgba(255,255,255,0.55)",
            fontSize: 12,
          }}
        >
          {"\u25BC"}
        </span>
      </div>
    </div>
  );
}

export default function RacesPage() {
  const [races, setRaces] = useState([]);
  const [sortBy, setSortBy] = useState("date");
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [chatRaceId, setChatRaceId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "Road",
    date: new Date().toISOString().split("T")[0],
    location: "",
    distance: "",
    elevationGain: "",
    priority: "B",
    time: "",
    position: "",
    number: "",
    totalRiders: "",
    story: "",
    terrain: "",
    weather: "",
    description: "",
  });
  const [formError, setFormError] = useState("");
  const refetchKey = useDataRefetch();

  useEffect(() => {
    setLoading(true);
    api
      .get("/races")
      .then((data) => setRaces(data || []))
      .catch((err) => console.error("Failed to load races:", err))
      .finally(() => setLoading(false));
  }, [refetchKey]);

  const sorted = useMemo(() => {
    const filtered = races.filter((r) => {
      if (typeFilter !== "All" && r.type !== typeFilter) return false;
      const name = (r.name || "").toLowerCase();
      if (searchQuery && !name.includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "date") return new Date(b.date) - new Date(a.date);
      if (sortBy === "distance") return (parseFloat(b.distance) || 0) - (parseFloat(a.distance) || 0);
      if (sortBy === "position") return (a.position || 999) - (b.position || 999);
      return 0;
    });
  }, [races, sortBy, typeFilter, searchQuery]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return races
      .filter((r) => new Date(r.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
  }, [races]);

  const visible = sorted.slice(0, visibleCount);
  const hasMore = sorted.length > visibleCount;

  const resetForm = () => {
    setForm({
      name: "", type: "Road", date: new Date().toISOString().split("T")[0],
      location: "", distance: "", elevationGain: "", priority: "B",
      time: "", position: "", number: "", totalRiders: "", story: "",
      terrain: "", weather: "", description: "",
    });
    setEditId(null);
    setFormError("");
  };

  const handleEdit = (race) => {
    const d = new Date(race.date);
    setForm({
      name: race.name || "",
      type: race.type || "Road",
      date: isNaN(d) ? new Date().toISOString().split("T")[0] : d.toISOString().split("T")[0],
      location: race.location || "",
      distance: race.distance != null ? String(race.distance) : "",
      elevationGain: race.elevationGain != null ? String(race.elevationGain) : "",
      priority: race.priority || "B",
      time: race.time || "",
      position: race.position != null ? String(race.position) : "",
      number: race.number != null ? String(race.number) : "",
      totalRiders: race.totalRiders != null ? String(race.totalRiders) : "",
      story: race.story || "",
      terrain: race.terrain || "",
      weather: race.weather || "",
      description: race.description || "",
    });
    setEditId(race._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/races/${id}`);
      setRaces((prev) => prev.filter((r) => r._id !== id));
    } catch {
      setFormError("Failed to delete race");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.location.trim()) {
      setFormError("Name and location are required");
      return;
    }
    const isPast = new Date(form.date) < new Date();
    const body = {
      name: form.name.trim(),
      type: form.type,
      date: form.date,
      location: form.location.trim(),
      distance: parseFloat(form.distance) || 0,
      elevationGain: parseFloat(form.elevationGain) || 0,
      priority: form.priority,
      time: form.time,
      position: form.position ? parseInt(form.position, 10) : null,
      number: form.number ? parseInt(form.number, 10) : null,
      totalRiders: form.totalRiders ? parseInt(form.totalRiders, 10) : null,
      story: form.story,
      terrain: form.terrain,
      weather: form.weather,
      description: form.description,
      completed: isPast ? true : false,
    };

    try {
      if (editId) {
        const updated = await api.put(`/races/${editId}`, body);
        setRaces((prev) => prev.map((r) => (r._id === editId ? updated : r)));
      } else {
        const created = await api.post("/races", body);
        setRaces((prev) => [created, ...prev]);
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      setFormError(err.message || "Failed to save race");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[62%] top-[-8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.04)_0%,transparent_72%)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-[1] mx-auto max-w-[1320px] px-4 pb-10 pt-[44px] md:px-6 md:pt-[52px] xl:px-8"
      >
        <div className="mb-8 border-b border-white/10 pb-6">
          <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
            Competition
          </p>
          <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
            YOUR <span className="text-[#FF5500]">RACES</span>
          </h1>
          <p className="mt-3 font-dmSans text-sm text-white/50">
            Every finish line you&apos;ve crossed.
          </p>
        </div>

        {/* Upcoming Race */}
        {upcoming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={{
              background: "linear-gradient(135deg, rgba(255,85,0,0.12), rgba(255,85,0,0.04))",
              border: "1px solid rgba(255,85,0,0.2)",
              borderRadius: 12,
              padding: "1.25rem 1.5rem",
              marginBottom: "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#FF5500",
                }}
              >
                Up Next
              </span>
              <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 700, color: "#fff" }}>
                {upcoming.name}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                {upcoming.location} &middot; {formatDate(upcoming.date)} &middot; {upcoming.type}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {parseFloat(upcoming.distance || 0).toFixed(2)} km
              </span>
              {upcoming.elevationGain > 0 && (
                <p
                  style={{
                    margin: "2px 0 0",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  {upcoming.elevationGain}m &uarr;
                </p>
              )}
            </div>
          </motion.div>
        )}

        <SeasonSummaryStrip races={races} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "center",
            marginBottom: "1.4rem",
          }}
        >
          <FilterSelect
            label="Sort by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={SORT_OPTIONS}
          />
          <FilterSelect
            label="Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={TYPE_OPTIONS.map((o) => ({
              label: o === "All" ? "All Types" : o,
              value: o,
            }))}
          />
          <input
            type="text"
            placeholder="Search races..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: 220,
              background: "#0D0D0D",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 14,
              outline: "none",
            }}
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { resetForm(); setShowForm(true); }}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: "#FF5500",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + Add Race
          </motion.button>
        </motion.div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
            onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); resetForm(); } }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: "#0D0D0D",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "1.5rem",
                width: "100%",
                maxWidth: 560,
                maxHeight: "85vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h2
                  style={{
                    fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                    fontSize: "1.6rem",
                    fontWeight: 400,
                    letterSpacing: "0.04em",
                    margin: 0,
                    color: "#fff",
                  }}
                >
                  {editId ? "EDIT" : "ADD"} <span style={{ color: "#FF5500" }}>RACE</span>
                </h2>
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 20,
                    cursor: "pointer",
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  {"\u2715"}
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Name
                    </label>
                    <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Race name" style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Type
                    </label>
                    <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", appearance: "none" }}>
                      {TYPE_OPTIONS.filter((t) => t !== "All").map((t) => (<option key={t} value={t} style={{ background: "#080808" }}>{t}</option>))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Date
                    </label>
                    <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", colorScheme: "dark" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Location
                    </label>
                    <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="City" style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Distance (km)
                    </label>
                    <input type="number" step="0.1" value={form.distance} onChange={(e) => setForm((p) => ({ ...p, distance: e.target.value }))} placeholder="0" style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Elevation (m)
                    </label>
                    <input type="number" value={form.elevationGain} onChange={(e) => setForm((p) => ({ ...p, elevationGain: e.target.value }))} placeholder="0" style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Time
                    </label>
                    <input value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} placeholder="e.g. 4:12:00" style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Position
                    </label>
                    <input type="number" min="1" value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} placeholder="1st, 5th, ..." style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Race No.
                    </label>
                    <input type="number" value={form.number} onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))} placeholder="42" style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Total Riders
                    </label>
                    <input type="number" value={form.totalRiders} onChange={(e) => setForm((p) => ({ ...p, totalRiders: e.target.value }))} placeholder="120" style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Priority
                    </label>
                    <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", appearance: "none" }}>
                      {["A", "B", "C"].map((p) => (<option key={p} value={p} style={{ background: "#080808" }}>{p}</option>))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Terrain
                    </label>
                    <select value={form.terrain} onChange={(e) => setForm((p) => ({ ...p, terrain: e.target.value }))} style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", appearance: "none" }}>
                      {TERRAIN_OPTIONS.map((t) => (<option key={t} value={t} style={{ background: "#080808" }}>{t || "Any"}</option>))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Weather
                    </label>
                    <input value={form.weather} onChange={(e) => setForm((p) => ({ ...p, weather: e.target.value }))} placeholder="e.g. Sunny, 22\u00b0C" style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Description
                    </label>
                    <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Race description, route details, etc." style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", resize: "none", fontFamily: "'DM Sans', sans-serif" }} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4 }}>
                      Story
                    </label>
                    <textarea value={form.story} onChange={(e) => setForm((p) => ({ ...p, story: e.target.value }))} rows={2} placeholder="How did it go?" style={{ width: "100%", background: "#080808", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", resize: "none", fontFamily: "'DM Sans', sans-serif" }} />
                  </div>
                </div>

                {formError && <p style={{ margin: 0, fontSize: 12, color: "#E74C3C" }}>{formError}</p>}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                    style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button type="submit"
                    style={{ padding: "10px 18px", borderRadius: 10, background: "#FF5500", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: "none", cursor: "pointer" }}>
                    {editId ? "Update" : "Add Race"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Table */}
        <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
          Showing {visible.length} of {sorted.length} races
        </p>

        <div style={{ marginBottom: "2rem" }}>
          {/* Header Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(150px, 1.3fr) 70px 85px 70px 90px 75px 80px 50px 50px",
              gap: 10,
              padding: "8px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {["Race", "Type", "Date", "Dist", "Time", "Pos", "Elev", "", ""].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                  textAlign: ["Type", "Date", "Dist", "Time", "Pos", "Elev"].includes(h) ? "right" : "left",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding: "2.5rem 16px", fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
              Loading...
            </div>
          ) : visible.length === 0 ? (
            <div style={{ padding: "2.5rem 16px", fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
              No races found.
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show">
              {visible.map((race, index) => (
                <motion.div
                  key={race._id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(150px, 1.3fr) 70px 85px 70px 90px 75px 80px 50px 50px",
                    gap: 10,
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    transition: "background 0.14s ease",
                    background: race.position === 1 ? "rgba(255,215,0,0.04)" : "transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = race.position === 1 ? "rgba(255,215,0,0.07)" : "rgba(255,255,255,0.025)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = race.position === 1 ? "rgba(255,215,0,0.04)" : "transparent")}
                >
                  <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {race.name}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                        {race.location}
                        {race.terrain && <span style={{ color: "rgba(255,255,255,0.18)" }}> &middot; {race.terrain}</span>}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", textAlign: "right" }}>
                    {race.type}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatDate(race.date)}
                  </span>
                  <span style={{ fontSize: 13, color: "#fff", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>
                    {race.distance ? `${parseFloat(race.distance).toFixed(2)}k` : "\u2014"}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>
                    {race.time || "\u2014"}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: race.position === 1 ? "#FFD700" : race.position === 2 ? "#C0C0C0" : race.position === 3 ? "#CD7F32" : "#FF5500", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>
                    {race.position ? `${race.position}${race.position === 1 ? "st" : race.position === 2 ? "nd" : race.position === 3 ? "rd" : "th"}` : "\u2014"}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>
                    {race.elevationGain > 0 ? `${parseFloat(race.elevationGain).toFixed(1)}m` : "\u2014"}
                  </span>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setChatRaceId(race._id)}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13, padding: 0 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#7C8CFF")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                      title="Race Chat"
                    >
                      {"\uD83D\uDCAC"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => handleEdit(race)}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13, padding: 0 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#FF5500")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                    >
                      {"\u270E"}
                    </button>
                    <button
                      onClick={() => handleDelete(race._id)}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13, padding: 0 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#E74C3C")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                    >
                      {"\u2715"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <motion.button
            onClick={() => setVisibleCount((c) => c + 12)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 18px",
              borderRadius: 8,
              background: "#FF5500",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
            }}
          >
            Load More
          </motion.button>
        )}
      </motion.main>

      {chatRaceId && (
        <RaceChatModal
          raceId={chatRaceId}
          onClose={() => setChatRaceId(null)}
        />
      )}
    </div>
  );
}
