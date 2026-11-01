"use client";

import { useRouter } from "next/navigation";
import { Leaf, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ApiError, cartApi, getToken, productsApi } from "@/services/api";
import type { Product, ProductVariant } from "@/types";

const CART_UPDATED_EVENT = "cart-updated";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  const [variants, setVariants] = useState<ProductVariant[]>(
    product.variants ?? [],
  );
  const [variantId, setVariantId] = useState<number | null>(
    product.variants?.[0]?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [imageFailed, setImageFailed] = useState(!product.imageUrl);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (product.variants && product.variants.length > 0) return;

    productsApi
      .getVariants(product.id)
      .then((items) => {
        if (cancelled) return;
        setVariants(items);
        setVariantId(items[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setVariants([]);
      });

    return () => {
      cancelled = true;
    };
  }, [product.id, product.variants]);

  const selected = useMemo(
    () => variants.find((variant) => variant.id === variantId) ?? null,
    [variants, variantId],
  );

  const outOfStock = product.stockQuantity <= 0;
  const maxQty = Math.max(product.stockQuantity, 0);
  const price = selected?.price ?? product.basePrice;

  function changeQuantity(next: number) {
    if (maxQty === 0) {
      setQuantity(0);
      return;
    }
    const val = Math.min(maxQty, Math.max(1, next));
    setQuantity(val);
  }

  // 1. Add to Cart
  async function addToCart() {
    if (outOfStock) return;
    if (!getToken()) {
      toast.error("මිලදී ගැනීමට කරුණාකර පළමුව Login වන්න!");
      router.push("/login");
      return;
    }
    if (!selected) {
      toast.error("කරුණාකර බර ප්‍රමාණය (Weight Variant) තෝරන්න.");
      return;
    }

    setAdding(true);
    try {
      await cartApi.addItem({
        productId: product.id,
        variantId: selected.id,
        quantity,
      });
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      toast.success(`${product.name} (${selected.weight}) × ${quantity} Cart එකට එක් විය!`);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Cart එකට එක් කිරීමට නොහැකි විය.";
      toast.error(message);
    } finally {
      setAdding(false);
    }
  }

  // 2. Direct Buy Now
  function handleBuyNow() {
    if (outOfStock) return;
    if (!getToken()) {
      toast.error("මිලදී ගැනීමට කරුණාකර පළමුව Login වන්න!");
      router.push("/login");
      return;
    }
    if (!selected) {
      toast.error("කරුණාකර බර ප්‍රමාණය (Weight Variant) තෝරන්න.");
      return;
    }

    const weightInKg = selected.weightInKg || 0.1;
    const checkoutData = {
      items: [
        {
          id: `${product.id}-${selected.id}`,
          productId: product.id,
          variantId: selected.id,
          name: product.name,
          weightLabel: selected.weight,
          weightGrams: weightInKg * 1000,
          unitPrice: selected.price,
          quantity: quantity,
        },
      ],
      totalWeightKg: weightInKg * quantity,
      subtotal: selected.price * quantity,
    };

    sessionStorage.setItem("checkoutItems", JSON.stringify(checkoutData));
    router.push("/checkout");
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md text-gray-900">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-amber-200 via-orange-200 to-amber-700">
        {!imageFailed && product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-amber-950/80">
            <Leaf className="h-12 w-12" />
            <span className="font-serif text-lg">Lanka Food City</span>
          </div>
        )}
        {product.isSpecial && (
          <span className="absolute top-3 left-3 rounded-full bg-amber-950/90 px-3 py-1 text-xs font-semibold tracking-wide text-amber-100 uppercase">
            Special Cinnamon
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-3 right-3 rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white">
            Out of Stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-serif text-xl text-amber-950 font-bold">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-stone-600">
            {product.description}
          </p>
        </div>

        <p className="text-2xl font-bold text-green-800">{formatPrice(price)}</p>

        {/* Weight Selector */}
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Weight Variant (බර තෝරන්න)
          <select
            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-600 font-medium"
            value={variantId ?? ""}
            onChange={(event) =>
              setVariantId(event.target.value ? Number(event.target.value) : null)
            }
            disabled={variants.length === 0}
          >
            {variants.length === 0 && <option value="">No variants yet</option>}
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.weight} — {formatPrice(variant.price)}
              </option>
            ))}
          </select>
        </label>

        <p className={`text-xs font-semibold ${outOfStock ? "text-red-700" : "text-emerald-700"}`}>
          {outOfStock ? "Out of Stock" : `In Stock: ${product.stockQuantity} units`}
        </p>

        {/* Quantity Controls & Action Buttons */}
        <div className="mt-auto flex items-center gap-2">
          {/* Quantity Box (තද කළු පාටින් පැහැදිලිව Type කළ හැක) */}
          <div className="flex items-center rounded-xl border-2 border-gray-300 bg-white shadow-sm overflow-hidden">
            <button
              type="button"
              className="p-2 text-gray-800 hover:bg-gray-100 disabled:opacity-30 transition"
              onClick={() => changeQuantity(quantity - 1)}
              disabled={outOfStock || quantity <= 1}
              title="අඩු කරන්න"
            >
              <Minus className="h-3.5 w-3.5 text-gray-800" />
            </button>

            <input
              type="number"
              min={1}
              max={maxQty}
              value={outOfStock ? 0 : quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) changeQuantity(val);
              }}
              disabled={outOfStock}
              className="w-12 text-center text-sm font-black text-gray-950 bg-white border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            <button
              type="button"
              className="p-2 text-gray-800 hover:bg-gray-100 disabled:opacity-30 transition"
              onClick={() => changeQuantity(quantity + 1)}
              disabled={outOfStock || quantity >= maxQty}
              title="වැඩි කරන්න"
            >
              <Plus className="h-3.5 w-3.5 text-gray-800" />
            </button>
          </div>

          {/* Add to Cart */}
          <button
            type="button"
            onClick={addToCart}
            disabled={outOfStock || adding}
            className="flex-1 py-2 px-3 rounded-xl border border-green-700 text-green-800 text-xs font-bold hover:bg-green-50 transition flex items-center justify-center gap-1 disabled:opacity-40"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>

          {/* Buy Now */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="flex-1 py-2 px-3 rounded-xl bg-green-700 text-white text-xs font-bold hover:bg-green-800 transition flex items-center justify-center gap-1 shadow-sm disabled:bg-gray-300"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </article>
  );
}