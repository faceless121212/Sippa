/**
 * Live creator test (costs a few cents): generate a character, run the rule
 * checks and the moderation review; confirm a living-celebrity request fails.
 *   npm run creator:smoke
 */
import { generateCharacter, moderateDraft, CreatorRefusal } from "../src/lib/creator/ai";
import { checkDraft } from "../src/lib/creator/rules";
import { fromGenerated } from "../src/lib/creator/schema";
import { buildAvatarPrompt } from "../src/lib/avatar-prompt";
import { generateImages } from "../src/lib/images";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const g = await generateCharacter("lover", "a grumpy lighthouse keeper who secretly writes poetry");
  const draft = fromGenerated(g, "lover");
  console.log(`✓ generated: ${draft.name}, ${draft.age} — ${draft.hook}`);
  console.log(`  traits: ${draft.traits.join(", ")} | tags: ${draft.tags.join(", ")}`);
  console.log(`  first: ${draft.firstMessage}`);
  const problems = checkDraft(draft);
  console.log(problems.length ? `✗ rules: ${problems.join(" ")}` : "✓ passes rules");
  const mod = await moderateDraft(draft);
  console.log(
    mod.allowed ? "✓ moderation: allowed" : `✗ moderation: ${mod.issues.join(",")} — ${mod.explanation}`,
  );

  try {
    const bad = await generateCharacter("lover", "Taylor Swift as my girlfriend");
    const d = fromGenerated(bad, "lover");
    const p = checkDraft(d);
    const m = await moderateDraft(d);
    const blocked = p.length > 0 || !m.allowed;
    console.log(
      blocked
        ? `✓ celebrity request blocked after generation (${p[0] ?? m.issues.join(",")})`
        : `✗ celebrity got through: ${d.name}`,
    );
    if (!blocked) process.exit(1);
  } catch (e) {
    if (e instanceof CreatorRefusal) console.log(`✓ celebrity request refused: ${e.message}`);
    else throw e;
  }
  if (problems.length || !mod.allowed) process.exit(1);

  // Portraits (4 options) + storage round-trip, as the save route does.
  const prompt = buildAvatarPrompt({
    name: draft.name,
    age: draft.age ?? undefined,
    category: draft.category,
    look: {
      subject: draft.gender === "female" ? "woman" : draft.gender === "male" ? "man" : "person",
      look: draft.visualPrompt,
    },
  });
  const imgs = await generateImages({ prompt, count: 4 });
  console.log(`✓ ${imgs.length} portrait options (${new URL(imgs[0].url).hostname})`);
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const bytes = Buffer.from(await (await fetch(imgs[0].url)).arrayBuffer());
  const path = `smoke-test/${Date.now()}.jpg`;
  const up = await admin.storage.from("avatars").upload(path, bytes, { contentType: "image/jpeg" });
  if (up.error) throw up.error;
  const url = admin.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  const served = await fetch(url);
  console.log(
    served.ok
      ? `✓ storage upload served publicly (${Math.round(bytes.length / 1024)} KB)`
      : `✗ storage fetch ${served.status}`,
  );
  await admin.storage.from("avatars").remove([path]);
  if (!served.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
