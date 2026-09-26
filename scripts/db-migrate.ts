/**
 * Applies supabase/migrations/*.sql in order, once each, inside a transaction.
 *   npm run db:migrate
 * Needs SUPABASE_DB_URL in .env.local (Supabase → Settings → Database → Session pooler URI).
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const dir = path.resolve(import.meta.dirname, "..", "supabase", "migrations");

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is not set. Add it to .env.local.");
  const sql = postgres(url, { ssl: "require", max: 1, onnotice: () => {} });
  try {
    await sql`create table if not exists public.schema_migrations (version text primary key, applied_at timestamptz not null default now())`;
    await sql`alter table public.schema_migrations enable row level security`;
    const done = new Set(
      (await sql`select version from public.schema_migrations`).map((r) => r.version as string),
    );
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    let applied = 0;
    for (const file of files) {
      if (done.has(file)) continue;
      const body = await readFile(path.join(dir, file), "utf8");
      process.stdout.write(`… ${file} `);
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`insert into public.schema_migrations (version) values (${file})`;
      });
      console.log("✓");
      applied++;
    }
    console.log(applied ? `Applied ${applied} migration(s).` : "Database is up to date.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
