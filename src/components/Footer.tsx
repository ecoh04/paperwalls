import Link from "next/link";

const footerSections = [
  {
    title: "Shop",
    links: [
      { href: "/shop/custom-wallpaper",     label: "Custom wallpaper"      },
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
        <div className="mb-10 rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pw-accent">Why customers choose PaperWalls</p>
              <h3 className="mt-2 font-sans text-xl font-semibold text-pw-ink">Commercial print quality with simple ordering</h3>
              <p className="mt-1 text-sm text-pw-ink/75">Upload your image, preview your crop, and checkout with free shipping nationwide.</p>
            </div>
            <Link
              href="/config"
              className="inline-flex shrink-0 items-center justify-center rounded-pw bg-pw-ink px-5 py-3 text-sm font-semibold text-white hover:bg-pw-ink-soft"
            >
              Start your design
            </Link>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-pw-ink/80 sm:grid-cols-3">
            <p>72-hour production</p>
            <p>Free shipping in South Africa</p>
            <p>DIY or pro installer options</p>
          </div>
        </div>

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
                      className="text-sm text-pw-ink/75 hover:text-pw-ink"
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
