"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  cancelOrder,
  markOrderRefunded,
  archiveOrder,
  restoreOrder,
  replaceOrderPrintFile,
} from "@/app/admin/orders/actions";

type Props = {
  orderId: string;
  status: string;
  refundedAt: string | null;
  deletedAt: string | null;
  wallCount: number;
  isAdmin: boolean;
};

export function OrderActionButtons({
  orderId,
  status,
  refundedAt,
  deletedAt,
  wallCount,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    const reason = window.prompt("Cancel reason (optional):");
    startTransition(async () => {
      await cancelOrder(orderId, reason ?? undefined);
      router.refresh();
    });
  }

  function handleMarkRefunded() {
    if (!confirm("Mark this order as refunded? It will be set to Cancelled.")) return;
    startTransition(async () => {
      await markOrderRefunded(orderId);
      router.refresh();
    });
  }

  function handleArchive() {
    if (!confirm("Archive this order? It will be hidden from the default list.")) return;
    startTransition(async () => {
      await archiveOrder(orderId);
      router.refresh();
    });
  }

  function handleRestore() {
    startTransition(async () => {
      await restoreOrder(orderId);
      router.refresh();
    });
  }

  const canChange = status !== "cancelled" && !deletedAt;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {deletedAt ? (
        isAdmin && (
          <button
            type="button"
            onClick={handleRestore}
            disabled={isPending}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            Restore from archive
          </button>
        )
      ) : (
        <>
          {isAdmin && canChange && (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                Cancel order
              </button>
              {!refundedAt && (
                <button
                  type="button"
                  onClick={handleMarkRefunded}
                  disabled={isPending}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Mark refunded
                </button>
              )}
              <button
                type="button"
                onClick={handleArchive}
                disabled={isPending}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                Archive
              </button>
              <span className="text-stone-300">|</span>
            </>
          )}
          {isAdmin && (
            <span className="inline-flex items-center gap-2">
              {wallCount > 1 && (
                <select
                  id={`replace-wall-${orderId}`}
                  className="rounded border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-700"
                  defaultValue={0}
                >
                  {Array.from({ length: wallCount }, (_, i) => (
                    <option key={i} value={i}>
                      Wall {i + 1}
                    </option>
                  ))}
                </select>
              )}
              <label className="cursor-pointer rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
                Replace print file
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const wallIndex =
                        wallCount > 1
                          ? parseInt(
                              (document.getElementById(`replace-wall-${orderId}`) as HTMLSelectElement)
                                ?.value ?? "0",
                              10
                            )
                          : 0;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUrl = reader.result as string;
                        startTransition(async () => {
                          await replaceOrderPrintFile(orderId, dataUrl, wallIndex);
                          router.refresh();
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                    e.target.value = "";
                  }}
                  disabled={isPending}
                />
              </label>
              <span className="text-stone-300">|</span>
            </span>
          )}
          <Link
            href={`/admin/orders/${orderId}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Print order
          </Link>
        </>
      )}
    </div>
  );
}
