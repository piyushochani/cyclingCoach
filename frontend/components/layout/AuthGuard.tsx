"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken } from '../../lib/api';
import BikeLoader from '../ui/BikeLoader';

const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/privacy', '/terms', '/cookie-policy', '/pricing', '/admin', '/admin/login'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(
    () => publicPaths.includes(pathname) || pathname.startsWith('/admin')
  );

  useEffect(() => {
    const isPublic = publicPaths.includes(pathname);
    const isAdminRoute = pathname.startsWith('/admin');

    if (isPublic || isAdminRoute) return;

    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is unreadable during SSR/hydration; flipping post-mount avoids a hydration mismatch
    setChecked(true);
  }, [pathname, router]);

  if (!checked) return <BikeLoader fullscreen size={128} />;

  return <>{children}</>;
}
