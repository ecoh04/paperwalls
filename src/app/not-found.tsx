import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-pw-ink">404</h1>
      <p className="mt-2 text-pw-muted">This page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-pw bg-pw-ink px-6 py-3 text-sm font-medium text-white hover:bg-pw-ink-soft"
      >
        Back to home
      </Link>
    </div>
  );
}
