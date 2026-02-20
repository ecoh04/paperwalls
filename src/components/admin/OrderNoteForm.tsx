"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  addNote: (orderId: string, note: string) => Promise<{ error?: string }>;
};

export function OrderNoteForm({ orderId, addNote }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const text = note.trim();
    if (!text) {
      setError("Enter a note");
      return;
    }
    startTransition(async () => {
      const result = await addNote(orderId, text);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setNote("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (e.g. waiting for stock, shipped via X)"
        rows={2}
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        disabled={isPending}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending || !note.trim()}
        className="self-end rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {isPending ? "Adding…" : "Add note"}
      </button>
    </form>
  );
}
