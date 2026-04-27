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
        <div className="mb-12 rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="pw-overline text-pw-accent">Why customers choose PaperWalls</p>
              <h3 className="pw-h3 mt-3 text-pw-ink">Commercial print quality with simple ordering</h3>
              <p className="pw-body mt-2 text-pw-ink/70">Upload your image, preview your crop, and check out with free shipping nationwide.</p>
            </div>
            <Link
              href="/config"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-pw bg-pw-ink px-5 text-sm font-medium text-white hover:bg-pw-ink-soft transition-colors"
            >
              Start your design
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              "72-hour production",
              "Free shipping in South Africa",
              "DIY or pro installer options",
            ].map((item) => (
              <p key={item} className="pw-small text-pw-ink/75">{item}</p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <p className="pw-overline text-pw-ink">{section.title}</p>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="pw-small text-pw-ink/70 hover:text-pw-ink transition-colors">
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
            <Link href="/" className="font-serif text-lg text-pw-ink">
              paper<span className="text-pw-accent">walls</span>
            </Link>
            <span className="pw-small text-pw-muted-light">·</span>
            <span className="pw-small text-pw-muted">Custom wallpaper, South Africa</span>
          </div>
          <p className="pw-small text-pw-muted-light">
            © {new Date().getFullYear()} Paperwalls. All prices in ZAR.
          </p>
        </div>

      </div>
    </footer>
  );
}
