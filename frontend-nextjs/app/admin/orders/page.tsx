"use client";

import { useMemo, useState } from "react";
import { Ban, CheckCircle, Loader2, Package, ShieldAlert, Truck, Zap } from "lucide-react";
import { adminApi } from "@/services/api";
import {
  AdminOrder,
  NEXT_STATUS,
  OrderStatus,
  STATUSES,
  MAX_STRIKES,
  normaliseOrder,
  useActionRunner,
  useList,
} from "@/lib/admin";
import {
  ConfirmButton,
  Empty,
  ErrorBox,
  ListSkeleton,
  OrderDetails,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";

export default function AllOrdersPage() {
  const { data, loading, error, reload, refresh } = useList(
    () => (adminApi as any).getOrders(),
    normaliseOrder
  );
  const { busy, run } = useActionRunner();
  const [filter, setFilter] = useState<"ALL" | OrderStatus>("ALL");

  const visible = useMemo(() => {
    const list = filter === "ALL" ? data : data.filter((o) => o.status === filter);
    // Urgent first, then newest first
    return [...list].sort(
      (a, b) =>
        Number(b.isUrgent) - Number(a.isUrgent) ||
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );
  }, [data, filter]);

  const advance = (o: AdminOrder, status: OrderStatus) =>
    run(
      `order-${o.id}-${status}`,
      () => (adminApi as any).updateOrderStatus(o.id, status),
      `Order #${o.id} is now ${status}`,
      "Could not update the order status.",
      refresh
    );

  const reject = (o: AdminOrder) =>
    run(
      `order-${o.id}-reject`,
      () => (adminApi as any).rejectDelivery(o.id),
      `Delivery rejection recorded for ${o.customerName} (+1 penalty)`,
      "Could not record the delivery rejection.",
      refresh
    );

  return (
    <div>
      <PageHeader
        icon={<Package className="h-6 w-6" />}
        title="All Orders & Courier Dispatch"
        subtitle="Move orders through dispatch and track COD delivery rejections."
        onRefresh={reload}
        refreshing={loading}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <label htmlFor="status-filter" className="mr-2 text-sm font-medium text-gray-700">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as "ALL" | OrderStatus)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30"
          >
            <option value="ALL">ALL</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-600">
          {visible.length} order{visible.length === 1 ? "" : "s"}
        </p>
      </div>

      <p className="mb-5 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        Upon the {MAX_STRIKES}th rejection, customer account is automatically blacklisted.
      </p>

      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorBox onRetry={reload} />
      ) : visible.length === 0 ? (
        <Empty>No orders{filter !== "ALL" ? ` with status ${filter}` : ""}.</Empty>
      ) : (
        <ul className="space-y-4">
          {visible.map((o) => {
            const next = NEXT_STATUS[o.status];
            const canCancel = o.status === "PENDING" || o.status === "PROCESSING";
            return (
              <li
                key={o.id}
                className={`rounded-xl border bg-white p-4 ${o.isUrgent ? "border-red-400" : "border-gray-200"}`}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">Order #{o.id}</h2>
                    {o.isUrgent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                        <Zap className="h-3 w-3" /> URGENT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {o.createdAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(o.createdAt).toLocaleString("en-LK")}
                      </span>
                    )}
                    <StatusBadge status={o.status} />
                  </div>
                </div>

                <OrderDetails order={o} />

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                  {next && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => advance(o, next)}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                    >
                      {busy === `order-${o.id}-${next}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : next === "DELIVERED" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Truck className="h-4 w-4" />
                      )}
                      Advance to {next.charAt(0) + next.slice(1).toLowerCase()}
                    </button>
                  )}
                  {canCancel && (
                    <ConfirmButton
                      disabled={busy !== null}
                      onConfirm={() => advance(o, "CANCELLED")}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Ban className="h-4 w-4" /> Cancel order
                    </ConfirmButton>
                  )}
                  {o.status === "SHIPPED" && (
                    <ConfirmButton
                      disabled={busy !== null}
                      onConfirm={() => reject(o)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-600 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      <ShieldAlert className="h-4 w-4" /> Record Delivery Rejection (+1 Penalty)
                    </ConfirmButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
