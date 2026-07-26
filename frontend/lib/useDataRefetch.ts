"use client";

import { useEffect, useState } from "react";

/**
 * Returns a counter that increments when auth completes or Strava sync finishes.
 * Add to useEffect deps so pages refetch without a manual refresh.
 */
export function useDataRefetch(): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener("auth-session-changed", bump);
    window.addEventListener("sync-completed", bump);
    window.addEventListener("data-refetch", bump);
    return () => {
      window.removeEventListener("auth-session-changed", bump);
      window.removeEventListener("sync-completed", bump);
      window.removeEventListener("data-refetch", bump);
    };
  }, []);

  return version;
}
