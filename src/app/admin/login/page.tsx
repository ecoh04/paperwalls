"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(err.message ?? "Login failed");
        return;
      }
      router.push("/admin/orders");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-pw-bg px-4">
      <div className="w-full max-w-sm rounded-pw-card border border-pw-stone bg-pw-surface p-8 shadow-pw-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-pw-ink">PaperWalls Factory</h1>
          <p className="mt-1 text-sm text-pw-muted">Sign in with your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full rounded-pw border border-pw-stone bg-pw-surface px-4 py-3 text-pw-ink placeholder:text-pw-muted focus:border-pw-ink focus:outline-none focus:ring-1 focus:ring-pw-ink"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full rounded-pw border border-pw-stone bg-pw-surface px-4 py-3 text-pw-ink placeholder:text-pw-muted focus:border-pw-ink focus:outline-none focus:ring-1 focus:ring-pw-ink"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-pw bg-pw-ink px-4 py-3 font-medium text-white transition hover:bg-pw-ink-soft disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
