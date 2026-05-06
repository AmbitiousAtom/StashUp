"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getReadableSupabaseError } from "@/lib/supabase/error-message";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push("/");
      }
    } catch (error) {
      setError(getReadableSupabaseError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell flex items-center">
      <section className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel hero-panel hidden p-8 lg:block">
          <span className="eyebrow">Secure account access</span>
          <h1 className="display-title mt-6 max-w-lg text-[3.5rem]">
            Check in on your money with a calmer dashboard.
          </h1>
          <p className="muted-copy mt-5 max-w-md text-lg leading-8">
            Sign in to review your budget activity, keep entries organized, and stay on top
            of the numbers that matter most.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="stat-card max-w-sm">
              <p className="stat-label">Use your account</p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                Log in with the email and password you created on the sign up page.
              </p>
            </div>
          </div>
        </div>

        <div className="panel mx-auto w-full max-w-xl p-6 sm:p-8">
          <span className="eyebrow">Log in</span>
          <h2 className="section-title mt-4">Welcome back</h2>
          <p className="muted-copy mt-3 leading-7">
            Use your Supabase account details to continue to the dashboard.
          </p>

          <form onSubmit={handleLogin} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <p className="rounded-2xl border border-[#d5b071] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[#7b5d2b]">
                {error}
              </p>
            ) : null}

            <button disabled={loading} className="button-primary mt-2 w-full">
              {loading ? "Signing in..." : "Continue to dashboard"}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="muted-copy">Need an account first?</span>
            <Link href="/signup" className="font-semibold text-[var(--primary)]">
              Create one here
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
