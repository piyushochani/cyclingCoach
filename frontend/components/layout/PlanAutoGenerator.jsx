"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '../../lib/api';

const publicPaths = ['/', '/login', '/signup', '/forgot-password'];

export default function PlanAutoGenerator() {
  const pathname = usePathname();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (publicPaths.includes(pathname)) return;

    const runEnsurePlans = () => {
      api.post('/analysis/ensure-plans', {}).catch(() => {});
    };

    if (!checkedRef.current) {
      checkedRef.current = true;
      const id = setTimeout(runEnsurePlans, 2000);
      return () => clearTimeout(id);
    }

    const onAuth = () => {
      setTimeout(runEnsurePlans, 1500);
    };
    window.addEventListener('auth-session-changed', onAuth);
    return () => window.removeEventListener('auth-session-changed', onAuth);
  }, [pathname]);

  return null;
}
