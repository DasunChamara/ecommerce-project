"use client";

import { useEffect, useMemo } from "react";
import { Ban, Clock, Loader2, Truck, Zap } from "lucide-react";
import { adminApi } from "@/services/api";
import {
  AdminOrder,
  isAwaitingDispatch,
  normaliseOrder,
  useActionRunner,
  useList,
  useNow,
  waiting,
} from "@/lib/admin";
import { ConfirmButton, Empty, ErrorBox, ListSkeleton, OrderDetails, PageHeader } from "@/components/admin/ui";

export default function UrgentOrdersPage() {
  const { data, loading, error, reload, refresh } = useList(
    () => (adminApi as any).getUrgentOrders(),
    normaliseOrder
  );
  const { busy, run } = useActionRunner();
  const now = useNow(30000);

  // New urgent orders should show up without the admin reloading the page.
  useEffect(() => {
    const t = setInterval(() => refresh(), 30000);
    return () => clearInterval(t);
  }, [refresh]);

  // Only orders that still need dispatching belong in the queue; oldest first.
  const queue = useMemo(
    () =>
      data
        .filter((o) => isAwaitingDispatch(o.status))
        .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()),
    [data]
  );

  const act = (o: AdminOrder, status: "SHIPPED" | "CANCELLED") =>
    run(
      `urgent-${o.id}-${status}`,
      () => (adminApi as any).updateOrderStatus(o.id, status),
      status === "SHIPPED" ? `Order #${o.id} marked as dispatched` : `Urgent order #${o.id} cancelled`,
      "Could not update the order.",
      refresh
    );

  return (
    <div>
      <PageHeader
        icon={<Zap className="h-6 w-6" />}
        title="Urgent Orders Queue"
        subtitle={
          loading
            ? "Loading…"
            : `${queue.length} order${queue.length === 1 ? "" : "s"} waiting · auto-refreshes every 30 seconds`
        }
        onRefresh={reload}
        refreshing={loading}
      />

      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorBox onRetry={reload} />
      ) : queue.length === 0 ? (
        <Empty>No urgent orders waiting. The queue is clear.</Empty>
      ) : (
        <ul className="space-y-4">
          {queue.map((o) => {
            const wait = waiting(o.createdAt, now);
            return (
              <li key={o.id} className="overflow-hidden rounded-xl border-2 border-red-500 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-red-600 to-amber-500 px-4 py-2.5 text-white">
                  <p className="flex items-center gap-2 text-sm font-extrabold">
                    <Zap className="h-4 w-4" /> Immediate Priority Dispatch Required
                  </p>
                  <p className="flex items-center gap-3 text-xs font-semibold">
                    <span>Order #{o.id}</span>
                    {wait && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> waiting {wait}
                      </span>
                    )}
                  </p>
                </div>

                <div className="space-y-4 bg-amber-50/60 p-4">
                  <OrderDetails order={o} />
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => act(o, "SHIPPED")}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50"
                    >
                      {busy === `urgent-${o.id}-SHIPPED` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Truck className="h-4 w-4" />
                      )}
                      Mark as Dispatched (SHIPPED)
                    </button>
                    <ConfirmButton
                      disabled={busy !== null}
                      onConfirm={() => act(o, "CANCELLED")}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-600 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                    >
                      <Ban className="h-4 w-4" /> Cancel / Reject Urgent Order
                    </ConfirmButton>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
