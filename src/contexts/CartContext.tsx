"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { CartItem } from "@/types/cart";
import { metaPixelTrack } from "@/components/MetaPixel";
import { mintEventId } from "@/lib/meta/event-id";
import { track } from "@/lib/analytics";

const STORAGE_KEY = "paperwalls-cart";
const SESSION_KEY = "paperwalls-session";

// Standard Omit<Union, K> only keeps keys common to ALL union members.
// DistributiveOmit applies Omit to each member individually, preserving unique fields.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

// UTM + click-ID attribution captured from URL on first visit
interface SessionAttribution {
  utm_source?:   string;
  utm_medium?:   string;
  utm_campaign?: string;
  utm_content?:  string;
  utm_term?:     string;
  fbclid?:       string;
  gclid?:        string;
  landing_page?: string;
}

type CartContextValue = {
  items:              CartItem[];
  sessionId:          string;
  addItem:            (item: DistributiveOmit<CartItem, "id">) => void;
  removeItem:         (id: string) => void;
  clearCart:          () => void;
  identifyCustomer:   (email: string, name?: string, phone?: string) => void;
  /** Slide-out cart drawer state. */
  isCartOpen:         boolean;
  openCart:           () => void;
  closeCart:          () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);

// ── Persistence helpers ───────────────────────────────────────────────────────

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): boolean {
  if (typeof window === "undefined") return true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (e) {
    // Most common cause: localStorage quota exceeded by base64 image data URLs.
    // Cart still works in-memory for this session — we just can't survive a refresh.
    if (
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014)
    ) {
      console.warn(
        "[PaperWalls cart] Local storage is full — your cart won't survive a page refresh. Complete checkout, or remove an item to free space."
      );
    } else {
      console.warn("[PaperWalls cart] Could not persist cart:", e);
    }
    if (typeof document !== "undefined") {
      // Non-fatal signal for any UI that wants to warn the user.
      document.dispatchEvent(new CustomEvent("paperwalls:cart-save-failed"));
    }
    return false;
  }
}

// Read a browser cookie. Used for Meta's _fbp/_fbc, forwarded to the server so
// the CAPI AddToCart mirror matches the buyer at high quality.
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

function loadOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const newId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, newId);
    return newId;
  } catch {
    return "";
  }
}

/**
 * Reads UTM params and click IDs from the current URL.
 * Only called once on first page load — captures first-touch attribution.
 * Also persists fbclid/gclid in sessionStorage so they survive page navigations
 * within the same session (they appear in the landing URL, not all URLs).
 */
// Pages where we should not record a new landing_page
// (user was redirected here by payment gateway, not by their own navigation)
const SKIP_LANDING_PAGES = ["/checkout/success", "/checkout/cancelled"];

function captureAttribution(): SessionAttribution {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    const attr: SessionAttribution = {
      // Don't record success/cancel pages as the landing page — these are
      // PayFast redirect destinations and would corrupt first-touch attribution
      ...(SKIP_LANDING_PAGES.some((p) => pathname.startsWith(p))
        ? {}
        : { landing_page: pathname }),
    };

    const utm_source   = params.get("utm_source")   || undefined;
    const utm_medium   = params.get("utm_medium")   || undefined;
    const utm_campaign = params.get("utm_campaign") || undefined;
    const utm_content  = params.get("utm_content")  || undefined;
    const utm_term     = params.get("utm_term")     || undefined;

    if (utm_source)   attr.utm_source   = utm_source;
    if (utm_medium)   attr.utm_medium   = utm_medium;
    if (utm_campaign) attr.utm_campaign = utm_campaign;
    if (utm_content)  attr.utm_content  = utm_content;
    if (utm_term)     attr.utm_term     = utm_term;

    // Click IDs: persist in sessionStorage so they survive navigation
    const fbclid = params.get("fbclid") || sessionStorage.getItem("pw_fbclid") || undefined;
    const gclid  = params.get("gclid")  || sessionStorage.getItem("pw_gclid")  || undefined;

    if (params.get("fbclid")) sessionStorage.setItem("pw_fbclid", params.get("fbclid")!);
    if (params.get("gclid"))  sessionStorage.setItem("pw_gclid",  params.get("gclid")!);

    if (fbclid) attr.fbclid = fbclid;
    if (gclid)  attr.gclid  = gclid;

    return attr;
  } catch {
    return {};
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router                    = useRouter();
  const [items, setItems]         = useState<CartItem[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const attribution               = useRef<SessionAttribution>({});
  const syncTimer                 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender             = useRef(true);

  const openCart  = useCallback(() => setIsCartOpen(true),  []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  useEffect(() => {
    setItems(loadCart());
    const sid = loadOrCreateSessionId();
    setSessionId(sid);
    attribution.current = captureAttribution();
  }, []);

  // Debounced backend sync — fire and forget, never blocks the UI
  const syncToBackend = useCallback(
    (currentSessionId: string, currentItems: CartItem[]) => {
      if (!currentSessionId) return;
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        fetch("/api/cart/sync", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id:   currentSessionId,
            items:        currentItems,
            user_agent:   typeof navigator !== "undefined" ? navigator.userAgent : undefined,
            referrer:     typeof document  !== "undefined" ? document.referrer || undefined : undefined,
            ...attribution.current,
          }),
        }).catch(() => {});
      }, 900);
    },
    []
  );

  // Sync whenever items change (skip the initial hydration render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    syncToBackend(sessionId, items);
  }, [items, sessionId, syncToBackend]);

  // ── Cart mutations ──────────────────────────────────────────────────────────

  const addItem = useCallback((item: DistributiveOmit<CartItem, "id">) => {
    const id = `pw-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setItems((prev) => {
      const next = [...prev, { ...item, id } as CartItem];
      saveCart(next);
      return next;
    });

    // Wallpaper is high-intent — they configured a wall and clicked add to
    // cart, so cut the drawer step and send them straight to checkout.
    // Sample-pack adds keep the drawer open so the buyer can see the
    // confirmation + the upsell to wallpaper.
    if (item.type === "wallpaper") {
      router.push("/checkout");
    } else {
      setIsCartOpen(true);
    }

    // First-party add-to-cart — fired HERE at the cart chokepoint (not in the
    // configurator leaf) so EVERY add is captured, including the sample-pack
    // path, which never touches the configurator and was previously invisible.
    // Type-specific names let the admin funnel query the wallpaper journey.
    if (item.type === "wallpaper") {
      track("cart.wallpaper_added", {
        value_cents:    item.subtotalCents,
        material:       item.material,
        application:    item.application,
        wallpaper_type: item.wallpaperType,
        total_sqm:      item.totalSqm,
        wall_count:     item.wallCount,
      });
    } else {
      track("cart.sample_added", {
        value_cents: item.subtotalCents,
        quantity:    item.quantity,
      });
    }

    // Meta Pixel: AddToCart. event_id minted here is shared with the server
    // CAPI mirror below so Meta dedups the two into one event.
    const eventId = mintEventId("AddToCart");
    const contentId = item.type === "sample_pack" ? "sample_pack" : "custom_wallpaper";
    const valueZar  = item.subtotalCents / 100;
    metaPixelTrack("AddToCart", {
      event_id:     eventId,
      value_cents:  item.subtotalCents,
      currency:     "ZAR",
      content_type: item.type === "sample_pack" ? "sample_pack" : "wallpaper",
      content_ids:  [contentId],
      content_name: item.type === "sample_pack" ? "Sample pack" : `Custom wallpaper (${item.material})`,
      num_items:    1,
    });

    // Meta CAPI: AddToCart — fired here, 1:1 with the pixel above, sharing the
    // SAME event_id for dedup. This is the moment of the real add, so it never
    // fires on quantity edits or the debounced /api/cart/sync re-sync. fbp/fbc
    // are read from cookies; the server skips the send gracefully if absent.
    // Fire-and-forget: a CAPI failure must never break add-to-cart.
    fetch("/api/track", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action:       "capi_add_to_cart",
        event_id:     eventId,
        value:        valueZar,
        currency:     "ZAR",
        content_type: item.type === "sample_pack" ? "sample_pack" : "wallpaper",
        content_ids:  [contentId],
        contents:     [{ id: contentId, quantity: 1, item_price: valueZar }],
        num_items:    1,
        fbp:          readCookie("_fbp"),
        fbc:          readCookie("_fbc"),
      }),
      keepalive: true,
    }).catch(() => {});
  }, [router]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCart([]);
  }, []);

  // Called from CheckoutForm on email blur — links this session to a named customer
  const identifyCustomer = useCallback(
    (email: string, name?: string, phone?: string) => {
      if (!sessionId || !email) return;
      fetch("/api/cart/identify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, email, name, phone }),
      }).catch(() => {});
    },
    [sessionId]
  );

  const value: CartContextValue = {
    items,
    sessionId,
    addItem,
    removeItem,
    clearCart,
    identifyCustomer,
    isCartOpen,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ── Consumer hook ─────────────────────────────────────────────────────────────

const emptyCartValue: CartContextValue = {
  items:            [],
  sessionId:        "",
  addItem:          () => {},
  removeItem:       () => {},
  clearCart:        () => {},
  identifyCustomer: () => {},
  isCartOpen:       false,
  openCart:         () => {},
  closeCart:        () => {},
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  return ctx ?? emptyCartValue;
}
