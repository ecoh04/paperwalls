"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { STYLE_LABELS, APPLICATION_LABELS } from "@/lib/admin-labels";
import { PROVINCES } from "@/lib/shipping";
import type { WallpaperStyle, ApplicationMethod, ShippingProvince } from "@/types/order";
import { updateOrderDetails } from "@/app/admin/orders/actions";

type Props = {
  orderId: string;
  initial: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    province: string;
    postal_code: string;
    wall_width_m: number;
    wall_height_m: number;
    wall_count: number;
    total_sqm: number;
    wallpaper_style: string;
    application_method: string;
    walls_spec: { widthM: number; heightM: number }[] | null;
  };
};

export function OrderEditForm({ orderId, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await updateOrderDetails(orderId, {
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        address_line1: form.address_line1,
        address_line2: form.address_line2 || null,
        city: form.city,
        province: form.province,
        postal_code: form.postal_code,
        wall_width_m: form.wall_width_m,
        wall_height_m: form.wall_height_m,
        wall_count: form.wall_count,
        total_sqm: form.total_sqm,
        wallpaper_style: form.wallpaper_style,
        application_method: form.application_method,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">Edit order</h2>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-sm font-medium text-amber-600 hover:text-amber-700"
        >
          {open ? "Cancel" : "Edit details"}
        </button>
      </div>
      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-stone-500">Customer name</label>
              <input
                value={form.customer_name}
                onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500">Email</label>
              <input
                type="email"
                value={form.customer_email}
                onChange={(e) => setForm((p) => ({ ...p, customer_email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500">Phone</label>
              <input
                value={form.customer_phone}
                onChange={(e) => setForm((p) => ({ ...p, customer_phone: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500">Address line 1</label>
            <input
              value={form.address_line1}
              onChange={(e) => setForm((p) => ({ ...p, address_line1: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500">Address line 2</label>
            <input
              value={form.address_line2 ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, address_line2: e.target.value || null }))}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-stone-500">City</label>
              <input
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500">Province</label>
              <select
                value={form.province}
                onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              >
                {PROVINCES.map((pr) => (
                  <option key={pr.value} value={pr.value}>
                    {pr.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500">Postal code</label>
              <input
                value={form.postal_code}
                onChange={(e) => setForm((p) => ({ ...p, postal_code: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-stone-500">Wall width (m)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={form.wall_width_m}
                onChange={(e) => setForm((p) => ({ ...p, wall_width_m: Number(e.target.value) || 0 }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500">Wall height (m)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={form.wall_height_m}
                onChange={(e) => setForm((p) => ({ ...p, wall_height_m: Number(e.target.value) || 0 }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500">Wall count</label>
              <input
                type="number"
                min={1}
                max={4}
                value={form.wall_count}
                onChange={(e) => setForm((p) => ({ ...p, wall_count: Number(e.target.value) || 1 }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500">Total m²</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.total_sqm}
                onChange={(e) => setForm((p) => ({ ...p, total_sqm: Number(e.target.value) || 0 }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500">Finish</label>
              <select
                value={form.wallpaper_style}
                onChange={(e) => setForm((p) => ({ ...p, wallpaper_style: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              >
                {(Object.entries(STYLE_LABELS) as [WallpaperStyle, string][]).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500">Application</label>
              <select
                value={form.application_method}
                onChange={(e) => setForm((p) => ({ ...p, application_method: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              >
                {(Object.entries(APPLICATION_LABELS) as [ApplicationMethod, string][]).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </div>
  );
}
