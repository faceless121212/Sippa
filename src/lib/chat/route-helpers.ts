import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ChatError, MAX_MESSAGE_CHARS, ndjson } from "./service";

export const contentSchema = z.object({
  content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
  useBeans: z.boolean().optional(),
});

export function errorResponse(e: unknown) {
  if (e instanceof ChatError) return ndjson([{ t: "error", message: e.message }], e.status);
  console.error("chat route:", e);
  return NextResponse.json({ t: "error", message: "Something went wrong." }, { status: 500 });
}

export const limitResponse = (limit: number, beans: number) => ndjson([{ t: "limit", limit, beans }], 429);
