"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";
import { useDataRefetch } from "../../lib/useDataRefetch";


// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getWeekNumber(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function weekKey(d) {
  const iso = new Date(d);
  iso.setHours(0, 0, 0, 0);
  // ISO week-year is the year of the week's Thursday.
  iso.setDate(iso.getDate() + 3 - ((iso.getDay() + 6) % 7));
  const wn = getWeekNumber(d);
  return `${iso.getFullYear()}-W${String(wn).padStart(2, "0")}`;
}

function weekStartDate(key) {
  const parts = key.split("-W");
  const year = parseInt(parts[0], 10);
  const wn = parseInt(parts[1], 10);
  // ISO week 1 always contains Jan 4; its Monday is the anchor for week numbering.
  const jan4 = new Date(year, 0, 4);
  jan4.setHours(0, 0, 0, 0);
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const start = new Date(week1Monday);
  start.setDate(week1Monday.getDate() + (wn - 1) * 7);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatWeekDateRange(startDate) {
  const end = new Date(startDate);
  end.setDate(startDate.getDate() + 6);
  const fmt = (d) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `${fmt(startDate)} → ${fmt(end)}`;
}

/** Keep month labels only where they won't overlap on the x-axis. */
function pickVisibleMonthLabels(monthPts, minGap = 56) {
  if (monthPts.length === 0) return [];
  if (monthPts.length === 1) return monthPts;

  const picked = [monthPts[0]];
  for (let i = 1; i < monthPts.length; i++) {
    const pt = monthPts[i];
    if (pt.x - picked[picked.length - 1].x >= minGap) {
      picked.push(pt);
    }
  }

  const last = monthPts[monthPts.length - 1];
  const lastPicked = picked[picked.length - 1];
  if (last !== lastPicked && last.x - lastPicked.x >= minGap) {
    picked.push(last);
  }

  return picked;
}

const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const WORKOUT_LABELS = {
  rest: "Rest", recovery: "Recovery", endurance: "Endurance", tempo: "Tempo",
  threshold: "Threshold", intervals: "Intervals", vo2max: "VO2Max", race: "Race", long: "Long Ride", custom: "Custom",
};

function fmtTime(hrs) {
  const h = Math.floor(hrs);
  const m = Math.round((hrs % 1) * 60);
  return `${h}h ${m}m`;
}

function buildDayData(start, dayOffset, dayActivities) {
  const day = new Date(start);
  day.setDate(start.getDate() + dayOffset);
  const dateStr = `${String(day.getDate()).padStart(2, "0")}/${String(day.getMonth() + 1).padStart(2, "0")}`;
  const dayName = DAY_NAMES[dayOffset];

  if (dayActivities && dayActivities.length > 0) {
    const a = dayActivities[0];
    const totalSec = a.durationSeconds || 0;
    const dist = a.distance || 0;
    const timeStr = `${Math.floor(totalSec / 3600)}h ${Math.floor((totalSec % 3600) / 60)}m`;
    return { day: dayName, date: dateStr, activity: a.name || "Activity", time: timeStr, distance: dist ? `${(dist / 1000).toFixed(2)} km` : "—" };
  }
  return { day: dayName, date: dateStr, activity: "Rest", time: "—", distance: "—" };
}

function buildDayDataFromPlan(workout, dayOffset, startDate) {
  const day = new Date(startDate);
  day.setDate(startDate.getDate() + dayOffset);
  const dateStr = `${String(day.getDate()).padStart(2, "0")}/${String(day.getMonth() + 1).padStart(2, "0")}`;
  const dayName = DAY_NAMES[dayOffset];

  if (workout && workout.type !== 'rest') {
    const label = WORKOUT_LABELS[workout.type] || workout.type || "Workout";
    const dist = workout.distance ? `${(workout.distance / 1000).toFixed(2)} km` : "—";
    return { day: dayName, date: dateStr, activity: label, time: "—", distance: dist };
  }
  return { day: dayName, date: dateStr, activity: "Rest", time: "—", distance: "—" };
}

function buildWeeklyData(activities, weeklyPlansMap = {}) {
  if (!activities || activities.length === 0) return [];

  const weeks = {};
  for (const a of activities) {
    const d = new Date(a.date);
    const key = weekKey(d);
    if (!weeks[key]) {
      const start = weekStartDate(key);
      start.setHours(0, 0, 0, 0);
      const monthLabel = start.toLocaleString("en", { month: "short" }).toUpperCase();
      weeks[key] = {
        week: key,
        km: 0, hrs: 0, elev: 0,
        month: monthLabel,
        dateRange: {
          days: DAY_NAMES,
          dates: DAY_NAMES.map((_, i) => {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            return `${String(day.getDate()).padStart(2, "0")}/${String(day.getMonth() + 1).padStart(2, "0")}`;
          }),
          label: formatWeekDateRange(start),
        },
        startDate: start,
        dayBuckets: {},
      };
    }
    weeks[key].km = Math.round((weeks[key].km + (a.distance || 0) / 1000) * 100) / 100;
    weeks[key].hrs += (a.durationSeconds || 0) / 3600;
    weeks[key].elev = Math.round((weeks[key].elev + (a.elevationGain || 0)) * 100) / 100;
    const dayName = DAY_NAMES[(d.getDay() + 6) % 7];
    if (!weeks[key].dayBuckets[dayName]) weeks[key].dayBuckets[dayName] = [];
    weeks[key].dayBuckets[dayName].push(a);
  }

  return Object.values(weeks).map((w) => {
    const performed = DAY_NAMES.map((_, i) => buildDayData(w.startDate, i, w.dayBuckets[DAY_NAMES[i]]));
    const plan = weeklyPlansMap[w.week];
    const planned = plan && plan.workouts?.length
      ? DAY_NAMES.map((_, i) => {
          const wo = plan.workouts.find((w) => w.dayOfWeek === i);
          return buildDayDataFromPlan(wo, i, w.startDate);
        })
      : performed;
    return { ...w, planned, performed, activities: Object.values(w.dayBuckets).flat() };
  }).sort((a, b) => a.week.localeCompare(b.week));
}

const ZOOM_STEPS = [12, 10, 8, 6, 4];
const ZOOM_LABELS = ["12M", "10W", "8W", "6W", "4W"];

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const statusOf = (planned, performed) => {
  if (planned === "Rest" && performed === "Rest") return "rest";
  if (performed === "Rest" || performed === "—") return "missed";
  if (planned === "Rest" || planned === "—") return "bonus";
  return "done";
};

const activityEmoji = (name) => {
  if (!name || name === "Rest" || name === "—") return "";
  const lower = name.toLowerCase();
  if (lower.includes("ride") || lower.includes("spin") || lower.includes("race") || lower.includes("coffee")) return "🚴";
  if (lower.includes("run") || lower.includes("jog")) return "🏃";
  if (lower.includes("gym") || lower.includes("strength")) return "🏋️";
  if (lower.includes("walk") || lower.includes("hike")) return "🥾";
  return "🚴";
};

const STATUS_META = {
  rest:   { label: "Rest",   bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.08)", text: "#6B7280" },
  done:   { label: "Done",   bg: "rgba(34,197,94,0.10)",   border: "rgba(34,197,94,0.3)",   text: "#22c55e" },
  missed: { label: "Missed", bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.3)",   text: "#ef4444" },
  bonus:  { label: "Bonus",  bg: "rgba(62,207,255,0.10)",  border: "rgba(62,207,255,0.3)",  text: "#3ECFFF" },
};

const controlButtonStyle = (variant = "default", disabled = false) => ({
  height: 34,
  padding: "0 12px",
  borderRadius: 10,
  border:
    variant === "accent"
      ? `1px solid ${disabled ? "rgba(255,255,255,0.08)" : "rgba(255,76,0,0.35)"}`
      : "1px solid rgba(255,255,255,0.08)",
  background:
    disabled
      ? "transparent"
      : variant === "accent"
      ? "rgba(255,76,0,0.10)"
      : "rgba(255,255,255,0.03)",
  color:
    disabled
      ? "#374151"
      : variant === "accent"
      ? "#FF5500"
      : "#D1D5DB",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 12,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
});

export default function WeeklyGraph({ activities: apiActivities }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [weeklyPlans, setWeeklyPlans] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const svgRef = useRef(null);
  const refetchKey = useDataRefetch();

  useEffect(() => {
    api.get('/training-context/weekly-plans')
      .then((plans) => setWeeklyPlans(plans || []))
      .catch(() => {});
  }, [refetchKey]);

  const weeklyPlansMap = useMemo(() => {
    const map = {};
    for (const plan of weeklyPlans) {
      if (!plan.startDate) continue;
      const d = new Date(plan.startDate);
      const key = weekKey(d);
      map[key] = plan;
    }
    return map;
  }, [weeklyPlans]);

  const weeklyData = useMemo(() => buildWeeklyData(apiActivities || [], weeklyPlansMap), [apiActivities, weeklyPlansMap]);

  const visibleCount = ZOOM_STEPS[zoomLevel];
  const visibleData = weeklyData.slice(-visibleCount);
  const minZoomReached = visibleCount >= 12;
  const maxZoomReached = zoomLevel === ZOOM_STEPS.length - 1;

  const dataLen = weeklyData.length;
  const lastIdx = dataLen - 1;
  const clampedActiveIdx = Math.max(
    dataLen - visibleCount,
    Math.min(activeIdx, lastIdx)
  );
  const activeWeek = weeklyData[clampedActiveIdx] || null;

  const W = 980;
  const H = 240;
  const PAD = { t: 24, r: 28, b: 42, l: 72 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  const maxKm = Math.max(...visibleData.map((d) => d.km), 1);
  const yMax = Math.ceil((maxKm * 1.15) / 50) * 50;
  const yMid = Math.round(yMax / 2);

  const pts = useMemo(
    () =>
      visibleData.map((d, i) => ({
        x:
          PAD.l +
          (visibleData.length === 1
            ? chartW / 2
            : (i / (visibleData.length - 1)) * chartW),
        y: PAD.t + (1 - d.km / yMax) * chartH,
        ...d,
        globalIdx: dataLen - visibleData.length + i,
        localIdx: i,
      })),
    [visibleData, chartW, chartH, yMax, dataLen]
  );

  const linePath = pts.length > 0
    ? pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
    : "";
  const lastPt = pts[pts.length - 1];
  const firstPt = pts[0];
  const areaPath = linePath && lastPt && firstPt
    ? `${linePath} L${lastPt.x.toFixed(1)},${PAD.t + chartH} L${firstPt.x.toFixed(1)},${PAD.t + chartH} Z`
    : "";
  const monthPts = useMemo(() => {
    const candidates = pts.filter((p, i) => {
      if (i === 0) return true;
      const d = new Date(p.startDate);
      const prevD = new Date(pts[i - 1].startDate);
      return d.getFullYear() !== prevD.getFullYear() || d.getMonth() !== prevD.getMonth();
    }).map((p) => {
      const d = new Date(p.startDate);
      return {
        ...p,
        month: d.toLocaleString("en", { month: "short" }).toUpperCase(),
        monthKey: `${d.getFullYear()}-${d.getMonth()}`,
      };
    });

    // Scale minimum gap with zoom so labels appear only when there's room.
    const pointSpacing =
      pts.length > 1 ? chartW / (pts.length - 1) : chartW;
    const minGap = Math.max(48, Math.min(72, pointSpacing * 0.85));

    return pickVisibleMonthLabels(candidates, minGap);
  }, [pts, chartW]);

  return (
    <div
      style={{
        background: "#111318",
        borderRadius: 16,
        padding: "24px 24px 0",
        fontFamily: "'DM Sans', sans-serif",
        minWidth: 0,
        position: "relative",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
      `}</style>

      {/* ── HEADER ROW ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 26,
            fontWeight: 700,
            color: "white",
            letterSpacing: 0.5,
            margin: 0,
          }}
        >
          WEEKLY <span style={{ color: "#FF5500" }}>STATISTICS</span>
        </h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            style={controlButtonStyle("default")}
            onClick={() => setShowGoalModal(true)}
          >
            <span>🎯</span>
            <span>Set Weekly Goal</span>
          </button>

          <button
            type="button"
            style={controlButtonStyle("default")}
            onClick={() => window.dispatchEvent(new CustomEvent("openai-chat", { detail: { command: "/week" } }))}
          >
            <span>✨</span>
            <span>AI Review</span>
          </button>

          <span
            style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 11,
              color: "#6B7280",
              letterSpacing: 1.5,
              minWidth: 32,
              textAlign: "center",
              marginLeft: 4,
            }}
          >
            {zoomLevel === 0 ? "ALL" : ZOOM_LABELS[zoomLevel]}
          </span>

          <button
            type="button"
            onClick={() => !minZoomReached && setZoomLevel((z) => z - 1)}
            disabled={minZoomReached}
            style={{
              ...controlButtonStyle("accent", minZoomReached),
              width: 34,
              padding: 0,
              fontSize: 18,
            }}
          >
            −
          </button>

          <button
            type="button"
            onClick={() => !maxZoomReached && setZoomLevel((z) => z + 1)}
            disabled={maxZoomReached}
            style={{
              ...controlButtonStyle("accent", maxZoomReached),
              width: 34,
              padding: 0,
              fontSize: 18,
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {weeklyData.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            📊
          </div>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "rgba(255,255,255,0.35)",
              textAlign: "center",
              margin: 0,
            }}
          >
            No ride data yet
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.2)",
              textAlign: "center",
              margin: 0,
              maxWidth: 280,
            }}
          >
            Activities will appear here once synced from Strava. Auto-sync runs every 5 minutes, or use "Refresh Strava Data" in your profile menu to sync now.
          </p>
        </div>
      )}

      {weeklyData.length > 0 && <>
      {/* ── STATS ROW ── */}
      <div style={{ paddingTop: 12, paddingBottom: 12 }}>
        <div style={{ display: "flex", gap: 40, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            {
              label: "Date Range",
              display: activeWeek?.dateRange?.label || "—",
              color: "#D1D5DB",
              size: 20,
            },
            { label: "Distance", val: activeWeek ? activeWeek.km : 0, unit: "km", decimals: 2, color: "white" },
            {
              label: "Time",
              val: null,
              display: activeWeek ? `${Math.floor(activeWeek.hrs)}h ${Math.round((activeWeek.hrs % 1) * 60)}m` : "—",
              color: "white"
            },
            { label: "Elevation Gain", val: activeWeek ? activeWeek.elev : 0, unit: "m", decimals: 2, color: "white" },
            { label: "Activities", val: activeWeek ? activeWeek.activities.length : 0, unit: "", decimals: 0, color: "white" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
            >
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: "#9CA3AF", fontWeight: 400, marginBottom: 2,
              }}>
                {s.label}
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: s.size || 28, fontWeight: 700, color: s.color, lineHeight: 1,
                display: "flex", alignItems: "baseline", gap: 4,
                whiteSpace: "nowrap",
              }}>
                {s.display ? s.display : (
                  <>
                    <span>{(typeof s.val === 'number' ? s.val.toFixed(s.decimals ?? 0) : s.val)}</span>
                    <span style={{ fontSize: s.size ? s.size - 2 : 22 }}> {s.unit}</span>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CHART ── */}
      <div style={{ position: "relative", userSelect: "none" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            cursor: "default",
            minHeight: 160,
          }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="wg-area2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B2500" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#3A0F00" stopOpacity="0.60" />
            </linearGradient>
          </defs>

          {pts.map((p) => (
            <line
              key={`vg-${p.localIdx}`}
              x1={p.x}
              y1={PAD.t}
              x2={p.x}
              y2={PAD.t + chartH}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          ))}

          {[0, yMid, yMax].map((v) => {
            const yPos = PAD.t + (1 - v / yMax) * chartH;
            return (
              <text
                key={`yl-${v}`}
                x={PAD.l - 10}
                y={yPos + 4}
                textAnchor="end"
                fill="#6B7280"
                style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12 }}
              >
                {v === 0 ? "0 km" : `${v} km`}
              </text>
            );
          })}

          <motion.path
            d={areaPath}
            fill="url(#wg-area2)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />

          <motion.path
            d={linePath}
            fill="none"
            stroke="#FF5500"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />

          {pts.map((p) => {
            const isActive = clampedActiveIdx === p.globalIdx;
            const isHovered = hoveredIdx === p.localIdx;
            const isThisWeek = p.globalIdx === lastIdx;
            const r = isActive || isHovered ? 8 : 5;

            return (
              <g
                key={`pt-${p.localIdx}`}
                onMouseEnter={() => setHoveredIdx(p.localIdx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setActiveIdx(p.globalIdx)}
                style={{ cursor: "pointer" }}
              >
                {isActive && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={14}
                    fill="rgba(255,76,0,0.12)"
                    stroke="rgba(255,76,0,0.25)"
                    strokeWidth="1"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill="#FF5500"
                  stroke={isActive ? "white" : "transparent"}
                  strokeWidth={isActive ? 2 : 0}
                  style={{ transition: "r 0.12s" }}
                />
                {isThisWeek && (
                  <text
                    x={p.x + 6}
                    y={p.y - 12}
                    fill="white"
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {Number(p.km).toFixed(2)} km
                  </text>
                )}
              </g>
            );
          })}

          {hoveredIdx !== null &&
            clampedActiveIdx !== pts[hoveredIdx]?.globalIdx &&
            (() => {
              const p = pts[hoveredIdx];
              const tipW = 90;
              const tipH = 38;
              const tx = Math.min(
                Math.max(p.x - tipW / 2, PAD.l),
                W - PAD.r - tipW
              );
              const ty = p.y - tipH - 10;
              return (
                <g style={{ pointerEvents: "none" }}>
                  <rect
                    x={tx}
                    y={ty}
                    width={tipW}
                    height={tipH}
                    rx="5"
                    fill="#1C1F26"
                    stroke="rgba(255,76,0,0.4)"
                    strokeWidth="1"
                  />
                  <text
                    x={tx + tipW / 2}
                    y={ty + 14}
                    textAnchor="middle"
                    fill="#FF5500"
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {p.week}
                  </text>
                  <text
                    x={tx + tipW / 2}
                    y={ty + 28}
                    textAnchor="middle"
                    fill="white"
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                    }}
                  >
                    {Number(p.km).toFixed(2)} km
                  </text>
                </g>
              );
            })()}

          {monthPts.map((p) => (
            <text
              key={`ml-${p.monthKey}-${p.globalIdx}`}
              x={p.x}
              y={H - 6}
              textAnchor="middle"
              fill="#9CA3AF"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}
            >
              {p.month}
            </text>
          ))}
        </svg>
      </div>

      {/* ── PLANNED vs PERFORMED TABLE ── */}
      {activeWeek && <AnimatePresence mode="wait">
        <motion.div
          key={clampedActiveIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            marginTop: 4,
            paddingTop: 20,
            paddingBottom: 24,
            overflowX: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "white",
                letterSpacing: 0.5,
              }}
            >
              {activeWeek.week}
              <span
                style={{
                  color: "#6B7280",
                  fontWeight: 400,
                  fontSize: 13,
                  marginLeft: 10,
                }}
              >
                · {activeWeek.dateRange.label}
              </span>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {Object.entries(STATUS_META)
                .filter(([k]) => k !== "rest")
                .map(([k, v]) => (
                  <div
                    key={k}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: v.text,
                        opacity: 0.8,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 11,
                        color: "#6B7280",
                      }}
                    >
                      {v.label}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div style={{ minWidth: 760 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "96px 1fr 1fr 80px",
                gap: 0,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "10px 0 0 0",
                  padding: "16px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 13,
                    letterSpacing: 1.5,
                    color: "#9CA3AF",
                    textAlign: "center",
                  }}
                >
                  DATE RANGE
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255,76,0,0.08)",
                  padding: "12px 16px 8px",
                  borderLeft: "2px solid rgba(255,255,255,0.25)",
                  borderBottom: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div style={{ width: "100%" }}>
                  <div
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 13,
                      letterSpacing: 1.5,
                      color: "#FF5500",
                      textAlign: "center",
                      marginBottom: 6,
                    }}
                  >
                    📋 PLANNED ACTIVITY
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 90px",
                      gap: 16,
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      paddingTop: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 10,
                        color: "#6B7280",
                        textAlign: "center",
                        borderRight: "1px solid rgba(255,255,255,0.1)",
                        paddingRight: 8,
                      }}
                    >
                      Activity
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 10,
                        color: "#6B7280",
                        textAlign: "center",
                      }}
                    >
                      Time
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255,76,0,0.06)",
                  padding: "12px 16px 8px",
                  borderLeft: "2px solid rgba(255,255,255,0.25)",
                  borderBottom: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div style={{ width: "100%" }}>
                  <div
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 13,
                      letterSpacing: 1.5,
                      color: "#FF5500",
                      textAlign: "center",
                      marginBottom: 6,
                    }}
                  >
                    ✅ PERFORMED ACTIVITY
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 88px 88px",
                      gap: 16,
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      paddingTop: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 10,
                        color: "#6B7280",
                        textAlign: "center",
                        borderRight: "1px solid rgba(255,255,255,0.1)",
                        paddingRight: 8,
                      }}
                    >
                      Activity
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 10,
                        color: "#6B7280",
                        textAlign: "center",
                        borderRight: "1px solid rgba(255,255,255,0.1)",
                        paddingRight: 8,
                      }}
                    >
                      Time
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 10,
                        color: "#6B7280",
                        textAlign: "center",
                      }}
                    >
                      Distance
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255,76,0,0.08)",
                  padding: "16px 12px",
                  borderLeft: "2px solid rgba(255,255,255,0.25)",
                  borderBottom: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "0 10px 0 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 13,
                    letterSpacing: 1.5,
                    color: "#FF5500",
                    textAlign: "center",
                  }}
                >
                  STATUS
                </div>
              </div>
            </div>

            {activeWeek.planned.map((row, i) => {
              const perf = activeWeek.performed[i];
              const status = statusOf(row.activity, perf.activity);
              const meta = STATUS_META[status];
              const isLast = i === activeWeek.planned.length - 1;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "96px 1fr 1fr 80px",
                    borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 12px",
                      borderRight: "2px solid rgba(255,255,255,0.25)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "white",
                      }}
                    >
                      {row.day}
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 10,
                        color: "#6B7280",
                        marginTop: 1,
                      }}
                    >
                      {row.date}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px 16px",
                      borderRight: "2px solid rgba(255,255,255,0.25)",
                      display: "grid",
                      gridTemplateColumns: "1fr 90px",
                      gap: 16,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: row.activity === "Rest" ? "#4B5563" : "#D1D5DB",
                        textAlign: "center",
                        minWidth: 0,
                        borderRight: "1px solid rgba(255,255,255,0.1)",
                        paddingRight: 8,
                      }}
                    >
                      {activityEmoji(row.activity)} {row.activity}
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 11,
                        color: "#6B7280",
                        textAlign: "center",
                      }}
                    >
                      {row.time}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px 16px",
                      borderRight: "2px solid rgba(255,255,255,0.25)",
                      display: "grid",
                      gridTemplateColumns: "1fr 88px 88px",
                      gap: 16,
                      alignItems: "center",
                    }}
                  >
                      <div
                        style={{
                          fontFamily: "'DM Sans',sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                          color:
                            perf.activity === "Rest"
                              ? "#4B5563"
                              : "#D1D5DB",
                          textAlign: "center",
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          borderRight: "1px solid rgba(255,255,255,0.1)",
                          paddingRight: 8,
                        }}
                      >
                        {activityEmoji(perf.activity)} {perf.activity}
                      </div>

                    <div
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 11,
                        color: "#D1D5DB",
                        textAlign: "center",
                        borderRight: "1px solid rgba(255,255,255,0.1)",
                        paddingRight: 8,
                      }}
                    >
                      {perf.time}
                    </div>

                    <div
                      style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 11,
                        color: "#D1D5DB",
                        textAlign: "center",
                      }}
                    >
                      {perf.distance || "—"}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px 8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        background: meta.bg,
                        border: `1px solid ${meta.border}`,
                        borderRadius: 5,
                        padding: "2px 7px",
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 9,
                        letterSpacing: 1.2,
                        color: meta.text,
                      }}
                    >
                      {meta.label}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <div
              style={{
                height: 10,
                background: "rgba(255,255,255,0.015)",
                borderRadius: "0 0 10px 10px",
                borderTop: "1px solid rgba(255,255,255,0.04)",
              }}
            />
          </div>
        </motion.div>
      </AnimatePresence>}
    </>}

      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setShowGoalModal(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#111318] p-6 shadow-2xl"
          >
            <h3 className="font-dmSans text-sm font-semibold text-white">Set Weekly Goal</h3>
            <p className="font-dmSans mt-1 text-xs text-white/40">Target distance in kilometers for this week.</p>
            <input
              type="number"
              step="0.1"
              min="1"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="mt-4 w-full rounded-xl border border-white/[0.08] bg-black px-4 py-3 font-jetbrainsMono text-sm text-white outline-none transition focus:border-[#FF5500]/50"
              placeholder="e.g. 150"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 font-dmSans text-sm text-white/50 transition hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const val = parseFloat(goalInput);
                  if (!(val > 0)) return;
                  try {
                    const u = JSON.parse(localStorage.getItem("cyclogenai_user") || "{}");
                    const email = u.email;
                    if (email) {
                      const updated = await api.put('/users/' + encodeURIComponent(email), { weeklyGoalKm: val });
                      localStorage.setItem("cyclogenai_user", JSON.stringify(updated));
                    }
                    window.location.reload();
                  } catch (e) { console.error("Failed to save goal", e); }
                  setShowGoalModal(false);
                }}
                className="flex-1 rounded-xl bg-[#FF5500] px-4 py-2.5 font-dmSans text-sm font-bold text-white transition hover:bg-[#e04a00]"
              >
                Save Goal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}