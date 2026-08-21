// frontend/components/layout/LandingNavbar.jsx
"use client"; // This is a Client Component

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const LandingNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <motion.nav
      initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
      animate={{
        backgroundColor: isScrolled ? 'rgba(10, 12, 15, 0.8)' : 'rgba(0,0,0,0)',
        backdropFilter: isScrolled ? 'blur(12px)' : 'blur(0px)',
      }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 px-8"
    >
      {/* CyclogenAI Logo */}
      <Link href="/">
        <motion.div className="flex items-center cursor-pointer" whileHover={{ scale: 1.05 }}>
          <img
            src="/images/new_cyclogenAI_logo.png"
            alt="CyclogenAI"
            className="h-12 w-auto md:h-16"
          />
        </motion.div>
      </Link>

      {/* Navigation Buttons */}
      <div className="flex items-center space-x-4">
        <Link href="/login">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 border-2 border-accent-orange text-accent-orange rounded-md font-dmSans text-lg"
          >
            Log In
          </motion.button>
        </Link>
        <Link href="/signup" onClick={() => { localStorage.removeItem("cyclogenai_signed_in"); localStorage.removeItem("cyclogenai_user"); localStorage.removeItem("cyclogenai_session_ts"); }}>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: '#E55C00' }}
            whileTap={{ scale: 0.95 }}
            className="skew-x-[-15deg] px-6 py-2 bg-accent-orange text-white font-dmSans text-lg relative group overflow-hidden"
          >
            <span className="block skew-x-[15deg] group-hover:skew-x-0 transition-transform duration-300">Start Free</span>
          </motion.button>
        </Link>
      </div>
    </motion.nav>
  );
};

export default LandingNavbar;
