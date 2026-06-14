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
    if (checkedRef.current) return;
    checkedRef.current = true;

    const id = setTimeout(() => {
      api.post('/analysis/ensure-plans', {}).catch(() => {});
    }, 2000);

    return () => clearTimeout(id);
  }, [pathname]);

  return null;
}
