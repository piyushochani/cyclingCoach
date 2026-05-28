"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { getSyncStatus, getLastSyncTimeFormatted, triggerGlobalSync } from '../../lib/useAutoSync';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Activities', href: '/activities' },
  { name: 'Best Efforts', href: '/best-efforts' },
  { name: 'Calendar', href: '/calendar' },
  { name: 'AI Training', href: '/ai-training' },
  { name: 'Race Results', href: '/race-results' },
  { name: 'Statistics', href: '/statistics' },
  { name: 'Connect', href: '/connect' },
];

const dropdownItems = [
  { type: 'link', name: 'Profile', href: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { type: 'link', name: 'Notifications', href: '/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { type: 'link', name: 'Settings', href: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { type: 'link', name: 'Help', href: '/help', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { type: 'link', name: 'Gears', href: '/gears', icon: 'M9 3v2m6-2v2M9 21v2m6-2v2M5 7h14M5 17h14M3 9h2m14 0h2M3 15h2m14 0h2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z' },
  { type: 'link', name: 'Expenses', href: '/expenses', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { type: 'link', name: 'Change Password', href: '/change-password', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { type: 'action', name: 'Refresh', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', action: 'refresh' },
  { type: 'action', name: 'Re-authorize Strava', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', action: 'reauth' },
];

const PostLoginNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userInitials, setUserInitials] = useState("U");
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  const loadFromStorage = useCallback(() => {
    const stored = localStorage.getItem("cycloai_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        const name = u.firstName || u.name || "User";
        setUserName(name);
        const full = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : name;
        setUserInitials(full.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2));
        setUserProfileImage(u.profileImage || null);
      } catch {}
    }
  }, []);

  const loadNotifCount = useCallback(() => {
    try {
      const stored = localStorage.getItem("cycloai_notifications");
      if (stored) {
        const list = JSON.parse(stored);
        setNotifCount(list.filter(n => !n.read).length);
      }
    } catch {}
  }, []);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  useEffect(() => { loadNotifCount(); }, [loadNotifCount]);

  useEffect(() => {
    const handler = () => loadFromStorage();
    window.addEventListener("storage", handler);
    window.addEventListener("notifications-updated", loadNotifCount);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("notifications-updated", loadNotifCount);
    };
  }, [loadFromStorage, loadNotifCount]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [syncing, setSyncing] = useState(() => getSyncStatus() === "syncing");

  useEffect(() => {
    const onStatus = (e) => {
      setSyncing(e.detail === "syncing");
    };
    window.addEventListener("sync-status-change", onStatus);
    return () => window.removeEventListener("sync-status-change", onStatus);
  }, []);

  const handleRefresh = async () => {
    if (syncing) return;
    setIsDropdownOpen(false);
    const ok = await triggerGlobalSync();
    if (ok) setTimeout(() => window.location.reload(), 2000);
  };

  const handleReauth = async () => {
    setIsDropdownOpen(false);
    try {
      const { url } = await api.get('/strava/auth-url');
      window.open(url, '_blank');
    } catch {
      alert('Failed to get Strava authorization URL.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cycloai_signed_in');
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex h-20 items-center justify-between border-b border-[#FF4C00]/20 bg-[#0A0A0A] px-8 shadow-[0_0_20px_rgba(255,76,0,0.08)] md:px-16">
      {/* Logo */}
      <Link href="/dashboard">
        <motion.div
          className="flex items-center cursor-pointer"
          whileHover={{ scale: 1.05 }}
        >
          <img
            src="/images/cyclogen_logo.png"
            alt="Cyclogen"
            className="h-15 w-40"
          />
        </motion.div>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-1">
        {navLinks.map((link) => (
          <div key={link.name} className="relative">
            <Link
              href={link.href}
              className={`rounded-lg px-4 py-2 font-dmSans text-sm font-medium tracking-wide transition-all duration-200 ${
                pathname === link.href
                  ? 'bg-[#FF4C00]/10 text-[#FF4C00]'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
            {pathname === link.href && (
              <motion.div
                layoutId="navbar-underline"
                className="absolute -bottom-[9px] left-2 right-2 h-[2px] bg-[#FF4C00] rounded-full shadow-[0_0_6px_rgba(255,76,0,0.6)]"
              />
            )}
          </div>
        ))}
      </div>

      {/* Right side: Notifications, Profile Dropdown, Mobile Toggle */}
      <div className="flex items-center space-x-3">
        <Link href="/notifications" className="relative rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-[#FF4C00]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          {notifCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-[#FF5500] px-1 py-0.5 font-dmSans text-[10px] font-bold leading-none text-white">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </Link>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#FF4C00]/20 text-xs font-semibold text-[#FF4C00]">
              {userProfileImage ? (
                <img src={userProfileImage} alt="" className="h-full w-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            <span className="hidden text-sm text-white/70 md:inline">{userName}</span>
            <motion.svg
              className="h-3.5 w-3.5 text-white/40"
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#111318] py-2 shadow-2xl backdrop-blur-xl"
              >
                {dropdownItems.map((item) =>
                  item.type === 'link' ? (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-2.5 font-dmSans text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <svg className="h-4 w-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                      </svg>
                      {item.name}
                    </Link>
                  ) : (
                    <button
                      key={item.name}
                      onClick={item.action === 'reauth' ? handleReauth : handleRefresh}
                      className="flex w-full items-center gap-3 px-4 py-2.5 font-dmSans text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                    >
                      <svg className="h-4 w-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                      </svg>
                      {item.action === 'refresh' && syncing ? "Syncing..." : item.name}
                    </button>
                  )
                )}
                <div className="mx-3 my-1 border-t border-white/10" />
                <button
                  onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 font-dmSans text-sm text-red-400 transition hover:bg-white/5"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          className="md:hidden rounded-lg p-2 text-white/70 hover:bg-white/5"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>

      {/* Mobile Side Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 right-0 h-full w-3/4 border-l border-[#FF4C00]/10 bg-[#0A0A0A] z-50 p-8 md:hidden shadow-2xl flex flex-col"
          >
            <button
              className="self-end text-white/70 mb-8"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`rounded-lg px-4 py-3 font-dmSans text-lg transition-all ${
                    pathname === link.href
                      ? 'bg-[#FF4C00]/10 text-[#FF4C00]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="my-4 border-t border-white/10" />
              {dropdownItems.map((item) =>
                item.type === 'link' ? (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 font-dmSans text-white/60 transition hover:bg-white/5 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                    </svg>
                    {item.name}
                  </Link>
                ) : (
                  <button
                    key={item.name}
                    onClick={() => { setIsMobileMenuOpen(false); item.action === 'reauth' ? handleReauth() : handleRefresh(); }}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 font-dmSans text-white/60 transition hover:bg-white/5 hover:text-white"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                    </svg>
                    {item.action === 'refresh' && syncing ? "Syncing..." : item.name}
                  </button>
                )
              )}
              <button
                onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                className="flex items-center gap-3 rounded-lg px-4 py-3 font-dmSans text-red-400 transition hover:bg-white/5"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default PostLoginNavbar;
