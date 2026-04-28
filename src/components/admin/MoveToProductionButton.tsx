"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/admin/orders/actions";

type Props = { orderId: string };

export function MoveToProductionButton({ orderId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await updateOrderStatus(orderId, "in_production");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
    >
      {isPending ? "Moving…" : "Move to production"}
    </button>
  );
}
