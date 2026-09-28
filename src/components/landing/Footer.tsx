import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Logo } from "../Logo";

const legal = [
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/cookies", label: "Cookie Policy" },
  { href: "/legal/guidelines", label: "Community Guidelines" },
];

export function Footer() {
  // Profiles without a real URL yet ("#") are hidden rather than shown as dead links.
  const socials = siteConfig.socials.filter((s) => s.href !== "#");
  return (
    <footer className="border-border border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="text-muted mt-3 max-w-xs text-sm">{siteConfig.tagline}</p>
          <p className="text-muted mt-4 max-w-sm text-xs">
            Sippa characters and their images are AI-generated. They are not real people and don&apos;t give
            professional advice. 18+ only.
          </p>
        </div>
        <nav aria-label="Legal">
          <h2 className="text-sm font-semibold">Legal</h2>
          <ul className="mt-3 space-y-2">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted hover:text-text text-sm">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {socials.length > 0 && (
          <nav aria-label="Social media">
            <h2 className="text-sm font-semibold">Follow along</h2>
            <ul className="mt-3 space-y-2">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} className="text-muted hover:text-text text-sm" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
      <div className="border-border border-t">
        <p className="text-muted mx-auto max-w-6xl px-4 py-6 text-xs sm:px-6">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
