"use client";

import { ReactNode, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { AdminOrder, formatKg, formatPrice } from "@/lib/admin";

export const inputClass =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export function PageHeader({
  icon,
  title,
  subtitle,
  onRefresh,
  refreshing,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-800">
          {icon}
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-green-950">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      )}
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
      ))}
    </div>
  );
}

export function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertTriangle className="h-8 w-8 text-red-600" />
      <p className="text-sm text-red-800">
        Couldn&apos;t load this data. Check that the backend is running on http://localhost:8081.
      </p>
      <button
        type="button"
        onClick={() => onRetry()}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-600">
      {children}
    </p>
  );
}

/** Two-step button for destructive actions: click, then "Sure? Yes / No". */
export function ConfirmButton({
  children,
  onConfirm,
  disabled,
  className,
}: {
  children: ReactNode;
  onConfirm: () => void;
  disabled?: boolean;
  className: string;
}) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAsking(true)}
        className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {children}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm">
      <span className="font-semibold text-red-800">Sure?</span>
      <button
        type="button"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
        className="font-bold text-red-700 underline"
      >
        Yes
      </button>
      <button type="button" onClick={() => setAsking(false)} className="text-gray-700 underline">
        No
      </button>
    </span>
  );
}

export function OrderDetails({ order }: { order: AdminOrder }) {
  return (
    <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
      <p>
        <span className="text-gray-600">Customer:</span>{" "}
        <span className="font-semibold text-gray-900">{order.customerName}</span>
      </p>
      <p>
        <span className="text-gray-600">Phone:</span>{" "}
        <span className="font-semibold text-gray-900">{order.phone ?? "—"}</span>
      </p>
      <p className="sm:col-span-2">
        <span className="text-gray-600">Delivery address:</span>{" "}
        <span className="text-gray-900">{order.address ?? "—"}</span>
      </p>
      <p>
        <span className="text-gray-600">Total weight:</span>{" "}
        <span className="font-semibold text-gray-900">{formatKg(order.totalWeightKg)}</span>
      </p>
      <p>
        <span className="text-gray-600">Amount (COD):</span>{" "}
        <span className="font-semibold text-green-800">{formatPrice(order.totalAmount)}</span>
      </p>
      <div className="sm:col-span-2">
        <p className="text-gray-600">Items:</p>
        <ul className="mt-0.5 list-disc pl-5 text-gray-900">
          {order.items.length === 0 && <li className="list-none pl-0 text-gray-500">No item details</li>}
          {order.items.map((i, idx) => (
            <li key={idx}>
              {i.name}
              {i.weight ? ` (${i.weight})` : ""} × {i.quantity}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
