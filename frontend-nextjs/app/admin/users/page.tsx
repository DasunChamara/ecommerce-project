"use client";

import { useMemo, useState } from "react";
import { Ban, CheckCircle, ShieldAlert } from "lucide-react";
import { adminApi } from "@/services/api";
import {
  AdminUser,
  MAX_STRIKES,
  normaliseUser,
  useActionRunner,
  useList,
} from "@/lib/admin";
import { ConfirmButton, Empty, ErrorBox, ListSkeleton, PageHeader } from "@/components/admin/ui";

export default function UsersPage() {
  const { data, loading, error, reload, refresh } = useList(
    () => (adminApi as any).getUsers(),
    normaliseUser
  );
  const { busy, run } = useActionRunner();
  const [onlyBlocked, setOnlyBlocked] = useState(false);

  const visible = useMemo(() => {
    const list = onlyBlocked ? data.filter((u) => u.isBlacklisted) : data;
    // Blacklisted first, then most strikes first
    return [...list].sort(
      (a, b) => Number(b.isBlacklisted) - Number(a.isBlacklisted) || b.penaltyCount - a.penaltyCount
    );
  }, [data, onlyBlocked]);

  const unblock = (u: AdminUser) =>
    run(
      `unblock-${u.id}`,
      () => (adminApi as any).unblockUser(u.id),
      `${u.name} unblocked and penalties reset`,
      "Could not unblock the user.",
      refresh
    );

  return (
    <div>
      <PageHeader
        icon={<ShieldAlert className="h-6 w-6" />}
        title="Users, Penalties & Blacklist Control"
        subtitle={`Customers are blacklisted automatically at ${MAX_STRIKES} COD delivery rejections.`}
        onRefresh={reload}
        refreshing={loading}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={onlyBlocked}
            onChange={(e) => setOnlyBlocked(e.target.checked)}
            className="h-4 w-4 accent-green-700"
          />
          Show Blacklisted Only
        </label>
        <p className="text-sm text-gray-600">
          {visible.length} user{visible.length === 1 ? "" : "s"}
        </p>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorBox onRetry={reload} />
      ) : visible.length === 0 ? (
        <Empty>{onlyBlocked ? "No blacklisted users." : "No users found."}</Empty>
      ) : (
        <ul className="space-y-3">
          {visible.map((u) => {
            const pct = Math.min(100, (u.penaltyCount / MAX_STRIKES) * 100);
            const canUnblock = u.role !== "ADMIN" && (u.isBlacklisted || u.penaltyCount > 0);
            return (
              <li
                key={u.id}
                className={`flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4 ${
                  u.isBlacklisted ? "border-red-300" : "border-gray-200"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-gray-900">{u.name}</h2>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                      {u.role}
                    </span>
                    {u.isBlacklisted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                        <Ban className="h-3 w-3" /> BLACKLISTED
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-700">
                    Email: {u.email || "—"} · Phone: {u.phone || "—"}
                  </p>
                  <div className="mt-2 max-w-xs">
                    <p className="text-xs font-semibold text-gray-700">
                      {u.penaltyCount} / {MAX_STRIKES} strikes
                    </p>
                    <div
                      className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={MAX_STRIKES}
                      aria-valuenow={Math.min(u.penaltyCount, MAX_STRIKES)}
                      aria-label={`${u.penaltyCount} of ${MAX_STRIKES} strikes`}
                    >
                      <div
                        className={`h-full ${pct >= 100 ? "bg-red-600" : pct >= 50 ? "bg-amber-500" : "bg-green-600"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {canUnblock && (
                  <ConfirmButton
                    disabled={busy !== null}
                    onConfirm={() => unblock(u)}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                  >
                    <CheckCircle className="h-4 w-4" /> Unblock User &amp; Reset Penalties
                  </ConfirmButton>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
