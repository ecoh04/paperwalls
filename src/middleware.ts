import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Rate limiting (dormant until Upstash is configured) ─────────────────────
// The public POST routes are unauthenticated and will attract bots + click
// fraud once ads run. We throttle them per-IP. The limiters are created ONLY
// when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, so until you
// add those two env vars this is a complete no-op and the app behaves exactly
// as before. Sign up free at upstash.com, create a Redis DB, paste the REST URL
// + token into Vercel, redeploy — limits switch on with no code change.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters: Record<string, Ratelimit> | null = redis
  ? {
      "/api/track":           new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60 s"), prefix: "rl:track" }),
      "/api/checkout/create": new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  "60 s"), prefix: "rl:checkout" }),
      "/api/subscribe":       new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3,  "60 s"), prefix: "rl:subscribe" }),
    }
  : null;

async function rateLimit(request: NextRequest, pathname: string): Promise<NextResponse | null> {
  if (!limiters || request.method !== "POST") return null;
  const limiter = limiters[pathname];
  if (!limiter) return null;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  try {
    const { success } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }
  } catch {
    // Fail OPEN — a limiter outage must never block real buyers.
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rate-limit public POSTs first, before any other work, so abusive traffic
  //    is rejected cheaply.
  const limited = await rateLimit(request, pathname);
  if (limited) return limited;

  // 2. Auth is only needed to gate /admin. Skip the Supabase round-trip for
  //    every other request — under ad traffic a getUser() per visitor and per
  //    /api/track hit would be pure latency + cost for nothing.
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next({ request });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          response.cookies.set(name, value)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname === "/admin/login") {
    if (user) {
      return NextResponse.redirect(new URL("/admin/orders", request.url));
    }
    return response;
  }
  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
