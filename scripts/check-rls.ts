/**
 * Verifies the database safety rules against the real database, inside a
 * transaction that is always rolled back (nothing is kept).
 *   npm run db:check
 */
import postgres from "postgres";

const results: [string, boolean][] = [];
const check = (name: string, ok: boolean) => results.push([name, ok]);

async function main() {
  const sql = postgres(process.env.SUPABASE_DB_URL!, { ssl: "require", max: 1, onnotice: () => {} });
  try {
    const noRls = await sql`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`;
    check(
      `RLS enabled on every public table${noRls.length ? ` (missing: ${noRls.map((r) => r.relname).join(", ")})` : ""}`,
      noRls.length === 0,
    );

    await sql
      .begin(async (tx) => {
        const adult = "00000000-0000-4000-8000-00000000a001";
        const teen = "00000000-0000-4000-8000-00000000a002";
        await tx`insert into auth.users (id, email, aud, role) values (${adult}, 'rls-adult@test.invalid', 'authenticated', 'authenticated'), (${teen}, 'rls-new@test.invalid', 'authenticated', 'authenticated')`;
        check(
          "profile row auto-created for new users",
          (await tx`select count(*)::int as n from public.profiles where id in (${adult}, ${teen})`)[0].n ===
            2,
        );
        await tx`update public.profiles set dob = '1990-01-01', is_adult = true where id = ${adult}`;

        const as = async (uid: string, q: () => Promise<unknown>) => {
          await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: uid, role: "authenticated" })}, true)`;
          await tx`set local role authenticated`;
          try {
            return await q();
          } finally {
            await tx`reset role`;
          }
        };

        const adultLovers = (await as(
          adult,
          () => tx`select count(*)::int as n from public.characters where category = 'lover'`,
        )) as { n: number }[];
        const [{ n: totalLovers }] =
          await tx`select count(*)::int as n from public.characters where category = 'lover' and status = 'approved' and visibility in ('public', 'unlisted')`;
        check(
          `verified adult sees all ${totalLovers} Lover characters`,
          totalLovers > 0 && adultLovers[0].n >= totalLovers,
        );
        const newLovers = (await as(
          teen,
          () => tx`select count(*)::int as n from public.characters where category = 'lover'`,
        )) as { n: number }[];
        check("user without age check sees no Lover characters", newLovers[0].n === 0);

        let blocked = false;
        await tx`savepoint s1`;
        try {
          await as(teen, () => tx`update public.profiles set is_adult = true where id = ${teen}`);
        } catch {
          blocked = true;
        }
        await tx`rollback to savepoint s1`;
        check("users cannot set their own is_adult", blocked);

        await tx`savepoint s2`;
        let plan = false;
        try {
          await as(teen, () => tx`update public.profiles set plan = 'plus', beans = 9999 where id = ${teen}`);
        } catch {
          plan = true;
        }
        await tx`rollback to savepoint s2`;
        check("users cannot grant themselves Plus or Beans", plan);

        const otherProfiles = (await as(
          teen,
          () => tx`select count(*)::int as n from public.profiles where id <> ${teen}`,
        )) as { n: number }[];
        check("users cannot read other profiles", otherProfiles[0].n === 0);

        await tx`savepoint s3`;
        let young = false;
        try {
          await tx`insert into public.characters (id, name, category, gender, age, hook) values ('rls-young', 'X', 'lover', 'female', 19, 'x')`;
        } catch {
          young = true;
        }
        await tx`rollback to savepoint s3`;
        check("database rejects a Lover character under 21", young);

        await tx`savepoint s4`;
        let fav = false;
        try {
          await as(
            teen,
            () => tx`insert into public.favorites (user_id, character_id) values (${adult}, 'ada-lovelace')`,
          );
        } catch {
          fav = true;
        }
        await tx`rollback to savepoint s4`;
        check("users cannot write favourites for someone else", fav);

        // ── chat tables (Phase 3) ──
        const [{ id: chatA }] =
          await tx`insert into public.chats (user_id, character_id) values (${adult}, 'ada-lovelace') returning id`;
        await tx`insert into public.messages (chat_id, role, content) values (${chatA}, 'assistant', 'hello')`;

        const peek = (await as(
          teen,
          () => tx`select count(*)::int as n from public.messages where chat_id = ${chatA}`,
        )) as { n: number }[];
        check("users cannot read other people's messages", peek[0].n === 0);
        const own = (await as(
          adult,
          () => tx`select count(*)::int as n from public.messages where chat_id = ${chatA}`,
        )) as { n: number }[];
        check("users can read their own messages", own[0].n === 1);

        const denied = async (label: string, q: () => Promise<unknown>) => {
          await tx`savepoint sx`;
          let blockedWrite = false;
          try {
            await q();
          } catch {
            blockedWrite = true;
          }
          await tx`rollback to savepoint sx`;
          check(label, blockedWrite);
        };
        await denied("users cannot forge messages (writes are server-only)", () =>
          as(
            adult,
            () =>
              tx`insert into public.messages (chat_id, role, content) values (${chatA}, 'assistant', 'forged')`,
          ),
        );
        await denied("users cannot reset their daily usage", () =>
          as(
            adult,
            () => tx`insert into public.daily_usage (user_id, day, count) values (${adult}, current_date, 0)`,
          ),
        );
        await denied("users cannot call consume_message directly", () =>
          as(adult, () => tx`select public.consume_message(${adult}, 1000)`),
        );
        await denied("users cannot add memories to someone else's chat", () =>
          as(teen, () => tx`insert into public.memories (chat_id, text) values (${chatA}, 'x')`),
        );

        const counts: number[] = [];
        for (let i = 0; i < 4; i++)
          counts.push((await tx`select public.consume_message(${adult}, 3) as n`)[0].n);
        check(`daily limit stops at the cap (got ${counts.join(",")})`, counts.join(",") === "1,2,3,-1");

        throw new Error("__rollback__");
      })
      .catch((e) => {
        if (e.message !== "__rollback__") throw e;
      });
  } finally {
    await sql.end();
  }
  for (const [name, ok] of results) console.log(`${ok ? "✓" : "✗"} ${name}`);
  if (results.some(([, ok]) => !ok)) process.exit(1);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
