"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Headphones,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBasket,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { cartApi, clearToken, getToken } from "@/services/api";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#groceries", label: "Groceries" },
  { href: "/packages", label: "Packages (පැකේජ)" },
  { href: "/#special", label: "Special Cinnamon", short: "Cinnamon" },
] as const;

function countCartItems(payload: unknown): number {
  const body = (payload as { data?: unknown })?.data ?? payload;
  const items = Array.isArray(body)
    ? body
    : (body as { items?: unknown[] })?.items;
  if (!Array.isArray(items)) return 0;
  return items.reduce<number>(
    (sum, item) => sum + (Number((item as { quantity?: number }).quantity) || 1),
    0
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");
  const [showAdminModal, setShowAdminModal] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const res = await (cartApi as any).getCart?.(1);
      setCartCount(countCartItems(res));
    } catch {
      setCartCount(0);
    }
  }, []);

  // Login සහ User Role පරික්ෂාව
  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(!!getToken());
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const u = JSON.parse(raw);
          setUserRole(String(u?.role ?? "CUSTOMER").toUpperCase());
        } else {
          setUserRole("CUSTOMER");
        }
      } catch {
        setUserRole("CUSTOMER");
      }
    };

    checkAuth();
    refreshCart();

    window.addEventListener("cart:updated", refreshCart);
    window.addEventListener("cart-updated", refreshCart);
    window.addEventListener("auth:updated", checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("cart:updated", refreshCart);
      window.removeEventListener("cart-updated", refreshCart);
      window.removeEventListener("auth:updated", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, [refreshCart]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open || showAdminModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, showAdminModal]);

  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
    setUserRole("CUSTOMER");
    window.dispatchEvent(new Event("auth:updated"));
    router.push("/login");
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/#groceries?search=${encodeURIComponent(q)}`);
  };

  // 🚀 Admin බොත්තම එබූ විට සිදුවන ක්‍රියාවලිය:
  const handleAdminButtonClick = () => {
    // සැබෑ Admin කෙනෙක් Login වී ඇත්නම් කෙලින්ම Dashboard එකට:
    if (isLoggedIn && (userRole === "ADMIN" || userRole === "ROLE_ADMIN")) {
      router.push("/admin");
    } else {
      // Customer කෙනෙක් හෝ Guest කෙනෙක් නම් Contact Admin Modal එක පෙන්වීම:
      setShowAdminModal(true);
    }
  };

  const linkClass = (href: string) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-green-100 text-green-900 font-bold"
        : "text-green-950/80 hover:bg-green-50 hover:text-green-900"
    }`;

  const cartBadge =
    cartCount > 0 ? (
      <span
        aria-label={`${cartCount} items in cart`}
        className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1 text-[11px] font-bold text-white shadow-xs"
      >
        {cartCount > 99 ? "99+" : cartCount}
      </span>
    ) : null;

  // Admin Portal පිටුවලදී පමණක් Customer Navbar එක Hide වේ
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-green-200 bg-white/95 backdrop-blur shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-700 text-white shadow-xs">
              <ShoppingBasket className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-extrabold text-green-900">
                Lanka Food City
              </span>
              <span className="block text-[11px] font-medium text-amber-700">
                Online
              </span>
            </span>
          </Link>

          {/* Desktop Links */}
          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                {"short" in l ? l.short : l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Search */}
          <div className="mx-auto hidden max-w-md flex-1 md:block">
            <form onSubmit={onSearch} role="search" className="relative w-full">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rice, dhal, spices, cinnamon…"
                className="w-full rounded-full border border-green-200 bg-white py-2 pl-4 pr-11 text-sm text-gray-900 placeholder:text-gray-500 focus:border-green-600 focus:outline-hidden focus:ring-2 focus:ring-green-600/30"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-green-700 text-white hover:bg-green-800"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Desktop Actions */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            {/* Cart Link */}
            <Link href="/cart" className={`${linkClass("/cart")} flex items-center gap-2`}>
              <span className="relative">
                <ShoppingCart className="h-5 w-5 text-green-800" />
                {cartBadge}
              </span>
              <span className="hidden xl:inline">Cart</span>
            </Link>

            {/* Login / Profile */}
            {isLoggedIn ? (
              <div className="flex items-center gap-1">
                <Link href="/profile" className={`${linkClass("/profile")} flex items-center gap-2`}>
                  <User className="h-5 w-5 text-green-700" />
                  <span className="hidden xl:inline">Profile</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Logout"
                  className="rounded-md p-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg bg-green-700 px-3.5 py-2 text-sm font-bold text-white shadow-xs transition hover:bg-green-800"
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </Link>
            )}

            {/* ⭐ ADMIN / CONTACT ADMIN SMART BUTTON ⭐ */}
            <button
              type="button"
              onClick={handleAdminButtonClick}
              className="ml-1 rounded-md border border-green-700 px-3 py-1.5 text-sm font-semibold text-green-800 hover:bg-green-700 hover:text-white transition flex items-center gap-1"
            >
              {isLoggedIn && (userRole === "ADMIN" || userRole === "ROLE_ADMIN") ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin Portal</span>
                </>
              ) : (
                <>
                  <Headphones className="h-4 w-4" />
                  <span>Contact Admin</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Buttons */}
          <div className="ml-auto flex items-center gap-3 md:hidden">
            <Link href="/cart" aria-label="Cart" className="relative p-2 text-green-900">
              <ShoppingCart className="h-6 w-6" />
              {cartBadge}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-2 text-green-900 hover:bg-green-50"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

        </div>

        {/* Mobile Drawer */}
        {open && (
          <div className="md:hidden border-t border-gray-100 px-4 pt-3 pb-4 space-y-2 bg-white">
            <Link href="/" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-green-50">
              Home
            </Link>
            <Link href="/#groceries" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-green-50">
              Groceries
            </Link>
            <Link href="/packages" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-amber-800 hover:bg-amber-50">
              Packages (පැකේජ)
            </Link>
            <Link href="/#special" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-amber-800 hover:bg-amber-50">
              Cinnamon Specials
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link href="/profile" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-green-50">
                  Profile &amp; Orders
                </Link>
                <button
                  type="button"
                  onClick={() => { setOpen(false); handleLogout(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-green-700 px-3 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-green-800"
              >
                <User className="h-4 w-4" />
                Login / Sign In
              </Link>
            )}

            <button
              type="button"
              onClick={() => { setOpen(false); handleAdminButtonClick(); }}
              className="w-full text-left mt-2 block px-3 py-2 rounded-md text-base font-bold text-green-800 bg-green-50"
            >
              {isLoggedIn && (userRole === "ADMIN" || userRole === "ROLE_ADMIN")
                ? "Go to Admin Portal"
                : "Contact Store Admin"}
            </button>
          </div>
        )}
      </header>

      {/* 🚀 CONTACT ADMIN / STORE SUPPORT MODAL (Customer ට පෙන්වන Modal එක) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-green-950 font-black text-lg">
                <span className="p-2 bg-green-100 text-green-800 rounded-xl">
                  <Headphones className="h-5 w-5" />
                </span>
                <span>Contact Store Admin</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              ඇණවුම්, භාණ්ඩ හෝ PickMe බෙදාහැරීම් පිළිබඳව ගැටලුවක් ඇත්නම් අපගේ ප්‍රධාන Admin / පාරිභෝගික සේවා කණ්ඩායම සෘජුවම සම්බන්ධ කරගන්න:
            </p>

            <div className="space-y-3">
              {/* Phone Hotline */}
              <a
                href="tel:0711111111"
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-gray-200 hover:border-green-600 hover:bg-green-50/50 transition group"
              >
                <div className="p-2.5 bg-green-100 text-green-700 rounded-xl group-hover:bg-green-700 group-hover:text-white transition">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase">Direct Admin Hotline</span>
                  <span className="text-sm font-extrabold text-gray-900">071 111 1111 / 011 234 5678</span>
                </div>
              </a>

              {/* WhatsApp Support */}
              <a
                href="https://wa.me/94711111111"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-gray-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition group"
              >
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase">WhatsApp Instant Support</span>
                  <span className="text-sm font-extrabold text-gray-900">+94 71 111 1111</span>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:admin@foodcity.lk"
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-gray-200 hover:border-blue-600 hover:bg-blue-50/50 transition group"
              >
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase">Official Admin Email</span>
                  <span className="text-sm font-extrabold text-gray-900">admin@foodcity.lk</span>
                </div>
              </a>

              {/* Head Office Address */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <span>Lanka Food City Head Office, No 45, Galle Road, Colombo 03.</span>
              </div>
            </div>

            {/* Admin Login Prompt */}
            <div className="pt-2 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                ඔබ ආයතනයේ Administrator කෙනෙක්ද?{" "}
                <Link
                  href="/login"
                  onClick={() => setShowAdminModal(false)}
                  className="font-bold text-green-700 hover:underline"
                >
                  Admin ලෙස Login වන්න
                </Link>
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}