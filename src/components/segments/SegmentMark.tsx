"use client";

import { useEffect } from "react";
import { SEGMENT_COOKIE, type SegmentId } from "@/config/segments";

/** Remembers which audience page someone came through, so the app opens on their kind of characters. */
export function SegmentMark({ segment }: { segment: SegmentId }) {
  useEffect(() => {
    document.cookie = `${SEGMENT_COOKIE}=${segment}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, [segment]);
  return null;
}
