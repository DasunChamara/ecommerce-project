"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Package, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { adminApi, productsApi } from "@/services/api";
import {
  AdminProduct,
  formatPrice,
  normaliseProduct,
  useActionRunner,
  useList,
} from "@/lib/admin";
import { ConfirmButton, Empty, ErrorBox, ListSkeleton, PageHeader, inputClass } from "@/components/admin/ui";

export default function ProductsPage() {
  const { data: products, loading, error, reload } = useList(
    () => (productsApi as any).getAll(),
    normaliseProduct
  );
  const { busy, run } = useActionRunner();

  // Add product
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pStock, setPStock] = useState("");
  const [pImage, setPImage] = useState("");
  const [pSpecial, setPSpecial] = useState(false);

  // Add variant
  const [vProduct, setVProduct] = useState("");
  const [vLabel, setVLabel] = useState("");
  const [vKg, setVKg] = useState("");
  const [vPrice, setVPrice] = useState("");

  const submitProduct = async (e: FormEvent) => {
    e.preventDefault();
    const basePrice = Number(pPrice);
    const stock = Number(pStock);
    if (!pName.trim()) return void toast.error("Product name is required.");
    if (!(basePrice > 0)) return void toast.error("Enter a base price greater than 0.");
    if (pStock.trim() === "" || !Number.isInteger(stock) || stock < 0)
      return void toast.error("Stock must be a whole number, 0 or more.");

    const ok = await run(
      "create-product",
      () =>
        (adminApi as any).createProduct({
          name: pName.trim(),
          description: pDesc.trim(),
          basePrice,
          stockQuantity: stock,
          imageUrl: pImage.trim() || undefined,
          isSpecial: pSpecial,
        }),
      `Product "${pName.trim()}" created`,
      "Could not create the product.",
      reload
    );
    if (ok) {
      setPName("");
      setPDesc("");
      setPPrice("");
      setPStock("");
      setPImage("");
      setPSpecial(false);
    }
  };

  const submitVariant = async (e: FormEvent) => {
    e.preventDefault();
    const kg = Number(vKg);
    const price = Number(vPrice);
    if (!vProduct) return void toast.error("Select a product.");
    if (!vLabel.trim()) return void toast.error("Weight label is required, e.g. 500g.");
    if (!(kg > 0)) return void toast.error("Enter the weight in kg, e.g. 0.5.");
    if (!(price > 0)) return void toast.error("Enter a variant price greater than 0.");

    const ok = await run(
      "create-variant",
      () =>
        (adminApi as any).createVariant({
          productId: vProduct,
          weightLabel: vLabel.trim(),
          weightKg: kg,
          weightGrams: Math.round(kg * 1000),
          price,
        }),
      `Variant ${vLabel.trim()} added`,
      "Could not add the weight variant.",
      reload
    );
    if (ok) {
      setVLabel("");
      setVKg("");
      setVPrice("");
    }
  };

  const remove = (p: AdminProduct) =>
    run(
      `delete-${p.id}`,
      () => (adminApi as any).deleteProduct(p.id),
      `"${p.name}" deleted`,
      "Could not delete the product.",
      reload
    );

  return (
    <div>
      <PageHeader
        icon={<ShoppingBasket className="h-6 w-6" />}
        title="Products & Weight Variants"
        subtitle="Add products, set pack sizes and manage what's on the shelf."
        onRefresh={reload}
        refreshing={loading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1: add product */}
        <section className="rounded-xl border border-green-100 bg-white p-5" aria-labelledby="add-product-h">
          <h2 id="add-product-h" className="flex items-center gap-2 text-lg font-bold text-green-950">
            <Plus className="h-5 w-5 text-green-700" /> Add New Product
          </h2>
          <form onSubmit={submitProduct} className="mt-4 space-y-3">
            <div>
              <label htmlFor="p-name" className="block text-sm font-medium text-gray-700">Name</label>
              <input id="p-name" value={pName} onChange={(e) => setPName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="p-desc" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="p-desc" rows={2} value={pDesc} onChange={(e) => setPDesc(e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="p-price" className="block text-sm font-medium text-gray-700">Base Price (LKR)</label>
                <input id="p-price" type="number" min="0" step="0.01" inputMode="decimal" value={pPrice} onChange={(e) => setPPrice(e.target.value)} className={inputClass} />
                <p className="mt-1 text-xs text-gray-500">
                  Price per 1 kg. Packs are priced from this unless a variant has its own price.
                </p>
              </div>
              <div>
                <label htmlFor="p-stock" className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                <input id="p-stock" type="number" min="0" step="1" inputMode="numeric" value={pStock} onChange={(e) => setPStock(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              {/* 📸 File Upload & Live Preview Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Product Image (පින්තූරය Upload කරන්න)
              </label>

              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const toastId = toast.loading("Uploading image...");
                    try {
                      const res = await (adminApi as any).uploadImage(file);
                      setPImage(res.imageUrl);
                      toast.success("Image uploaded successfully!", { id: toastId });
                    } catch {
                      toast.error("Image upload failed. Try again.", { id: toastId });
                    }
                  }}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-green-100 file:text-green-800 hover:file:bg-green-200 cursor-pointer border border-gray-200 rounded-xl p-1"
                />

                {/* Thumbnail Preview */}
                {pImage && (
                  <div className="h-14 w-14 shrink-0 rounded-xl border border-green-300 overflow-hidden bg-gray-50 shadow-sm">
                    <img src={pImage} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
              
              
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              <input type="checkbox" checked={pSpecial} onChange={(e) => setPSpecial(e.target.checked)} className="h-4 w-4 accent-amber-600" />
              Special Product (Ceylon Cinnamon)
            </label>
            <button
              type="submit"
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {busy === "create-product" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Product
            </button>
          </form>
        </section>

        {/* 2: add variant */}
        <section className="rounded-xl border border-green-100 bg-white p-5" aria-labelledby="add-variant-h">
          <h2 id="add-variant-h" className="flex items-center gap-2 text-lg font-bold text-green-950">
            <Package className="h-5 w-5 text-green-700" /> Add Weight Variant
          </h2>
          <form onSubmit={submitVariant} className="mt-4 space-y-3">
            <div>
              <label htmlFor="v-product" className="block text-sm font-medium text-gray-700">Product</label>
              <select id="v-product" value={vProduct} onChange={(e) => setVProduct(e.target.value)} className={inputClass}>
                <option value="">Select a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="v-label" className="block text-sm font-medium text-gray-700">Weight Label</label>
              <input id="v-label" value={vLabel} onChange={(e) => setVLabel(e.target.value)} placeholder="100g, 250g, 1kg, 5kg" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="v-kg" className="block text-sm font-medium text-gray-700">Weight in KG</label>
                <input id="v-kg" type="number" min="0" step="0.001" inputMode="decimal" value={vKg} onChange={(e) => setVKg(e.target.value)} placeholder="0.25" className={inputClass} />
              </div>
              <div>
                <label htmlFor="v-price" className="block text-sm font-medium text-gray-700">Variant Price (LKR)</label>
                <input id="v-price" type="number" min="0" step="0.01" inputMode="decimal" value={vPrice} onChange={(e) => setVPrice(e.target.value)} className={inputClass} />
              </div>
            </div>
            <button
              type="submit"
              disabled={busy !== null || products.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {busy === "create-variant" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Variant
            </button>
            {products.length === 0 && !loading && (
              <p className="text-center text-xs text-gray-500">Add a product first to create variants.</p>
            )}
          </form>
        </section>
      </div>

      {/* 3: existing products */}
      <section className="mt-8" aria-labelledby="manage-h">
        <h2 id="manage-h" className="mb-3 text-lg font-bold text-green-950">
          Existing Products ({products.length})
        </h2>
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorBox onRetry={reload} />
        ) : products.length === 0 ? (
          <Empty>No products yet. Add your first product above.</Empty>
        ) : (
          <ul className="space-y-3">
            {products.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-green-50">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-green-300">
                      <Package className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-900">{p.name}</h3>
                    {p.isSpecial && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                        Special · Ceylon Cinnamon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    {formatPrice(p.basePrice)} base ·{" "}
                    <span
                      className={
                        p.stockQuantity === 0
                          ? "font-semibold text-red-600"
                          : p.stockQuantity <= 10
                          ? "font-semibold text-amber-700"
                          : ""
                      }
                    >
                      {p.stockQuantity === 0 ? "Out of stock" : `${p.stockQuantity} in stock`}
                    </span>
                  </p>
                  {p.variants.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {p.variants.map((v, i) => (
                        <span key={i} className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-900">
                          {v.label}
                          {v.price !== undefined ? ` · ${formatPrice(v.price)}` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ConfirmButton
                  disabled={busy !== null}
                  onConfirm={() => remove(p)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-600 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete Product
                </ConfirmButton>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
