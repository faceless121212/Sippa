import Link from "next/link";
import { buttonClass } from "../ui/button";

export function ComingSoon({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="bg-primary text-on-primary rounded-md px-2 py-0.5 text-xs font-bold">Brewing</span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.03em]">{title}</h1>
      <p className="text-muted mt-2 text-sm">{body}</p>
      {children}
      <Link href="/app/explore" className={buttonClass({ variant: "secondary", className: "mt-6" })}>
        Explore characters
      </Link>
    </div>
  );
}
