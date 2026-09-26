import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ rating: z.union([z.literal(1), z.literal(-1), z.null()]) });

/** 👍 / 👎 on a character reply (null clears it). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!Number.isSafeInteger(id) || !parsed.success)
    return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log in" }, { status: 401 });

  // RLS read confirms the message belongs to one of the user's chats.
  const { data: msg } = await supabase.from("messages").select("id,role").eq("id", id).maybeSingle();
  if (!msg || msg.role !== "assistant") return NextResponse.json({ error: "Not found" }, { status: 404 });

  await createAdminClient().from("messages").update({ rating: parsed.data.rating }).eq("id", id);
  return NextResponse.json({ ok: true });
}
