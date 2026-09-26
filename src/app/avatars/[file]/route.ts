import { allLandingCharacters } from "@/data/landing";
import { avatarSvg } from "@/lib/avatar-svg";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return allLandingCharacters.map((c) => ({ file: `${c.id}.svg` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const character = allLandingCharacters.find((c) => `${c.id}.svg` === file);
  if (!character) return new Response("Not found", { status: 404 });
  return new Response(avatarSvg(character.avatar), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
