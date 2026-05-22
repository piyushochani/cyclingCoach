// frontend/components/layout/LandingFooter.jsx
"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const LandingFooter = () => {
  // Simple CSS tread pattern for demonstration
  const tireTreadPattern = `repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(255, 107, 0, 0.1) 5px,
    rgba(255, 107, 0, 0.1) 10px
  ),
  repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 5px,
    rgba(255, 107, 0, 0.1) 5px,
    rgba(255, 107, 0, 0.1) 10px
  )`;

  return (
    <footer className="bg-bg-dark text-text-secondary py-12 px-8 md:px-16 relative">
      {/* Tire tread pattern top border */}
      <div
        className="absolute top-0 left-0 right-0 h-2 opacity-50"
        style={{ backgroundImage: tireTreadPattern }}
      ></div>

      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center md:items-start space-y-8 md:space-y-0">
        {/* Logo and Copyright */}
        <div className="flex flex-col items-center md:items-start">
          <Link href="/">
            <motion.div className="flex items-center cursor-pointer mb-2">
              <motion.svg
                className="w-6 h-6 text-accent-orange mr-2"
                viewBox="0 0 100 100"
                animate={{ rotate: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" />
                <path d="M50 10 L50 90 M15 50 L85 50" stroke="currentColor" strokeWidth="4" />
              </motion.svg>
              <span className="font-barlowCondensed text-xl text-text-primary uppercase tracking-wide">
                CycloAI
              </span>
            </motion.div>
          </Link>
          <p className="font-dmSans text-sm text-text-muted mt-4">
            &copy; {new Date().getFullYear()} CycloAI. All rights reserved.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col items-center md:items-start space-y-2">
          <h4 className="font-bebasNeue text-lg text-text-primary uppercase mb-2">Explore</h4>
          <Link href="/features" className="font-dmSans hover:text-accent-orange transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="font-dmSans hover:text-accent-orange transition-colors">
            Pricing
          </Link>
          <Link href="/blog" className="font-dmSans hover:text-accent-orange transition-colors">
            Blog
          </Link>
        </div>

        {/* Legal Links */}
        <div className="flex flex-col items-center md:items-start space-y-2">
          <h4 className="font-bebasNeue text-lg text-text-primary uppercase mb-2">Legal</h4>
          <Link href="/privacy" className="font-dmSans hover:text-accent-orange transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="font-dmSans hover:text-accent-orange transition-colors">
            Terms of Service
          </Link>
        </div>

        {/* Social Media (Placeholders) */}
        <div className="flex flex-col items-center md:items-start space-y-2">
          <h4 className="font-bebasNeue text-lg text-text-primary uppercase mb-2">Connect</h4>
          <div className="flex space-x-4">
            <a href="#" className="text-text-secondary hover:text-accent-orange transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-3.25-.148-4.77-1.691-4.919-4.919-.058-1.265-.07-1.646-.07-4.85s.012-3.584.07-4.85c.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98C.014 8.333 0 8.741 0 12s.014 3.668.072 4.947c.2 4.357 2.618 6.78 6.98 6.98.058.014.466.028.948.028s.476-.014.947-.028c4.358-.2 6.78-2.618 6.98-6.98.059-1.28.073-1.689.073-4.947s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-.058-.014-.465-.028-.947-.028zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16.5c-2.484 0-4.5-2.015-4.5-4.5s2.016-4.5 4.5-4.5 4.5 2.015 4.5 4.5-2.016 4.5-4.5 4.5zM12.75 6.662a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>
            </a>
            <a href="#" className="text-text-secondary hover:text-accent-orange transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.3 4.25 17.23 3.5 16 3.5c-2.38 0-4.31 1.93-4.31 4.31 0 .34.04.67.11.98-3.58-.18-6.74-1.89-8.86-4.48-.37.64-.58 1.39-.58 2.19 0 1.49.76 2.81 1.92 3.59-.7-.02-1.37-.21-1.95-.5v.05c0 2.09 1.49 3.82 3.47 4.21-.36.1-.73.15-1.12.15-.27 0-.53-.02-.79-.08.55 1.72 2.14 2.98 4.02 3.01-1.48 1.16-3.35 1.85-5.39 1.85-.35 0-.69-.02-1.03-.06 1.93 1.24 4.23 1.96 6.7 1.96 8.04 0 12.44-6.67 12.44-12.45 0-.19-.01-.38-.01-.56.85-.61 1.58-1.37 2.16-2.22z"></path></svg>
            </a>
            <a href="#" className="text-text-secondary hover:text-accent-orange transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-7.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm7 7.5h-2v-4c0-.734-.044-1.611-.861-1.611-.864 0-1.002.673-1.002 1.554v4.057h-2v-6h1.996v.857h.027c.271-.512.939-.857 1.963-.857 2.103 0 2.494 1.385 2.494 3.171v4.83h-1.996z"></path></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
