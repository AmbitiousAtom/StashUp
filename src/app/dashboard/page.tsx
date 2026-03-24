"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }

      setCheckingSession(false);
    });
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (checkingSession) {
    return (
      <main className="app-shell flex items-center justify-center">
        <div className="panel max-w-lg p-8 text-center">
          <p className="eyebrow">Checking session</p>
          <h1 className="section-title mt-4">Loading your dashboard</h1>
          <p className="muted-copy mt-3">Confirming your account before rendering data.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
        <div className="panel hero-panel">
          <span className="eyebrow">Account status</span>
          <h1 className="display-title mt-6 max-w-2xl text-[3.8rem]">Your dashboard is active.</h1>
          <p className="muted-copy mt-5 max-w-xl text-lg leading-8">
            You are signed in and ready to continue managing your budget from a cleaner,
            more intentional interface.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <article className="stat-card">
              <p className="stat-label">Session</p>
              <p className="stat-value text-[var(--primary)]">Authenticated</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Next step</p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                Return to the main tracker to add entries and review recent spending.
              </p>
            </article>
          </div>
        </div>

        <aside className="panel p-6 sm:p-7">
          <p className="eyebrow">Quick actions</p>
          <h2 className="section-title mt-4">Move through the app faster.</h2>
          <div className="mt-6 grid gap-3">
            <Link href="/" className="button-primary">
              Open budget tracker
            </Link>
            <button type="button" className="button-secondary" onClick={signOut}>
              Sign out
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
