import { NextResponse } from "next/server";
import { getViewer, viewerIsAdult } from "@/lib/auth";
import { listCharacters, PAGE_SIZE } from "@/lib/characters";
import { parseExploreParams } from "@/lib/explore-params";

/** Paged character list for infinite scroll on Explore. RLS decides what's visible. */
export async function GET(request: Request) {
  const params = parseExploreParams(new URL(request.url).searchParams);
  const adult = viewerIsAdult(await getViewer());
  const items = await listCharacters({ ...params, limit: PAGE_SIZE }, adult);
  return NextResponse.json({
    items,
    nextOffset: items.length === PAGE_SIZE ? params.offset + PAGE_SIZE : null,
  });
}
