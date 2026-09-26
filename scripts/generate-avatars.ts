/**
 * Generates portraits for the landing-page characters with fal.ai and saves
 * them to public/characters/<id>.jpg, then updates the avatar manifest.
 *
 *   npm run avatars            # only characters without an image yet
 *   npm run avatars -- --force # regenerate everything
 *   npm run avatars -- ren-kaito cleopatra   # just these
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { avatarLooks } from "../src/data/avatar-looks";
import { allLandingCharacters } from "../src/data/landing";
import { buildAvatarPrompt } from "../src/lib/avatar-prompt";
import { generateImage } from "../src/lib/images";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public", "characters");
const manifestPath = path.join(root, "src", "data", "avatar-manifest.json");

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const only = args.filter((a) => !a.startsWith("--"));

  await mkdir(outDir, { recursive: true });
  const manifest: string[] = JSON.parse(await readFile(manifestPath, "utf8").catch(() => "[]"));
  const done = new Set(manifest);

  const targets = allLandingCharacters.filter(
    (c) => (only.length ? only.includes(c.id) : true) && (force || only.length || !done.has(c.id)),
  );
  if (!targets.length) {
    console.log("Nothing to generate. Use --force to regenerate.");
    return;
  }

  let failures = 0;
  for (const c of targets) {
    const look = avatarLooks[c.id];
    if (!look) {
      console.error(`✗ ${c.id}: no entry in avatar-looks.ts`);
      failures++;
      continue;
    }
    try {
      const prompt = buildAvatarPrompt({ name: c.name, age: c.age, category: c.category, look });
      process.stdout.write(`… ${c.id} `);
      const image = await generateImage({ prompt });
      const res = await fetch(image.url);
      if (!res.ok) throw new Error(`download failed: ${res.status}`);
      await writeFile(path.join(outDir, `${c.id}.jpg`), Buffer.from(await res.arrayBuffer()));
      done.add(c.id);
      console.log("✓");
    } catch (err) {
      failures++;
      console.log("✗");
      console.error(`  ${c.id}: ${(err as Error).message}`);
    }
  }

  await writeFile(manifestPath, JSON.stringify([...done].sort(), null, 2) + "\n");
  console.log(`Saved to public/characters/. ${failures ? `${failures} failed.` : "All done."}`);
  if (failures) process.exitCode = 1;
}

main();
