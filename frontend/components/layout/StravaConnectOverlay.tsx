"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";

const graphColors = ["#FF5500", "#FF7744", "#FF9933", "#FFBB22", "#FFDD11"];

function randomGraph(index: number) {
  const id = `graph-${index}`;
  const width = 120 + Math.random() * 100;
  const height = 60 + Math.random() * 40;
  const points = Array.from({ length: 6 }, (_, i) => {
    const x = (i / 5) * width;
    const y = height / 2 + (Math.random() - 0.5) * height * 0.6;
    return `${x},${y}`;
  }).join(" ");
  const color = graphColors[index % graphColors.length];

  return (
    <svg
      key={id}
      className="absolute opacity-[0.04]"
      style={{
        width,
        height,
        top: `${10 + Math.random() * 75}%`,
        left: `${5 + Math.random() * 80}%`,
        transform: `rotate(${Math.random() * 30 - 15}deg)`,
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

const publicPaths = ["/", "/login", "/signup", "/forgot-password", "/connect", "/auth/strava/callback"];

export default function StravaConnectOverlay({ children }: { children: React.ReactNode }) {
  const [stravaConnected, setStravaConnected] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    api.get("/strava/status")
      .then((res: any) => setStravaConnected(res?.connected === true))
      .catch(() => setStravaConnected(false));
  }, []);

  const isPublic = publicPaths.includes(pathname);

  const graphs = useMemo(
    () => Array.from({ length: 12 }, (_, i) => randomGraph(i)),
    []
  );

  if (stravaConnected === null) return <>{children}</>;
  if (stravaConnected || isPublic) return <>{children}</>;

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none select-none blur-sm brightness-[0.3]">
        {children}
      </div>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {graphs}
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0D0D0D]/95 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#FF5500]/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-[#FF5500]/5 blur-3xl" />

          <div className="relative z-[1] flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF5500]/10">
              <svg className="h-8 w-8 text-[#FF5500]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172H17.48l-2.093 4.116zM8.614 17.944l2.089-4.116h3.065L8.614 24l-5.15-10.172h2.058l2.093 4.116z" />
              </svg>
            </div>

            <h1 className="font-bebasNeue text-4xl uppercase leading-none tracking-wide text-white">
              Get Started <span className="text-[#FF5500]">&rarr;</span>
            </h1>

            <p className="font-dmSans mt-4 text-sm leading-relaxed text-white/40">
              Connect with Strava to get started with personalised training
            </p>

            <button
              onClick={() => router.push("/connect")}
              className="mt-6 inline-flex items-center gap-2.5 rounded-xl bg-[#FF5500] px-6 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:bg-[#FF5500]/90 hover:shadow-[0_0_30px_rgba(255,85,0,0.2)]"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172H17.48l-2.093 4.116zM8.614 17.944l2.089-4.116h3.065L8.614 24l-5.15-10.172h2.058l2.093 4.116z" />
              </svg>
              Connect with Strava
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
