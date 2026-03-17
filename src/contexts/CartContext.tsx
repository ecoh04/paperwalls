"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { CartItem } from "@/types/cart";

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

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
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
function captureAttribution(): SessionAttribution {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const attr: SessionAttribution = {
      landing_page: window.location.pathname,
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
  const [items, setItems]         = useState<CartItem[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const attribution               = useRef<SessionAttribution>({});
  const syncTimer                 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender             = useRef(true);

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
  }, []);

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
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  return ctx ?? emptyCartValue;
}
