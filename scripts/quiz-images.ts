/**
 * Generates the quiz images with fal.ai into public/quiz/<key>.jpg.
 *
 *   npm run quiz:images                 # only images that don't exist yet
 *   npm run quiz:images -- --force      # regenerate all
 *   npm run quiz:images -- love/date-cafe friends/need-fun   # just these
 *
 * Rules: people are fictional adults (25+), fully clothed and tasteful; no text or
 * logos; historical scenes are painted and never show a recognisable real person.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { quizImages } from "../src/config/quizzes";
import { generateImage } from "../src/lib/images";

const STYLE = {
  love: "cinematic warm photograph, soft golden light, shallow depth of field, romantic mood, tasteful, fully clothed adults aged 25 to 35, no text, no logos",
  friends:
    "bright candid lifestyle photograph, natural daylight, warm and friendly mood, vivid but natural colours, fully clothed adults, no text, no logos",
  history:
    "classical oil painting, rich textured brushstrokes, museum quality, warm candlelit palette, no recognisable real person, no text, no letters",
} as const;

export const prompts: Record<string, string> = {
  // Love
  "love/who-woman": "portrait of a confident smiling woman in her late twenties in a cosy café, looking at the camera",
  "love/who-man": "portrait of a kind smiling man in his early thirties in a cosy café, looking at the camera",
  "love/who-any": "a single red rose and two coffee cups on a café table by a rainy window at dusk, no people",
  "love/info-memory": "a phone on a bedside table glowing softly next to a sleeping cat and a cup of tea, fairy lights, no people, no screen text",
  "love/date-cafe": "two coffee cups on a small table in a late-night café, city lights through the window, no faces visible",
  "love/date-games": "a board game night on a coffee table, two hands reaching for the same game piece, laughing mood, no faces",
  "love/date-trip": "a couple seen from behind walking down a sunlit cobbled street in a Mediterranean town, holding hands",
  "love/date-dinner": "candle-lit dinner table at home with homemade pasta and two glasses of wine, romantic, no people",
  "love/info-control": "a woman relaxing on a sofa smiling at her phone in a warm living room in the evening, seen from the side",
  "love/start-friends": "two friends laughing together on a park bench in autumn, seen from behind, leaves falling",
  "love/start-slow": "two hands almost touching on a café table, soft morning light, close-up, no faces",
  "love/start-sparks": "a couple dancing at a lively rooftop party at night with string lights, seen from a distance",
  "love/start-kdrama": "a couple sharing one umbrella in the rain on a neon-lit Seoul street at night, seen from behind",
  "love/evening-home": "a cosy living room at night with blankets, candles and a film playing on a TV, two mugs, no people",
  "love/evening-city": "city street at night with glowing lights and reflections after rain, a couple walking in the distance",
  "love/evening-talk": "two people talking closely on a balcony at sunset with city view, silhouettes, warm light",
  "love/scene-rooftop": "a city rooftop at night after a party, string lights, fairy-lit skyline below, two glasses on a ledge, no people",
  "love/scene-cafe": "a cosy café late at night, staff stacking chairs in the background, one table still lit by a warm lamp with two cups, no faces",
  "love/scene-rain": "a couple seen from behind sharing one umbrella on a rainy city street at night, reflections of neon on wet pavement",
  "love/scene-sea": "a quiet beach in a small seaside town at sunset, footprints in the sand, gentle waves, no people",
  "love/evening-laugh": "two people laughing on a kitchen floor late at night with snacks, candid, faces partly turned away",

  // Friends
  "friends/need-talk": "two friends sitting on a sofa talking over mugs of tea, relaxed and smiling, seen from the side",
  "friends/need-push": "a young woman jogging at sunrise in a park with headphones, determined and happy",
  "friends/need-fun": "friends laughing while playing video games on a sofa with controllers, snacks on the table",
  "friends/need-adventure": "two friends with backpacks looking out over mountains at sunrise, seen from behind",
  "friends/info-memory": "a cheerful desk with a planner, sticky notes, a coffee mug and a phone, morning light, no people, no readable text",
  "friends/hangout-study": "a study session table with laptops, notebooks, highlighters and snacks, two people working, faces not visible",
  "friends/hangout-gaming": "a gaming setup at night with glowing keyboard and two controllers, neon light, no people",
  "friends/hangout-food": "a colourful street food market table with dumplings, tacos and bubble tea, hands reaching in",
  "friends/hangout-night": "a window seat at night with a city view, a blanket and a mug of cocoa, cosy, no people",
  "friends/info-anytime": "a bedroom at 3 a.m. lit only by a soft lamp and a phone screen, a person smiling under a blanket, seen from the side",
  "friends/learn-language": "a café table with a coffee, croissant and an open language notebook, travel postcards, no readable text",
  "friends/learn-cooking": "flour, eggs and fresh herbs on a wooden kitchen counter with someone kneading dough, hands only",
  "friends/learn-fit": "running shoes, a water bottle and a yoga mat on a sunny wooden floor",
  "friends/learn-vibes": "two friends lying on the grass in a park on a sunny day laughing, seen from above",
  "friends/scene-arcade": "a buzzing retro arcade at night with glowing cabinets and neon lights, tokens on a counter, no faces",
  "friends/scene-kitchen": "a small messy kitchen mid-recipe, flour everywhere, a slightly burnt cake, funny chaos, no people",
  "friends/scene-library": "a quiet library corner before exams, stacks of books, highlighters and hidden snacks under the table, warm lamp light",
  "friends/scene-roadtrip": "the inside of a car at the start of a road trip, windows down, sunglasses and snacks on the dashboard, open road ahead",
  "friends/weekend-cosy": "a sofa with blankets, popcorn and a film on the TV in a dim cosy room, no people",
  "friends/weekend-explore": "a lively old town street with colourful houses and a friend taking a photo, seen from behind",
  "friends/weekend-recipe": "a kitchen with a freshly baked pie on the table, warm afternoon light, no people",
  "friends/weekend-gaming": "a gaming marathon setup with pizza boxes, energy drinks and controllers on a coffee table, glowing screen",

  // History
  "history/world-science": "an old astronomer's study with a brass telescope, globes and star charts by candlelight, no people",
  "history/world-art": "a painter's studio with easels, a violin and sheet music in warm light, no people",
  "history/world-words": "an old writing desk with a quill, inkwell and stacks of leather books by candlelight, no people",
  "history/world-power": "a grand throne room with a golden throne, banners and marble columns, no people",
  "history/info-ai": "a glowing old map and an hourglass on a desk with a modern smartphone resting on it, candlelight",
  "history/q-universe": "the night sky full of stars and planets above an ancient observatory",
  "history/q-life": "a quiet Roman garden with a marble bench and olive trees at sunset, no people",
  "history/q-beauty": "an artist's palette, brushes and an unfinished painting of flowers on an easel",
  "history/q-lead": "a war council table with maps, candles and chess pieces, no people",
  "history/info-memory": "an open journal with pressed flowers, a feather pen and a candle on a wooden desk, no readable text",
  "history/feel-lesson": "an old library classroom with a chalkboard full of diagrams, empty wooden desks, sunbeams",
  "history/feel-debate": "two empty armchairs facing each other by a fireplace in a gentlemen's club, books, candlelight",
  "history/feel-adventure": "a tall sailing ship on stormy seas at dawn",
  "history/feel-story": "a foggy Victorian London street at night with gas lamps and a horse carriage",
  "history/scene-forum": "the ancient Roman Forum on a spring morning with marble columns, temples and blurred crowds in togas",
  "history/scene-workshop": "a cluttered Renaissance workshop in Florence with sketches, wooden machines and a window over terracotta roofs, no people",
  "history/scene-salon": "a glittering 1890s Paris salon with candlelight, a grand piano and blurred elegant guests",
  "history/scene-fog": "a foggy Victorian London street at night with gas lamps and a lone figure in a top hat seen from behind",
  "history/setting-study": "a candle-lit study with bookshelves, a skull and a globe, no people",
  "history/setting-court": "a royal court ballroom with chandeliers and courtiers in the distance, blurred figures",
  "history/setting-lab": "an old chemistry laboratory with glass flasks, glowing liquids and brass instruments, no people",
  "history/setting-studio": "an artist's studio with canvases, a piano and tall windows, afternoon light, no people",
};

const root = path.resolve(import.meta.dirname, "..");

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const only = args.filter((a) => !a.startsWith("--"));
  const keys = [...new Set(quizImages())];

  const missingPrompt = keys.filter((k) => !prompts[k]);
  if (missingPrompt.length) throw new Error(`No prompt for: ${missingPrompt.join(", ")}`);

  const targets = keys.filter((k) =>
    only.length ? only.includes(k) : force || !existsSync(path.join(root, "public/quiz", `${k}.jpg`)),
  );
  if (!targets.length) return console.log("Nothing to generate. Use --force to regenerate.");

  let failures = 0;
  // A few at a time keeps it quick without hammering the API.
  for (let i = 0; i < targets.length; i += 4) {
    await Promise.all(
      targets.slice(i, i + 4).map(async (key) => {
        const segment = key.split("/")[0] as keyof typeof STYLE;
        const square = key.includes("/info-");
        try {
          const image = await generateImage({
            prompt: `${prompts[key]}. ${STYLE[segment]}`,
            size: square ? "square_hd" : "portrait_4_3",
          });
          const res = await fetch(image.url);
          if (!res.ok) throw new Error(`download failed: ${res.status}`);
          const file = path.join(root, "public/quiz", `${key}.jpg`);
          await mkdir(path.dirname(file), { recursive: true });
          await writeFile(file, Buffer.from(await res.arrayBuffer()));
          // Keep the files light: the static site serves them unoptimised.
          execFileSync("sips", ["-Z", square ? "720" : "640", "-s", "formatOptions", "78", file], { stdio: "ignore" });
          console.log(`✓ ${key}`);
        } catch (err) {
          failures++;
          console.log(`✗ ${key}: ${(err as Error).message}`);
        }
      }),
    );
  }
  console.log(failures ? `${failures} failed.` : `Saved ${targets.length} images to public/quiz/.`);
  if (failures) process.exitCode = 1;
}

main();
