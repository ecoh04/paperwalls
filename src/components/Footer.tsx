import Link from "next/link";
import { EmailCaptureFooter } from "@/components/EmailCaptureFooter";

const footerSections = [
  {
    title: "Shop",
    links: [
      { href: "/shop/custom-wallpaper", label: "Custom wallpaper"      },
      { href: "/how-it-works",          label: "How it works"          },
      { href: "/materials",             label: "Materials"             },
      { href: "/inspiration",           label: "Inspiration"           },
      { href: "/samples",               label: "Sample pack"           },
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
    title: "Company",
    links: [
      { href: "/about",    label: "About us"          },
      { href: "/privacy",  label: "Privacy policy"    },
      { href: "/terms",    label: "Terms of service"  },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-pw-stone bg-pw-bg">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-12 sm:px-8 sm:pb-10 sm:pt-16 lg:px-12">

        {/* Email capture — top of footer, the lead-magnet for not-yet-ready buyers */}
        <EmailCaptureFooter />

        {/* Brand + nav — single column on mobile, multi on desktop */}
        <div className="mt-12 grid grid-cols-1 gap-10 border-t border-pw-stone pt-12 sm:grid-cols-12 sm:gap-8 sm:mt-16 sm:pt-14">
          <div className="sm:col-span-12 lg:col-span-4">
            <Link href="/" className="text-xl font-bold text-pw-ink">
              paper<span className="text-pw-accent">walls</span>
            </Link>
            <p className="pw-body mt-4 max-w-sm text-pw-ink/70">
              Custom wallpaper, made to order in Cape Town and shipped free
              across South Africa.
            </p>
          </div>
          {footerSections.map((section) => (
            <nav key={section.title} className="sm:col-span-4 lg:col-span-2 lg:col-start-auto">
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
            </nav>
          ))}
          {/* CTA column — desktop only */}
          <div className="hidden lg:col-span-2 lg:block">
            <p className="pw-overline text-pw-ink">Get started</p>
            <Link
              href="/config"
              className="pw-small mt-4 inline-flex h-10 items-center rounded-pw bg-pw-ink px-4 font-semibold text-white hover:bg-pw-ink-soft transition-colors"
            >
              Design yours
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-pw-stone pt-6 sm:mt-16 sm:flex-row sm:items-center sm:justify-between">
          <p className="pw-small text-pw-muted-light">
            © {new Date().getFullYear()} Paperwalls · All prices in ZAR
          </p>
          <p className="pw-small text-pw-muted-light">
            Custom wallpaper · South Africa
          </p>
        </div>
      </div>
    </footer>
  );
}
