import Link from "next/link";

const ITEMS = [
  "72-hour production",
  "Free shipping South Africa",
  "Printed in Cape Town",
  "Secure PayFast checkout",
];

export function TrustStrip() {
  return (
    <div className="border-b border-[rgba(26,23,20,0.08)] bg-pw-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 text-xs sm:px-6 lg:px-8">
        {ITEMS.map((item) => (
          <span key={item} className="text-pw-ink/75">
            {item}
          </span>
        ))}
        <Link href="/shipping" className="ml-auto text-pw-accent hover:underline">
          Delivery details
        </Link>
      </div>
    </div>
  );
}
