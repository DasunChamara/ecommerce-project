"use client";

// 🚀 Next.js 16 Turbopack එකට Instant Navigation validation එක Skip කිරීමට උපදෙස් දීම:
//export const instant = false;

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  ShieldAlert, 
  Zap, 
  Package, 
  Users, 
  Store, 
  LogOut, 
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";
import { clearToken } from "@/services/api";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/urgent-orders", label: "Urgent Orders", icon: Zap },
  { href: "/admin/orders", label: "All Orders", icon: Package },
  { href: "/admin/products", label: "Products & Variants", icon: Store },
  { href: "/admin/users", label: "Users & Blacklist", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.role === "ADMIN" || u?.role === "ROLE_ADMIN") {
          setIsAdmin(true);
          return;
        }
      }
    } catch {}
    setIsAdmin(false);
  }, []);

  const handleLogout = () => {
    clearToken();
    window.dispatchEvent(new Event("auth:updated"));
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 🛡️ DEDICATED ADMIN NAVBAR */}
      <header className="bg-green-950 text-white border-b border-green-900 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center justify-between h-16 border-b border-green-900/60">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-amber-500 text-green-950 rounded-xl font-black">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <span className="font-extrabold text-lg tracking-tight block leading-none">
                  Lanka Food City <span className="text-amber-400">| Admin Portal</span>
                </span>
                <span className="text-[10px] text-green-300 font-semibold tracking-wider uppercase">
                  Store Management System
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-green-900/80 px-3 py-1.5 rounded-xl border border-green-800">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-bold text-green-200">Administrator</span>
                <span className="text-[10px] bg-amber-400 text-green-950 px-1.5 py-0.5 rounded font-black">ADMIN</span>
              </div>

              <Link
                href="/"
                className="text-xs font-semibold text-gray-300 hover:text-white transition flex items-center gap-1 bg-green-900/40 px-3 py-1.5 rounded-lg border border-green-800"
              >
                <Store className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden md:inline">View Customer Store</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-bold text-red-300 hover:text-white bg-red-950/60 hover:bg-red-900/80 px-3 py-1.5 rounded-lg border border-red-800 transition flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto py-2 text-sm font-semibold">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition whitespace-nowrap ${
                    active
                      ? "bg-green-800 text-amber-300 shadow-inner"
                      : "text-gray-300 hover:text-white hover:bg-green-900/50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-amber-400" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

        </div>
      </header>

      {/* 🚀 Main Content: කිසිදා Drop නොවී එකම Return එකක් තුළ Render වීම */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!mounted ? (
          <div className="py-20 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-green-700 border-t-transparent rounded-full" />
          </div>
        ) : !isAdmin ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <span className="p-4 bg-red-100 text-red-600 rounded-full mb-3">
              <ShieldAlert className="h-10 w-10" />
            </span>
            <h1 className="text-2xl font-black text-gray-900">Access Denied: Admin Privileges Required</h1>
            <p className="text-sm text-gray-600 mt-1 max-w-sm">
              මෙම පිටුවට ඇතුළු විය හැක්කේ Admin ගිණුමකින් පමණි. කරුණාකර Admin ලෙස Login වන්න.
            </p>
            <Link href="/login" className="mt-6 px-6 py-2.5 bg-green-700 text-white rounded-xl font-bold text-sm hover:bg-green-800 transition">
              Go to Login
            </Link>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}