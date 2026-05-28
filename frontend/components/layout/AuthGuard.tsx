"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const publicPaths = ['/', '/login', '/signup', '/forgot-password'];
const SESSION_KEY = 'cycloai_session_ts';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isPublic = publicPaths.includes(pathname);
    if (isPublic) {
      setChecked(true);
      return;
    }

    const signedIn = localStorage.getItem('cycloai_signed_in') === 'true';
    if (!signedIn) {
      router.replace('/login');
      return;
    }

    const lastVisit = parseInt(localStorage.getItem(SESSION_KEY) || '0', 10);
    const now = Date.now();

    if (lastVisit > 0 && now - lastVisit > SESSION_DURATION_MS) {
      localStorage.removeItem('cycloai_signed_in');
      localStorage.removeItem('cycloai_user');
      localStorage.removeItem(SESSION_KEY);
      router.replace('/login');
      return;
    }

    localStorage.setItem(SESSION_KEY, String(now));
    setChecked(true);
  }, [pathname, router]);

  if (!checked) return null;

  return <>{children}</>;
}
