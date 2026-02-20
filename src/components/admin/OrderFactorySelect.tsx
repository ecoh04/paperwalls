"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Factory = { id: string; code: string; name: string };

type Props = {
  orderId: string;
  currentFactoryId: string | null;
  factories: Factory[];
  assignFactory: (orderId: string, factoryId: string | null) => Promise<{ error?: string }>;
};

export function OrderFactorySelect({
  orderId,
  currentFactoryId,
  factories,
  assignFactory,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const factoryId = value === "" ? null : value;
    startTransition(async () => {
      const result = await assignFactory(orderId, factoryId);
      if (!result?.error) router.refresh();
    });
  }

  return (
    <select
      value={currentFactoryId ?? ""}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
    >
      <option value="">Unassigned</option>
      {factories.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
}
