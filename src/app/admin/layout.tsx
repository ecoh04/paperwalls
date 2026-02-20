import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/admin/orders"
              className="text-lg font-semibold text-stone-900 hover:text-stone-700"
            >
              PaperWalls Factory
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                Orders
              </Link>
            </nav>
          </div>
          <form action="/api/admin/logout" method="POST" className="flex items-center gap-2">
            <button
              type="submit"
              className="text-sm font-medium text-stone-500 hover:text-stone-900"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
