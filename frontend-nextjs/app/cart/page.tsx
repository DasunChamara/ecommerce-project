"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBasket,
  Trash2,
} from "lucide-react";
import { cartApi } from "@/services/api";

/* -------------------------------------------------------------------------- */
/*  Normalised cart line                                                       */
/* -------------------------------------------------------------------------- */

type CartLine = {
  id: string; // cart item id
  productId: string | number | undefined;
  name: string;
  imageUrl?: string;
  weightLabel: string;
  weightGrams: number;
  unitPrice: number; // price for ONE pack of the chosen weight
  quantity: number;
  stock: number; // Infinity when the API doesn't send stock
};

/** "500g" -> 500, "1kg" -> 1000, "1.5 kg" -> 1500. Returns 0 if unknown. */
function parseWeightToGrams(label: unknown): number {
  const m = String(label ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .match(/^(\d+(?:\.\d+)?)(kg|g)$/);
  if (!m) return 0;
  return m[2] === "kg" ? Number(m[1]) * 1000 : Number(m[1]);
}

/**
 * Maps whatever your backend returns into CartLine.
 * ASSUMED item shape (adjust the field names here if yours differ):
 *   { id, productId, quantity, weight | weightLabel, weightGrams, unitPrice | price,
 *     name, imageUrl, stockQuantity, product?: { name, imageUrl, basePrice, stockQuantity } }
 */
function normalise(raw: any): CartLine {
  const product = raw.product ?? {};
  const weightLabel: string = raw.weight ?? raw.weightLabel ?? raw.variant ?? "";
  const weightGrams =
    Number(raw.weightGrams) || parseWeightToGrams(weightLabel) || 0;
  const basePrice = Number(product.basePrice ?? raw.basePrice ?? 0);
  const unitPrice =
    Number(raw.unitPrice ?? raw.price) ||
    (weightGrams ? (basePrice * weightGrams) / 1000 : basePrice);
  const stockRaw = raw.stockQuantity ?? product.stockQuantity;

  return {
    id: String(raw.id ?? raw.cartItemId ?? `${raw.productId}-${weightLabel}`),
    productId: raw.productId ?? product.id,
    name: raw.name ?? raw.productName ?? product.name ?? "Product",
    imageUrl: raw.imageUrl ?? raw.image ?? product.imageUrl,
    weightLabel: weightLabel || "Standard pack",
    weightGrams,
    unitPrice,
    quantity: Math.max(1, Number(raw.quantity) || 1),
    stock: stockRaw === undefined || stockRaw === null ? Infinity : Number(stockRaw),
  };
}

function toLines(res: unknown): CartLine[] {
  const body: any = (res as any)?.data ?? res;
  const items = Array.isArray(body) ? body : body?.items ?? body?.content ?? [];
  return Array.isArray(items) ? items.map(normalise) : [];
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatPrice = (v: number) =>
  `Rs. ${v.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatKg = (grams: number) =>
  `${(grams / 1000).toLocaleString("en-LK", { maximumFractionDigits: 2 })} kg`;

/**
 * Calls the first cartApi method that exists from `names`.
 * Returns false when none exists, so the page keeps working with local state only.
 * Replace the candidate names with your real ones once you've confirmed them.
 */
async function callCartApi(names: string[], ...args: unknown[]): Promise<boolean> {
  const api = cartApi as any;
  const fn = names.map((n) => api?.[n]).find((f) => typeof f === "function");
  if (!fn) return false;
  await fn.apply(api, args);
  return true;
}

const notifyNavbar = () => window.dispatchEvent(new Event("cart:updated"));

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CartPage() {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // User ID 1 fallback ලෙස ලබා දෙන්න (එක් වරක් පමණි)
      const res = await (cartApi as any).getCart?.(1);
      const next = toLines(res);
      setLines(next);
      setSelected(new Set(next.filter((l) => l.stock > 0).map((l) => l.id)));
    } catch {
      // Error නොපෙන්වා හිස් Cart එක පෙන්වීම
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  /* ----------------------------- selection -------------------------------- */

  const selectable = useMemo(() => lines.filter((l) => l.stock > 0), [lines]);
  const allSelected = selectable.length > 0 && selectable.every((l) => selected.has(l.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(selectable.map((l) => l.id)));

  /* ------------------------------ item actions ---------------------------- */

  const changeQuantity = async (line: CartLine, next: number) => {
    if (next < 1) return;
    if (next > line.stock) {
      toast.error(`Only ${line.stock} unit${line.stock === 1 ? "" : "s"} available`);
      return;
    }
    const previous = line.quantity;
    setLines((ls) => ls.map((l) => (l.id === line.id ? { ...l, quantity: next } : l)));
    setBusyId(line.id);
    try {
      await callCartApi(
        ["updateQuantity", "updateCartItem", "updateItem"],
        line.id,
        next
      );
      notifyNavbar();
    } catch {
      setLines((ls) => ls.map((l) => (l.id === line.id ? { ...l, quantity: previous } : l)));
      toast.error("Could not update quantity. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const removeLine = async (line: CartLine) => {
    setBusyId(line.id);
    try {
      await callCartApi(
        ["removeFromCart", "removeItem", "removeCartItem"],
        line.id
      );
      setLines((ls) => ls.filter((l) => l.id !== line.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(line.id);
        return next;
      });
      toast.success(`${line.name} removed from cart`);
      notifyNavbar();
    } catch {
      toast.error("Could not remove the item. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  /* ------------------------------- summary -------------------------------- */

  const selectedLines = useMemo(
    () => lines.filter((l) => selected.has(l.id)),
    [lines, selected]
  );
  const selectedUnits = selectedLines.reduce((s, l) => s + l.quantity, 0);
  const totalGrams = selectedLines.reduce((s, l) => s + l.weightGrams * l.quantity, 0);
  const subtotal = selectedLines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const savedForLater = lines.length - selectedLines.length;
  const missingWeight = selectedLines.some((l) => l.weightGrams === 0);

  const proceed = () => {
    if (selectedLines.length === 0) return;
    // /checkout reads this on mount (sessionStorage survives the navigation, not a new tab).
    sessionStorage.setItem(
      "checkoutItems",
      JSON.stringify({
        items: selectedLines,
        totalWeightKg: totalGrams / 1000,
        subtotal,
      })
    );
    const ids = selectedLines.map((l) => encodeURIComponent(l.id)).join(",");
    router.push(`/checkout?items=${ids}`);
  };

  /* -------------------------------- render -------------------------------- */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex animate-pulse gap-4 rounded-xl border border-gray-100 bg-white p-4">
                <div className="h-24 w-24 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                  <div className="h-3 w-1/4 rounded bg-gray-100" />
                  <div className="h-8 w-32 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <p className="text-sm text-red-800">
            We couldn&apos;t load your cart. Check that the backend is running on
            http://localhost:8081 and try again.
          </p>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-700">
          <ShoppingBasket className="h-10 w-10" />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold text-green-950">Your Cart is Empty</h1>
        <p className="mt-2 text-gray-600">
          Add rice, dhal, spices or Ceylon cinnamon and they&apos;ll show up here.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-lg bg-green-700 px-6 py-3 text-sm font-bold text-white hover:bg-green-800"
        >
          Shop Daily Groceries
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold text-green-950 sm:text-3xl">Shopping Cart</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <section className="lg:col-span-2" aria-label="Cart items">
          <div className="mb-3 flex items-center justify-between rounded-lg border border-green-100 bg-white px-4 py-3">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-gray-800">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                disabled={selectable.length === 0}
                className="h-4 w-4 accent-green-700"
              />
              {selected.size} of {lines.length} selected
            </label>
            <button
              type="button"
              onClick={toggleAll}
              disabled={selectable.length === 0}
              className="text-sm font-semibold text-green-700 hover:text-green-900 disabled:text-gray-400"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>

          <ul className="space-y-3">
            {lines.map((line) => {
              const isSelected = selected.has(line.id);
              const outOfStock = line.stock <= 0;
              const atLimit = line.quantity >= line.stock;
              const busy = busyId === line.id;

              return (
                <li
                  key={line.id}
                  className={`flex gap-3 rounded-xl border bg-white p-3 sm:gap-4 sm:p-4 ${
                    isSelected ? "border-green-300" : "border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={outOfStock}
                    onChange={() => toggle(line.id)}
                    aria-label={`Select ${line.name} for checkout`}
                    className="mt-1 h-4 w-4 shrink-0 accent-green-700"
                  />

                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-green-50 sm:h-24 sm:w-24">
                    {line.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.imageUrl}
                        alt={line.name}
                        className={`h-full w-full object-cover ${isSelected ? "" : "opacity-60"}`}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-green-300">
                        <ShoppingBasket className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold text-gray-900 sm:text-base">
                          {line.name}
                        </h2>
                        <p className="text-xs text-gray-600">
                          Pack size: <span className="font-semibold">{line.weightLabel}</span>
                          {" · "}
                          {formatPrice(line.unitPrice)} each
                        </p>
                        {!isSelected && !outOfStock && (
                          <p className="mt-0.5 text-xs font-medium text-amber-700">
                            Saved for later
                          </p>
                        )}
                        {outOfStock && (
                          <p className="mt-0.5 text-xs font-semibold text-red-600">
                            Out of Stock
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 text-sm font-extrabold text-green-800 sm:text-base">
                        {formatPrice(line.unitPrice * line.quantity)}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-md border border-gray-300">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${line.name}`}
                            disabled={busy || line.quantity <= 1}
                            onClick={() => changeQuantity(line, line.quantity - 1)}
                            className="p-1.5 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span
                            aria-live="polite"
                            className="w-10 border-x border-gray-300 py-1 text-center text-sm text-gray-900"
                          >
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${line.name}`}
                            disabled={busy || outOfStock || atLimit}
                            onClick={() => changeQuantity(line, line.quantity + 1)}
                            className="p-1.5 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {Number.isFinite(line.stock) && !outOfStock && (
                          <span className={`text-xs ${atLimit ? "font-semibold text-amber-700" : "text-gray-500"}`}>
                            {atLimit ? "Max available" : `${line.stock} in stock`}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLine(line)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Summary */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-green-200 bg-white p-5">
            <h2 className="text-lg font-extrabold text-green-950">Order Summary</h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Selected items</dt>
                <dd className="font-semibold text-gray-900">
                  {selectedLines.length}
                  {selectedUnits !== selectedLines.length && (
                    <span className="font-normal text-gray-500"> ({selectedUnits} units)</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Total Weight</dt>
                <dd className="font-semibold text-gray-900">{formatKg(totalGrams)}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3 text-base">
                <dt className="font-bold text-gray-900">Subtotal</dt>
                <dd className="font-extrabold text-green-800">{formatPrice(subtotal)}</dd>
              </div>
            </dl>

            {missingWeight && (
              <p className="mt-3 text-xs text-amber-700">
                Some items have no weight on record, so the total weight may be understated.
              </p>
            )}
            <p className="mt-3 text-xs text-gray-500">
              Delivery fee is calculated at checkout from the total weight.
            </p>

            <button
              type="button"
              onClick={proceed}
              disabled={selectedLines.length === 0}
              className="mt-5 w-full rounded-lg bg-green-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            >
              Proceed to Checkout
            </button>

            {selectedLines.length === 0 ? (
              <p className="mt-3 text-center text-xs text-gray-500">
                Select at least one item to check out.
              </p>
            ) : (
              savedForLater > 0 && (
                <p className="mt-3 text-center text-xs text-gray-500">
                  {savedForLater} item{savedForLater === 1 ? "" : "s"} will stay in your cart
                  for later.
                </p>
              )
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
