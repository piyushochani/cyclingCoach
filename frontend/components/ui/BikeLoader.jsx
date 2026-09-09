"use client";

import React from "react";

const BikeLoader = ({ size = 96, fullscreen = false, label = null }) => {
  const video = (
    <video
      src="/images/bike_loader_animation.mp4"
      autoPlay
      loop
      muted
      playsInline
      style={{ width: size, height: "auto" }}
      className="pointer-events-none select-none"
    />
  );

  if (!fullscreen) return video;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-dark">
      {video}
      {label && <p className="mt-4 font-dmSans text-sm text-white/40">{label}</p>}
    </div>
  );
};

export default BikeLoader;
