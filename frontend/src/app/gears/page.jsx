"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../lib/api";

const EQUIPMENT_TYPES = ["tyre", "tube", "chain", "cassette", "brake pad", "cable", "pedal", "saddle", "helmet", "shoes", "clothing", "other"];

function BikeCard({ bike, onSetActive, onDelete, onEdit }) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
        bike.isActive
          ? "border-[#FF5500]/40 bg-[#FF5500]/5 shadow-[0_0_25px_rgba(255,85,0,0.08)]"
          : "border-white/[0.06] bg-surface-cards hover:border-white/15"
      }`}
    >
      {bike.isActive && (
        <div className="absolute right-0 top-0 rounded-bl-xl rounded-tr-xl bg-[#FF5500] px-3 py-1">
          <span className="font-dmSans text-[9px] font-bold uppercase tracking-[0.12em] text-white">Active</span>
        </div>
      )}
      {bike.stravaId && !bike.isActive && (
        <div className="absolute right-0 top-0 rounded-bl-xl rounded-tr-xl bg-[#1e90ff]/20 px-3 py-1">
          <span className="font-dmSans text-[9px] font-bold uppercase tracking-[0.12em] text-[#1e90ff]">Strava</span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            bike.isActive ? "bg-[#FF5500]/15" : "bg-white/[0.04]"
          }`}>
            <svg className={`h-5 w-5 ${bike.isActive ? "text-[#FF5500]" : "text-white/40"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <h3 className="font-barlowCondensed text-lg uppercase tracking-wide text-white">{bike.name}</h3>
            <p className="font-dmSans text-[11px] text-white/25">
              Added {new Date(bike.dateAdded).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="font-jetbrainsMono text-2xl font-bold text-white">{bike.distanceUsed.toFixed(2)}</p>
          <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Total KM</p>
        </div>

        <div className="flex items-center gap-2">
          {!bike.isActive && (
            <button
              onClick={() => onSetActive(bike._id)}
              className="rounded-lg border border-white/[0.10] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/50 transition-all hover:border-[#FF5500]/30 hover:text-[#FF5500]"
            >
              Set Active
            </button>
          )}
          <button
            onClick={() => setShowDelete(!showDelete)}
            className="rounded-lg p-1.5 text-white/20 transition-colors hover:text-red-400"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5">
              <span className="font-dmSans text-xs text-red-400/80">Delete this bike?</span>
              <button
                onClick={() => { onDelete(bike._id); setShowDelete(false); }}
                className="ml-auto rounded-lg bg-red-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-red-400 transition hover:bg-red-500/30"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="rounded-lg px-2 py-1 text-[10px] text-white/30 transition hover:text-white/60"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EquipmentCard({ item, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-surface-cards px-4 py-3 transition-all hover:border-white/15"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
          <svg className="h-4 w-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="font-dmSans text-sm font-medium text-white/80">{item.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="rounded-full bg-white/[0.04] px-2 py-0.5 font-dmSans text-[9px] uppercase tracking-[0.08em] text-white/30">
              {item.type}
            </span>
            <span className="font-dmSans text-[10px] text-white/20">
              Added {new Date(item.dateAdded).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={() => onDelete(item._id)}
        className="rounded-lg p-1.5 text-white/15 transition-colors hover:text-red-400"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </motion.div>
  );
}

export default function GearsPage() {
  const [bikes, setBikes] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBike, setShowAddBike] = useState(false);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newBikeName, setNewBikeName] = useState("");
  const [newBikeActive, setNewBikeActive] = useState(false);
  const [newEquipName, setNewEquipName] = useState("");
  const [newEquipType, setNewEquipType] = useState("other");
  const [newEquipNotes, setNewEquipNotes] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get("/gear/bikes").catch(() => []),
      api.get("/gear/equipment").catch(() => []),
    ]).then(([b, e]) => {
      setBikes(b || []);
      setEquipment(e || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const addBike = async () => {
    if (!newBikeName.trim()) return;
    const hasActive = bikes.some((b) => b.isActive);
    await api.post("/gear/bikes", {
      name: newBikeName.trim(),
      isActive: newBikeActive || !hasActive,
    });
    setNewBikeName("");
    setNewBikeActive(false);
    setShowAddBike(false);
    loadData();
  };

  const setActiveBike = async (id) => {
    await api.put(`/gear/bikes/${id}`, { isActive: true });
    loadData();
  };

  const deleteBike = async (id) => {
    await api.delete(`/gear/bikes/${id}`);
    loadData();
  };

  const addEquipment = async () => {
    if (!newEquipName.trim()) return;
    await api.post("/gear/equipment", {
      name: newEquipName.trim(),
      type: newEquipType,
      notes: newEquipNotes,
    });
    setNewEquipName("");
    setNewEquipType("other");
    setNewEquipNotes("");
    setShowAddEquipment(false);
    loadData();
  };

  const deleteEquipment = async (id) => {
    await api.delete(`/gear/equipment/${id}`);
    loadData();
  };

  const activeBike = bikes.find((b) => b.isActive);
  const totalBikeKm = bikes.reduce((s, b) => s + (b.distanceUsed || 0), 0);

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[55%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,85,0,0.05)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-8%] right-[-5%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(255,85,0,0.03)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-[1] mx-auto max-w-[1200px] px-4 pb-20 pt-10 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
            Equipment
          </p>
          <h1 className="font-barlowCondensed text-5xl md:text-6xl">
            Your <span className="text-[#FF5500]">Gear</span>
          </h1>
          <div className="mt-3 h-[2px] w-10 rounded-full bg-[#FF5500]" />
          <p className="font-dmSans mt-3 text-sm text-white/30">
            Track your bikes and equipment. Distance is logged automatically to the active bike when you record activities.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF5500] border-t-transparent" />
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3"
            >
              <div className="rounded-2xl border border-white/[0.05] bg-surface-cards px-4 py-3.5">
                <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Bikes</p>
                <p className="font-jetbrainsMono mt-1 text-xl font-bold text-white">{bikes.length}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-surface-cards px-4 py-3.5">
                <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Total KM</p>
                <p className="font-jetbrainsMono mt-1 text-xl font-bold text-white">{totalBikeKm.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-surface-cards px-4 py-3.5">
                <p className="font-dmSans text-[10px] uppercase tracking-[0.12em] text-white/30">Equipment</p>
                <p className="font-jetbrainsMono mt-1 text-xl font-bold text-white">{equipment.length}</p>
              </div>
            </motion.div>

            <div className="mb-12">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-barlowCondensed text-xl uppercase tracking-wide text-white">
                  Bikes <span className="text-[#FF5500]">Fleet</span>
                </h2>
                <button
                  onClick={() => setShowAddBike(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-6 py-3 text-sm font-semibold bg-[#FF5500] hover:bg-[#FF5500]/90 text-white transition-all duration-200"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Bike
                </button>
              </div>

              <AnimatePresence>
                {showAddBike && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-5 overflow-hidden"
                  >
                    <div className="rounded-2xl border border-[#FF5500]/20 bg-[#FF5500]/5 p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-end">
                        <div className="flex-1">
                          <label className="font-dmSans mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-white/40">Bike Name</label>
                          <input
                            value={newBikeName}
                            onChange={(e) => setNewBikeName(e.target.value)}
                            placeholder="e.g. Canyon Ultimate CF SL"
                            className="w-full rounded-xl border border-white/[0.10] bg-surface-cards px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-[#FF5500]/50 placeholder:text-white/15"
                            onKeyDown={(e) => e.key === "Enter" && addBike()}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.10] px-3 py-2 transition hover:border-[#FF5500]/30">
                            <input
                              type="checkbox"
                              checked={newBikeActive}
                              onChange={(e) => setNewBikeActive(e.target.checked)}
                              className="h-3.5 w-3.5 accent-[#FF5500]"
                            />
                            <span className="font-dmSans text-[10px] uppercase tracking-[0.1em] text-white/50">Set as active</span>
                          </label>
                          <button
                            onClick={addBike}
                            disabled={!newBikeName.trim()}
                            className="rounded-xl px-6 py-3 text-sm font-semibold bg-[#FF5500] hover:bg-[#FF5500]/90 text-white transition-all duration-200 disabled:opacity-40"
                          >
                            Add Bike
                          </button>
                          <button
                            onClick={() => setShowAddBike(false)}
                            className="rounded-xl px-3 py-2.5 text-[10px] text-white/30 transition hover:text-white/60"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {bikes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.06] bg-surface-cards px-6 py-12 text-center">
                  <svg className="mx-auto mb-3 h-8 w-8 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6l4 2" />
                  </svg>
                  <p className="font-dmSans text-sm text-white/20">No bikes yet. Add your first bike to start tracking distance.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <AnimatePresence>
                    {bikes.map((bike) => (
                      <BikeCard
                        key={bike._id}
                        bike={bike}
                        onSetActive={setActiveBike}
                        onDelete={deleteBike}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-barlowCondensed text-xl uppercase tracking-wide text-white">
                  Other <span className="text-[#FF5500]">Equipment</span>
                </h2>
                <button
                  onClick={() => setShowAddEquipment(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-surface-cards px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/60 transition-all hover:border-white/20 hover:text-white"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Equipment
                </button>
              </div>

              <AnimatePresence>
                {showAddEquipment && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-5 overflow-hidden"
                  >
                    <div className="rounded-2xl border border-white/[0.06] bg-surface-cards p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-end">
                        <div className="flex-[2]">
                          <label className="font-dmSans mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-white/40">Name</label>
                          <input
                            value={newEquipName}
                            onChange={(e) => setNewEquipName(e.target.value)}
                            placeholder="e.g. Continental GP5000"
                            className="w-full rounded-xl border border-white/[0.10] bg-[#080808] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-[#FF5500]/50 placeholder:text-white/15"
                            onKeyDown={(e) => e.key === "Enter" && addEquipment()}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="font-dmSans mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-white/40">Type</label>
                          <select
                            value={newEquipType}
                            onChange={(e) => setNewEquipType(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/[0.10] bg-[#080808] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-[#FF5500]/50"
                          >
                            {EQUIPMENT_TYPES.map((t) => (
                              <option key={t} value={t} className="bg-[#080808] text-white">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={addEquipment}
                          disabled={!newEquipName.trim()}
                          className="rounded-xl px-6 py-3 text-sm font-semibold bg-[#FF5500] hover:bg-[#FF5500]/90 text-white transition-all duration-200 disabled:opacity-40"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddEquipment(false)}
                          className="rounded-xl px-3 py-2.5 text-[10px] text-white/30 transition hover:text-white/60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {equipment.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.06] bg-surface-cards px-6 py-10 text-center">
                  <p className="font-dmSans text-sm text-white/20">No equipment added yet. Track your tyres, chains, and other components.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {equipment.map((item) => (
                      <EquipmentCard key={item._id} item={item} onDelete={deleteEquipment} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
