import Link from "next/link";
import { Logo } from "../Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="Sippa home">
          <Logo />
        </Link>
        <h1 className="mt-8 text-3xl font-extrabold tracking-[-0.03em]">{title}</h1>
        {subtitle && <p className="text-muted mt-2 text-sm">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="text-muted mt-6 text-sm">{footer}</div>}
      </div>
    </main>
  );
}

export const inputCls =
  "border-border bg-bg focus:border-text h-12 w-full rounded-lg border px-4 text-base focus:outline-none";
