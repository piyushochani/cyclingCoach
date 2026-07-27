"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  getUserDisplayName,
  getUserInitials,
  formatExperienceLevel,
  formatSportLabel,
} from "../../lib/component-data";

const ProfileContainer = ({ user }) => {
  const name = getUserDisplayName(user);
  const email = user?.email || "";
  const initials = getUserInitials(user);
  const sport = formatSportLabel(user?.mainSport);
  const level = formatExperienceLevel(user?.experienceLevel);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] p-6 md:p-7"
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full border border-[#FF7A1A]/10" />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#FF7A1A]/10" />

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4 h-[92px] w-[92px]">
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(#FF7A1A_60%,rgba(255,122,26,0.15)_60%)]" />
          <div className="absolute inset-[4px] flex items-center justify-center overflow-hidden rounded-full border-4 border-black bg-[#111111]">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-[#FF7A1A]">{initials}</span>
            )}
          </div>
        </div>

        <h2 className="font-dmSans text-2xl font-semibold text-white">{name}</h2>
        <p className="mt-1 font-dmSans text-sm text-white/50">
          {sport} · {level}
        </p>

        {email && (
          <p className="mt-1 font-dmSans text-xs text-white/30">{email}</p>
        )}
      </div>
    </motion.div>
  );
};

export default ProfileContainer;
