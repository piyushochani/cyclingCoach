"use client";

// frontend/components/animations/PageTransitionWrapper.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation'; // Only available in Client Components

const PageTransitionWrapper = ({ children }) => {
  const pathname = usePathname();

  // Basic variants for the page content fading in/out
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  // Placeholder for the bicycle wheel SVG wipe animation
  const transitionVariants = {
    initial: { scale: 0 },
    animate: { scale: 0 }, // Should stay hidden when not transitioning
    enter: { scale: 200, transition: { duration: 0.5 } }, // Expand to wipe
    exit: { scale: 0, transition: { duration: 0.5 } }, // Shrink after wipe
  };

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransitionWrapper;
