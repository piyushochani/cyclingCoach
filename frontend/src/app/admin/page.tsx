"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminGuard from "../../../components/admin/AdminGuard";
import { isAdminAuthenticated } from "../../../lib/admin-auth";

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAdminAuthenticated()) {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/admin/login");
    }
  }, [router]);

  return (
    <AdminGuard>
      <div className="flex min-h-screen items-center justify-center bg-[#0A0C0F]">
        <p className="font-dmSans text-sm text-white/40">Loading...</p>
      </div>
    </AdminGuard>
  );
}
