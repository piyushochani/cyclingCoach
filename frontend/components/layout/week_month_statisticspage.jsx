import { useMemo, useState } from "react";

/**
 * TrainingChart
 * -------------
 * A Strava-style activity history chart: a bar graph of training load
 * (Distance / Time / Elev Gain) bucketed Weekly or Monthly, with a
 * pill-button toggle for each axis.
 *
 * HOOKING UP YOUR OWN BACKEND
 * ----------------------------
 * Pass real entries via the `entries` prop:
 *
 *   <TrainingChart entries={myEntries} />
 *
 * where `myEntries` is an array of:
 *   { date: "2026-03-14", distanceKm: 12.4, timeMin: 65, elevGainM: 180 }
 *
 * One entry per activity/day. Use mapActivitiesToChartEntries() from lib/component-data.
 */

// ---------- Config ----------

const METRICS = [
  { key: "time", label: "Time" },
  { key: "distance", label: "Distance" },
  { key: "elevGain", label: "Elev Gain" },
];

const PERIODS = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const METRIC_CONFIG = {
  distance: { field: "distanceKm", unit: "km", formatAxis: (v) => `${v}` },
  time: { field: "timeMin", unit: "h", formatAxis: (v) => `${v}` },
  elevGain: { field: "elevGainM", unit: "m", formatAxis: (v) => `${v}` },
};

// ---------- Bucketing helpers ----------

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function bucketEntries(entries, period) {
  const buckets = new Map();

  for (const entry of entries) {
    const date = new Date(entry.date + "T00:00:00");
    let key, sortDate, label;

    if (period === "monthly") {
      const year = date.getFullYear();
      const month = date.getMonth();
      key = `${year}-${month}`;
      sortDate = new Date(year, month, 1);
      label = sortDate.toLocaleDateString("en-US", { month: "short" });
      if (sortDate.getMonth() === 0) {
        label = `${label} ${year}`;
      }
    } else {
      const weekStart = getWeekStart(date);
      key = weekStart.toISOString().slice(0, 10);
      sortDate = weekStart;
      label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        sortDate,
        label,
        distanceKm: 0,
        timeMin: 0,
        elevGainM: 0,
      });
    }

    const bucket = buckets.get(key);
    bucket.distanceKm += entry.distanceKm;
    bucket.timeMin += entry.timeMin;
    bucket.elevGainM += entry.elevGainM;
  }

  return Array.from(buckets.values()).sort((a, b) => a.sortDate - b.sortDate);
}

// "Show month name only on the first bucket of each month" — mirrors the
// reference weekly chart, where week-bars are grouped under month labels.
function withMonthHeaders(buckets, period) {
  if (period === "monthly") {
    return buckets.map((b) => ({ ...b, monthLabel: b.label, showDivider: false }));
  }
  let lastMonth = null;
  return buckets.map((b) => {
    const month = b.sortDate.getMonth();
    const showDivider = month !== lastMonth;
    const monthLabel = showDivider
      ? b.sortDate.toLocaleDateString("en-US", { month: "short" })
      : null;
    lastMonth = month;
    return { ...b, monthLabel, showDivider };
  });
}

// ---------- Formatting ----------

function formatValue(bucket, metricKey) {
  const { field } = METRIC_CONFIG[metricKey];
  const raw = bucket[field];

  if (metricKey === "time") {
    const hours = raw / 60;
    return hours;
  }
  return raw;
}

function niceMax(value) {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  let niceNormalized;
  if (normalized <= 1) niceNormalized = 1;
  else if (normalized <= 2) niceNormalized = 2;
  else if (normalized <= 2.5) niceNormalized = 2.5;
  else if (normalized <= 5) niceNormalized = 5;
  else niceNormalized = 10;
  return niceNormalized * magnitude;
}

function buildAxisTicks(maxValue) {
  const niceTop = niceMax(maxValue * 1.05 || 1);
  const stepCount = 5;
  const step = niceTop / stepCount;
  const ticks = [];
  for (let i = 0; i <= stepCount; i++) {
    ticks.push(+(step * i).toFixed(2));
  }
  return { ticks, max: niceTop };
}

// ---------- Component ----------

export default function TrainingChart({ entries }) {
  const [metric, setMetric] = useState("distance");
  const [period, setPeriod] = useState("monthly");

  const data = useMemo(() => entries || [], [entries]);

  const buckets = useMemo(() => {
    const raw = bucketEntries(data, period);
    return withMonthHeaders(raw, period);
  }, [data, period]);

  const values = useMemo(
    () => buckets.map((b) => formatValue(b, metric)),
    [buckets, metric]
  );

  const { ticks, max } = useMemo(
    () => buildAxisTicks(Math.max(...values, 0)),
    [values]
  );

  const unit = metric === "time" ? "h" : metric === "elevGain" ? "m" : "km";

  if (data.length === 0) {
    return (
      <div className="tc-card flex flex-col items-center justify-center py-16 gap-2">
        <p className="font-dmSans text-sm text-white/40">No activity data to chart yet.</p>
        <p className="font-dmSans text-xs text-white/25">Sync activities from Strava to see your training history.</p>
      </div>
    );
  }

  return (
    <div className="tc-card">
      <div className="tc-chart-area">
        <div className="tc-axis">
          {ticks
            .slice()
            .reverse()
            .map((tick, i) => (
              <div className="tc-axis-tick" key={i}>
                {i === ticks.length - 1 ? `0 ${unit}` : tick}
              </div>
            ))}
        </div>

        <div className="tc-plot">
          <div className="tc-gridlines">
            {ticks.map((_, i) => (
              <div className="tc-gridline" key={i} />
            ))}
          </div>

          <div className="tc-bars">
            {buckets.map((bucket, i) => {
              const value = values[i];
              const heightPct = max > 0 ? (value / max) * 100 : 0;
              return (
                <div
                  className="tc-bar-col"
                  key={bucket.key}
                  title={`${bucket.label}: ${value.toFixed(1)} ${unit}`}
                >
                  {bucket.showDivider !== false && period === "weekly" && (
                    <div className="tc-month-divider" />
                  )}
                  <div className="tc-bar-track">
                    <div
                      className="tc-bar"
                      style={{ height: `${Math.max(heightPct, value > 0 ? 1.5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="tc-labels">
        <div className="tc-axis-spacer" />
        <div className="tc-labels-row">
          {buckets.map((bucket) => (
            <div className="tc-label-col" key={bucket.key}>
              {(period === "monthly" || bucket.monthLabel) && (
                <span className="tc-label">{bucket.monthLabel ?? bucket.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="tc-controls">
        <div className="tc-toggle-group">
          {METRICS.map((m) => (
            <button
              key={m.key}
              className={`tc-pill ${metric === m.key ? "tc-pill-active" : ""}`}
              onClick={() => setMetric(m.key)}
              type="button"
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="tc-toggle-group">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={`tc-pill ${period === p.key ? "tc-pill-active" : ""}`}
              onClick={() => setPeriod(p.key)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .tc-card {
          font-family: inherit;
          background: transparent;
          padding: 0;
          box-sizing: border-box;
          width: 100%;
        }

        .tc-chart-area {
          display: flex;
          align-items: stretch;
          height: 200px;
        }

        .tc-axis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 44px;
          flex-shrink: 0;
          padding-bottom: 0;
          text-align: right;
          padding-right: 10px;
        }

        .tc-axis-tick {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          line-height: 1;
        }

        .tc-plot {
          position: relative;
          flex: 1;
          min-width: 0;
        }

        .tc-gridlines {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          pointer-events: none;
        }

        .tc-gridline {
          border-top: 1px solid rgba(255,255,255,0.04);
          height: 0;
        }

        .tc-bars {
          position: relative;
          display: flex;
          align-items: flex-end;
          height: 100%;
          gap: 2px;
        }

        .tc-bar-col {
          position: relative;
          flex: 1;
          min-width: 3px;
          display: flex;
          align-items: flex-end;
        }

        .tc-month-divider {
          position: absolute;
          left: -1px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: rgba(255,255,255,0.06);
        }

        .tc-bar-track {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-end;
        }

        .tc-bar {
          width: 100%;
          background: linear-gradient(180deg, #FF5500 0%, #cc4400 100%);
          border-radius: 3px 3px 0 0;
          transition: height 0.35s ease;
          min-height: 0;
          opacity: 0.85;
        }

        .tc-bar-col:hover .tc-bar {
          opacity: 1;
        }

        .tc-labels {
          display: flex;
        }

        .tc-axis-spacer {
          width: 54px;
          flex-shrink: 0;
        }

        .tc-labels-row {
          flex: 1;
          display: flex;
          gap: 2px;
          margin-top: 6px;
        }

        .tc-label-col {
          flex: 1;
          min-width: 2px;
          text-align: left;
        }

        .tc-label {
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          white-space: nowrap;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .tc-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .tc-toggle-group {
          display: inline-flex;
          background: rgba(255,255,255,0.06);
          border-radius: 6px;
          padding: 3px;
          gap: 2px;
        }

        .tc-pill {
          appearance: none;
          border: none;
          background: transparent;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.4);
          padding: 5px 14px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .tc-pill:hover:not(.tc-pill-active) {
          color: rgba(255,255,255,0.6);
        }

        .tc-pill-active {
          background: #FF5500;
          color: #ffffff;
        }

        @media (max-width: 480px) {
          .tc-card {
            padding: 0;
          }
          .tc-axis {
            width: 34px;
          }
          .tc-axis-spacer {
            width: 34px;
          }
          .tc-label {
            font-size: 8px;
          }
          .tc-axis-tick {
            font-size: 9px;
          }
          .tc-chart-area {
            height: 150px;
          }
        }
      `}</style>
    </div>
  );
}