"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { api } from '../../../../lib/api';

const formatTime = (seconds) => {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const SingleActivityPage = ({ params }) => {
  const activityId = params.id === 'undefined' || params.id === 'null' ? null : params.id;
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activityId) return;

    api.get(`/activities/${activityId}`)
      .then((data) => {
        setActivity(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch activity:', err);
        setLoading(false);
      });
  }, [activityId]);

  const streamData = useMemo(() => {
    if (!activity?.rawStreams) return [];
    const streams = activity.rawStreams;
    const time = streams.time || [];
    const distance = streams.distance || [];
    const watts = streams.watts || [];
    const heartrate = streams.heartrate || [];
    const cadence = streams.cadence || [];
    const altitude = streams.altitude || [];

    return time.map((t, i) => ({
      time: t,
      distance: (distance[i] / 1000).toFixed(2),
      power: watts[i] || 0,
      hr: heartrate[i] || 0,
      cadence: cadence[i] || 0,
      elevation: altitude[i] || 0,
    })).filter((_, i) => i % 5 === 0);
  }, [activity]);

  const powerZonesData = useMemo(() => {
    if (!activity?.processed?.powerZoneSeconds) return [];
    const zones = activity.processed.powerZoneSeconds;
    return [
      { name: 'Z1', value: Math.round(zones.z1 / 60), color: '#3B414B' },
      { name: 'Z2', value: Math.round(zones.z2 / 60), color: '#3498DB' },
      { name: 'Z3', value: Math.round(zones.z3 / 60), color: '#2ECC71' },
      { name: 'Z4', value: Math.round(zones.z4 / 60), color: '#F1C40F' },
      { name: 'Z5', value: Math.round(zones.z5 / 60), color: '#E67E22' },
      { name: 'Z6', value: Math.round(zones.z6 / 60), color: '#E74C3C' },
      { name: 'Z7', value: Math.round(zones.z7 / 60), color: '#9B59B6' },
    ];
  }, [activity]);

  const hrZonesData = useMemo(() => {
    if (!activity?.processed?.hrZoneSeconds) return [];
    const zones = activity.processed.hrZoneSeconds;
    return [
      { name: 'Z1', value: Math.round(zones.z1 / 60), color: '#3B414B' },
      { name: 'Z2', value: Math.round(zones.z2 / 60), color: '#3498DB' },
      { name: 'Z3', value: Math.round(zones.z3 / 60), color: '#2ECC71' },
      { name: 'Z4', value: Math.round(zones.z4 / 60), color: '#F1C40F' },
      { name: 'Z5', value: Math.round(zones.z5 / 60), color: '#E67E22' },
      { name: 'Z6', value: Math.round(zones.z6 / 60), color: '#E74C3C' },
    ];
  }, [activity]);

  const route = useMemo(() => {
    if (!activity?.rawStreams?.latlng) return null;
    return activity.rawStreams.latlng;
  }, [activity]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF5500] border-t-transparent" />
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
    <div className="min-h-screen bg-black pb-12 pt-16 text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[62%] top-[-8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.04)_0%,transparent_72%)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-[1] mx-auto max-w-[1320px] px-4 md:px-6 xl:px-8"
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
            { label: 'Elevation', value: Math.round(activity.elevationGain), unit: 'M' },
            { label: 'Avg Power', value: activity.averageWatts ? Math.round(activity.averageWatts) : '—', unit: 'W' },
            { label: 'Avg HR', value: activity.averageHeartrate ? Math.round(activity.averageHeartrate) : '—', unit: 'BPM' },
            { label: 'Avg Speed', value: activity.avgSpeed ? activity.avgSpeed.toFixed(1) : ((activity.distance/1000) / (activity.durationSeconds/3600)).toFixed(1), unit: 'KM/H' },
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
          <div className="lg:col-span-2">
            <div className="rounded-[24px] border border-[#FF5500]/20 bg-[radial-gradient(circle_at_top_left,rgba(255,76,0,0.08)_0%,transparent_50%)] p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5500]/10 text-xl">🤖</div>
                <div>
                  <h2 className="font-barlowCondensed text-2xl uppercase tracking-tight text-white">AI Coach Insights</h2>
                  <p className="font-dmSans text-[10px] uppercase tracking-widest text-[#FF5500]/60">Automated Performance Review</p>
                </div>
              </div>

              <div className="space-y-4 font-dmSans text-base leading-relaxed text-white/80">
                {activity.llmAnalysis ? (
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

            <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.02] p-6">
              <h3 className="mb-6 font-barlowCondensed text-xl uppercase tracking-wider text-white/60">Performance Streams</h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={streamData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="distance" stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={(val) => `${val} km`} />
                    <YAxis yAxisId="power" orientation="left" stroke="#FF5500" fontSize={10} />
                    <YAxis yAxisId="hr" orientation="right" stroke="#E74C3C" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      labelStyle={{ color: '#FF5500', fontWeight: 'bold' }}
                    />
                    <Line yAxisId="power" type="monotone" dataKey="power" stroke="#FF5500" strokeWidth={2} dot={false} name="Power (W)" />
                    <Line yAxisId="hr" type="monotone" dataKey="hr" stroke="#E74C3C" strokeWidth={1.5} dot={false} name="HR (BPM)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="h-[320px] overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02]">
              {route ? (
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

            <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6">
              <h3 className="mb-4 font-barlowCondensed text-xl uppercase tracking-wider text-white/60">Power Zones</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={powerZonesData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="white" fontSize={10} width={30} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#111', borderRadius: '8px' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {powerZonesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default SingleActivityPage;
