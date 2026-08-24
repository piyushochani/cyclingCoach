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

/**
 * Returns a stable YYYY-MM-DD string for the Monday of the week containing `d`,
 * computed entirely in local time. Used as the plan lookup key to avoid ISO week
 * numbering edge-cases and UTC/local timezone shifts.
 */
function getMondayKey(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
    const dist = workout.distance ? `${Number(workout.distance).toFixed(2)} km` : "—";
    const extra = [workout.zoneBreakdown, workout.terrain].filter(Boolean).join(" · ");
    return {
      day: dayName, date: dateStr, activity: label, time: extra || "—", distance: dist,
      notes: workout.notes || "",
      importance: workout.importance || "medium",
      isPlan: true,
    };
  }
  return { day: dayName, date: dateStr, activity: "Rest", time: "—", distance: "—", isPlan: true };
}

function buildWeeklyData(activities, weeklyPlans = []) {
  if (!activities || activities.length === 0) return [];

  // Index plans by the Monday date key (local YYYY-MM-DD) of their startDate.
  // This is more reliable than ISO week string comparison because it operates
  // purely on local calendar dates, avoiding UTC/timezone edge-cases.
  const plansByMonday = {};
  for (const plan of weeklyPlans) {
    if (!plan.startDate) continue;
    const key = getMondayKey(new Date(plan.startDate));
    plansByMonday[key] = plan;
  }

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
    // Match plan using the robust Monday-date key
    const monKey = getMondayKey(w.startDate);
    const plan = plansByMonday[monKey];
    const hasPlan = !!(plan && plan.workouts?.length);
    const planned = hasPlan
      ? DAY_NAMES.map((_, i) => {
          const wo = plan.workouts.find((pw) => pw.dayOfWeek === i);
          return buildDayDataFromPlan(wo, i, w.startDate);
        })
      : null; // null = no LLM plan for this week
    return { ...w, planned, performed, hasPlan, activities: Object.values(w.dayBuckets).flat() };
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
  const [activeIdx, setActiveIdx] = useState(Number.MAX_SAFE_INTEGER);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [weeklyPlans, setWeeklyPlans] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const svgRef = useRef(null);
  const chartContainerRef = useRef(null);
  const refetchKey = useDataRefetch();

  useEffect(() => {
    api.get('/training-context/weekly-plans')
      .then((plans) => setWeeklyPlans(plans || []))
      .catch(() => {});
  }, [refetchKey]);


  const weeklyData = useMemo(() => {
    const data = buildWeeklyData(apiActivities || [], weeklyPlans);
    // Always extend the graph to include the current week, even if empty
    const now = new Date();
    const currentKey = weekKey(now);
    if (data.length === 0 || data[data.length - 1].week !== currentKey) {
      const start = weekStartDate(currentKey);
      start.setHours(0, 0, 0, 0);
      const performed = DAY_NAMES.map((_, i) => buildDayData(start, i, null));
      // Check if there's a plan for the current week
      const monKey = getMondayKey(start);
      const plansByMonday = {};
      for (const plan of weeklyPlans) {
        if (!plan.startDate) continue;
        plansByMonday[getMondayKey(new Date(plan.startDate))] = plan;
      }
      const curPlan = plansByMonday[monKey];
      const hasPlan = !!(curPlan && curPlan.workouts?.length);
      const planned = hasPlan
        ? DAY_NAMES.map((_, i) => {
            const wo = curPlan.workouts.find((pw) => pw.dayOfWeek === i);
            return buildDayDataFromPlan(wo, i, start);
          })
        : null;
      data.push({
        week: currentKey,
        km: 0, hrs: 0, elev: 0,
        month: start.toLocaleString("en", { month: "short" }).toUpperCase(),
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
        planned,
        performed,
        hasPlan,
        activities: [],
      });
    }
    return data;
  }, [apiActivities, weeklyPlans]);

  const visibleCount = ZOOM_STEPS[zoomLevel];
  const minZoomReached = visibleCount >= 12;
  const maxZoomReached = zoomLevel === ZOOM_STEPS.length - 1;

  const dataLen = weeklyData.length;
  const lastIdx = dataLen - 1;

  // windowStart: index of the first visible week; null = pinned to the most recent weeks
  const [windowStart, setWindowStart] = useState(null);

  // Reset window to end whenever zoom level changes
  useEffect(() => { setWindowStart(null); }, [zoomLevel]);

  // Resolved window boundaries
  const resolvedWindowStart = Math.max(
    0,
    Math.min(
      windowStart !== null ? windowStart : Math.max(0, dataLen - visibleCount),
      Math.max(0, dataLen - visibleCount)
    )
  );
  const visibleData = weeklyData.slice(resolvedWindowStart, resolvedWindowStart + visibleCount);

  // activeIdx = MAX_SAFE_INTEGER means "always track the most recent week"
  const clampedActiveIdx = Math.max(
    0,
    Math.min(
      activeIdx === Number.MAX_SAFE_INTEGER ? lastIdx : activeIdx,
      lastIdx
    )
  );
  const activeWeek = weeklyData[clampedActiveIdx] || null;

  // Keyboard arrow navigation — works after clicking into the chart area
  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const handleKeyDown = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const delta = e.key === "ArrowLeft" ? -1 : 1;

      setActiveIdx((prev) => {
        const curr =
          prev === Number.MAX_SAFE_INTEGER ? lastIdx : Math.max(0, Math.min(prev, lastIdx));
        const next = Math.max(0, Math.min(lastIdx, curr + delta));

        // Slide the visible window to keep the selected week in view
        setWindowStart((ws) => {
          const base = ws !== null ? ws : Math.max(0, dataLen - visibleCount);
          if (next < base) return Math.max(0, base - 1);
          if (next >= base + visibleCount) return Math.min(Math.max(0, dataLen - visibleCount), base + 1);
          return ws; // no change needed
        });

        return next;
      });
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [dataLen, visibleCount, lastIdx]);

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
        globalIdx: resolvedWindowStart + i,
        localIdx: i,
      })),
    [visibleData, chartW, chartH, yMax, resolvedWindowStart]
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
    // Count weeks and sum x-positions per calendar month
    const weekCountByMonth = {};
    const monthSumX = {};
    pts.forEach((p) => {
      const d = new Date(p.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      weekCountByMonth[key] = (weekCountByMonth[key] || 0) + 1;
      monthSumX[key] = (monthSumX[key] || 0) + p.x;
    });

    // Build one entry per month, centered under all its visible weeks
    const seen = new Set();
    const candidates = [];
    pts.forEach((p) => {
      const d = new Date(p.startDate);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      if (!seen.has(monthKey)) {
        seen.add(monthKey);
        const count = weekCountByMonth[monthKey] || 0;
        // Only show month label if at least 2 weeks are visible for that month
        if (count >= 2) {
          candidates.push({
            ...p,
            x: monthSumX[monthKey] / count,
            month: d.toLocaleString("en", { month: "short" }).toUpperCase(),
            monthKey,
          });
        }
      }
    });

    const pointSpacing = pts.length > 1 ? chartW / (pts.length - 1) : chartW;
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
      <div
        ref={chartContainerRef}
        tabIndex={0}
        style={{ position: "relative", userSelect: "none", outline: "none" }}
        onFocus={() => {}}
      >
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

          {/* X-axis baseline */}
          <line
            x1={PAD.l}
            y1={PAD.t + chartH}
            x2={W - PAD.r}
            y2={PAD.t + chartH}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />

          {monthPts.map((p) => (
            <text
              key={`ml-${p.monthKey}`}
              x={p.x}
              y={PAD.t + chartH + 26}
              textAnchor="middle"
              fill="#9CA3AF"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600 }}
            >
              {p.month}
            </text>
          ))}
          {/* Keyboard navigation hint */}
          <text
            x={W - PAD.r}
            y={PAD.t + chartH + 26}
            textAnchor="end"
            fill="rgba(255,255,255,0.18)"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10 }}
          >
            ← → to navigate
          </text>
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

          {/* Mobile & tablet: day cards */}
          <div className="space-y-2 lg:hidden">
            {activeWeek.performed.map((perf, i) => {
              const row = activeWeek.planned ? activeWeek.planned[i] : null;
              const status = row ? statusOf(row.activity, perf.activity) : (perf.activity === "Rest" ? "rest" : "done");
              const meta = STATUS_META[status];

              return (
                <div
                  key={`mobile-${i}`}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-dmSans text-sm font-bold text-white">{perf.day}</p>
                      <p className="font-dmSans text-[11px] text-white/40">{perf.date}</p>
                    </div>
                    <span
                      className="rounded px-2 py-0.5 font-dmSans text-[9px] font-semibold uppercase tracking-wide"
                      style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.text }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-lg bg-[#FF5500]/5 px-3 py-2">
                      <p className="font-dmSans text-[10px] uppercase tracking-wide text-[#FF5500]/70">Planned</p>
                      {row ? (
                        <>
                          <p className="mt-1 truncate font-dmSans text-sm text-white/80">{activityEmoji(row.activity)} {row.activity}</p>
                          <p className="font-dmSans text-xs text-white/45">{row.distance !== "—" ? row.distance : ""}{row.time && row.time !== "—" ? ` · ${row.time}` : ""}</p>
                          {row.notes ? <p className="font-dmSans text-[10px] text-white/30 mt-0.5 line-clamp-2">{row.notes}</p> : null}
                        </>
                      ) : (
                        <p className="mt-1 font-dmSans text-sm text-white/30 italic">No plan</p>
                      )}
                    </div>
                    <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                      <p className="font-dmSans text-[10px] uppercase tracking-wide text-white/35">Performed</p>
                      <p className="mt-1 truncate font-dmSans text-sm text-white/80">{activityEmoji(perf.activity)} {perf.activity}</p>
                      <p className="font-dmSans text-xs text-white/45">{perf.time}{perf.distance ? ` · ${perf.distance}` : ""}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Laptop / desktop: full table */}
          <div className="hidden lg:block" style={{ minWidth: 760 }}>
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

            {activeWeek.performed.map((perf, i) => {
              const row = activeWeek.planned ? activeWeek.planned[i] : null;
              const status = row ? statusOf(row.activity, perf.activity) : (perf.activity === "Rest" ? "rest" : "done");
              const meta = STATUS_META[status];
              const isLast = i === activeWeek.performed.length - 1;

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
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, color: "white" }}>
                      {perf.day}
                    </div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#6B7280", marginTop: 1 }}>
                      {perf.date}
                    </div>
                  </div>

                  {/* PLANNED column */}
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
                    {row ? (
                      <>
                        <div style={{ minWidth: 0, borderRight: "1px solid rgba(255,255,255,0.1)", paddingRight: 8 }}>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: row.activity === "Rest" ? "#4B5563" : "#D1D5DB", textAlign: "center" }}>
                            {activityEmoji(row.activity)} {row.activity}
                          </div>
                          {row.notes && (
                            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#6B7280", textAlign: "center", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {row.notes}
                            </div>
                          )}
                        </div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#6B7280", textAlign: "center" }}>
                          {row.distance !== "—" ? row.distance : row.time !== "—" ? row.time : "—"}
                        </div>
                      </>
                    ) : (
                      <div style={{ gridColumn: "1 / -1", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", fontStyle: "italic" }}>
                        No plan generated
                      </div>
                    )}
                  </div>

                  {/* PERFORMED column */}
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
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: perf.activity === "Rest" ? "#4B5563" : "#D1D5DB", textAlign: "center", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderRight: "1px solid rgba(255,255,255,0.1)", paddingRight: 8 }}>
                      {activityEmoji(perf.activity)} {perf.activity}
                    </div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#D1D5DB", textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.1)", paddingRight: 8 }}>
                      {perf.time}
                    </div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#D1D5DB", textAlign: "center" }}>
                      {perf.distance || "—"}
                    </div>
                  </div>

                  <div style={{ padding: "12px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
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