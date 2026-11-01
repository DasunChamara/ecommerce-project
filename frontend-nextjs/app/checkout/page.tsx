"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Loader2,
  LocateFixed,
  MapPin,
  ShoppingBasket,
  Truck,
} from "lucide-react";
import { courierApi, ordersApi, getToken } from "@/services/api";

type CheckoutLine = {
  id: string;
  productId?: string | number;
  variantId?: string | number;
  name: string;
  imageUrl?: string;
  weightLabel: string;
  weightGrams: number;
  unitPrice: number;
  quantity: number;
};

type CheckoutData = {
  items: CheckoutLine[];
  totalWeightKg: number;
  subtotal: number;
};

type FeeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; isWithinColombo: boolean; fee: number };

type Receipt = {
  orderId: string;
  status: string;
  totalAmount: number;
  isUrgent: boolean;
  address: string;
};

type ModalStep = null | "urgent" | "normal" | "confirmUrgent";

const formatPrice = (v: number) =>
  `Rs. ${v.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatKg = (kg: number) =>
  `${kg.toLocaleString("en-LK", { maximumFractionDigits: 2 })} kg`;

function readCheckoutData(): CheckoutData | null {
  try {
    const raw = sessionStorage.getItem("checkoutItems");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    return {
      items: parsed.items,
      totalWeightKg: Number(parsed.totalWeightKg) || 0.5,
      subtotal: Number(parsed.subtotal) || 0,
    };
  } catch {
    return null;
  }
}

function readUserId(): number | string {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      const id = u?.userId ?? u?.id;
      if (id) return id;
    }
  } catch {}
  return 1;
}

const parseCoord = (value: string, min: number, max: number): number | null => {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<CheckoutData | null>(null);
  const [userId, setUserId] = useState<number | string>(1);

  const [address, setAddress] = useState("");
  const [latInput, setLatInput] = useState("6.9271");
  const [lngInput, setLngInput] = useState("79.8612");
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [fee, setFee] = useState<FeeState>({ status: "idle" });
  const feeRequestId = useRef(0);

  const [modal, setModal] = useState<ModalStep>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitLock = useRef(false);

  const [receipt, setReceipt] = useState<Receipt | null>(null);

  // 🚀 1. Smart Auth Protection: Login වී නැතිනම් කෙලින්ම Login එකට යැවීම
  useEffect(() => {
    if (!getToken()) {
      toast.error("ඇණවුම් කිරීමට කරුණාකර Login වන්න!");
      router.push("/login");
      return;
    }

    const checkoutData = readCheckoutData();
    if (!checkoutData) {
      toast.error("මිලදී ගැනීමට භාණ්ඩ තෝරා නොමැත!");
      router.push("/cart");
      return;
    }

    setData(checkoutData);
    setUserId(readUserId());
    setReady(true);
  }, [router]);

  const detectLocation = () => {
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError("Your browser doesn't support GPS location. Enter coordinates manually below.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatInput(pos.coords.latitude.toFixed(6));
        setLngInput(pos.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success("GPS Location detected!");
      },
      () => {
        setLocating(false);
        setGeoError("GPS ලබාගත නොහැකි විය. Colombo Coordinates ස්වයංක්‍රීයව භාවිත කෙරේ.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const lat = parseCoord(latInput, -90, 90);
  const lng = parseCoord(lngInput, -180, 180);
  const totalWeightKg = data?.totalWeightKg ?? 0.5;

  const calculateFee = useCallback(async () => {
    if (lat === null || lng === null) {
      setFee({ status: "idle" });
      return;
    }
    const requestId = ++feeRequestId.current;
    setFee({ status: "loading" });
    try {
      const res: any = await (courierApi as any).calculateCourierFee(lat, lng, totalWeightKg);
      if (requestId !== feeRequestId.current) return;
      const body = res?.data ?? res;
      const within = body?.isWithinColombo ?? true;
      setFee({
        status: "ok",
        isWithinColombo: within,
        fee: Number(body?.estimatedCourierFee ?? body?.courierFee ?? 250),
      });
    } catch {
      if (requestId !== feeRequestId.current) return;
      setFee({
        status: "ok",
        isWithinColombo: true,
        fee: 250 + Math.round(totalWeightKg * 40),
      });
    }
  }, [lat, lng, totalWeightKg]);

  useEffect(() => {
    if (!ready || !data) return;
    const t = setTimeout(calculateFee, 400);
    return () => clearTimeout(t);
  }, [ready, data, calculateFee]);

  const subtotal = data?.subtotal ?? 0;
  const outsideColombo = fee.status === "ok" && !fee.isWithinColombo;
  const courierFee = fee.status === "ok" && fee.isWithinColombo ? fee.fee : 250;
  const finalTotal = subtotal + courierFee;

  const canPlaceOrder =
    !!data &&
    address.trim().length > 0 &&
    lat !== null &&
    lng !== null &&
    fee.status === "ok" &&
    fee.isWithinColombo;

  const placeOrder = async (isUrgent: boolean) => {
    if (!data || !canPlaceOrder) return;
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      userId,
      items: data.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || null,
        quantity: i.quantity,
      })),
      deliveryAddress: address.trim(),
      deliveryLatitude: lat,
      deliveryLongitude: lng,
      totalWeightKg: data.totalWeightKg,
      itemsTotal: subtotal,
      courierFee,
      totalAmount: finalTotal,
      isUrgent,
    };

    try {
      const res: any = await (ordersApi as any).createOrder(payload);
      const order = res?.data ?? res;

      sessionStorage.removeItem("checkoutItems");
      window.dispatchEvent(new Event("cart:updated"));

      setReceipt({
        orderId: String(order?.orderId ?? order?.id ?? Math.floor(1000 + Math.random() * 9000)),
        status: String(order?.status ?? "PENDING"),
        totalAmount: finalTotal,
        isUrgent,
        address: address.trim(),
      });
      setModal(null);
      toast.success("ඇණවුම සාර්ථකව සම්පූර්ණ විය!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      const msg = err.body?.message || err.message || "Order placement failed. Check stock or details.";
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const closeModal = useCallback(() => {
    if (submitLock.current) return;
    setModal(null);
    setSubmitError(null);
  }, []);

  if (receipt) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-2xl border border-green-200 bg-white p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-14 w-14 text-green-600" />
            <h1 className="mt-3 text-2xl font-black text-green-950">ඇණවුම සාර්ථකයි! (Order Placed)</h1>
            <p className="mt-1 text-sm text-gray-600">Lanka Food City Online වෙතින් මිලදී ගැනීම ගැන ස්තූතියි.</p>
          </div>

          <dl className="mt-6 divide-y divide-gray-100 text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-gray-600">Order Reference</dt>
              <dd className="font-bold text-gray-900">#{receipt.orderId}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-gray-600">තත්ත්වය (Status)</dt>
              <dd>
                <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800">
                  {receipt.status}
                </span>
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-gray-600">ගෙවිය යුතු මුළු මුදල (Cash on Delivery)</dt>
              <dd className="font-extrabold text-green-800">{formatPrice(receipt.totalAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="shrink-0 text-gray-600">බෙදාහරින ලිපිනය</dt>
              <dd className="text-right text-gray-900">{receipt.address}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-gray-600">Delivery Type</dt>
              <dd className={`font-semibold ${receipt.isUrgent ? "text-amber-700" : "text-green-700"}`}>
                {receipt.isUrgent ? "⚡ Urgent Delivery" : "Normal Delivery"}
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-900">
            {receipt.isUrgent ? (
              <p>⚡ හදිසි ඇණවුමක් (Urgent) බැවින් කඩිනමින් පිටත් කිරීම සඳහා Admin වෙත යොමු කර ඇත.</p>
            ) : (
              <>
                <p className="font-semibold">Cancellation Policy (අවලංගු කිරීමේ නීතිය):</p>
                <p className="mt-1">
                  සාමාන්‍ය ඇණවුමක් ලෙස පැය 48ක් ඇතුළත ඔබට මෙය අවලංගු කළ හැක (You can cancel within 48 hours).
                </p>
              </>
            )}
          </div>

          <Link
            href="/"
            className="mt-6 block rounded-xl bg-green-700 px-4 py-3 text-center text-sm font-bold text-white hover:bg-green-800 transition shadow-sm"
          >
            තවත් භාණ්ඩ මිලදී ගන්න (Continue Shopping)
          </Link>
        </div>
      </div>
    );
  }

  if (!ready || !data) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold text-green-950 sm:text-3xl">Checkout (මිලදී ගැනීම)</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Delivery Address + GPS */}
          <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-green-950">
              <MapPin className="h-5 w-5 text-green-700" />
              Delivery Address & Location
            </h2>

            <label htmlFor="address" className="mt-4 block text-xs font-bold text-gray-700 uppercase tracking-wider">
              බෙදාහැරීමේ ලිපිනය (Full Address) *
            </label>
            <textarea
              id="address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="No 45, Galle Road, Colombo 03"
              className="mt-1 w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />

            <button
              type="button"
              onClick={detectLocation}
              disabled={locating}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-green-700 px-4 py-2 text-xs font-bold text-green-800 hover:bg-green-50 disabled:opacity-60 transition"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              {locating ? "GPS ලබාගනිමින්..." : "Detect My Current GPS Location"}
            </button>

            {outsideColombo && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border-2 border-red-600 bg-red-600 p-4 text-white">
                <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" />
                <p className="font-bold text-sm">
                  බෙදාහැරීම කොළඹ දිස්ත්‍රික්කයට පමණක් සීමා වේ! ඔබේ ලොකේෂන් එක අපගේ සේවා කලාපයෙන් පිටත පිහිටා ඇත.
                </p>
              </div>
            )}
          </section>

          {/* Payment Method */}
          <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-green-950">
              <Banknote className="h-5 w-5 text-green-700" />
              Payment Method (ගෙවීම් ක්‍රමය)
            </h2>
            <div className="mt-4 flex items-center justify-between rounded-xl border-2 border-green-700 bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <input type="radio" checked readOnly className="h-4 w-4 accent-green-700" />
                <div>
                  <span className="block text-sm font-bold text-green-950">Cash on Delivery (COD)</span>
                  <span className="block text-xs text-gray-600">භාණ්ඩ ලැබුණු පසු PickMe කුරියර් වෙත මුදල් ගෙවන්න.</span>
                </div>
              </div>
              <span className="text-xs font-bold bg-green-200 text-green-900 px-2.5 py-1 rounded-full">
                COD Only
              </span>
            </div>
          </section>

          {/* Items */}
          <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-green-950 mb-3">
              මිලදී ගන්නා භාණ්ඩ ({data.items.length})
            </h2>
            <ul className="divide-y divide-gray-100">
              {data.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{i.name}</p>
                    <p className="text-xs text-gray-500">{i.weightLabel} × {i.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatPrice(i.unitPrice * i.quantity)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Summary Sidebar */}
        <aside>
          <div className="sticky top-24 rounded-2xl border border-green-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-green-950">මිලදී ගැනීමේ සාරාංශය</h2>
            <dl className="space-y-3 text-sm border-b border-gray-100 pb-4">
              <div className="flex justify-between text-gray-600">
                <dt>භාණ්ඩවල එකතුව</dt>
                <dd className="font-bold text-gray-900">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>මුළු බර (PickMe Weight)</dt>
                <dd className="font-bold text-green-900">{formatKg(data.totalWeightKg)}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>PickMe Delivery Fee</dt>
                <dd className="font-bold text-gray-900">{formatPrice(courierFee)}</dd>
              </div>
            </dl>

            <div className="flex justify-between text-lg font-black text-green-950">
              <dt>අවසන් මුදල (Final Total)</dt>
              <dd className="text-green-800">{formatPrice(finalTotal)}</dd>
            </div>

            <button
              type="button"
              onClick={() => setModal("urgent")}
              disabled={!canPlaceOrder || submitting}
              className="mt-4 w-full rounded-xl bg-green-700 py-3.5 text-sm font-black text-white hover:bg-green-800 disabled:bg-gray-300 transition shadow-md"
            >
              Pay (Cash on Delivery)
            </button>
            {!address && (
              <p className="text-xs text-center text-amber-700 font-medium">කරුණාකර Delivery Address එක ඇතුළත් කරන්න.</p>
            )}
          </div>
        </aside>
      </div>

      {/* 🚀 URGENT DELIVERY MODAL SYSTEM */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            
            {/* Step 1: Urgent or Normal */}
            {modal === "urgent" && (
              <>
                <h2 className="text-lg font-black text-green-950">මෙම ඇණවුම ඔබට හදිසි අවශ්‍යතාවයක්ද?</h2>
                <p className="text-xs text-gray-600">(Is this an Urgent Delivery?)</p>
                <div className="grid gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setModal("normal")}
                    className="rounded-xl border-2 border-green-700 p-3.5 text-left text-sm font-bold text-green-900 hover:bg-green-50 transition"
                  >
                    <div>නැත (Normal Delivery)</div>
                    <span className="text-xs font-normal text-gray-500">පැය 48ක් ඇතුළත Cancel කරගත හැක.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal("confirmUrgent")}
                    className="rounded-xl bg-amber-600 p-3.5 text-left text-sm font-bold text-white hover:bg-amber-700 transition"
                  >
                    <div>⚡ ඔව් (Urgent Delivery)</div>
                    <span className="text-xs font-normal text-amber-100">කඩිනමින් යැවීමට Admin වෙත යොමු වේ.</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full text-center text-xs font-semibold text-gray-400 hover:text-gray-600 pt-2"
                >
                  Cancel
                </button>
              </>
            )}

            {/* Step 2A: Normal Confirmation */}
            {modal === "normal" && (
              <>
                <h2 className="text-lg font-black text-green-950">Normal Delivery</h2>
                <p className="rounded-xl bg-green-50 p-4 text-xs font-semibold text-green-900">
                  ℹ️ සාමාන්‍ය ඇණවුමක් ලෙස පැය 48ක් ඇතුළත ඔබට මෙය අවලංගු කළ හැක (You can cancel within 48 hours).
                </p>
                {submitError && <p className="text-xs font-bold text-red-600">{submitError}</p>}
                <div className="grid gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => placeOrder(false)}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-sm font-bold text-white hover:bg-green-800 transition"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {submitting ? "ඇණවුම යවමින්..." : `Place Order · ${formatPrice(finalTotal)}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal("urgent")}
                    disabled={submitting}
                    className="text-xs font-bold text-gray-500 py-1"
                  >
                    Back
                  </button>
                </div>
              </>
            )}

            {/* Step 2B: Double Confirmation for Urgent */}
            {modal === "confirmUrgent" && (
              <>
                <h2 className="text-lg font-black text-amber-900">මෙම ගනුදෙනුව තහවුරු කරනවාද?</h2>
                <p className="text-xs text-gray-500">(Confirm Transaction?)</p>
                <div className="rounded-xl bg-amber-50 p-4 text-xs font-semibold text-amber-950">
                  ⚡ හදිසි ඇණවුමක් (Urgent) ලෙස තහවුරු කළ පසු එය කඩිනමින් ක්‍රියාත්මක වන අතර අවලංගු කිරීමට (Cancel) නොහැකි වනු ඇත.
                </div>
                {submitError && <p className="text-xs font-bold text-red-600">{submitError}</p>}
                <div className="grid gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => placeOrder(true)}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-700 transition"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {submitting ? "හදිසි ඇණවුම යවමින්..." : "තහවුරු කරන්න (Confirm)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal("urgent")}
                    disabled={submitting}
                    className="text-xs font-bold text-gray-500 py-1"
                  >
                    Go back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}