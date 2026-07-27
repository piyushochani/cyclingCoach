"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import polyline from '@mapbox/polyline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../../../../lib/api';
import { useParams } from 'next/navigation';
import Loader from '../../../../components/ui/Loader';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then(m => ({ default: m.MapContainer })), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => ({ default: m.TileLayer })), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(m => ({ default: m.Polyline })), { ssr: false });

const formatTime = (seconds) => {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}`;
  return `${m} min`;
};

const formatTimeShort = (seconds) => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const fmtKm = (v) => `${Number(v).toFixed(1)} km`;
const fmtSpeed = (v) => `${Number(v).toFixed(1)} km/h`;
const fmtElev = (v) => `${Math.round(v)} m`;
const fmtHr = (v) => `${Math.round(v)} bpm`;
const fmtWatts = (v) => `${Math.round(v)} W`;
const fmtDist = (v) => `${Number(v).toFixed(1)} km`;

function downSample(arr, step = 5) {
  return arr.filter((_, i) => i % step === 0);
}

function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#111] px-4 py-3 shadow-2xl">
      <p className="font-dmSans text-xs text-white/40 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-jetbrainsMono text-sm font-bold" style={{ color: p.color }}>
          {formatter ? formatter(p) : `${p.name}: ${typeof p.value === 'number' ? p.value.toFixed(1) : p.value}`}
        </p>
      ))}
    </div>
  );
}

function GraphCard({ title, children }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6">
      <h3 className="mb-6 font-barlowCondensed text-xl uppercase tracking-wider text-white/60">{title}</h3>
      <div className="h-[280px] w-full">{children}</div>
    </div>
  );
}

const SingleActivityPage = () => {
  const params = useParams();
  const activityId = params?.id === 'undefined' || params?.id === 'null' ? null : params?.id;
  const [activity, setActivity] = useState(null);
  const [streams, setStreams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    if (!activityId) return;

    api.get(`/activities/${activityId}`)
      .then((data) => {
        setActivity(data);
        setStreams(data.rawStreams || null);
      })
      .catch((err) => {
        console.error('Failed to fetch activity:', err);
      })
      .finally(() => setLoading(false));
  }, [activityId]);

  const handleDeepReview = async () => {
    setReviewLoading(true);
    setReviewError("");
    try {
      const result = await api.post(`/activities/${activityId}/review`);
      if (result?.review) {
        setActivity((prev) => ({ ...prev, llmAnalysis: result.review }));
      }
    } catch (err) {
      setReviewError(err?.message || "An error occured while fetching results");
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (activity && !activity.llmAnalysis && !reviewLoading && !reviewError) {
      handleDeepReview();
    }
  }, [activity]);

  const raw = streams;
  const sr = raw?.sampleRate || 1;

  const cumulativeDist = useMemo(() => {
    if (!raw?.speed?.length) return [];
    const dist = [0];
    for (let i = 1; i < raw.speed.length; i++) {
      dist.push(dist[i - 1] + (raw.speed[i] * (sr / 3600)));
    }
    return dist;
  }, [raw, sr]);

  const speedDistData = useMemo(() => {
    if (!raw?.speed?.length || !cumulativeDist.length) return [];
    return downSample(raw.speed.map((s, i) => ({
      dist: cumulativeDist[i],
      speed: s,
    })));
  }, [raw, cumulativeDist]);

  const elevationDistData = useMemo(() => {
    if (!raw?.elevation?.length || !cumulativeDist.length) return [];
    return downSample(raw.elevation.map((e, i) => ({
      dist: cumulativeDist[i],
      elevation: e,
    })));
  }, [raw, cumulativeDist]);

  const hrData = useMemo(() => {
    if (!raw?.heartRate?.length) return [];
    return downSample(raw.heartRate.map((bpm, i) => ({
      t: i * sr,
      actual: bpm,
      required: null,
    })));
  }, [raw, sr]);

  const route = useMemo(() => {
    if (activity?.polyline) {
      try {
        return polyline.decode(activity.polyline);
      } catch {}
    }
    return null;
  }, [activity]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-4">
        <Loader size={48} />
        <p className="font-dmSans text-white/50 animate-pulse">Analyzing Ride Data...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <p className="font-dmSans text-white/50">Activity not found.</p>
      </div>
    );
  }

  const p = activity.processed || {};

  return (
    <div className="min-h-screen bg-black text-white">
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
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
              {activity.sport || 'Cycling'} Activity
            </p>
            <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
              {activity.name}
            </h1>
            <p className="mt-3 font-dmSans text-sm text-white/50">
              {new Date(activity.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-dmSans text-xs font-medium uppercase tracking-wider text-white/70">
              {p.sessionType || 'Training'}
            </span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Distance', value: (activity.distance / 1000).toFixed(2), unit: 'KM' },
            { label: 'Moving Time', value: formatTime(activity.durationSeconds), unit: '' },
            { label: 'Avg Speed', value: activity.avgSpeed ? activity.avgSpeed.toFixed(1) : ((activity.distance/1000) / (activity.durationSeconds/3600)).toFixed(1), unit: 'KM/H' },
            { label: 'Elevation', value: Math.round(activity.elevationGain), unit: 'M' },
            { label: 'Avg Power', value: activity.averageWatts ? Math.round(activity.averageWatts) : '—', unit: 'W' },
            { label: 'Avg HR', value: activity.averageHeartrate ? Math.round(activity.averageHeartrate) : '—', unit: 'BPM' },
            
          ].map((m, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
              <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/40">{m.label}</p>
              <div className="mt-2 flex items-baseline justify-center gap-1">
                <span className="font-barlowCondensed text-3xl font-bold text-white">{m.value}</span>
                <span className="font-dmSans text-[10px] text-white/30">{m.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-[24px] border border-[#FF5500]/20 bg-[radial-gradient(circle_at_top_left,rgba(255,76,0,0.08)_0%,transparent_50%)] p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5500]/10 text-xl">🤖</div>
                <div className="flex-1">
                  <h2 className="font-barlowCondensed text-2xl uppercase tracking-tight text-white">AI Coach Insights</h2>
                  <p className="font-dmSans text-[10px] uppercase tracking-widest text-[#FF5500]/60">Automated Performance Review</p>
                </div>
              </div>

              <div className="space-y-4 font-dmSans text-base leading-relaxed text-white/80">
                {reviewError ? (
                  <p className="text-red-400">{reviewError}</p>
                ) : reviewLoading ? (
                  <div className="flex items-center gap-3 py-4">
                    <Loader size={20} />
                    <p className="text-sm text-white/40">Generating deep insights...</p>
                  </div>
                ) : activity.llmAnalysis ? (
                  activity.llmAnalysis.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))
                ) : (
                  <p>Coach analysis is being generated. This ride was a <span className="text-white font-medium">{p.intensityDescription || 'moderate effort'}</span> through <span className="text-white font-medium">{p.terrainClass || 'mixed'}</span> terrain.</p>
                )}
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                 <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                   <p className="text-[10px] uppercase tracking-wider text-white/40">Intensity Factor</p>
                   <p className="mt-1 font-barlowCondensed text-2xl font-semibold text-[#FF5500]">{p.intensityFactor || '—'}</p>
                 </div>
                 <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                   <p className="text-[10px] uppercase tracking-wider text-white/40">Training Stress</p>
                   <p className="mt-1 font-barlowCondensed text-2xl font-semibold text-[#FF5500]">{p.tss || '—'} <span className="text-sm">pts</span></p>
                 </div>
                 <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                   <p className="text-[10px] uppercase tracking-wider text-white/40">Norm. Power</p>
                   <p className="mt-1 font-barlowCondensed text-2xl font-semibold text-[#FF5500]">{p.normalizedPower ? Math.round(p.normalizedPower) : '—'} <span className="text-sm">W</span></p>
                 </div>
              </div>
            </div>

            {speedDistData.length > 0 && (
              <GraphCard title="Speed">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={speedDistData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="dist" stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={fmtDist} domain={['auto', 'auto']} />
                    <YAxis stroke="#4ADE80" fontSize={10} tickFormatter={fmtSpeed} />
                    <Tooltip content={<CustomTooltip formatter={(p) => `${Number(p.value).toFixed(1)} km/h`} />} labelFormatter={(v) => `${Number(v).toFixed(1)} km`} />
                    <Line type="monotone" dataKey="speed" stroke="#4ADE80" strokeWidth={2} dot={false} name="Speed" />
                  </LineChart>
                </ResponsiveContainer>
              </GraphCard>
            )}

            {elevationDistData.length > 0 && (
              <GraphCard title="Elevation">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={elevationDistData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="dist" stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={fmtDist} domain={['auto', 'auto']} />
                    <YAxis stroke="#F59E0B" fontSize={10} tickFormatter={fmtElev} />
                    <Tooltip content={<CustomTooltip formatter={(p) => `${Math.round(p.value)} m`} />} labelFormatter={(v) => `${Number(v).toFixed(1)} km`} />
                    <Line type="monotone" dataKey="elevation" stroke="#F59E0B" strokeWidth={2} dot={false} name="Elevation" />
                  </LineChart>
                </ResponsiveContainer>
              </GraphCard>
            )}

            {hrData.length > 0 && (
              <GraphCard title="Heart Rate">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hrData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="t" stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={formatTimeShort} domain={['auto', 'auto']} />
                    <YAxis stroke="#EF4444" fontSize={10} tickFormatter={fmtHr} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip formatter={(p) => `${Math.round(p.value)} bpm`} />} labelFormatter={(v) => formatTimeShort(v)} />
                    <Line type="monotone" dataKey="actual" stroke="#EF4444" strokeWidth={2} dot={false} name="Actual HR" />
                    {hrData.some(d => d.required != null) && (
                      <Line type="monotone" dataKey="required" stroke="#EF4444" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Required HR" opacity={0.6} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </GraphCard>
            )}
          </div>

          <div className="space-y-8">
            <div className="h-[320px] overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02]">
              {route && route.length > 0 ? (
                <MapContainer
                  center={route[0]}
                  zoom={12}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <Polyline positions={route} color="#FF5500" weight={3} opacity={0.8} />
                </MapContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-white/20">
                  <p className="font-dmSans text-xs">No Map Data Available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default SingleActivityPage;
