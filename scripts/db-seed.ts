/**
 * Upserts the 24 official seed characters (src/data/characters.ts).
 *   npm run db:seed
 * Safe to re-run: existing rows are updated, counts included.
 */
import postgres from "postgres";
import { seedCharacters } from "../src/data/characters";

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is not set. Add it to .env.local.");
  const sql = postgres(url, { ssl: "require", max: 1, onnotice: () => {} });
  try {
    const rows = seedCharacters.map((c) => ({
      id: c.id,
      creator_id: null,
      name: c.name,
      category: c.category,
      famous_type: c.famousType ?? null,
      gender: c.gender,
      age: c.age ?? null,
      hook: c.hook,
      description: c.description,
      personality: sql.json({ traits: c.traits }),
      speaking_style: c.speakingStyle,
      backstory: c.backstory,
      first_message: c.firstMessage,
      example_dialogues: sql.json(c.exampleDialogues),
      tags: c.tags,
      avatar_url: `/characters/${c.id}.jpg`,
      visibility: "public",
      status: "approved",
      message_count: c.messages,
      trending_score: c.trending,
      badges: c.badges ?? [],
    }));
    await sql`
      insert into public.characters ${sql(rows)}
      on conflict (id) do update set
        name = excluded.name, category = excluded.category, famous_type = excluded.famous_type,
        gender = excluded.gender, age = excluded.age, hook = excluded.hook,
        description = excluded.description, personality = excluded.personality,
        speaking_style = excluded.speaking_style, backstory = excluded.backstory,
        first_message = excluded.first_message, example_dialogues = excluded.example_dialogues,
        tags = excluded.tags, avatar_url = excluded.avatar_url, visibility = excluded.visibility,
        status = excluded.status, message_count = excluded.message_count,
        trending_score = excluded.trending_score, badges = excluded.badges, updated_at = now()`;
    const [{ count }] =
      await sql`select count(*)::int as count from public.characters where creator_id is null`;
    console.log(`Seeded ${rows.length} characters (${count} official in DB).`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
