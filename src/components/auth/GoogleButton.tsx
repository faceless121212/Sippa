import { signInWithGoogle } from "@/app/login/actions";
import { buttonClass } from "../ui/button";

/** Shown only once Google is enabled in Supabase → Authentication → Providers. */
export const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "1";

export function GoogleButton({ next, label = "Continue with Google" }: { next: string; label?: string }) {
  if (!googleAuthEnabled) return null;
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        className={buttonClass({ variant: "secondary", size: "lg", className: "w-full" })}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24z"
          />
          <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
          <path
            fill="#EA4335"
            d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8z"
          />
        </svg>
        {label}
      </button>
    </form>
  );
}

export function OrDivider() {
  if (!googleAuthEnabled) return null;
  return (
    <div className="text-muted flex items-center gap-3 text-xs">
      <span className="bg-border h-px flex-1" /> or <span className="bg-border h-px flex-1" />
    </div>
  );
}
