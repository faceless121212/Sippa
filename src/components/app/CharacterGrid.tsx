"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CharacterCard, type CardCharacter } from "../CharacterCard";

/** Grid with infinite scroll. `query` is the explore querystring without offset. */
export function CharacterGrid({
  initial,
  initialNextOffset,
  query,
}: {
  initial: CardCharacter[];
  initialNextOffset: number | null;
  query: string;
}) {
  const [items, setItems] = useState(initial);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(initial);
    setNextOffset(initialNextOffset);
  }, [initial, initialNextOffset]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || nextOffset === null) return;
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || loading) return;
        setLoading(true);
        setFailed(false);
        try {
          const sep = query ? "&" : "";
          const res = await fetch(`/api/characters?${query}${sep}offset=${nextOffset}`);
          if (!res.ok) throw new Error(String(res.status));
          const data = (await res.json()) as { items: CardCharacter[]; nextOffset: number | null };
          setItems((prev) => [...prev, ...data.items.filter((d) => !prev.some((p) => p.id === d.id))]);
          setNextOffset(data.nextOffset);
        } catch {
          setFailed(true);
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [nextOffset, query, loading]);

  if (!items.length) {
    return <p className="text-muted py-16 text-center text-sm">No characters match. Try another filter.</p>;
  }

  return (
    <>
      <h2 className="sr-only">Characters</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {items.map((c, i) => (
          <li key={c.id} className="animate-rise" style={{ animationDelay: `${(i % 12) * 30}ms` }}>
            <Link href={`/app/c/${c.id}`} className="block rounded-xl">
              <CharacterCard character={c} priority={i < 4} />
            </Link>
          </li>
        ))}
      </ul>
      <div ref={sentinel} aria-hidden="true" className="h-8" />
      <p aria-live="polite" className="text-muted pb-8 text-center text-xs">
        {loading ? "Loading more…" : failed ? "Couldn't load more. Scroll to retry." : ""}
      </p>
    </>
  );
}
