import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CharacterCard } from "@/components/CharacterCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buttonClass } from "@/components/ui/button";
import { requireAdult, viewerIsAdult } from "@/lib/auth";
import { listCharacters } from "@/lib/characters";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { deleteAccount, setNudges } from "./actions";

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
  const { data: mine } = await supabase
    .from("characters")
    .select("id,name,age,category,famous_type,hook,tags,message_count,visibility,avatar_url")
    .eq("creator_id", viewer.user.id)
    .order("created_at", { ascending: false });
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
        <Link
          href="/app/plus"
          className="bg-surface-2 hover:bg-border rounded-md px-2.5 py-1 text-xs font-bold"
        >
          {p.plan === "plus" ? "SIPPA PLUS" : "FREE"} · {p.beans} Flowers
        </Link>
      </section>

      <section aria-labelledby="mine">
        <div className="flex items-center justify-between">
          <h2 id="mine" className="text-xl font-extrabold tracking-[-0.02em]">
            My characters
          </h2>
          <Link href="/app/create" className={buttonClass({ size: "sm" })}>
            Create
          </Link>
        </div>
        {mine?.length ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {mine.map((c) => (
              <li key={c.id}>
                <Link href={`/app/c/${c.id}`} className="block rounded-xl">
                  <CharacterCard
                    character={{
                      id: c.id,
                      name: c.name,
                      age: c.age ?? undefined,
                      category: c.category,
                      famousType: c.famous_type ?? undefined,
                      hook: c.hook,
                      tags: c.tags,
                      messages: Number(c.message_count),
                      avatarUrl: c.avatar_url,
                    }}
                  />
                </Link>
                <p className="text-muted mt-1 text-xs capitalize">{c.visibility}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted mt-2 text-sm">You haven&apos;t brewed anyone yet.</p>
        )}
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
          <form action={setNudges} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <span>
              Characters can message me
              <span className="text-muted block text-xs">
                A short popup every few minutes from someone you chat with.
              </span>
            </span>
            <input type="hidden" name="on" value={p.nudges_enabled ? "0" : "1"} />
            <button
              type="submit"
              role="switch"
              aria-checked={p.nudges_enabled}
              aria-label="Characters can message me"
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                p.nudges_enabled ? "bg-primary" : "bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full shadow transition-all",
                  p.nudges_enabled ? "left-[22px] bg-black" : "left-0.5 bg-white",
                )}
              />
            </button>
          </form>
          <div className="flex items-center justify-between px-5 py-3 text-sm">
            <span>Your data</span>
            <a href="/api/account/export" className={buttonClass({ variant: "secondary", size: "sm" })}>
              Export (JSON)
            </a>
          </div>
          <details className="px-5 py-3 text-sm">
            <summary className="text-lover-ink cursor-pointer font-semibold">Delete account</summary>
            <form action={deleteAccount} className="mt-3 space-y-2">
              <p className="text-muted">
                This permanently erases your account, chats, memories, characters you created (including other
                people&apos;s chats with them) and purchase history. It can&apos;t be undone.
              </p>
              <label htmlFor="confirm-delete" className="block font-semibold">
                Type DELETE to confirm
              </label>
              <div className="flex gap-2">
                <input
                  id="confirm-delete"
                  name="confirm"
                  required
                  pattern="[Dd][Ee][Ll][Ee][Tt][Ee]"
                  autoComplete="off"
                  className="border-border bg-bg h-9 rounded-lg border px-3"
                />
                <button
                  className={buttonClass({ size: "sm", className: "bg-lover hover:bg-lover text-white" })}
                >
                  Delete forever
                </button>
              </div>
            </form>
          </details>
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
