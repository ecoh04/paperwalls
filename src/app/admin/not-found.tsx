import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-stone-900">Order not found</h1>
      <p className="mt-2 text-stone-600">This order may have been removed or the link is invalid.</p>
      <Link
        href="/admin/orders"
        className="mt-8 inline-flex rounded-lg bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800"
      >
        Back to orders
      </Link>
    </div>
  );
}
