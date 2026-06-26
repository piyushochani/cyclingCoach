"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function AppLoader({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0C0F]"
        >
          <div className="h-40 w-40 md:h-52 md:w-52">
            <video autoPlay muted loop playsInline className="h-full w-full object-contain">
              <source src="/images/bike_loader_animation.mp4" type="video/mp4" />
            </video>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
