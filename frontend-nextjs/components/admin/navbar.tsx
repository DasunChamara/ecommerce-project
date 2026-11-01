"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Search,
  ShoppingBasket,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { cartApi } from "@/services/api";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/groceries", label: "Groceries" },
  { href: "/special", label: "Special Products (Cinnamon)", short: "Cinnamon" },
] as const;

/**
 * Pulls the item count out of whatever shape the cart API returns:
 *  - an array of items
 *  - { items: [...] }
 *  - { data: ... } (axios-style wrapper)
 */
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

  const refreshCart = useCallback(async () => {
    try {
      // Adjust to your cartApi: getCart / getCartItems / etc.
      const res = await (cartApi as any).getCart();
      setCartCount(countCartItems(res));
    } catch {
      setCartCount(0); // backend offline or not logged in
    }
  }, []);

  useEffect(() => {
    refreshCart();
    // ProductCard dispatches this event after a successful add-to-cart.
    window.addEventListener("cart:updated", refreshCart);
    return () => window.removeEventListener("cart:updated", refreshCart);
  }, [refreshCart]);

  // Close drawer on navigation
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/groceries?search=${encodeURIComponent(q)}`);
  };

  const linkClass = (href: string) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700 ${
      pathname === href
        ? "bg-green-100 text-green-900"
        : "text-green-950/80 hover:bg-green-50 hover:text-green-900"
    }`;

  const cartBadge =
    cartCount > 0 ? (
      <span
        aria-label={`${cartCount} items in cart`}
        className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1 text-[11px] font-bold text-white"
      >
        {cartCount > 99 ? "99+" : cartCount}
      </span>
    ) : null;

  const searchForm = (
    <form onSubmit={onSearch} role="search" className="relative w-full">
      <label htmlFor="site-search" className="sr-only">
        Search groceries
      </label>
      <input
        id="site-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search rice, dhal, spices, cinnamon…"
        className="w-full rounded-full border border-green-200 bg-white py-2 pl-4 pr-11 text-sm text-gray-900 placeholder:text-gray-500 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-green-700 text-white hover:bg-green-800"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );

  // The Admin Portal has its own header (app/admin/layout.tsx).
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-green-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-700 text-white">
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

        {/* Desktop links */}
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {"short" in l ? l.short : l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop search */}
        <div className="mx-auto hidden max-w-md flex-1 md:block">{searchForm}</div>

        {/* Desktop actions */}
        <div className="ml-auto hidden items-center gap-1 md:flex">
          <Link href="/cart" className={`${linkClass("/cart")} flex items-center gap-2`}>
            <span className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartBadge}
            </span>
            <span className="hidden xl:inline">Cart</span>
          </Link>
          <Link href="/profile" className={`${linkClass("/profile")} flex items-center gap-2`}>
            <User className="h-5 w-5" />
            <span className="hidden xl:inline">Profile</span>
          </Link>
          <Link
            href="/admin"
            className="ml-1 rounded-md border border-green-700 px-3 py-1.5 text-sm font-semibold text-green-800 hover:bg-green-700 hover:text-white"
          >
            Admin
          </Link>
        </div>

        {/* Mobile: cart + menu */}
        <div className="ml-auto flex items-center gap-3 md:hidden">
          <Link href="/cart" aria-label="Cart" className="relative p-2 text-green-900">
            <ShoppingCart className="h-6 w-6" />
            {cartBadge}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="rounded-md p-2 text-green-900 hover:bg-green-50"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-80 max-w-[85%] flex-col bg-white shadow-xl transition-transform duration-200 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-green-100 px-4">
            <span className="font-bold text-green-900">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rounded-md p-2 text-green-900 hover:bg-green-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto p-4">
            {searchForm}
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {NAV_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                  {l.label}
                </Link>
              ))}
              <Link href="/cart" className={`${linkClass("/cart")} flex items-center justify-between`}>
                Cart
                {cartCount > 0 && (
                  <span className="rounded-full bg-amber-600 px-2 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link href="/profile" className={linkClass("/profile")}>
                Profile
              </Link>
              <Link href="/admin" className={linkClass("/admin")}>
                Admin
              </Link>
            </nav>
          </div>
        </aside>
      </div>
    </header>
  );
}
