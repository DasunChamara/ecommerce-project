"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  AlertTriangle, 
  Clock, 
  Package, 
  Ban, 
  CheckCircle2, 
  Truck, 
  RefreshCw,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import { ordersApi, getToken } from "@/services/api";

type OrderItem = {
  orderId: number;
  totalAmount: number;
  itemsTotal: number;
  courierFee: number;
  totalWeightKg: number;
  isUrgent: boolean;
  status: string;
  createdAt: string;
  deliveryAddress: string;
};

const formatPrice = (v: number) =>
  `Rs. ${v.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // 1. User Auth check
  useEffect(() => {
    if (!getToken()) {
      toast.error("Profile එක බැලීමට කරුණාකර පළමුව Login වන්න!");
      router.push("/login");
      return;
    }

    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch {}
  }, [router]);

  // 2. Fetch User Orders
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const userId = user.userId || user.id || 1;
    setLoadingOrders(true);
    try {
      const res: any = await (ordersApi as any).getUserOrders?.(userId);
      const list = Array.isArray(res) ? res : res?.data || [];
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  // 3. 48-Hour Order Cancellation Logic (PDF Requirement)
  const isWithin48Hours = (createdAt: string) => {
    if (!createdAt) return false;
    const orderTime = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffHours = (now - orderTime) / (1000 * 60 * 60);
    return diffHours <= 48;
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("මෙම ඇණවුම අවලංගු කිරීමට (Cancel) ඔබට සහතිකද?")) return;

    setCancellingId(orderId);
    try {
      const userId = user?.userId || user?.id || 1;
      await (ordersApi as any).cancelOrder(orderId, userId);
      toast.success("ඇණවුම සාර්ථකව අවලංගු කරන ලදී!");
      fetchOrders(); // Refresh list
    } catch (err: any) {
      const msg = err.body?.message || err.message || "පැය 48 ඉක්මවා ඇති බැවින් Cancel කළ නොහැක.";
      toast.error(msg);
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) return null;

  const penaltyCount = user.penaltyCount || 0;
  const isBlacklisted = user.isBlacklisted || user.blacklisted || false;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-green-950">Customer Profile</h1>
        <p className="text-sm text-gray-600 mt-1">ඔබගේ පුද්ගලික තොරතුරු සහ ඇණවුම් ඉතිහාසය</p>
      </div>

      {/* ⚠️ 1. BLACKLIST & PENALTY WARNING BANNER (PDF Requirement) */}
      {isBlacklisted ? (
        <div className="p-6 rounded-3xl bg-red-600 text-white shadow-lg space-y-2">
          <div className="flex items-center gap-2 font-black text-lg">
            <ShieldAlert className="h-6 w-6" />
            <span>ගිණුම අසාදු ලේඛනගත කර ඇත (Account Blacklisted)</span>
          </div>
          <p className="text-sm text-red-100">
            අවස්ථා 6කදී COD ඇණවුම් භාර නොගෙන ප්‍රතික්ෂේප කිරීම හේතුවෙන් ඔබේ ගිණුම ස්වයංක්‍රීයව අත්හිටුවා ඇත. නව ඇණවුම් දැමීම අවහිර කර ඇත. විසඳා ගැනීමට කරුණාකර Admin අමතන්න.
          </p>
        </div>
      ) : penaltyCount > 0 ? (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold text-base text-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
              දඩ ලකුණු පිළිබඳ අවවාදයයි (Penalty Strikes Warning)
            </span>
            <span className="px-3 py-1 bg-amber-200 text-amber-900 rounded-full font-black text-xs">
              {penaltyCount} / 5 Strikes
            </span>
          </div>
          <p className="text-xs text-amber-800">
            COD ඇණවුම් භාරනොගැනීම නිසා ඔබට දඩ ලකුණු {penaltyCount}ක් ලැබී ඇත. දඩ ලකුණු 5 ඉක්මවා 6 වන වරත් ප්‍රතික්ෂේප වුවහොත් ඔබගේ ගිණුම ස්වයංක්‍රීයව Blacklist වේ!
          </p>
          <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-amber-600 h-full" 
              style={{ width: `${(penaltyCount / 5) * 100}%` }} 
            />
          </div>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: User Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <span className="p-3 bg-green-100 text-green-800 rounded-2xl">
                <User className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-extrabold text-base text-gray-900">{user.email?.split("@")[0] || "Customer"}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 uppercase">
                  {user.role || "CUSTOMER"}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5 text-gray-600">
                <Mail className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                <span className="truncate">{user.email || "—"}</span>
              </div>
              <div className="flex items-start gap-2.5 text-gray-600">
                <Phone className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                <span>{user.phoneNumber || "0771234567"}</span>
              </div>
              <div className="flex items-start gap-2.5 text-gray-600">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                <span>{user.deliveryAddress || "Colombo District"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order History & 48h Cancel Logic */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-green-950 flex items-center gap-2">
              <Package className="h-5 w-5 text-green-700" />
              ඇණවුම් ඉතිහාසය (Order History)
            </h2>
            <button
              type="button"
              onClick={fetchOrders}
              className="text-xs font-bold text-green-700 hover:text-green-900 flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>

          {loadingOrders ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-dashed border-gray-300 text-center text-gray-500 space-y-3">
              <Package className="h-10 w-10 mx-auto opacity-40 text-green-700" />
              <p className="text-sm font-semibold">තවමත් ඇණවුම් කිසිවක් සිදු කර නොමැත.</p>
              <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold text-green-700 underline">
                භාණ්ඩ මිලදී ගන්න (Start Shopping) <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const canCancel = isWithin48Hours(order.createdAt) && 
                  (order.status === "PENDING" || order.status === "PROCESSING");

                return (
                  <div key={order.orderId} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div>
                        <span className="font-bold text-sm text-gray-900">Order #{order.orderId}</span>
                        <span className="text-xs text-gray-500 block">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString("en-LK") : "Recent"}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        order.status === "DELIVERED" ? "bg-green-100 text-green-800" :
                        order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                        order.status === "SHIPPED" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">මුදල (COD):</span>
                      <span className="font-extrabold text-green-800">{formatPrice(order.totalAmount || 0)}</span>
                    </div>

                    {/* 🚀 48-Hour Cancel Button (PDF Requirement) */}
                    <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                      {canCancel ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] text-green-700 font-medium flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> පැය 48ක් ඇතුළත බැවින් Cancel කළ හැක.
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order.orderId)}
                            disabled={cancellingId === order.orderId}
                            className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-300 rounded-lg text-xs font-bold hover:bg-red-100 transition flex items-center gap-1"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            {cancellingId === order.orderId ? "Cancelling..." : "Cancel Order"}
                          </button>
                        </div>
                      ) : order.status === "CANCELLED" ? (
                        <span className="text-xs text-red-600 font-bold">ඇණවුම අවලංගු කර ඇත (Cancelled).</span>
                      ) : (
                        <span className="text-xs text-gray-400">පැය 48 ඉක්මවා ඇති බැවින් Cancel කළ නොහැක.</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}