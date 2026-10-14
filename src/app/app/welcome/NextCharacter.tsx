"use client";

import { useEffect } from "react";

/** Remembers the matched character for an hour, so "Start chatting" after a purchase goes back to them. */
export function NextCharacter({ id }: { id: string }) {
  useEffect(() => {
    document.cookie = `sippa_next_character=${encodeURIComponent(id)}; path=/; max-age=3600; samesite=lax`;
  }, [id]);
  return null;
}
