 "use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export function SiteHeader() {
  const router = useRouter();
  const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const logoSrc = `${assetBasePath}/stashup-logo.svg`;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setIsAuthenticated(Boolean(data.user));
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      setIsAuthenticated(Boolean(session?.user));

      if (event === "SIGNED_OUT") {
        router.push("/");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="logo-link" aria-label="StashUp home">
          <Image
            src={logoSrc}
            alt="StashUp logo"
            width={320}
            height={79}
            className="logo-image"
          />
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {checkingSession ? null : isAuthenticated ? (
            <button type="button" className="button-secondary" onClick={signOut}>
              Log out
            </button>
          ) : (
            <>
              <Link href="/login" className="site-nav-link">
                Log in
              </Link>
              <Link href="/signup" className="site-nav-link">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
