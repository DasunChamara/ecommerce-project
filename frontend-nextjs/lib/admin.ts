/**
 * Shared admin code: types, response normalisers, formatters and hooks.
 * Imported by app/admin/** (all client components).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

/* -------------------------------------------------------------------------- */
/*  Config                                                                     */
/* -------------------------------------------------------------------------- */

/** Strikes at which a customer is automatically blacklisted (the 6th COD rejection). */
export const MAX_STRIKES = 6;

export const STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatus = (typeof STATUSES)[number];

export const NEXT_STATUS: Partial<Record<string, OrderStatus>> = {
  PENDING: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

/** Urgent orders that still need dispatching. */
export const isAwaitingDispatch = (status: string) =>
  status === "PENDING" || status === "PROCESSING";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AdminOrder = {
  id: string | number;
  status: string;
  isUrgent: boolean;
  customerName: string;
  phone?: string;
  address?: string;
  totalWeightKg: number;
  totalAmount: number;
  createdAt?: string;
  items: { name: string; weight?: string; quantity: number }[];
};

export type AdminProduct = {
  id: string | number;
  name: string;
  description?: string;
  basePrice: number;
  stockQuantity: number;
  imageUrl?: string;
  isSpecial: boolean;
  variants: { label: string; price?: number }[];
};

export type AdminUser = {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  penaltyCount: number;
  isBlacklisted: boolean;
};

export type StoredUser = {
  id?: string | number;
  name?: string;
  phoneNumber?: string;
  role: string;
};

/* -------------------------------------------------------------------------- */
/*  Normalisers (tolerate small differences in backend field names)            */
/* -------------------------------------------------------------------------- */

export const toArray = (res: unknown): any[] => {
  const body: any = (res as any)?.data ?? res;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.content)) return body.content;
  return [];
};

export function normaliseOrder(r: any): AdminOrder {
  const items: any[] = r.items ?? r.orderItems ?? [];
  return {
    id: r.id ?? r.orderId,
    status: String(r.status ?? "PENDING").toUpperCase(),
    isUrgent: r.isUrgent === true || r.urgent === true,
    customerName:
      r.customerName ?? r.user?.fullName ?? r.user?.name ?? r.userName ?? "Customer",
    phone: r.phoneNumber ?? r.customerPhone ?? r.user?.phoneNumber ?? r.user?.phone,
    address: r.deliveryAddress ?? r.address,
    totalWeightKg: Number(r.totalWeightKg ?? r.totalWeight) || 0,
    totalAmount: Number(r.totalAmount ?? r.finalAmount) || 0,
    createdAt: r.createdAt ?? r.orderDate,
    items: items.map((i) => ({
      name: i.name ?? i.productName ?? i.product?.name ?? "Item",
      weight: i.weight ?? i.weightLabel,
      quantity: Number(i.quantity) || 1,
    })),
  };
}

export function normaliseProduct(r: any): AdminProduct {
  const variants: any[] = r.weightVariants ?? r.variants ?? [];
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    basePrice: Number(r.basePrice ?? r.price) || 0,
    stockQuantity: Number(r.stockQuantity) || 0,
    imageUrl: r.imageUrl ?? r.image,
    isSpecial: r.isSpecial === true || r.special === true,
    variants: variants.map((v) => ({
      label: v.weightLabel ?? v.label ?? "",
      price: v.price !== undefined ? Number(v.price) : undefined,
    })),
  };
}

export function normaliseUser(r: any): AdminUser {
  return {
    id: r.id ?? r.userId,
    name: r.fullName ?? r.name ?? "—",
    email: r.email,
    phone: r.phoneNumber ?? r.phone,
    role: String(r.role ?? "CUSTOMER").replace(/^ROLE_/, "").toUpperCase(),
    penaltyCount: Number(r.penaltyCount ?? r.penalties) || 0,
    isBlacklisted:
      r.isBlacklisted === true ||
      r.blacklisted === true ||
      String(r.status ?? "").toUpperCase() === "BLACKLISTED",
  };
}

/* -------------------------------------------------------------------------- */
/*  Formatters                                                                 */
/* -------------------------------------------------------------------------- */

export const formatPrice = (v: number) =>
  `Rs. ${v.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatKg = (kg: number) =>
  `${kg.toLocaleString("en-LK", { maximumFractionDigits: 2 })} kg`;

/** "42m", "3h 5m", "2d 4h", or null when the date is missing/invalid. */
export function waiting(createdAt: string | undefined, now: number): string | null {
  if (!createdAt) return null;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return null;
  const mins = Math.max(0, Math.floor((now - t) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  return h < 24 ? `${h}h ${mins % 60}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
}

export const errMsg = (e: any, fallback: string): string =>
  e?.response?.data?.message ?? fallback;

/* -------------------------------------------------------------------------- */
/*  Session                                                                    */
/* -------------------------------------------------------------------------- */

/** Reads the logged-in user saved by the login page (localStorage["user"]). */
export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u || typeof u !== "object") return null;
    return {
      id: u.id ?? u.userId,
      name: u.name ?? u.fullName,
      phoneNumber: u.phoneNumber ?? u.phone,
      role: String(u.role ?? "").replace(/^ROLE_/, "").toUpperCase(),
    };
  } catch {
    return null;
  }
}

export const isAdminUser = (u: StoredUser | null) => u?.role === "ADMIN";

/* -------------------------------------------------------------------------- */
/*  Hooks                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Loads a list on mount.
 *  - reload():  shows the loading skeleton
 *  - refresh(): silent background refresh (keeps current data, ignores errors)
 * `map` must be a stable (module-level) function.
 */
export function useList<T>(fetcher: () => Promise<unknown>, map: (raw: any) => T) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const [state, setState] = useState({ data: [] as T[], loading: true, error: false });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: false }));
    try {
      const res = await fetcherRef.current();
      setState({ data: toArray(res).map(map), loading: false, error: false });
    } catch {
      setState((s) => ({ ...s, loading: false, error: true }));
    }
  }, [map]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetcherRef.current();
      setState({ data: toArray(res).map(map), loading: false, error: false });
    } catch {
      /* keep showing the last good data */
    }
  }, [map]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload, refresh };
}

/** Runs one admin action at a time (blocks double-clicks) with toast feedback. */
export function useActionRunner() {
  const [busy, setBusy] = useState<string | null>(null);
  const lock = useRef(false);

  const run = useCallback(
    async (
      key: string,
      fn: () => Promise<unknown>,
      ok: string,
      fail: string,
      after?: () => Promise<unknown> | void
    ): Promise<boolean> => {
      if (lock.current) return false;
      lock.current = true;
      setBusy(key);
      try {
        await fn();
        toast.success(ok);
        await after?.();
        return true;
      } catch (e) {
        toast.error(errMsg(e, fail));
        return false;
      } finally {
        lock.current = false;
        setBusy(null);
      }
    },
    []
  );

  return { busy, run };
}

export type Run = ReturnType<typeof useActionRunner>["run"];

/** Current timestamp that re-renders the component every `ms`. */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
