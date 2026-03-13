import Link from "next/link";

const footerSections = [
  {
    title: "Shop",
    links: [
      { href: "/products/custom-wallpaper", label: "Custom wallpaper"      },
      { href: "/how-it-works",              label: "How it works"           },
      { href: "/materials",                 label: "Materials"              },
      { href: "/inspiration",               label: "Inspiration"            },
      { href: "/samples",                   label: "Order a sample pack"    },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/faq",      label: "FAQ"                  },
      { href: "/contact",  label: "Contact"              },
      { href: "/shipping", label: "Shipping & delivery"  },
      { href: "/returns",  label: "Returns & refunds"    },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy"   },
      { href: "/terms",   label: "Terms of service" },
    ],
  },
  {
    title: "Brand",
    links: [
      { href: "/about", label: "About us" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-pw-stone bg-pw-bg">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-medium uppercase tracking-widest text-pw-ink">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-light text-pw-muted hover:text-pw-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-pw-stone pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-serif text-pw-ink">
              paper<span className="text-pw-accent">walls</span>
            </Link>
            <span className="text-sm text-pw-muted">·</span>
            <span className="text-sm text-pw-muted">Custom wallpaper, South Africa</span>
          </div>
          <p className="text-xs text-pw-muted-light">
            © {new Date().getFullYear()} Paperwalls. All prices in ZAR.
          </p>
        </div>

      </div>
    </footer>
  );
}
