import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CharacterCard } from "@/components/CharacterCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buttonClass } from "@/components/ui/button";
import { requireAdult, viewerIsAdult } from "@/lib/auth";
import { listCharacters } from "@/lib/characters";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const viewer = await requireAdult("/app/profile");
  const supabase = await createClient();
  const { data: favs } = await supabase
    .from("favorites")
    .select("character_id")
    .eq("user_id", viewer.user.id)
    .order("created_at", { ascending: false });
  const favIds = new Set((favs ?? []).map((f) => f.character_id as string));
  const all = favIds.size ? await listCharacters({ limit: 200 }, viewerIsAdult(viewer)) : [];
  const favorites = all.filter((c) => favIds.has(c.id));
  const p = viewer.profile!;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 md:py-10">
      <section className="border-border bg-surface flex flex-wrap items-center gap-4 rounded-2xl border p-5">
        <span className="bg-text text-bg flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-extrabold">
          {(p.display_name ?? p.email ?? "?").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold tracking-[-0.02em]">{p.display_name ?? "You"}</h1>
          <p className="text-muted truncate text-sm">{p.email}</p>
        </div>
        <span className="bg-surface-2 rounded-md px-2.5 py-1 text-xs font-bold uppercase">
          {p.plan === "plus" ? "Sippa Plus" : "Free"}
        </span>
      </section>

      <section aria-labelledby="favs">
        <h2 id="favs" className="text-xl font-extrabold tracking-[-0.02em]">
          Saved characters
        </h2>
        {favorites.length ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {favorites.map((c) => (
              <li key={c.id}>
                <Link href={`/app/c/${c.id}`} className="block rounded-xl">
                  <CharacterCard character={c} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted mt-2 text-sm">
            Nothing saved yet. Tap <strong>Save</strong> on a character you like.
          </p>
        )}
      </section>

      <section aria-labelledby="settings" className="border-border rounded-2xl border">
        <h2 id="settings" className="border-border border-b px-5 py-3 text-sm font-extrabold">
          Settings
        </h2>
        <div className="divide-border divide-y">
          <div className="flex items-center justify-between px-5 py-3 text-sm">
            <span>Theme</span>
            <ThemeToggle />
          </div>
          <div className="text-muted flex items-center justify-between px-5 py-3 text-sm">
            <span>Export data · Delete account</span>
            <span className="text-xs">Coming soon</span>
          </div>
          <form action="/auth/signout" method="post" className="px-5 py-3">
            <button
              type="submit"
              className={buttonClass({ variant: "ghost", size: "sm", className: "-ml-2" })}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
