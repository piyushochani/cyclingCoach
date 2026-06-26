"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const MAX_LOADING_MS = 2500;

const LoadingContext = createContext({ isLoading: true, ready: () => {} });

export function useAppReady() {
  return useContext(LoadingContext);
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const ready = useCallback(() => setIsLoading(false), []);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsLoading(false), MAX_LOADING_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, ready }}>
      {children}
    </LoadingContext.Provider>
  );
}
