"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { 
  Package, 
  Plus, 
  Minus, 
  Trash2, 
  Sparkles, 
  Zap, 
  ShoppingCart, 
  Users, 
  ArrowLeft,
  PlusCircle,
  Truck
} from "lucide-react";
import { getToken } from "@/services/api";

type PackageItem = {
  id: string;
  productId: number;
  name: string;
  weightLabel: string;
  weightKg: number;
  unitPrice: number;
  quantity: number;
};

// 1. කලින් සකස් කළ පවුලේ මාසික එදිනෙදා බඩු පැකේජය (Default Family Pack - No Cinnamon)
const INITIAL_FAMILY_ITEMS: PackageItem[] = [
  {
    id: "pkg-rice",
    productId: 3,
    name: "Keeri Samba Rice (5kg Pack)",
    weightLabel: "5kg Bag",
    weightKg: 5.0,
    unitPrice: 1650,
    quantity: 1,
  },
  {
    id: "pkg-dhal",
    productId: 4,
    name: "Red Dhal (Mysore Dhal)",
    weightLabel: "1kg Pack",
    weightKg: 1.0,
    unitPrice: 680,
    quantity: 1,
  },
  {
    id: "pkg-sugar",
    productId: 5,
    name: "White Sugar (Pure Cane)",
    weightLabel: "1kg Pack",
    weightKg: 1.0,
    unitPrice: 280,
    quantity: 2,
  },
  {
    id: "pkg-soya",
    productId: 6,
    name: "Soya Meat (Chicken Flavor)",
    weightLabel: "500g Pack",
    weightKg: 0.5,
    unitPrice: 420,
    quantity: 1,
  },
];

// පැකේජයට අලුතින් එක් කරගත හැකි අමතර Food City බඩු ලැයිස්තුව
const AVAILABLE_ADDONS = [
  { productId: 7, name: "Wheat Flour (White)", weightLabel: "1kg Pack", weightKg: 1.0, unitPrice: 240 },
  { productId: 8, name: "Tea Leaves (BOPF)", weightLabel: "400g Pack", weightKg: 0.4, unitPrice: 580 },
  { productId: 9, name: "Chilli Powder (Pure)", weightLabel: "250g Pack", weightKg: 0.25, unitPrice: 380 },
  { productId: 10, name: "Table Salt", weightLabel: "1kg Pack", weightKg: 1.0, unitPrice: 120 },
];

function PackagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packType = searchParams.get("type"); // 'family' or 'custom'

  const [activeTab, setActiveTab] = useState<"family" | "custom">(
    packType === "custom" ? "custom" : "family"
  );

  const [items, setItems] = useState<PackageItem[]>(
    packType === "custom" ? [] : INITIAL_FAMILY_ITEMS
  );

  useEffect(() => {
    if (packType === "custom") {
      setActiveTab("custom");
      setItems([]);
    } else {
      setActiveTab("family");
      setItems(INITIAL_FAMILY_ITEMS);
    }
  }, [packType]);

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const totalWeightKg = items.reduce((sum, i) => sum + i.weightKg * i.quantity, 0);

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("භාණ්ඩය පැකේජයෙන් ඉවත් කරන ලදී");
  };

  // පැකේජයට අලුතින් බඩුවක් එක් කිරීම
  const addItemToPackage = (addon: typeof AVAILABLE_ADDONS[0]) => {
    const existing = items.find((i) => i.productId === addon.productId);
    if (existing) {
      updateQty(existing.id, 1);
      toast.success(`${addon.name} ප්‍රමාණය වැඩි කරන ලදී`);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: `pkg-addon-${addon.productId}-${Date.now()}`,
          productId: addon.productId,
          name: addon.name,
          weightLabel: addon.weightLabel,
          weightKg: addon.weightKg,
          unitPrice: addon.unitPrice,
          quantity: 1,
        },
      ]);
      toast.success(`${addon.name} පැකේජයට එක් විය!`);
    }
  };

  // Direct Checkout (කෙලින්ම Purchase කිරීම)
  const proceedToCheckout = () => {
    if (!getToken()) {
      toast.error("ඇණවුම් කිරීමට කරුණාකර පළමුව Login වන්න!");
      router.push("/login");
      return;
    }
    if (items.length === 0) {
      toast.error("කරුණාකර පැකේජයට අවම වශයෙන් එක් භාණ්ඩයක්වත් එක් කරන්න!");
      return;
    }

    const checkoutData = {
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.name,
        weightLabel: i.weightLabel,
        weightGrams: i.weightKg * 1000,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      totalWeightKg: totalWeightKg,
      subtotal: subtotal,
    };

    sessionStorage.setItem("checkoutItems", JSON.stringify(checkoutData));
    router.push("/checkout");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-green-700 hover:text-green-900 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Home වෙත ආපසු
      </Link>

      {/* Header */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-700 text-amber-200 text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          Exclusive Package Builder
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-green-950">
          Food City Customizable Packages
        </h1>
        <p className="text-sm text-gray-600 mt-2 max-w-2xl">
          ඔබේ පවුලේ මාසික අවශ්‍යතාවය අනුව සම්පූර්ණ පැකේජයක් එකවර සකසා ගන්න. අවශ්‍ය බඩු ප්‍රමාණ අඩු වැඩි කිරීමට හෝ අලුත් බඩු එක් කිරීමට ඔබට සම්පූර්ණ නිදහස ඇත.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        <button
          type="button"
          onClick={() => { setActiveTab("family"); setItems(INITIAL_FAMILY_ITEMS); }}
          className={`py-3 px-6 rounded-2xl font-bold text-sm transition flex items-center gap-2 shadow-sm ${
            activeTab === "family"
              ? "bg-green-700 text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Family Grocery Pack (කලින් සකසන ලද්දක්)</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab("custom"); setItems([]); }}
          className={`py-3 px-6 rounded-2xl font-bold text-sm transition flex items-center gap-2 shadow-sm ${
            activeTab === "custom"
              ? "bg-amber-600 text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Custom Trolley (හිස් පැකේජය)</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Package Items Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-green-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-lg font-black text-green-950">
                {activeTab === "family" ? "පවුලේ මාසික පැකේජයේ බඩු" : "ඔබේ Custom පැකේජයේ බඩු"} ({items.length})
              </h2>
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                Customizable
              </span>
            </div>

            {items.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <Package className="h-12 w-12 mx-auto opacity-30" />
                <p className="text-sm font-semibold">පැකේජය දැනට හිස්ව පවතී.</p>
                <p className="text-xs text-gray-500">පහළ ඇති බඩු ලැයිස්තුවෙන් ඔබට අවශ්‍ය බඩු එකතු කරගන්න.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item) => (
                  <li key={item.id} className="py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.weightLabel} · Rs. {item.unitPrice.toLocaleString()} each
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Qty Controls */}
                      <div className="flex items-center rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="p-1.5 text-gray-700 hover:bg-gray-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="p-1.5 text-gray-700 hover:bg-gray-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-sm font-extrabold text-green-800 min-w-20 text-right">
                        Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add more items to package */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-green-700" />
              පැකේජයට තව බඩු එකතු කරන්න (Add more groceries to package)
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {AVAILABLE_ADDONS.map((addon) => (
                <div key={addon.productId} className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{addon.name}</p>
                    <p className="text-[11px] text-gray-500">{addon.weightLabel} — Rs. {addon.unitPrice}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItemToPackage(addon)}
                    className="py-1.5 px-3 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Package Summary & Checkout */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-3xl border-2 border-green-600 p-6 shadow-xl sticky top-24 space-y-5">
            <h3 className="text-lg font-black text-green-950">Package Summary</h3>

            <dl className="space-y-3 text-sm border-b border-gray-100 pb-4">
              <div className="flex justify-between text-gray-600">
                <dt>අඩංගු භාණ්ඩ ගණන:</dt>
                <dd className="font-bold text-gray-900">{items.length}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>මුළු බර (Total Weight):</dt>
                <dd className="font-bold text-green-900">{totalWeightKg.toFixed(2)} kg</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>කුරියර් ගාස්තුව:</dt>
                <dd className="text-xs font-bold text-green-800 bg-green-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Truck className="h-3 w-3" /> Single Delivery Fee
                </dd>
              </div>
            </dl>

            <div className="flex justify-between text-xl font-black text-green-950">
              <dt>පැකේජයේ මුළු මිල:</dt>
              <dd className="text-green-800">Rs. {subtotal.toLocaleString()}</dd>
            </div>

            <button
              type="button"
              onClick={proceedToCheckout}
              disabled={items.length === 0}
              className="w-full py-4 bg-green-700 hover:bg-green-800 text-white rounded-xl font-black text-sm shadow-md transition flex items-center justify-center gap-2 disabled:bg-gray-300"
            >
              <Zap className="h-4 w-4 fill-current" />
              <span>Buy Package Now (මිලදී ගන්න)</span>
            </button>

            <p className="text-[11px] text-gray-500 text-center leading-relaxed">
              ⚡ පැකේජයේ භාණ්ඩ කීයක් තිබුණද PickMe කුරියර් ගාස්තුව අයවන්නේ මුළු බරට අදාළව එක් වරක් පමණි.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ⭐ Next.js Turbopack Prerendering සඳහා Suspense Boundary එකකින් Wrap කිරීම:
export default function PackagesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-gray-500">Loading package builder...</div>}>
      <PackagesContent />
    </Suspense>
  );
}