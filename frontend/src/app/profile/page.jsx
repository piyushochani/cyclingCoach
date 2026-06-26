"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";

const GEAR_STORAGE_KEY = "cyclogenai_gears";

function loadGears() {
  try {
    return JSON.parse(localStorage.getItem(GEAR_STORAGE_KEY) || "[]");
  } catch { return []; }
}

const COACH_STORAGE_KEY = "cyclogenai_selected_coach";
const CUSTOM_COACHES_KEY = "cyclogenai_custom_coaches";

const defaultCoaches = [
  { id: "pogi", name: "Tadej Pogačar", team: "UAE Team Emirates", image: "/images/pogi.jpg", stars: 5, verified: true, specialty: "Grand Tours" },
  { id: "mvdp", name: "Mathieu van der Poel", team: "Alpecin-Deceuninck", image: "/images/mvdp.avif", stars: 5, verified: true, specialty: "All-Rounder" },
  { id: "wva", name: "Wout van Aert", team: "Visma-Lease a Bike", image: "/images/wva.webp", stars: 4, verified: true, specialty: "Cyclocross" },
  { id: "vingegaard", name: "Jonas Vingegaard", team: "Visma-Lease a Bike", image: "/images/vingegard.webp", stars: 5, verified: true, specialty: "Climber" },
  { id: "remco", name: "Remco Evenepoel", team: "Soudal Quick-Step", image: "/images/remco.webp", stars: 5, verified: true, specialty: "Time Trial" },
  { id: "jonathan", name: "Jonathan Milan", team: "Lidl-Trek", image: "/images/jonathan.jpg", stars: 4, verified: true, specialty: "Sprinter" },
];

const coachUrls = {
  pogi: "https://www.procyclingstats.com/rider/tadej-pogacar",
  mvdp: "https://www.procyclingstats.com/rider/mathieu-van-der-poel",
  wva: "https://www.procyclingstats.com/rider/wout-van-aert",
  vingegaard: "https://www.procyclingstats.com/rider/jonas-vingegaard",
  remco: "https://www.procyclingstats.com/rider/remco-evenepoel",
  jonathan: "https://www.procyclingstats.com/rider/jonathan-milan",
};

function loadCoach() {
  try {
    const raw = localStorage.getItem("cyclogenai_user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u.selectedCoach) return u.selectedCoach;
    }
    const saved = localStorage.getItem(COACH_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return defaultCoaches[0];
}

async function saveCoach(coach) {
  localStorage.setItem(COACH_STORAGE_KEY, JSON.stringify(coach));
  try {
    const raw = localStorage.getItem("cyclogenai_user");
    if (raw) {
      const u = JSON.parse(raw);
      u.selectedCoach = coach;
      localStorage.setItem("cyclogenai_user", JSON.stringify(u));
      if (u.email) await api.put('/users/' + encodeURIComponent(u.email), { selectedCoach: coach });
    }
  } catch {}
}

function loadCustomCoaches() {
  try {
    const raw = localStorage.getItem("cyclogenai_user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u.customCoaches && u.customCoaches.length > 0) return u.customCoaches;
    }
    return JSON.parse(localStorage.getItem(CUSTOM_COACHES_KEY) || "[]");
  } catch { return []; }
}

async function saveCustomCoaches(list) {
  localStorage.setItem(CUSTOM_COACHES_KEY, JSON.stringify(list));
  try {
    const raw = localStorage.getItem("cyclogenai_user");
    if (raw) {
      const u = JSON.parse(raw);
      u.customCoaches = list;
      localStorage.setItem("cyclogenai_user", JSON.stringify(u));
      if (u.email) await api.put('/users/' + encodeURIComponent(u.email), { customCoaches: list });
    }
  } catch {}
}

const sportOptions = ["cycling", "running", "swimming", "triathlon"];
const experienceOptions = ["beginner", "intermediate", "advanced", "pro"];

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 1500);
    return () => clearTimeout(t);
  }, [message]);
  const [cropImage, setCropImage] = useState(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  function getCroppedImage(src, zoom, pos) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const SIZE = 260;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
        ctx.clip();

        const coverScale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
        const drawW = img.naturalWidth * coverScale;
        const drawH = img.naturalHeight * coverScale;

        ctx.save();
        ctx.translate(SIZE / 2 + pos.x, SIZE / 2 + pos.y);
        ctx.scale(zoom, zoom);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = src;
    });
  }

  const [gears, setGears] = useState([]);
  const [apiBikes, setApiBikes] = useState([]);

  const [selectedCoach, setSelectedCoach] = useState(null);
  const [showCoachPicker, setShowCoachPicker] = useState(false);
  const [customCoaches, setCustomCoaches] = useState([]);
  const [coachForm, setCoachForm] = useState({ name: "", team: "", stars: 3, image: null, specialty: "" });
  const [showCoachForm, setShowCoachForm] = useState(false);
  const coachImageRef = useRef(null);
  const profileImageRef = useRef(null);
  const originalFormRef = useRef(null);

  useEffect(() => {
    if (showCoachPicker || isCropping) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [showCoachPicker, isCropping]);

  useEffect(() => {
    const stored = localStorage.getItem("cyclogenai_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUser(u);
        setForm({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          email: u.email || "",
          mainSport: u.mainSport || "cycling",
          experienceLevel: u.experienceLevel || "beginner",
          heightCm: u.heightCm || "",
          weightKg: u.weightKg || "",
          goal: u.goal || "",
          cyclingYears: u.cyclingYears || "",
          ftp: u.ftp || "",
          maxHeartrate: u.maxHeartrate || "",
          age: u.age || "",
          profileImage: u.profileImage || "",
          description: u.description || "",
        });
      } catch {}
    }
    api.get("/gear/bikes").then(setApiBikes).catch(() => {});
    setGears(loadGears());
    setSelectedCoach(loadCoach());
    const storedCoaches = loadCustomCoaches();
    setCustomCoaches(storedCoaches);
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.email) {
          api.get(`/users/${u.email}`).then(data => {
            if (data.coaches) {
              setCustomCoaches(data.coaches);
              saveCustomCoaches(data.coaches);
            }
          }).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem("cyclogenai_user");
    if (!stored) return;
    const email = JSON.parse(stored).email;
    if (!email) return;
    try {
      const data = await api.get(`/users/${email}`);
      setUser(data);
      setForm(prev => ({
        ...prev,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        mainSport: data.mainSport || "cycling",
        experienceLevel: data.experienceLevel || "beginner",
        heightCm: data.heightCm || "",
        weightKg: data.weightKg || "",
        goal: data.goal || "",
        cyclingYears: data.cyclingYears || "",
        ftp: data.ftp || "",
        maxHeartrate: data.maxHeartrate || "",
        age: data.age || "",
        profileImage: data.profileImage || "",
        description: data.description || "",
      }));
      if (data.coaches) {
        setCustomCoaches(data.coaches);
        saveCustomCoaches(data.coaches);
      }
      localStorage.setItem("cyclogenai_user", JSON.stringify(data));
    } catch {}
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.put(`/users/${form.email}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        mainSport: form.mainSport,
        experienceLevel: form.experienceLevel,
        heightCm: form.heightCm ? Number(form.heightCm) : null,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        goal: form.goal,
        cyclingYears: form.cyclingYears ? Number(form.cyclingYears) : 0,
        ftp: form.ftp ? Number(form.ftp) : null,
        maxHeartrate: form.maxHeartrate ? Number(form.maxHeartrate) : null,
        age: form.age ? Number(form.age) : null,
        description: form.description || null,
        coaches: customCoaches,
      });
      setUser(updated);
      localStorage.setItem("cyclogenai_user", JSON.stringify(updated));
      setEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleAddGear = () => {
    if (!gearForm.name.trim()) return;
    const newGear = { ...gearForm, id: Date.now(), weight: gearForm.weight || null };
    const updated = editingGear
      ? gears.map(g => g.id === editingGear.id ? { ...newGear, id: editingGear.id } : g)
      : [...gears, newGear];
    setGears(updated);
    saveGears(updated);
    setGearForm({ name: "", type: "Road", weight: "" });
    setEditingGear(null);
  };

  const handleDeleteGear = (id) => {
    const updated = gears.filter(g => g.id !== id);
    setGears(updated);
    saveGears(updated);
  };

  const handleSelectCoach = (coach) => {
    setSelectedCoach(coach);
    saveCoach(coach);
    setShowCoachPicker(false);
  };

  const handleAddCoach = () => {
    if (!coachForm.name.trim()) return;
    const newCoach = {
      id: "custom_" + Date.now(),
      name: coachForm.name.trim(),
      team: coachForm.team.trim() || "Unknown Team",
      image: coachForm.image || null,
      stars: coachForm.stars,
      specialty: coachForm.specialty.trim() || "",
    };
    const updated = [...customCoaches, newCoach];
    setCustomCoaches(updated);
    saveCustomCoaches(updated);
    setCoachForm({ name: "", team: "", stars: 3, image: null, specialty: "" });
    setShowCoachForm(false);
    handleSelectCoach(newCoach);
  };

  const handleDeleteCoach = (coach) => {
    const updated = customCoaches.filter(c => c.id !== coach.id);
    setCustomCoaches(updated);
    saveCustomCoaches(updated);
    if (selectedCoach?.id === coach.id) {
      handleSelectCoach(defaultCoaches[0]);
    }
  };

  const initials = user
    ? `${(user.firstName || "A")[0]}${(user.lastName || "T")[0]}`.toUpperCase()
    : "AT";

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#FF5500]" />
      </div>
    );
  }

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
        <div className="mb-8 flex flex-col gap-3 border-b border-white/8 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
              Account
            </p>
            <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
              Your Profile
            </h1>
          </div>
          {editing ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl px-6 py-3 text-sm font-semibold bg-[#FF5500] hover:bg-[#FF5500]/90 text-white transition-all duration-200 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  const orig = originalFormRef.current;
                  if (orig) {
                    setForm(orig);
                    setUser(prev => ({
                      ...prev,
                      ...orig,
                      heightCm: orig.heightCm ? Number(orig.heightCm) : null,
                      weightKg: orig.weightKg ? Number(orig.weightKg) : null,
                      ftp: orig.ftp ? Number(orig.ftp) : null,
                      cyclingYears: orig.cyclingYears ? Number(orig.cyclingYears) : 0,
                    }));
                    localStorage.setItem("cyclogenai_user", JSON.stringify({
                      ...JSON.parse(localStorage.getItem("cyclogenai_user") || "{}"),
                      ...orig,
                    }));
                  }
                  setEditing(false);
                }}
                className="rounded-xl border border-white/10 px-5 py-2.5 font-dmSans text-sm font-semibold text-white/60 transition hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                originalFormRef.current = { ...form };
                setEditing(true);
              }}
              className="rounded-xl border border-[#FF5500]/30 bg-[#FF5500]/10 px-5 py-2.5 font-dmSans text-sm font-semibold text-[#FF5500] transition hover:bg-[#FF5500]/20"
            >
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className={`mb-6 rounded-xl border px-5 py-3 font-dmSans text-sm ${
            message.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Left: Avatar + Key Info */}
          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] p-6 text-center"
            >
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full border border-[#FF7A1A]/10" />
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#FF7A1A]/10" />

              <div className="relative mb-4 inline-flex h-[100px] w-[100px]">
                <div className={`absolute inset-0 rounded-full border-[3px] border-[#FF5500] transition-opacity ${imageSaving ? 'opacity-0' : 'opacity-100'}`} />
                <div className={`absolute inset-[4px] flex items-center justify-center overflow-hidden rounded-full border-4 border-black bg-[#111111] transition-opacity ${imageSaving ? 'opacity-0' : 'opacity-100'}`}>
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-[#FF7A1A]">{initials}</span>
                  )}
                </div>
                {imageSaving && (
                  <div className="absolute inset-[4px] flex items-center justify-center rounded-full border-4 border-black bg-[#111111]">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#FF5500]" />
                  </div>
                )}
                {!imageSaving && (
                  <button
                    type="button"
                    onClick={() => profileImageRef.current?.click()}
                    className="absolute -right-1 -top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-[#FF5500] text-white shadow-lg transition hover:bg-[#ff6a1a]"
                    title="Change profile image"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={profileImageRef}
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const dataUrl = ev.target?.result;
                    if (typeof dataUrl === "string") {
                      setCropImage(dataUrl);
                      setCropZoom(1);
                      setCropPos({ x: 0, y: 0 });
                      setIsCropping(true);
                    }
                  };
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />

              <h2 className="font-dmSans text-2xl font-semibold text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="mt-1 font-dmSans text-sm text-white/50">
                {user.mainSport === "cycling" ? "Cyclist" : user.mainSport} · {user.experienceLevel.charAt(0).toUpperCase() + user.experienceLevel.slice(1)}
              </p>
              <p className="mt-1 font-dmSans text-xs text-white/30">{user.email}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                {[
                  { label: "Height", value: user.heightCm ? `${user.heightCm} cm` : "—" },
                  { label: "Weight", value: user.weightKg ? `${user.weightKg} kg` : "—" },
                  { label: "FTP", value: user.ftp ? `${user.ftp} W` : "—" },
                  { label: "Cycling Since", value: user.cyclingYears ? `${user.cyclingYears} yr` : "—" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-[#080808] p-3">
                    <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">{item.label}</p>
                    <p className="mt-1 font-dmSans text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Gears */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6"
            >
              <h3 className="font-barlowCondensed text-2xl uppercase tracking-wide text-white">
                MY <span className="text-[#FF5500]">GEARS</span>
              </h3>

              <div className="mt-4 space-y-2">
                {apiBikes.length === 0 && gears.length === 0 && (
                  <p className="font-dmSans text-sm text-white/30">No gears added yet.</p>
                )}
                {apiBikes.map((b) => (
                  <div key={b._id} className="rounded-xl border border-white/10 bg-[#080808] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="font-dmSans text-sm font-semibold text-white">{b.name}</p>
                      {b.stravaId && <span className="font-dmSans text-[9px] uppercase tracking-[0.1em] text-[#1e90ff]">Strava</span>}
                    </div>
                    <p className="font-dmSans text-[11px] text-white/40">
                      {((b.distanceUsed || 0) / 1000).toFixed(1)} km{b.isActive ? " · Active" : ""}
                    </p>
                  </div>
                ))}
                {gears.map((g) => (
                  <div key={g.id} className="rounded-xl border border-white/10 bg-[#080808] px-4 py-3">
                    <p className="font-dmSans text-sm font-semibold text-white">{g.name}</p>
                    <p className="font-dmSans text-[11px] text-white/40">{g.type}{g.weight ? ` · ${g.weight} kg` : ""}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Edit Form + Change Password */}
          <div className="flex flex-col gap-6">
            {editing ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6"
              >
                <h3 className="font-barlowCondensed text-2xl uppercase tracking-wide text-white">
                  EDIT <span className="text-[#FF5500]">INFO</span>
                </h3>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  {[
                    { key: "firstName", label: "First Name", type: "text" },
                    { key: "lastName", label: "Last Name", type: "text" },
                    { key: "heightCm", label: "Height (cm)", type: "number" },
                    { key: "weightKg", label: "Weight (kg)", type: "number" },
                    { key: "ftp", label: "FTP (watts)", type: "number" },
                    { key: "maxHeartrate", label: "Max HR (bpm)", type: "number" },
                    { key: "age", label: "Age", type: "number" },
                    { key: "cyclingYears", label: "Cycling (years)", type: "number" },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/40">{label}</label>
                      <input
                        type={type}
                        value={form[key] ?? ""}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/40"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/40">Sport</label>
                  <select
                    value={form.mainSport}
                    onChange={e => setForm(p => ({ ...p, mainSport: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/40"
                  >
                    {sportOptions.map(s => <option key={s} value={s} className="bg-black">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>

                <div className="mt-4">
                  <label className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/40">Experience</label>
                  <select
                    value={form.experienceLevel}
                    onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/40"
                  >
                    {experienceOptions.map(e => <option key={e} value={e} className="bg-black">{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
                  </select>
                </div>

                <div className="mt-4">
                  <label className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/40">Goal</label>
                  <textarea
                    value={form.goal}
                    onChange={e => setForm(p => ({ ...p, goal: e.target.value }))}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/40 resize-none"
                    placeholder="Your training goal..."
                  />
                </div>

                <div className="mt-4">
                  <label className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/40">Description</label>
                  <textarea
                    value={form.description ?? ""}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/40 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6"
              >
                <h3 className="font-barlowCondensed text-2xl uppercase tracking-wide text-white">
                  PROFILE <span className="text-[#FF5500]">INFO</span>
                </h3>

                <div className="mt-5 space-y-4">
                  {[
                    { label: "First Name", value: user.firstName || "—" },
                    { label: "Last Name", value: user.lastName || "—" },
                    { label: "Email", value: user.email || "—" },
                    { label: "Sport", value: user.mainSport || "—" },
                    { label: "Experience", value: user.experienceLevel || "—" },
                    { label: "Max HR", value: user.maxHeartrate ? `${user.maxHeartrate} bpm` : "—" },
                    { label: "Age", value: user.age || "—" },
                    { label: "Goal", value: user.goal || "No goal set" },
                    { label: "Description", value: user.description || "No description" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-[#080808] px-4 py-3">
                      <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">{label}</p>
                      <p className="mt-1 font-dmSans text-sm text-white">{value}</p>
                    </div>
                  ))}
                  {user.onboardingSummary && (
                    <div className="rounded-xl border border-white/10 bg-[#080808] px-4 py-3">
                      <p className="font-dmSans text-[10px] uppercase tracking-[0.08em] text-white/25">About You</p>
                      <div className="mt-1 font-dmSans text-sm text-white whitespace-pre-line">{user.onboardingSummary}</div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* HR Zones */}
            {!editing && (user.maxHeartrate || user.age) && (() => {
              const maxHr = user.maxHeartrate ? Number(user.maxHeartrate) : Math.round(220 - Number(user.age));
              const zones = maxHr >= 120 ? [
                { label: "Z1 (Active Recovery)", min: 0, max: Math.round(maxHr * 0.55) },
                { label: "Z2 (Endurance)", min: Math.round(maxHr * 0.55) + 1, max: Math.round(maxHr * 0.69) },
                { label: "Z3 (Tempo)", min: Math.round(maxHr * 0.70), max: Math.round(maxHr * 0.79) },
                { label: "Z4 (Threshold)", min: Math.round(maxHr * 0.80), max: Math.round(maxHr * 0.87) },
                { label: "Z5 (VO2 Max)", min: Math.round(maxHr * 0.88), max: Math.round(maxHr * 0.94) },
                { label: "Z6 (Anaerobic)", min: Math.round(maxHr * 0.95), max: maxHr },
              ] : [];
              return zones.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6"
                >
                  <h3 className="font-barlowCondensed text-2xl uppercase tracking-wide text-white">
                    HR <span className="text-[#FF5500]">ZONES</span>
                  </h3>
                  <p className="mt-1 font-dmSans text-xs text-white/40">Based on max HR: {maxHr} bpm</p>
                  <div className="mt-4 space-y-2">
                    {zones.map(z => (
                      <div key={z.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#080808] px-4 py-2.5">
                        <span className="font-dmSans text-sm text-white">{z.label}</span>
                        <span className="font-dmSans text-sm text-white/60">{z.min}–{z.max} bpm</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : null;
            })()}

            {/* Change Coach */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-barlowCondensed text-2xl uppercase tracking-wide text-white">
                  YOUR <span className="text-[#FF5500]">COACH</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCoachPicker(true)}
                    className="rounded-xl border border-[#FF5500]/30 bg-[#FF5500]/10 px-4 py-2 font-dmSans text-xs font-semibold text-[#FF5500] transition hover:bg-[#FF5500]/20"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {!showCoachPicker && selectedCoach ? (
                <div className="mt-5 flex items-center gap-4 rounded-xl border border-white/10 bg-[#080808] p-4">
                  {selectedCoach.image ? (
                    <img src={selectedCoach.image} alt={selectedCoach.name} className="h-14 w-14 rounded-full border-2 border-[#FF5500]/40 object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#FF5500]/40 bg-[#FF5500]/20 text-lg font-bold text-[#FF5500]">
                      {selectedCoach.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-dmSans text-sm font-semibold text-white flex items-center gap-1.5">
                      {selectedCoach.verified && coachUrls[selectedCoach.id] ? (
                        <a href={coachUrls[selectedCoach.id]} target="_blank" rel="noopener noreferrer" className="hover:underline">{selectedCoach.name}</a>
                      ) : (
                        selectedCoach.name
                      )}
                      {selectedCoach.verified && (
                        <svg className="h-4 w-4 flex-shrink-0 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                      )}
                    </p>
                    <p className="font-dmSans text-xs text-white/40">{selectedCoach.team}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded-full bg-[#FF5500] px-2 py-0.5 font-dmSans text-[10px] font-bold text-white">Active</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < selectedCoach.stars ? "text-[#FF5500]" : "text-white/15"}>★</span>
                        ))}
                      </div>
                      {selectedCoach.specialty && (
                        <span className="rounded-full border border-[#FF5500]/30 bg-[#FF5500]/10 px-2 py-0.5 font-dmSans text-[10px] font-semibold text-[#FF5500]">{selectedCoach.specialty}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {showCoachPicker && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm pt-[15vh]" onClick={(e) => { if (e.target === e.currentTarget) { setShowCoachPicker(false); setShowCoachForm(false); } }}>
                  <div className="flex max-h-[75vh] w-[480px] max-w-[90vw] flex-col rounded-[24px] border border-white/10 bg-[#0a0a0a] p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-barlowCondensed text-2xl uppercase tracking-wide text-white">
                        SELECT <span className="text-[#FF5500]">COACH</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowCoachForm(true)}
                          className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 font-dmSans text-xs font-semibold text-green-400 transition hover:bg-green-500/20"
                        >
                          + Add
                        </button>
                        <button
                          onClick={() => { setShowCoachPicker(false); setShowCoachForm(false); }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-white/60 transition hover:bg-white/5"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {showCoachForm && (
                      <div className="mb-4 rounded-xl border border-white/10 bg-[#080808] p-4">
                        <h4 className="font-dmSans text-xs font-semibold uppercase tracking-[0.1em] text-white/40">Add Custom Coach</h4>
                        <div className="mt-3 space-y-3">
                          <input value={coachForm.name} onChange={e => setCoachForm(p => ({ ...p, name: e.target.value }))} placeholder="Coach name" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/40" />
                          <input value={coachForm.team} onChange={e => setCoachForm(p => ({ ...p, team: e.target.value }))} placeholder="Team name" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/40" />
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => coachImageRef.current?.click()} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-dmSans text-xs text-white/60 transition hover:border-[#FF5500]/30 hover:text-[#FF5500]">{coachForm.image ? "Change Image" : "Add Image"}</button>
                            {coachForm.image && (
                              <div className="relative h-10 w-10 flex-shrink-0">
                                <img src={coachForm.image} alt="" className="h-full w-full rounded-full border border-white/10 object-cover" />
                                <button type="button" onClick={() => setCoachForm(p => ({ ...p, image: null }))} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">×</button>
                              </div>
                            )}
                            <input ref={coachImageRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = ev => { if (typeof ev.target?.result === "string") { setCoachForm(p => ({ ...p, image: ev.target.result })); } }; reader.readAsDataURL(file); e.target.value = ""; }} />
                          </div>
                          <input value={coachForm.specialty} onChange={e => setCoachForm(p => ({ ...p, specialty: e.target.value }))} placeholder="Specialty (e.g. Climber, Sprinter)" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/40" />
                          <div className="flex items-center gap-3">
                            <span className="font-dmSans text-xs text-white/40">Rating:</span>
                            <div className="flex gap-1">{ [1,2,3,4,5].map(s => (<button key={s} type="button" onClick={() => setCoachForm(p => ({ ...p, stars: s }))} className={`text-lg ${s <= coachForm.stars ? "text-[#FF5500]" : "text-white/15"}`}>★</button>)) }</div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleAddCoach} className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold bg-[#FF5500] hover:bg-[#FF5500]/90 text-white transition-all duration-200">Add Coach</button>
                            <button onClick={() => setShowCoachForm(false)} className="rounded-xl border border-white/10 px-4 py-2.5 font-dmSans text-sm text-white/60 transition hover:bg-white/5">Cancel</button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 space-y-2 overflow-y-auto pr-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,200,200,0.4) rgba(255,255,255,0.05)" }}>
                      {[...defaultCoaches, ...customCoaches].map((coach) => {
                        const isActive = selectedCoach?.id === coach.id;
                        const isCustom = coach.id.startsWith("custom_");
                        return (
                          <div key={coach.id} className="flex items-center gap-2">
                            <button
                              onClick={() => handleSelectCoach(coach)}
                              className={`flex flex-1 items-center gap-4 rounded-xl border p-3 text-left transition ${
                                isActive
                                  ? "border-[#FF5500]/40 bg-[#FF5500]/[0.08]"
                                  : "border-white/10 bg-[#080808] hover:border-[#FF5500]/25 hover:bg-[#FF5500]/[0.04]"
                              }`}
                            >
                              {coach.image ? (
                                <img src={coach.image} alt={coach.name} className="h-12 w-12 flex-shrink-0 rounded-full border border-white/10 object-cover" />
                              ) : (
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#FF5500]/20 text-base font-bold text-[#FF5500]">
                                  {coach.name.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-1 truncate font-dmSans text-sm font-semibold text-white">
                                  {coach.verified && coachUrls[coach.id] ? (
                                    <a href={coachUrls[coach.id]} target="_blank" rel="noopener noreferrer" className="hover:underline" onClick={e => e.stopPropagation()}>{coach.name}</a>
                                  ) : (
                                    coach.name
                                  )}
                                  {coach.verified && (
                                    <svg className="h-3.5 w-3.5 flex-shrink-0 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                  )}
                                </p>
                                <p className="truncate font-dmSans text-xs text-white/40">{coach.team}</p>
                              </div>
                              <div className="flex flex-shrink-0 flex-col items-end gap-1">
                                {isActive && (
                                  <span className="rounded-full bg-[#FF5500] px-2 py-0.5 font-dmSans text-[10px] font-bold text-white">Active</span>
                                )}
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} className={i < coach.stars ? "text-[#FF5500]" : "text-white/15"}>★</span>
                                  ))}
                                </div>
                                {coach.specialty && (
                                  <span className="rounded-full border border-[#FF5500]/20 bg-[#FF5500]/8 px-2 py-0.5 font-dmSans text-[9px] font-semibold text-[#FF5500]/80">{coach.specialty}</span>
                                )}
                              </div>
                            </button>
                            {isCustom && (
                              <button onClick={() => handleDeleteCoach(coach)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 text-red-400 transition hover:bg-red-500/10" title="Delete coach">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.main>

      {isCropping && cropImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="rounded-[24px] border border-white/10 bg-[#0a0a0a] p-6 w-[400px] max-w-[90vw]">
            <h3 className="font-barlowCondensed text-2xl uppercase tracking-wide text-white text-center mb-4">
              ADJUST <span className="text-[#FF5500]">IMAGE</span>
            </h3>

              <div
                className="relative mx-auto h-[260px] w-[260px] overflow-hidden rounded-full cursor-grab active:cursor-grabbing"
                style={{ boxShadow: "0 0 0 4px rgba(255,85,0,0.3)" }}
                onMouseDown={e => {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={e => {
                  if (!isDragging) return;
                  const dx = (e.clientX - dragStart.x) / cropZoom;
                  const dy = (e.clientY - dragStart.y) / cropZoom;
                  setCropPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                  setDragStart({ x: e.clientX, y: e.clientY });
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onTouchStart={e => {
                  const t = e.touches[0];
                  setIsDragging(true);
                  setDragStart({ x: t.clientX, y: t.clientY });
                }}
                onTouchMove={e => {
                  if (!isDragging) return;
                  const t = e.touches[0];
                  const dx = (t.clientX - dragStart.x) / cropZoom;
                  const dy = (t.clientY - dragStart.y) / cropZoom;
                  setCropPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                  setDragStart({ x: t.clientX, y: t.clientY });
                }}
                onTouchEnd={() => setIsDragging(false)}
              >
                <img
                  src={cropImage}
                  alt="Crop preview"
                  className="pointer-events-none absolute h-full w-full object-cover"
                  style={{
                    transform: `translate(${cropPos.x}px, ${cropPos.y}px) scale(${cropZoom})`,
                  }}
                />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="font-dmSans text-xs text-white/40">Zoom</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={cropZoom}
                onChange={e => setCropZoom(Number(e.target.value))}
                className="flex-1 accent-[#FF5500]"
              />
              <span className="font-dmSans text-xs text-white/40 tabular-nums w-8 text-right">{cropZoom.toFixed(2)}x</span>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={async () => {
                  if (!form.email) {
                    setMessage({ type: "error", text: "User email not found. Try refreshing." });
                    setIsCropping(false);
                    setCropImage(null);
                    return;
                  }
                  setIsCropping(false);
                  setImageSaving(true);
                  try {
                    const cropped = await getCroppedImage(cropImage, cropZoom, cropPos);
                    setCropImage(null);
                    const result = await api.post(`/users/${encodeURIComponent(form.email)}/upload-image`, { image: cropped });
                    setForm(p => ({ ...p, profileImage: result.profileImage }));
                    setUser(prev => ({ ...prev, profileImage: result.profileImage }));
                    const stored = JSON.parse(localStorage.getItem("cyclogenai_user") || "{}");
                    stored.profileImage = result.profileImage;
                    localStorage.setItem("cyclogenai_user", JSON.stringify(stored));
                    setMessage({ type: "success", text: "Profile image updated!" });
                  } catch (err) {
                    setMessage({ type: "error", text: err?.message || "Failed to upload image." });
                  }
                  setImageSaving(false);
                }}
                className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold bg-[#FF5500] hover:bg-[#FF5500]/90 text-white transition-all duration-200"
              >
                Set Image
              </button>
              <button
                onClick={() => {
                  setIsCropping(false);
                  setCropImage(null);
                  setCropZoom(1);
                  setCropPos({ x: 0, y: 0 });
                }}
                className="rounded-xl border border-white/10 px-5 py-2.5 font-dmSans text-sm text-white/60 transition hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
