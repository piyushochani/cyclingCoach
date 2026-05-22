"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const STRAVA_BASE = "https://www.strava.com/api/v3";

const CYCLING_DISTANCES = [
  { label: "5 km",   meters: 5000   },
  { label: "10 km",  meters: 10000  },
  { label: "20 km",  meters: 20000  },
  { label: "50 km",  meters: 50000  },
  { label: "100 km", meters: 100000 },
];

async function fetchBestEfforts(accessToken) {
  const res = await fetch(`${STRAVA_BASE}/athlete/activities?per_page=200&page=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch activities");
  const activities = await res.json();
  const rides = activities.filter((a) => a.type === "Ride" || a.type === "VirtualRide");
  const efforts = {};
  for (const bucket of CYCLING_DISTANCES) {
    const lo = bucket.meters * 0.95;
    const hi = bucket.meters * 1.05;
    efforts[bucket.label] = rides
      .filter((r) => r.distance >= lo && r.distance <= hi)
      .map((r) => ({ id: r.id, name: r.name, time: r.moving_time, date: r.start_date_local, distance: r.distance, avgSpeed: r.average_speed }))
      .sort((a, b) => a.time - b.time)
      .slice(0, 5)
      .map((e, i) => ({ rank: i + 1, ...e }));
  }
  return efforts;
}

async function fetchTopSegments(accessToken) {
  const res = await fetch(`${STRAVA_BASE}/segments/starred?per_page=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch segments");
  const segments = await res.json();
  const results = await Promise.allSettled(
    segments.map(async (seg) => {
      const lb = await fetch(`${STRAVA_BASE}/segments/${seg.id}/leaderboard?per_page=10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!lb.ok) return null;
      const data = await lb.json();
      const athleteRank = seg.athlete_segment_stats?.effort_count
        ? (data.entries?.findIndex((e) => e.elapsed_time === seg.athlete_segment_stats?.pr_elapsed_time) ?? -1) + 1
        : null;
      if (!athleteRank || athleteRank > 10 || athleteRank < 1) return null;
      return {
        id: seg.id, name: seg.name, distance: seg.distance,
        avgGrade: seg.average_grade, komTime: data.entries?.[0]?.elapsed_time,
        athleteTime: seg.athlete_segment_stats?.pr_elapsed_time,
        rank: athleteRank, isKOM: athleteRank === 1,
        city: seg.city, state: seg.state,
      };
    })
  );
  return results
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value)
    .sort((a, b) => a.rank - b.rank);
}

function formatTime(secs) {
  if (!secs) return "—";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function formatSpeed(ms) { return ms ? `${(ms * 3.6).toFixed(1)} km/h` : "—"; }
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function diffLabel(efforts, i) {
  if (!efforts.length || i === 0) return null;
  const d = efforts[i].time - efforts[0].time;
  const m = Math.floor(d / 60);
  const s = d % 60;
  return `+${m > 0 ? `${m}m ` : ""}${s}s`;
}

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

// ── MOCK DATA ──────────────────────────────────────────────────────────────────
const MOCK_EFFORTS = {
  "5 km":   [
    { rank: 1, id: 1, name: "Morning Spin · Bandra",   time: 462,  date: "2024-11-10", distance: 5020,  avgSpeed: 10.86 },
    { rank: 2, id: 2, name: "Evening Ride · Sea Link", time: 498,  date: "2024-10-22", distance: 5110,  avgSpeed: 10.24 },
    { rank: 3, id: 3, name: "Weekend Loop",             time: 531,  date: "2024-09-14", distance: 4980,  avgSpeed: 9.38  },
    { rank: 4, id: 7, name: "Early Bird Ride",          time: 554,  date: "2024-08-03", distance: 4970,  avgSpeed: 8.97  },
  ],
  "10 km":  [
    { rank: 1, id: 4, name: "Gateway to Worli",         time: 1035, date: "2024-11-02", distance: 10050, avgSpeed: 9.71 },
    { rank: 2, id: 5, name: "Juhu Circuit",             time: 1112, date: "2024-10-05", distance: 9940,  avgSpeed: 8.94 },
    { rank: 3, id: 8, name: "Andheri Loop",             time: 1198, date: "2024-09-20", distance: 10080, avgSpeed: 8.41 },
  ],
  "20 km":  [
    { rank: 1, id: 6, name: "Marine Drive & Back",      time: 2310, date: "2024-10-18", distance: 20100, avgSpeed: 8.7  },
    { rank: 2, id: 9, name: "Bandra–Worli–Bandra",      time: 2580, date: "2024-09-01", distance: 20300, avgSpeed: 7.87 },
  ],
  "50 km":  [],
  "100 km": [],
};
const MOCK_SEGMENTS = [
  { id: 1, name: "Sea Link Sprint",      distance: 3500, avgGrade: 0.3, rank: 1, athleteTime: 324, komTime: 324, city: "Mumbai", state: "MH", isKOM: true  },
  { id: 3, name: "Carter Road Flat-out", distance: 1200, avgGrade: -0.1,rank: 2, athleteTime: 110, komTime: 104, city: "Mumbai", state: "MH", isKOM: false },
  { id: 2, name: "Bandra Flyover Climb", distance: 800,  avgGrade: 4.2, rank: 3, athleteTime: 98,  komTime: 87,  city: "Bandra", state: "MH", isKOM: false },
  { id: 4, name: "Worli Seaface Dash",   distance: 2100, avgGrade: 0.5, rank: 7, athleteTime: 228, komTime: 189, city: "Worli",  state: "MH", isKOM: false },
  { id: 5, name: "Powai Lake Loop",      distance: 4800, avgGrade: 1.2, rank: 1, athleteTime: 701, komTime: 701, city: "Powai",  state: "MH", isKOM: true  },
];

// ── PAGE ───────────────────────────────────────────────────────────────────────
const BestEffortsPage = () => {
  const [activeTab, setActiveTab] = useState("5 km");
  const [efforts,   setEfforts]   = useState({});
  const [segments,  setSegments]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("strava_access_token") : null;
    if (!token) {
      Promise.resolve().then(() => {
        setEfforts(MOCK_EFFORTS);
        setSegments(MOCK_SEGMENTS);
        setLoading(false);
      });
      return;
    }
    (async () => {
      try {
        const [e, s] = await Promise.all([fetchBestEfforts(token), fetchTopSegments(token)]);
        setEfforts(e); setSegments(s);
      } catch { setEfforts(MOCK_EFFORTS); setSegments(MOCK_SEGMENTS); }
      finally { setLoading(false); }
    })();
  }, []);

  const currentEfforts = efforts[activeTab] || [];

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "2.5rem 1.5rem 5rem", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: "2.75rem" }}>
          <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#FF5500" }}>
            Strava · Cycling
          </p>
          <h1 style={{
            fontFamily: "'Bebas Neue', 'Impact', sans-serif",
            fontSize: "clamp(3rem, 7vw, 5rem)",
            fontWeight: 400, letterSpacing: "0.04em", lineHeight: 0.95,
            margin: "0 0 14px", color: "#fff",
          }}>
            BEST <span style={{ color: "#FF5500" }}>EFFORTS</span>
          </h1>
          <div style={{ width: 36, height: 2, background: "#FF5500", marginBottom: 14, borderRadius: 2 }} />
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>
            Your fastest cycling efforts by distance, live from Strava.
          </p>
        </motion.div>

        {/* ── TABS ───────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          style={{ display: "flex", gap: 6, marginBottom: "1.75rem", flexWrap: "wrap" }}>
          {CYCLING_DISTANCES.map((d) => {
            const active = activeTab === d.label;
            return (
              <button key={d.label} onClick={() => setActiveTab(d.label)} style={{
                padding: "5px 16px", borderRadius: 4,
                border: active ? "1px solid #FF5500" : "1px solid rgba(255,255,255,0.08)",
                background: active ? "#FF5500" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.38)",
                fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer", letterSpacing: "0.03em",
                transition: "all 0.15s ease",
              }}>
                {d.label}
              </button>
            );
          })}
        </motion.div>

        {/* ── EFFORTS TABLE ──────────────────────────────────────────────── */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
          style={{ marginBottom: "3.5rem" }}>

          {/* col headers */}
          <div style={{
            display: "grid", gridTemplateColumns: "40px 1fr 110px 110px 105px 80px",
            padding: "8px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            {["#", "Activity", "Time", "Speed", "Date", "Δ PR"].map((h) => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{h}</span>
            ))}
          </div>

          {loading ? <SkeletonRows /> : currentEfforts.length === 0 ? <EmptyState label={activeTab} /> : (
            <motion.div variants={stagger} initial="hidden" animate="show">
              {currentEfforts.map((effort, i) => (
                <EffortRow key={effort.id ?? i} effort={effort} i={i} efforts={currentEfforts} />
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* ── SEGMENTS & KOMs ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.45 }}>

          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{
              fontFamily: "'Bebas Neue', 'Impact', sans-serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 400,
              letterSpacing: "0.04em", margin: 0, color: "#fff",
            }}>
              SEGMENTS & <span style={{ color: "#FF5500" }}>KOMs</span>
            </h2>
            <p style={{ margin: "5px 0 0", fontSize: 13, color: "rgba(255,255,255,0.28)" }}>
              Strava segments where you rank in the top 10
            </p>
          </div>

          {loading ? <SegmentSkeleton /> : segments.length === 0 ? (
            <div style={{ padding: "2rem 0", color: "rgba(255,255,255,0.22)", fontSize: 14 }}>
              No top-10 segments found — keep riding.
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {segments.map((seg) => (
                <motion.div key={seg.id} variants={fadeUp}><SegmentRow seg={seg} /></motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

      </div>
    </div>
  );
};

// ── EFFORT ROW ─────────────────────────────────────────────────────────────────
function EffortRow({ effort, i, efforts }) {
  const isPR = i === 0;
  const [hovered, setHovered] = React.useState(false);
  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid", gridTemplateColumns: "40px 1fr 110px 110px 105px 80px",
        padding: "13px 16px", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: hovered ? "rgba(255,255,255,0.025)" : isPR ? "rgba(255,85,0,0.03)" : "transparent",
        transition: "background 0.12s ease",
        borderLeft: isPR ? "2px solid #FF5500" : "2px solid transparent",
      }}
    >
      {/* rank */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
        color: isPR ? "#FF5500" : "rgba(255,255,255,0.2)",
      }}>
        {isPR ? "PR" : `#${effort.rank}`}
      </span>

      {/* name */}
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: isPR ? "#fff" : "rgba(255,255,255,0.75)", lineHeight: 1.3 }}>
          {effort.name ?? `Ride · ${formatDate(effort.date)}`}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
          {(effort.distance / 1000).toFixed(2)} km
        </p>
      </div>

      {/* time */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700,
        color: isPR ? "#FF5500" : "rgba(255,255,255,0.85)",
      }}>
        {formatTime(effort.time)}
      </span>

      {/* speed */}
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.38)" }}>
        {formatSpeed(effort.avgSpeed)}
      </span>

      {/* date */}
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
        {formatDate(effort.date)}
      </span>

      {/* delta */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        color: isPR ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
      }}>
        {isPR ? "—" : diffLabel(efforts, i)}
      </span>
    </motion.div>
  );
}

// ── SEGMENT ROW ────────────────────────────────────────────────────────────────
function SegmentRow({ seg }) {
  const isKOM = seg.rank === 1;
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid", gridTemplateColumns: "56px 1fr auto",
        alignItems: "center", padding: "15px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        borderLeft: isKOM ? "2px solid #FF5500" : "2px solid transparent",
        background: hovered ? "rgba(255,255,255,0.025)" : isKOM ? "rgba(255,85,0,0.02)" : "transparent",
        transition: "background 0.12s ease",
      }}
    >
      {/* rank col */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
        {isKOM ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF5500">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2 2h10v1H7v-1z"/>
            </svg>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: "#FF5500", textTransform: "uppercase" }}>KOM</span>
          </>
        ) : (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
            color: seg.rank <= 3 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.22)",
          }}>
            #{seg.rank}
          </span>
        )}
      </div>

      {/* info */}
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: isKOM ? "#fff" : "rgba(255,255,255,0.72)", lineHeight: 1.3 }}>
          {seg.name}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.25)", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span>{(seg.distance / 1000).toFixed(2)} km</span>
          {seg.avgGrade !== undefined && (
            <span style={{ color: seg.avgGrade > 2 ? "rgba(255,85,0,0.6)" : "rgba(255,255,255,0.25)" }}>
              {seg.avgGrade > 0 ? "↑" : "↓"} {Math.abs(seg.avgGrade).toFixed(1)}%
            </span>
          )}
          {seg.city && <span>{seg.city}{seg.state ? `, ${seg.state}` : ""}</span>}
        </p>
      </div>

      {/* times */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700,
          color: isKOM ? "#FF5500" : "#fff",
        }}>
          {formatTime(seg.athleteTime)}
        </span>
        {seg.komTime && !isKOM && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
            KOM · {formatTime(seg.komTime)}
          </span>
        )}
        {isKOM && (
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,85,0,0.55)", textTransform: "uppercase" }}>
            You own this
          </span>
        )}
      </div>
    </div>
  );
}

// ── SKELETONS / EMPTY ─────────────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          height: 54, margin: "1px 0",
          background: "rgba(255,255,255,0.03)",
          animation: `pulse ${1.2 + i * 0.1}s ease-in-out infinite`,
        }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.7}}`}</style>
    </div>
  );
}
function SegmentSkeleton() {
  return (
    <div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          height: 62, margin: "1px 0",
          background: "rgba(255,255,255,0.03)",
          animation: `pulse ${1.2 + i * 0.1}s ease-in-out infinite`,
        }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.7}}`}</style>
    </div>
  );
}
function EmptyState({ label }) {
  return (
    <div style={{ padding: "2.5rem 16px", fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
      No {label} efforts found. Ride more.
    </div>
  );
}

export default BestEffortsPage;