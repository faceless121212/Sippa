/**
 * Turns the landing page into a static site for GitHub Pages.
 *
 * Sippa's app needs a server (auth, chat, database), so only the public pages are
 * exported: the landing page, legal pages and icons. It saves what a running
 * production server renders, plus the JS/CSS bundle and public files, then checks
 * that every file the HTML refers to exists.
 *
 *   SERVER=http://localhost:3300 BASE_PATH=/Sippa DIST=.next-pages OUT=out-pages npx tsx scripts/export-landing.ts
 *
 * The server must be built with NEXT_PUBLIC_STATIC_LANDING=1 and the same BASE_PATH
 * (see .github/workflows/pages.yml).
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const SERVER = process.env.SERVER ?? "http://localhost:3300";
const BASE_PATH = process.env.BASE_PATH ?? "/Sippa";
const DIST = process.env.DIST ?? ".next-pages";
const OUT = process.env.OUT ?? "out-pages";

const PAGES = ["/", "/legal/privacy", "/legal/terms", "/legal/cookies", "/legal/guidelines"];
const FILES = [
  "/icon.svg",
  "/apple-icon",
  "/opengraph-image",
  "/manifest.webmanifest",
  "/pwa-icon/192",
  "/pwa-icon/512",
  "/pwa-icon/512-maskable",
];

async function get(path: string) {
  // With a base path, the home page is "/Sippa" (the trailing-slash form redirects).
  const url = SERVER + BASE_PATH + (path === "/" && BASE_PATH ? "" : path);
  const res = await fetch(url, { redirect: "manual" });
  return res;
}

function write(rel: string, data: Buffer | string) {
  const file = join(OUT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
}

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  for (const page of PAGES) {
    const res = await get(page);
    if (res.status !== 200) throw new Error(`${page} returned ${res.status}`);
    const html = await res.text();
    if (page === "/") write("index.html", html);
    else {
      // Both /legal/privacy (served from privacy.html) and /legal/privacy/ work on Pages.
      write(`${page.slice(1)}.html`, html);
      write(`${page.slice(1)}/index.html`, html);
    }
  }
  for (const file of FILES) {
    const res = await get(file);
    if (res.status !== 200) throw new Error(`${file} returned ${res.status}`);
    write(file.slice(1), Buffer.from(await res.arrayBuffer()));
  }
  // The site's 404 page (GitHub Pages serves 404.html for unknown paths).
  write("404.html", await (await get("/__not-found__")).text());

  cpSync(join(DIST, "static"), join(OUT, "_next", "static"), { recursive: true });
  cpSync("public", OUT, { recursive: true });
  writeFileSync(join(OUT, ".nojekyll"), ""); // let Pages serve the _next folder

  // Every asset the pages reference must exist in the export.
  const missing = new Set<string>();
  for (const page of ["index.html", "legal/privacy.html"]) {
    const html = readFileSync(join(OUT, page), "utf8");
    for (const [, ref] of html.matchAll(new RegExp(`["'(](${BASE_PATH}/[^"'()?#\\s]+)`, "g"))) {
      // References inside embedded JSON end in an escaped quote (\) and may be URL-encoded.
      const rel = decodeURIComponent(ref.slice(BASE_PATH.length + 1).replace(/\\+$/, ""));
      if (!rel || PAGES.includes(`/${rel}`) || rel.startsWith("legal/")) continue;
      if (!existsSync(join(OUT, rel))) missing.add(rel);
    }
  }
  if (missing.size) throw new Error(`Missing from export:\n${[...missing].slice(0, 20).join("\n")}`);
  console.log(`Exported ${PAGES.length} pages to ${OUT}/ — all referenced assets present.`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
