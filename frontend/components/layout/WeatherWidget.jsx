"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const getWeatherMeta = (code) => {
  if (code <= 1)  return { icon: "☀️",  label: "Clear",      accent: "rgba(255,180,0,0.18)" };
  if (code <= 3)  return { icon: "⛅",  label: "Partly Cloudy", accent: "rgba(255,160,0,0.14)" };
  if (code <= 49) return { icon: "🌫️", label: "Foggy",       accent: "rgba(180,200,220,0.12)" };
  if (code <= 69) return { icon: "🌧️", label: "Rain",        accent: "rgba(80,140,255,0.14)" };
  if (code <= 79) return { icon: "🌨️", label: "Snow",        accent: "rgba(180,220,255,0.14)" };
  if (code <= 82) return { icon: "⛈️", label: "Stormy",      accent: "rgba(160,100,255,0.14)" };
  return           { icon: "☁️",  label: "Cloudy",      accent: "rgba(140,150,160,0.12)" };
};

// Wind arrow SVG — points in the wind direction
const WindArrow = () => (
  <svg
    width="11" height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    style={{ color: "rgba(255,255,255,0.45)", flexShrink: 0 }}
  >
    <path d="M12 2v20M7 7l5-5 5 5" />
  </svg>
);

// ── Skeleton shimmer for loading state ──────────────────────────────────────
const Skeleton = () => (
  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
    {[1, 2].map((i) => (
      <div key={i} className="flex items-center gap-2">
        <div className="h-3 w-12 animate-pulse rounded-full bg-white/10" />
        <div className="h-5 w-5 animate-pulse rounded-full bg-white/10" />
        <div className="flex flex-col gap-1">
          <div className="h-2.5 w-7 animate-pulse rounded-full bg-white/10" />
          <div className="h-2 w-5 animate-pulse rounded-full bg-white/[0.06]" />
        </div>
        {i === 1 && <div className="mx-1 h-5 w-px bg-white/8" />}
      </div>
    ))}
  </div>
);

// ── Fallback link state ──────────────────────────────────────────────────────
const FallbackLink = () => (
  <a
    href="https://www.google.com/search?q=weather+forecast+today"
    target="_blank"
    rel="noopener noreferrer"
    className="group flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]"
  >
    <span className="text-sm">🌤️</span>
    <span className="font-dmSans text-[11px] uppercase tracking-[0.12em] text-white/40 transition-colors group-hover:text-white/60">
      View Forecast
    </span>
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" className="text-white/25 transition-colors group-hover:text-white/45">
      <path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </a>
);

// ── Single day pill ──────────────────────────────────────────────────────────
const DayPill = ({ label, meta, high, low, windSpeed, windDeg, isToday }) => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-2.5"
    style={{
      border: isToday ? "1px solid rgba(255,76,0,0.22)" : "1px solid rgba(255,255,255,0.08)",
      background: isToday
        ? "linear-gradient(135deg, rgba(255,76,0,0.07) 0%, rgba(255,76,0,0.03) 100%)"
        : "rgba(255,255,255,0.025)",
    }}
  >
    {/* Ambient glow from weather accent */}
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background: meta.accent, opacity: 0.5, mixBlendMode: "screen" }}
    />

    {/* Day label */}
    <div className="flex min-w-[52px] flex-col">
      <span
        className="font-dmSans text-[9px] uppercase tracking-[0.16em]"
        style={{ color: isToday ? "rgba(255,76,0,0.85)" : "rgba(255,255,255,0.35)" }}
      >
        {label}
      </span>
      <span
        className="font-dmSans text-[10px] font-medium"
        style={{ color: isToday ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)" }}
      >
        {meta.label}
      </span>
    </div>

    {/* Weather icon */}
    <span className="text-[18px] leading-none">{meta.icon}</span>

    {/* Temp range */}
    <div className="flex flex-col items-center leading-none">
      <span className="font-dmSans text-[13px] font-semibold text-white">{high}</span>
      <span className="mt-[2px] font-dmSans text-[10px] text-white/35">{low}</span>
    </div>

    {/* Wind */}
    <div className="flex items-center gap-1 border-l border-white/8 pl-2.5">
     <WindArrow />
     <div className="flex flex-col leading-none">        <span className="font-dmSans text-[11px] font-medium text-white/60">{windSpeed}</span>
        <span className="font-dmSans text-[9px] text-white/30">km/h</span>
      </div>
    </div>
  </motion.div>
);

// ── Main component ───────────────────────────────────────────────────────────
const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      Promise.resolve().then(() => {
        setError(true);
        setLoading(false);
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&daily=temperature_2m_max,temperature_2m_min,weathercode,wind_speed_10m_max,wind_direction_10m_dominant` +
            `&timezone=auto&forecast_days=2`
          );
          const data = await res.json();
          if (!data.daily?.time) throw new Error("bad data");
          setWeather(data.daily);
        } catch {
          setError(true);
        } finally {
          setLoading(false);
        }
      },
      () => {
        Promise.resolve().then(() => {
          setError(true);
          setLoading(false);
        });
      }
    );
  }, []);

  if (loading || error || !weather) return null;

  return (
    <AnimatePresence>
      <motion.a
        href={`https://www.google.com/search?q=${encodeURIComponent("weather forecast today")}`}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="group flex cursor-pointer items-center gap-2 no-underline"
        title="Open weather forecast"
      >
        {(() => {
          const meta      = getWeatherMeta(weather.weathercode[0]);
          const high      = `${Math.round(weather.temperature_2m_max[0])}°`;
          const low       = `${Math.round(weather.temperature_2m_min[0])}°`;
          const windSpeed = Math.round(weather.wind_speed_10m_max[0]);
          const windDeg   = weather.wind_direction_10m_dominant[0];

          return (
            <DayPill
              label="Today"
              meta={meta}
              high={high}
              low={low}
              windSpeed={windSpeed}
              windDeg={windDeg}
              isToday={true}
            />
          );
        })()}
      </motion.a>
    </AnimatePresence>
  );
};

export default WeatherWidget;