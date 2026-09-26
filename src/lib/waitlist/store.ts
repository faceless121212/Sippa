import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type WaitlistEntry = {
  email: string;
  consent: true;
  source?: string;
};

export class WaitlistNotConfiguredError extends Error {}

/**
 * Stores a waitlist sign-up. Uses Supabase (via its REST API, service role,
 * server-only) when configured; otherwise a local JSON file for development.
 * Duplicates are ignored silently so the response never reveals whether an
 * email is already on the list.
 */
export async function addToWaitlist(entry: WaitlistEntry): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    const res = await fetch(`${supabaseUrl}/rest/v1/waitlist?on_conflict=email`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal,resolution=ignore-duplicates",
      },
      body: JSON.stringify({ email: entry.email, consent: entry.consent, source: entry.source ?? null }),
    });
    if (!res.ok) throw new Error(`Supabase waitlist insert failed: ${res.status}`);
    return;
  }

  if (process.env.VERCEL) {
    throw new WaitlistNotConfiguredError("Set Supabase env vars to store the waitlist in production.");
  }
  await addToFile(waitlistFilePath(), entry);
}

export function waitlistFilePath(): string {
  return process.env.WAITLIST_FILE ?? path.join(process.cwd(), ".data", "waitlist.json");
}

type FileRow = WaitlistEntry & { created_at: string };

export async function addToFile(file: string, entry: WaitlistEntry): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  let rows: FileRow[] = [];
  try {
    rows = JSON.parse(await readFile(file, "utf8")) as FileRow[];
  } catch {
    rows = [];
  }
  if (rows.some((r) => r.email === entry.email)) return;
  rows.push({ ...entry, created_at: new Date().toISOString() });
  await writeFile(file, JSON.stringify(rows, null, 2));
}
