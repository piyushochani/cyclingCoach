"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminApi } from "../../lib/admin-api";
import { clearAdminSession, getAdminUsername } from "../../lib/admin-auth";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/system", label: "System" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/audit-log", label: "Audit Log" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const username = getAdminUsername();

  const handleLogout = async () => {
    try {
      await adminApi.post("/admin/auth/logout");
    } catch {
      // proceed with local logout
    }
    clearAdminSession();
    router.replace("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-[#0A0C0F] text-white">
      <aside className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-[#111318]">
        <div className="border-b border-white/10 px-5 py-6">
          <p className="font-barlowCondensed text-lg uppercase tracking-[0.08em] text-[#FF5500]">
            Admin
          </p>
          <p className="mt-1 font-dmSans text-xs text-white/40">CyclogenAI</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 font-dmSans text-sm transition ${
                  active
                    ? "bg-[#FF5500]/15 text-[#FF5500]"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate font-dmSans text-xs text-white/40">{username || "Admin"}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 font-dmSans text-xs text-white/50 transition hover:text-[#FF5500]"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
