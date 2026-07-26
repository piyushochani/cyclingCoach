"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken } from '../../lib/api';

const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/privacy', '/terms', '/cookie-policy', '/pricing'];

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

    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setChecked(true);
  }, [pathname, router]);

  if (!checked) return null;

  return <>{children}</>;
}
