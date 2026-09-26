import { Bot, Heart, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportButton } from "@/components/app/ReportButton";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { buttonClass } from "@/components/ui/button";
import { categories, categoryStyles } from "@/config/categories";
import { getViewer, viewerIsAdult } from "@/lib/auth";
import { getCharacter, isSeedLover } from "@/lib/characters";
import { exploreHref } from "@/lib/explore-params";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { cn, formatCount } from "@/lib/utils";
import { startChat } from "../../chats/actions";
import { toggleFavorite } from "./actions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = await getCharacter(id, viewerIsAdult(await getViewer()));
  return c ? { title: c.name, description: c.hook } : { title: "Character" };
}

export default async function CharacterPage({ params }: Props) {
  const { id } = await params;
  const viewer = await getViewer();
  const adult = viewerIsAdult(viewer);
  const character = await getCharacter(id, adult);

  if (!character) {
    if (!adult && isSeedLover(id)) return <AdultGate id={id} signedIn={Boolean(viewer)} />;
    notFound();
  }

  let favorited = false;
  if (viewer && supabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("favorites")
      .select("character_id")
      .eq("user_id", viewer.user.id)
      .eq("character_id", id)
      .maybeSingle();
    favorited = Boolean(data);
  }

  const category = categories.find((c) => c.id === character.category)!;
  const style = categoryStyles[character.category];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:py-10">
      <div className="grid gap-8 md:grid-cols-[minmax(0,380px)_1fr]">
        <div className="bg-surface-2 relative aspect-[3/4] overflow-hidden rounded-2xl">
          <CharacterAvatar
            id={character.id}
            name={character.name}
            priority
            sizes="(min-width: 768px) 380px, 100vw"
          />
        </div>

        <div className="min-w-0">
          <Link
            href={exploreHref({ category: character.category })}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold",
              style.softBg,
              style.ink,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", style.fill)} aria-hidden="true" />
            {category.label}
            {character.famousType === "historical" && " · Historical"}
          </Link>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.035em] sm:text-5xl">
            {character.name}
            {character.age ? <span className="text-muted font-semibold"> {character.age}</span> : null}
          </h1>
          <p className="mt-2 text-lg">{character.hook}</p>

          <div className="text-muted mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {formatCount(character.messages)} messages
            </span>
            <span>by {character.creatorName}</span>
          </div>

          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
            {character.tags.map((t) => (
              <li key={t}>
                <Link
                  href={exploreHref({ tag: t })}
                  className="border-border hover:bg-surface block rounded-md border px-2.5 py-1 text-xs font-medium"
                >
                  {t}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {viewer && supabaseConfigured ? (
              <form action={startChat}>
                <input type="hidden" name="character_id" value={id} />
                <button type="submit" className={buttonClass({ size: "lg" })}>
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Start chat
                </button>
              </form>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(`/app/c/${id}`)}`}
                className={buttonClass({ size: "lg" })}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Start chat
              </Link>
            )}
            {viewer && supabaseConfigured && (
              <form action={toggleFavorite}>
                <input type="hidden" name="character_id" value={id} />
                <input type="hidden" name="favorited" value={favorited ? "1" : "0"} />
                <button
                  type="submit"
                  aria-pressed={favorited}
                  className={buttonClass({ variant: "secondary", size: "lg" })}
                >
                  <Heart
                    className={cn("h-4 w-4", favorited && "text-lover-ink fill-current")}
                    aria-hidden="true"
                  />
                  {favorited ? "Saved" : "Save"}
                </button>
              </form>
            )}
            <ReportButton targetType="character" targetId={id} />
          </div>
          <p className="text-muted mt-3 flex items-center gap-1.5 text-xs">
            <Bot className="h-3.5 w-3.5" aria-hidden="true" />
            You&apos;re chatting with an AI character. They aren&apos;t a real person.
          </p>

          <section className="border-border mt-8 space-y-5 border-t pt-6">
            <div>
              <h2 className="text-muted text-xs font-bold tracking-[0.08em] uppercase">About</h2>
              <p className="mt-2 leading-relaxed">{character.description}</p>
            </div>
            {character.traits.length > 0 && (
              <div>
                <h2 className="text-muted text-xs font-bold tracking-[0.08em] uppercase">Personality</h2>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {character.traits.map((t) => (
                    <li key={t} className="bg-surface-2 rounded-md px-2.5 py-1 text-sm font-medium">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {character.firstMessage && (
              <div>
                <h2 className="text-muted text-xs font-bold tracking-[0.08em] uppercase">Says hi like</h2>
                <blockquote className="bg-surface border-border mt-2 rounded-xl rounded-tl-sm border p-4 text-sm leading-relaxed">
                  {character.firstMessage}
                </blockquote>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function AdultGate({ id, signedIn }: { id: string; signedIn: boolean }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-2xl font-extrabold tracking-[-0.02em]">This character is 18+</p>
      <p className="text-muted mt-2 text-sm">
        {signedIn ? "Confirm your age to continue." : "Log in and confirm your age to continue."}
      </p>
      <Link
        href={`/login?next=${encodeURIComponent(`/app/c/${id}`)}`}
        className={buttonClass({ className: "mt-6" })}
      >
        {signedIn ? "Confirm age" : "Log in"}
      </Link>
    </div>
  );
}
