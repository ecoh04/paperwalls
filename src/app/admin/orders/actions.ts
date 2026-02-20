"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["new", "in_production", "shipped", "delivered"] as const;

async function setLastActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  preview: string
) {
  await supabase
    .from("orders")
    .update({
      last_activity_at: new Date().toISOString(),
      last_activity_preview: preview.slice(0, 200),
    })
    .eq("id", orderId);
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return { error: "Invalid status" };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();
  if (!order) return { error: "Order not found" };

  const updates: Record<string, unknown> = { status };
  if (status === "shipped") {
    updates.shipped_at = new Date().toISOString();
  }
  if (status === "delivered") {
    updates.delivered_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (updateError) return { error: updateError.message };

  await supabase.from("order_activity").insert({
    order_id: orderId,
    user_id: user.id,
    action: "status_change",
    old_value: order.status,
    new_value: status,
  });
  await setLastActivity(supabase, orderId, `Status → ${status}`);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function assignOrderFactory(orderId: string, factoryId: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: order } = await supabase
    .from("orders")
    .select("assigned_factory_id")
    .eq("id", orderId)
    .single();
  if (!order) return { error: "Order not found" };

  let oldName = "Unassigned";
  if (order.assigned_factory_id) {
    const { data: f } = await supabase.from("factories").select("name").eq("id", order.assigned_factory_id).single();
    oldName = f?.name ?? "Unknown";
  }
  let newName = "Unassigned";
  if (factoryId) {
    const { data: f } = await supabase.from("factories").select("name").eq("id", factoryId).single();
    newName = f?.name ?? factoryId;
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ assigned_factory_id: factoryId })
    .eq("id", orderId);

  if (updateError) return { error: updateError.message };

  await supabase.from("order_activity").insert({
    order_id: orderId,
    user_id: user.id,
    action: "assigned",
    old_value: oldName,
    new_value: newName,
  });
  await setLastActivity(supabase, orderId, `Factory → ${newName}`);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function addOrderNote(orderId: string, note: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .single();
  if (!order) return { error: "Order not found" };

  const text = (note ?? "").trim();
  if (!text) return { error: "Note is required" };

  await supabase.from("order_activity").insert({
    order_id: orderId,
    user_id: user.id,
    action: "note",
    new_value: text,
  });
  await setLastActivity(supabase, orderId, `Note: ${text}`);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function updateOrderDetails(
  orderId: string,
  updates: {
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    address_line1?: string;
    address_line2?: string | null;
    city?: string;
    province?: string;
    postal_code?: string;
    wall_width_m?: number;
    wall_height_m?: number;
    wall_count?: number;
    total_sqm?: number;
    wallpaper_style?: string;
    application_method?: string;
    walls_spec?: { widthM: number; heightM: number }[] | null;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order) return { error: "Order not found" };

  const allowed: Record<string, unknown> = {};
  if (updates.customer_name !== undefined) allowed.customer_name = updates.customer_name;
  if (updates.customer_email !== undefined) allowed.customer_email = updates.customer_email;
  if (updates.customer_phone !== undefined) allowed.customer_phone = updates.customer_phone;
  if (updates.address_line1 !== undefined) allowed.address_line1 = updates.address_line1;
  if (updates.address_line2 !== undefined) allowed.address_line2 = updates.address_line2;
  if (updates.city !== undefined) allowed.city = updates.city;
  if (updates.province !== undefined) allowed.province = updates.province;
  if (updates.postal_code !== undefined) allowed.postal_code = updates.postal_code;
  if (updates.wall_width_m !== undefined) allowed.wall_width_m = updates.wall_width_m;
  if (updates.wall_height_m !== undefined) allowed.wall_height_m = updates.wall_height_m;
  if (updates.wall_count !== undefined) allowed.wall_count = updates.wall_count;
  if (updates.total_sqm !== undefined) allowed.total_sqm = updates.total_sqm;
  if (updates.wallpaper_style !== undefined) allowed.wallpaper_style = updates.wallpaper_style;
  if (updates.application_method !== undefined) allowed.application_method = updates.application_method;
  if (updates.walls_spec !== undefined) allowed.walls_spec = updates.walls_spec;

  if (Object.keys(allowed).length === 0) return { ok: true };

  const { error: updateError } = await supabase.from("orders").update(allowed).eq("id", orderId);
  if (updateError) return { error: updateError.message };

  const actions: string[] = [];
  if (allowed.address_line1 !== undefined || allowed.city !== undefined) actions.push("address");
  if (allowed.customer_name !== undefined || allowed.customer_email !== undefined) actions.push("customer");
  if (allowed.wall_width_m !== undefined || allowed.wallpaper_style !== undefined) actions.push("spec");
  const actionType = actions.includes("address")
    ? "address_edit"
    : actions.includes("customer")
      ? "customer_edit"
      : "spec_edit";

  await supabase.from("order_activity").insert({
    order_id: orderId,
    user_id: user.id,
    action: actionType,
    new_value: JSON.stringify(Object.keys(allowed)),
  });
  await setLastActivity(supabase, orderId, `Updated: ${actions.join(", ") || "details"}`);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function cancelOrder(orderId: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).single();
  if (!order) return { error: "Order not found" };

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);
  if (updateError) return { error: updateError.message };

  await supabase.from("order_activity").insert({
    order_id: orderId,
    user_id: user.id,
    action: "cancelled",
    old_value: order.status,
    new_value: reason ?? "Cancelled",
  });
  await setLastActivity(supabase, orderId, "Cancelled");

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function markOrderRefunded(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error: updateError } = await supabase
    .from("orders")
    .update({ refunded_at: new Date().toISOString(), status: "cancelled" })
    .eq("id", orderId);
  if (updateError) return { error: updateError.message };

  await supabase.from("order_activity").insert({
    order_id: orderId,
    user_id: user.id,
    action: "refunded",
    new_value: "Refunded",
  });
  await setLastActivity(supabase, orderId, "Refunded");

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function archiveOrder(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error: updateError } = await supabase
    .from("orders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", orderId);
  if (updateError) return { error: updateError.message };

  await supabase.from("order_activity").insert({
    order_id: orderId,
    user_id: user.id,
    action: "archived",
    new_value: "Archived",
  });
  await setLastActivity(supabase, orderId, "Archived");

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function restoreOrder(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error: updateError } = await supabase
    .from("orders")
    .update({ deleted_at: null })
    .eq("id", orderId);
  if (updateError) return { error: updateError.message };

  await supabase.from("order_activity").insert({
    order_id: orderId,
    user_id: user.id,
    action: "restored",
    new_value: "Restored",
  });
  await setLastActivity(supabase, orderId, "Restored");

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function replaceOrderPrintFile(
  orderId: string,
  dataUrl: string,
  wallIndex: number
): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: order } = await supabase
    .from("orders")
    .select("order_number, image_url, image_urls")
    .eq("id", orderId)
    .single();
  if (!order) return { error: "Order not found" };

  const { uploadPrintImage } = await import("@/lib/storage");
  const path = `${(order as { order_number: string }).order_number}-${wallIndex}.jpg`;
  let newUrl: string;
  try {
    newUrl = await uploadPrintImage(dataUrl, path);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed" };
  }

  const urls = Array.isArray((order as { image_urls?: string[] }).image_urls)
    ? ((order as { image_urls: string[] }).image_urls as string[]).slice()
    : [(order as { image_url: string }).image_url];
  urls[wallIndex] = newUrl;
  const primaryUrl = urls[0];

  const { error: updateError } = await supabase
    .from("orders")
    .update({ image_url: primaryUrl, image_urls: urls })
    .eq("id", orderId);
  if (updateError) return { error: updateError.message };

  await supabase.from("order_activity").insert({
    order_id: orderId,
    user_id: user.id,
    action: "print_file_replaced",
    new_value: `Wall ${wallIndex + 1} replaced`,
  });
  await setLastActivity(supabase, orderId, "Print file replaced");

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function bulkUpdateStatus(orderIds: string[], status: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) return { error: "Invalid status" };
  for (const id of orderIds) {
    await updateOrderStatus(id, status);
  }
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function bulkAssignFactory(orderIds: string[], factoryId: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  for (const id of orderIds) {
    await assignOrderFactory(id, factoryId);
  }
  revalidatePath("/admin/orders");
  return { ok: true };
}
