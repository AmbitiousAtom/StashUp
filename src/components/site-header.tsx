import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const logoSrc = `${assetBasePath}/stashup-logo.svg`;

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
          <Link href="/" className="site-nav-link">
            Budget
          </Link>
          <Link href="/dashboard" className="site-nav-link">
            Dashboard
          </Link>
          <Link href="/login" className="site-nav-link">
            Log in
          </Link>
          <Link href="/signup" className="site-nav-link">
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
