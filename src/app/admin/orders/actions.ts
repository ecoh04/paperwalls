"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["new", "in_production", "shipped", "delivered"] as const;

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

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
