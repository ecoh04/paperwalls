import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-stone-900">404</h1>
      <p className="mt-2 text-stone-600">This page doesn’t exist.</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800"
      >
        Back to home
      </Link>
    </div>
  );
}
