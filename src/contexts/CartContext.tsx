"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { CartItem } from "@/types/cart";

const STORAGE_KEY = "paperwalls-cart";

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);

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
    // ignore
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    const id = `pw-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setItems((prev) => {
      const next = [...prev, { ...item, id }];
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

  const value: CartContextValue = { items, addItem, removeItem, clearCart };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

const emptyCartValue: CartContextValue = {
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  return ctx ?? emptyCartValue;
}
