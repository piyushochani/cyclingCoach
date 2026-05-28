"use client";

import React from "react";
import { motion } from "framer-motion";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="font-barlowCondensed text-5xl uppercase tracking-wide">Help</h1>
        <p className="mt-4 font-dmSans text-white/50">Guides and support.</p>
      </motion.div>
    </div>
  );
}
