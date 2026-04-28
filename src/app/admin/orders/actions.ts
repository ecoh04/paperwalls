"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["new", "in_production", "shipped", "delivered"] as const;

const COURIERS = [
  "Pargo",
  "The Courier Guy",
  "Aramex",
  "Dawn Wing",
  "RAM",
  "PostNet",
  "Other",
] as const;

type Courier = (typeof COURIERS)[number];

/**
 * Queue a transactional email idempotently. Uses the (idempotency_key) unique
 * index so re-clicking "mark shipped" never sends a duplicate.
 */
async function queueCustomerEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  args: {
    orderId:    string;
    customerId: string | null;
    type:       "order_confirmed" | "order_shipped" | "order_delivered";
    subject:    string;
  },
) {
  if (!args.customerId) return;
  const { error } = await supabase.from("scheduled_emails").upsert(
    {
      customer_id:     args.customerId,
      order_id:        args.orderId,
      type:            args.type,
      status:          "pending",
      send_at:         new Date().toISOString(),
      subject:         args.subject,
      idempotency_key: `${args.type}:${args.orderId}`,
      attempts:        0,
    },
    { onConflict: "idempotency_key", ignoreDuplicates: true },
  );
  if (error) {
    console.error(`[queueCustomerEmail] ${args.type} for ${args.orderId}:`, error.message);
  }
}

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

/** Returns supabase + userId if current user is admin; otherwise { error }. */
async function requireAdmin(): Promise<
  | { supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Admin only" };
  return { supabase, userId: user.id };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const { supabase, userId } = auth;

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return { error: "Invalid status" };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, customer_id, customer_email, tracking_number")
    .eq("id", orderId)
    .single();
  if (!order) return { error: "Order not found" };

  const updates: Record<string, unknown> = { status };
  if (status === "shipped") {
    updates.shipped_at   = new Date().toISOString();
    updates.dispatched_at = new Date().toISOString();
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
    user_id: userId,
    action: "status_change",
    old_value: order.status,
    new_value: status,
  });
  await setLastActivity(supabase, orderId, `Status → ${status}`);

  // Queue customer notifications. Shipped only gets queued if tracking is set
  // (otherwise the operator is parking the status; the proper path is the
  // dedicated "ship + notify" form). Delivered always sends — there's no
  // tracking dependency.
  if (status === "shipped" && order.tracking_number) {
    await queueCustomerEmail(supabase, {
      orderId,
      customerId: order.customer_id as string | null,
      type:       "order_shipped",
      subject:    "",
    });
  }
  if (status === "delivered") {
    await queueCustomerEmail(supabase, {
      orderId,
      customerId: order.customer_id as string | null,
      type:       "order_delivered",
      subject:    "",
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return {
    ok:   true,
    note: status === "shipped" && !order.tracking_number
      ? "Status set. No tracking captured — customer not emailed. Use the Ship form to send tracking."
      : undefined,
  };
}

/**
 * Capture tracking + mark shipped + email the customer in one action.
 * The canonical "ship it" path. Idempotent on the email side.
 */
export async function markOrderShipped(
  orderId: string,
  args: { courier: string; trackingNumber: string; trackingUrl?: string },
): Promise<{ ok?: true; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const { supabase, userId } = auth;

  const courier = (args.courier ?? "").trim() as Courier;
  const trackingNumber = (args.trackingNumber ?? "").trim();
  const trackingUrl = (args.trackingUrl ?? "").trim() || null;
  if (!COURIERS.includes(courier)) return { error: "Pick a courier" };
  if (!trackingNumber)             return { error: "Tracking number is required" };

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, customer_id")
    .eq("id", orderId)
    .single();
  if (!order) return { error: "Order not found" };

  const wasShipped = order.status === "shipped";
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status:          "shipped",
      courier_name:    courier,
      tracking_number: trackingNumber,
      tracking_url:    trackingUrl,
      shipped_at:      wasShipped ? undefined : now,
      dispatched_at:   wasShipped ? undefined : now,
    })
    .eq("id", orderId);
  if (updateError) return { error: updateError.message };

  await supabase.from("order_activity").insert({
    order_id:  orderId,
    user_id:   userId,
    action:    wasShipped ? "note" : "shipped",
    new_value: `${courier} · ${trackingNumber}`,
  });
  await setLastActivity(supabase, orderId, `Shipped via ${courier} · ${trackingNumber}`);

  await queueCustomerEmail(supabase, {
    orderId,
    customerId: order.customer_id as string | null,
    type:       "order_shipped",
    subject:    "",
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/**
 * Mark delivered + queue the delivered email. Separate from the dropdown
 * so operators can use either path.
 */
export async function markOrderDelivered(orderId: string): Promise<{ ok?: true; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const { supabase, userId } = auth;

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, customer_id")
    .eq("id", orderId)
    .single();
  if (!order) return { error: "Order not found" };

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", orderId);
  if (updateError) return { error: updateError.message };

  await supabase.from("order_activity").insert({
    order_id:  orderId,
    user_id:   userId,
    action:    "status_change",
    old_value: order.status,
    new_value: "delivered",
  });
  await setLastActivity(supabase, orderId, "Delivered");

  await queueCustomerEmail(supabase, {
    orderId,
    customerId: order.customer_id as string | null,
    type:       "order_delivered",
    subject:    "",
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/**
 * Re-send a customer email on demand. Inserts a fresh queue row with a
 * timestamped idempotency key so it always sends, even if a previous one
 * already went out.
 */
export async function resendCustomerEmail(
  orderId: string,
  type: "order_confirmed" | "order_shipped" | "order_delivered",
): Promise<{ ok?: true; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const { supabase, userId } = auth;

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id")
    .eq("id", orderId)
    .single();
  if (!order) return { error: "Order not found" };
  if (!order.customer_id) return { error: "No customer attached to this order" };

  const { error } = await supabase.from("scheduled_emails").insert({
    customer_id:     order.customer_id,
    order_id:        orderId,
    type,
    status:          "pending",
    send_at:         new Date().toISOString(),
    subject:         "",
    idempotency_key: `${type}:${orderId}:resend:${Date.now()}`,
    attempts:        0,
  });
  if (error) return { error: error.message };

  await supabase.from("order_activity").insert({
    order_id:  orderId,
    user_id:   userId,
    action:    "note",
    new_value: `Resent ${type.replace("_", " ")} email`,
  });
  await setLastActivity(supabase, orderId, `Resent ${type.replace("_", " ")} email`);

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
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const { supabase, userId } = auth;

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
    user_id: userId,
    action: actionType,
    new_value: JSON.stringify(Object.keys(allowed)),
  });
  await setLastActivity(supabase, orderId, `Updated: ${actions.join(", ") || "details"}`);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function cancelOrder(orderId: string, reason?: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const { supabase, userId } = auth;

  const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).single();
  if (!order) return { error: "Order not found" };

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);
  if (updateError) return { error: updateError.message };

  await supabase.from("order_activity").insert({
    order_id: orderId,
    user_id: userId,
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
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const { supabase, userId } = auth;

  const { error: updateError } = await supabase
    .from("orders")
    .update({ refunded_at: new Date().toISOString(), status: "cancelled" })
    .eq("id", orderId);
  if (updateError) return { error: updateError.message };

  await supabase.from("order_activity").insert({
    order_id: orderId,
    user_id: userId,
    action: "refunded",
    new_value: "Refunded",
  });
  await setLastActivity(supabase, orderId, "Refunded");

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function archiveOrder(orderId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const { supabase, userId } = auth;

  const { error: updateError } = await supabase
    .from("orders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", orderId);
  if (updateError) return { error: updateError.message };

  await supabase.from("order_activity").insert({
    order_id: orderId,
    user_id: userId,
    action: "archived",
    new_value: "Archived",
  });
  await setLastActivity(supabase, orderId, "Archived");

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function restoreOrder(orderId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const { supabase, userId } = auth;

  const { error: updateError } = await supabase
    .from("orders")
    .update({ deleted_at: null })
    .eq("id", orderId);
  if (updateError) return { error: updateError.message };

  await supabase.from("order_activity").insert({
    order_id: orderId,
    user_id: userId,
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
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const { supabase, userId } = auth;

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
    user_id: userId,
    action: "print_file_replaced",
    new_value: `Wall ${wallIndex + 1} replaced`,
  });
  await setLastActivity(supabase, orderId, "Print file replaced");

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function bulkUpdateStatus(orderIds: string[], status: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) return { error: "Invalid status" };
  for (const id of orderIds) {
    await updateOrderStatus(id, status);
  }
  revalidatePath("/admin/orders");
  return { ok: true };
}

