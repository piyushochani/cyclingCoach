"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/admin-auth";

const adminPublicPaths = ["/admin/login"];

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isPublic = adminPublicPaths.includes(pathname);

    if (isPublic) {
      if (isAdminAuthenticated() && pathname === "/admin/login") {
        router.replace("/admin/dashboard");
        return;
      }
      setChecked(true);
      return;
    }

    if (!isAdminAuthenticated()) {
      router.replace("/admin/login");
      return;
    }

    setChecked(true);
  }, [pathname, router]);

  if (!checked) return null;

  return <>{children}</>;
}
