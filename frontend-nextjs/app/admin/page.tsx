"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Package,
  RefreshCw,
  ShoppingBasket,
  Users,
  Zap,
} from "lucide-react";
import { adminApi, productsApi } from "@/services/api";
import {
  getStoredUser,
  isAwaitingDispatch,
  normaliseOrder,
  normaliseProduct,
  normaliseUser,
  useList,
} from "@/lib/admin";

function Kpi({
  label,
  value,
  hint,
  icon,
  href,
  tone,
  loading,
  failed,
}: {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  href: string;
  tone: "red" | "green" | "amber" | "slate";
  loading: boolean;
  failed: boolean;
}) {
  const tones = {
    red: "border-red-300 bg-red-50 text-red-700",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    green: "border-green-200 bg-white text-green-800",
    slate: "border-gray-200 bg-white text-gray-800",
  } as const;

  return (
    <Link
      href={href}
      className={`block rounded-xl border-2 p-5 transition-shadow hover:shadow-md ${tones[tone]}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        {icon}
      </div>
      {loading ? (
        <div className="mt-3 h-9 w-16 animate-pulse rounded bg-black/10" />
      ) : (
        <p className="mt-2 text-4xl font-extrabold">{failed ? "—" : value}</p>
      )}
      <p className="mt-1 text-xs opacity-80">{failed ? "Couldn't load" : hint}</p>
    </Link>
  );
}

const SECTIONS = [
  {
    href: "/admin/urgent-orders",
    title: "⚡ Urgent Orders",
    text: "Priority parcels that need immediate dispatch.",
    icon: Zap,
    style: "border-red-300 hover:border-red-500",
    iconStyle: "bg-red-100 text-red-700",
  },
  {
    href: "/admin/orders",
    title: "📦 All Orders",
    text: "Track orders, advance statuses and record COD rejections.",
    icon: Package,
    style: "border-green-200 hover:border-green-500",
    iconStyle: "bg-green-100 text-green-800",
  },
  {
    href: "/admin/products",
    title: "🛒 Products & Variants",
    text: "Add products, weight variants and manage stock.",
    icon: ShoppingBasket,
    style: "border-green-200 hover:border-green-500",
    iconStyle: "bg-green-100 text-green-800",
  },
  {
    href: "/admin/users",
    title: "🛡️ Users & Blacklist",
    text: "Review penalties and unblock customers.",
    icon: Users,
    style: "border-amber-300 hover:border-amber-500",
    iconStyle: "bg-amber-100 text-amber-800",
  },
] as const;

export default function AdminOverviewPage() {
  const [name, setName] = useState<string>("");
  useEffect(() => {
    const u = getStoredUser();
    setName(u?.name || "");
  }, []);

  const urgent = useList(() => (adminApi as any).getUrgentOrders(), normaliseOrder);
  const orders = useList(() => (adminApi as any).getOrders(), normaliseOrder);
  const products = useList(() => (productsApi as any).getAll(), normaliseProduct);
  const users = useList(() => (adminApi as any).getUsers(), normaliseUser);

  const urgentWaiting = useMemo(
    () => urgent.data.filter((o) => isAwaitingDispatch(o.status)).length,
    [urgent.data]
  );
  const inStock = useMemo(() => products.data.filter((p) => p.stockQuantity > 0).length, [products.data]);
  const outOfStock = products.data.length - inStock;
  const blacklisted = useMemo(() => users.data.filter((u) => u.isBlacklisted).length, [users.data]);
  const withStrikes = useMemo(
    () => users.data.filter((u) => !u.isBlacklisted && u.penaltyCount > 0).length,
    [users.data]
  );
  const pendingOrders = useMemo(
    () => orders.data.filter((o) => o.status === "PENDING").length,
    [orders.data]
  );

  const anyFailed = urgent.error || orders.error || products.error || users.error;
  const retryAll = () => {
    if (urgent.error) urgent.reload();
    if (orders.error) orders.reload();
    if (products.error) products.reload();
    if (users.error) users.reload();
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section className="rounded-2xl bg-gradient-to-r from-green-800 to-green-950 px-6 py-8 text-white">
        <p className="text-sm font-semibold text-amber-300">Admin Portal</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          Welcome back{name ? `, ${name}` : ""}
        </h1>
        <p className="mt-2 max-w-2xl text-green-100">
          {urgent.loading
            ? "Checking the urgent queue…"
            : urgent.error
            ? "Here's your store at a glance."
            : urgentWaiting > 0
            ? `${urgentWaiting} urgent order${urgentWaiting === 1 ? " is" : "s are"} waiting for dispatch. Start there.`
            : "No urgent orders are waiting. Here's your store at a glance."}
        </p>
      </section>

      {anyFailed && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Some figures couldn&apos;t be loaded. Check that the backend is running on http://localhost:8081.
          </span>
          <button type="button" onClick={retryAll} className="inline-flex items-center gap-1.5 font-semibold underline">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}

      {/* KPIs */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Urgent orders waiting dispatch"
          value={urgentWaiting}
          hint={urgentWaiting > 0 ? "Immediate dispatch required" : "Queue is clear"}
          icon={<Zap className="h-5 w-5" />}
          href="/admin/urgent-orders"
          tone={urgentWaiting > 0 ? "red" : "green"}
          loading={urgent.loading}
          failed={urgent.error}
        />
        <Kpi
          label="Total orders"
          value={orders.data.length}
          hint={`${pendingOrders} pending`}
          icon={<Package className="h-5 w-5" />}
          href="/admin/orders"
          tone="slate"
          loading={orders.loading}
          failed={orders.error}
        />
        <Kpi
          label="Active products"
          value={inStock}
          hint={`${products.data.length} listed · ${outOfStock} out of stock`}
          icon={<ShoppingBasket className="h-5 w-5" />}
          href="/admin/products"
          tone="green"
          loading={products.loading}
          failed={products.error}
        />
        <Kpi
          label="Blacklisted customers"
          value={blacklisted}
          hint={`${withStrikes} more with active strikes`}
          icon={<Ban className="h-5 w-5" />}
          href="/admin/users"
          tone={blacklisted > 0 ? "amber" : "green"}
          loading={users.loading}
          failed={users.error}
        />
      </section>

      {/* Quick navigation */}
      <section aria-label="Admin sections">
        <h2 className="mb-3 text-lg font-bold text-green-950">Manage your store</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SECTIONS.map(({ href, title, text, icon: Icon, style, iconStyle }) => (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-4 rounded-xl border-2 bg-white p-5 transition-shadow hover:shadow-md ${style}`}
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}>
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-gray-900">{title}</span>
                <span className="block text-sm text-gray-600">{text}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
