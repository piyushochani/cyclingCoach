"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

const TERRAIN_OPTIONS = ["", "Flat", "Rolling", "Hilly", "Mountainous"];

const ScheduleRaceModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({
    name: "", date: new Date().toISOString().split("T")[0],
    city: "", distance: "", elevationGain: "", priority: "B",
    time: "", terrain: "", weather: "", expectations: "", description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Race name is required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/races', {
        name: form.name.trim(),
        date: form.date,
        location: form.city.trim(),
        distance: parseFloat(form.distance) || 0,
        elevationGain: parseFloat(form.elevationGain) || 0,
        priority: form.priority,
        time: form.time,
        terrain: form.terrain,
        weather: form.weather,
        story: form.expectations,
        description: form.description,
        completed: false,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule race');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            style={{
              background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 560,
              maxHeight: "85vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: "1.6rem", fontWeight: 400, letterSpacing: "0.04em", margin: 0, color: "#fff" }}>
                SCHEDULE <span style={{ color: "#FF5500" }}>RACE</span>
              </h2>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1 }}>
                {"\u2715"}
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Race Name</label>
                  <input value={form.name} onChange={handleChange("name")} placeholder="e.g. Tour of Flanders Sportive" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input type="date" value={form.date} onChange={handleChange("date")} style={{ ...inputStyle, colorScheme: "dark" }} />
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select value={form.priority} onChange={handleChange("priority")} style={{ ...inputStyle, appearance: "none" }}>
                    {["A", "B", "C", "D"].map((p) => (<option key={p} value={p} style={{ background: "#080808" }}>{p}</option>))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>City</label>
                  <input value={form.city} onChange={handleChange("city")} placeholder="City / region" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Terrain</label>
                  <select value={form.terrain} onChange={handleChange("terrain")} style={{ ...inputStyle, appearance: "none" }}>
                    {TERRAIN_OPTIONS.map((t) => (<option key={t} value={t} style={{ background: "#080808" }}>{t || "Any"}</option>))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Distance (km)</label>
                  <input type="number" step="0.1" value={form.distance} onChange={handleChange("distance")} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Elevation (m)</label>
                  <input type="number" value={form.elevationGain} onChange={handleChange("elevationGain")} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Expected Time</label>
                  <input value={form.time} onChange={handleChange("time")} placeholder="e.g. 4:12:00" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Expected Weather</label>
                  <input value={form.weather} onChange={handleChange("weather")} placeholder="e.g. Sunny, 22\u00b0C" style={inputStyle} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>What do you expect from this race?</label>
                  <textarea value={form.expectations} onChange={handleChange("expectations")} rows={2} placeholder="Your goal, target time, position aim, or outcome you're hoping for..." style={{ ...inputStyle, resize: "none" }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Describe the race</label>
                  <textarea value={form.description} onChange={handleChange("description")} rows={2} placeholder="Previous experiences on this route, known strong competitors, course characteristics, anything to be aware of..." style={{ ...inputStyle, resize: "none" }} />
                </div>
              </div>

              {error && <p style={{ margin: 0, fontSize: 12, color: "#E74C3C" }}>{error}</p>}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={onClose}
                  style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  style={{ padding: "10px 18px", borderRadius: 10, background: "#FF5500", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", border: "none", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Saving..." : "Schedule Race"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const labelStyle = {
  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
  color: "rgba(255,255,255,0.38)", display: "block", marginBottom: 4,
};

const inputStyle = {
  width: "100%", background: "#080808", color: "#fff",
  border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
  padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box",
};

export default ScheduleRaceModal;