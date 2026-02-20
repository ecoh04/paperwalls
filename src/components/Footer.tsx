import Link from "next/link";

const footerSections = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All products" },
      { href: "/shop/custom-wallpaper", label: "Custom wallpaper" },
      { href: "/config", label: "Design your wallpaper" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/shipping", label: "Shipping & delivery" },
      { href: "/returns", label: "Returns & refunds" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-stone-600 hover:text-stone-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-stone-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-semibold text-stone-900">
              PaperWalls
            </Link>
            <span className="text-sm text-stone-500">·</span>
            <span className="text-sm text-stone-500">Custom wallpaper, South Africa</span>
          </div>
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} PaperWalls. All prices in ZAR.
          </p>
        </div>
      </div>
    </footer>
  );
}
