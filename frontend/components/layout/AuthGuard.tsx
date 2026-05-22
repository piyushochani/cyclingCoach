"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const publicPaths = ['/', '/login', '/signup', '/forgot-password'];

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
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  if (!checked) return null;

  return <>{children}</>;
}
