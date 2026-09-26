/**
 * Generates Sippa's 3D brand icons with fal.ai into public/brand/.
 *   npm run brand:icons [-- plus beans]
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { generateImages } from "../src/lib/images";

const STYLE =
  "3D rendered app icon, glossy soft plastic material, subtle subsurface glow, soft studio lighting, centered composition, isolated on a pure solid black background, no text, no letters, high detail";

const ICONS: Record<string, string> = {
  plus: `a cute chunky coffee cup in vivid neon lime green (#C3FF00) with a small shiny gold crown resting on top and two soft white steam swirls, ${STYLE}`,
  beans: `three chunky glossy roasted coffee beans with vivid neon lime green (#C3FF00) rim highlights, stacked playfully, ${STYLE}`,
  cup: `a cute chunky coffee cup in vivid neon lime green (#C3FF00) with a heart-shaped steam swirl, ${STYLE}`,
};

async function main() {
  const only = process.argv.slice(2);
  const out = path.resolve(import.meta.dirname, "..", "public", "brand");
  for (const [name, prompt] of Object.entries(ICONS)) {
    if (only.length && !only.includes(name)) continue;
    const [img] = await generateImages({ prompt, size: "square_hd", count: 1 });
    const res = await fetch(img.url);
    await writeFile(path.join(out, `${name}.jpg`), Buffer.from(await res.arrayBuffer()));
    console.log(`✓ ${name}`);
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
