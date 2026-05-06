"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getReadableSupabaseError } from "@/lib/supabase/error-message";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        return;
      }

      setEmail("");
      setPassword("");
      setMessage("Account created. Check your email to confirm your account, then log in.");
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
          <span className="eyebrow">New account</span>
          <h1 className="display-title mt-6 max-w-lg text-[3.5rem]">
            Start using StashUp with your own account.
          </h1>
          <p className="muted-copy mt-5 max-w-md text-lg leading-8">
            Create a login so you can return to your budget dashboard and keep your entries
            under one account.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="stat-card max-w-sm">
              <p className="stat-label">Access</p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                Sign up with your email, then use the login page to access the dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="panel mx-auto w-full max-w-xl p-6 sm:p-8">
          <span className="eyebrow">Sign up</span>
          <h2 className="section-title mt-4">Create your account</h2>
          <p className="muted-copy mt-3 leading-7">
            Enter an email and password to create a new StashUp account. If email
            confirmation is enabled, we will send you a confirmation link before you log in.
          </p>

          <form onSubmit={handleSignup} className="mt-6 grid gap-4">
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
                placeholder="Choose a password"
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

            {message ? (
              <p className="rounded-2xl border border-[rgba(47,107,61,0.18)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--primary-strong)]">
                {message}
              </p>
            ) : null}

            <button disabled={loading} className="button-primary mt-2 w-full">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="muted-copy">Already have an account?</span>
            <Link href="/login" className="font-semibold text-[var(--primary)]">
              Go to login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
