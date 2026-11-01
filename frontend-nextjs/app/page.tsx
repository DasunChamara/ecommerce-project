"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  RefreshCw, 
  Truck, 
  Leaf, 
  ShieldCheck, 
  Package, 
  Sparkles, 
  ArrowRight,
  ShoppingBag,
  Users,
  ShoppingCart
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { productsApi } from "@/services/api";
import type { Product } from "@/types";

function toList(res: unknown): Product[] {
  const body = (res as { data?: unknown })?.data ?? res;
  if (Array.isArray(body)) return body as Product[];
  const content = (body as { content?: unknown })?.content;
  return Array.isArray(content) ? (content as Product[]) : [];
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="flex gap-2">
          <div className="h-6 w-12 rounded bg-gray-200" />
          <div className="h-6 w-12 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <AlertTriangle className="h-8 w-8 text-red-600" />
      <p className="max-w-md text-sm text-red-800">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

const OFFLINE_MSG =
  "We can't reach the store right now. Check that the backend is running on http://localhost:8081 and try again.";

export default function HomePage() {
  const [special, setSpecial] = useState<Product[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialError, setSpecialError] = useState(false);
  const [catalogError, setCatalogError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setSpecialError(false);
    setCatalogError(false);

    const [spec, all] = await Promise.allSettled([
      productsApi.getSpecials(),
      productsApi.getAll(),
    ]);

    if (spec.status === "fulfilled") setSpecial(toList(spec.value));
    else setSpecialError(true);

    if (all.status === "fulfilled") setCatalog(toList(all.value));
    else setCatalogError(true);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      {/* 1. Hero Section */}
      <section className="bg-green-800 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-5 md:py-20 lg:px-8">
          <div className="md:col-span-3">
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              Your Everyday Online Food City
            </h1>
            <p className="mt-4 max-w-xl text-lg text-green-50">
              Fresh groceries, daily provisions and household essentials delivered right to your doorstep in Colombo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/packages"
                className="rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-black text-green-950 hover:bg-amber-300 shadow-md flex items-center gap-2 transition"
              >
                <Package className="h-5 w-5" />
                Customizable Packages (සුවිශේෂී පැකේජ)
              </Link>
              <a
                href="#groceries"
                className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-green-900 hover:bg-green-50 transition"
              >
                Shop Groceries
              </a>
              <a
                href="#special"
                className="rounded-xl border border-amber-300 px-6 py-3.5 text-sm font-bold text-amber-200 hover:bg-amber-300 hover:text-green-950 transition"
              >
                Ceylon Cinnamon
              </a>
            </div>
          </div>

          <ul className="space-y-4 md:col-span-2 md:self-center">
            {[
              { icon: Truck, text: "Fast PickMe Courier delivery across Colombo" },
              { icon: Leaf, text: "Rice, Dhal, Sugar, Soya Meat and daily provisions" },
              { icon: ShieldCheck, text: "Customizable Packages with a Single Delivery Fee" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-green-50">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <span className="text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 2. 🌟 HOMEPAGE EXCLUSIVE PACKAGES PROMOTIONAL SECTION 🌟 */}
      <section className="bg-gradient-to-b from-green-50/70 to-white py-16 border-b border-green-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-700 text-amber-200 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              අපගේ සුවිශේෂී පහසුකම (Exclusive Feature)
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-green-950 tracking-tight">
              Food City Customizable Packages
            </h2>
            <p className="mt-3 text-base text-gray-700">
              භාණ්ඩ එකින් එක තෝරමින් කාලය නාස්ති නොකර, ඔබේ පවුලට අවශ්‍ය සියලුම එදිනෙදා බඩු එකවර පැකේජයක් ලෙස ලබාගන්න. 
              පැකේජයේ බඩු ප්‍රමාණයන් වෙනස් කිරීමට (Customize කිරීමට) හෝ ඔබේම පැකේජයක් සෑදීමට සම්පූර්ණ නිදහස ඇත!
            </p>
          </div>

          {/* 🚀 ආකර්ෂණීය පැකේජ කාඩ්පත් 2 (Cards 2) */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Card 1: Family Grocery Pack */}
            <div className="bg-white rounded-3xl border-2 border-green-600 p-8 shadow-xl hover:shadow-2xl transition flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl">
                Most Popular
              </div>

              <div>
                <div className="p-3.5 bg-green-100 text-green-800 rounded-2xl w-fit mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-green-950">
                  Monthly Family Grocery Pack
                </h3>
                <p className="text-sm font-semibold text-green-700 mt-1">පවුලේ මාසික එදිනෙදා බඩු පැකේජය</p>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                  කීරි සම්බා හාල් (5kg), පරිප්පු (1kg), සුදු සීනි (1kg), සොයාමීට් (500g) ඇතුළු පවුලකට මාසයකට අවශ්‍ය අත්‍යවශ්‍ය බඩු කලින්ම සකසා ඇත.
                </p>

                <div className="mt-6 p-4 rounded-2xl bg-green-50 border border-green-100 space-y-1.5 text-xs text-green-900 font-medium">
                  <p>✔ කැමති පරිදි බඩු ප්‍රමාණයන් (Quantity) අඩු වැඩි කළ හැක.</p>
                  <p>✔ අනවශ්‍ය බඩු ඉවත් කිරීමට හෝ අලුතින් බඩු එක් කිරීමට හැක.</p>
                  <p>✔ සියලුම බඩු සඳහා එකම PickMe Courier ගාස්තුවක් පමණි.</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block">ආරම්භක මිල:</span>
                  <span className="text-2xl font-black text-green-900">Rs. 3,850</span>
                </div>
                <Link
                  href="/packages?type=family"
                  className="py-3 px-6 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm shadow-md transition flex items-center gap-2 group-hover:translate-x-1"
                >
                  <span>පැකේජය Customize කරන්න</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Card 2: Custom Package / Empty Trolley */}
            <div className="bg-white rounded-3xl border-2 border-amber-500 p-8 shadow-xl hover:shadow-2xl transition flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl">
                100% Flexible
              </div>

              <div>
                <div className="p-3.5 bg-amber-100 text-amber-800 rounded-2xl w-fit mb-4">
                  <ShoppingCart className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">
                  Build Your Own Custom Package
                </h3>
                <p className="text-sm font-semibold text-amber-700 mt-1">හිස් ට්‍රොලිය (තමන්ගේම පැකේජයක් හදන්න)</p>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                  හිස් පැකේජයකින් ආරම්භ කර, Food City Catalog එකෙන් ඔබට අවශ්‍ය හාල්, පරිප්පු, කුළුබඩු හෝ කැමති ඕනෑම බඩු ප්‍රමාණයක් එකතු කර ඔබේම පැකේජයක් නිර්මාණය කරගන්න.
                </p>

                <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-1.5 text-xs text-amber-950 font-medium">
                  <p>✔ කැමති ඕනෑම භාණ්ඩ ප්‍රමාණයක් එකතු කළ හැක.</p>
                  <p>✔ සජීවීව මුළු බර (Weight) සහ මිල ගණනය වේ.</p>
                  <p>✔ එක ක්ලික් එකකින් කෙලින්ම Checkout වෙත යැවිය හැක.</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block">පැකේජ වර්ගය:</span>
                  <span className="text-xl font-black text-amber-900">Custom Trolley</span>
                </div>
                <Link
                  href="/packages?type=custom"
                  className="py-3 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 group-hover:translate-x-1"
                >
                  <span>පැකේජය සාදන්න</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Special Product: Cinnamon (කුරුඳු වෙනම අංශයක් ලෙස) */}
      <section id="special" className="scroll-mt-20 bg-amber-950 py-14 text-amber-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-amber-800 text-amber-200 text-xs font-bold uppercase tracking-wider">
              Exclusive Special Category
            </span>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl text-amber-100">
              Special Product: Premium Ceylon Cinnamon
            </h2>
            <p className="mt-1 text-xl font-bold text-amber-300">සුවිශේෂී කුරුඳු නිෂ්පාදන</p>
            <p className="mt-3 text-sm text-amber-100/90 leading-relaxed">
              විදේශීය සංචාරකයින් සහ විශේෂ පාරිභෝගිකයින් සඳහාම වෙන්වූ 100% ක් පිරිසිදු කුරුඳු කූරු සහ කුරුඳු කුඩු. 
              අවශ්‍ය බර (Weight) සහ ප්‍රමාණය තෝරා කෙලින්ම මිලදී ගන්න!
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : specialError ? (
            <ErrorBox message={OFFLINE_MSG} onRetry={load} />
          ) : special.length === 0 ? (
            <p className="rounded-xl border border-amber-800 px-6 py-10 text-center text-amber-100">
              Cinnamon products are being restocked. Check back soon.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {special.map((p) => (
                <ProductCard key={(p as any).id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

     
  

          
      {/* 4. Main Catalog Section (Daily Groceries) */}
      <section id="groceries" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-green-950 sm:text-3xl">
            Daily Groceries &amp; Supermarket Essentials
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            හාල්, පරිප්පු, සීනි, සොයාමීට් ඇතුළු එදිනෙදා අවශ්‍ය සියලුම ද්‍රව්‍ය කැමති බර අනුව තෝරාගන්න.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : catalogError ? (
          <ErrorBox message={OFFLINE_MSG} onRetry={load} />
        ) : catalog.filter((p) => !p.isSpecial && !(p as any).special).length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-600">
            No grocery products are listed yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* 🚀 කුරුඳු (Special) ඉවත් කර සාමාන්‍ය Food City බඩු පමණක් පෙන්වීම: */}
            {catalog
              .filter((p) => !p.isSpecial && !(p as any).special)
              .map((p) => (
                <ProductCard key={(p as any).id} product={p} />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}