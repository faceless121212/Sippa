import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addToFile } from "./store";

describe("addToFile", () => {
  it("stores entries and ignores duplicates", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "sippa-waitlist-"));
    const file = path.join(dir, "nested", "waitlist.json");
    await addToFile(file, { email: "a@example.com", consent: true });
    await addToFile(file, { email: "a@example.com", consent: true });
    await addToFile(file, { email: "b@example.com", consent: true, source: "landing" });
    const rows = JSON.parse(await readFile(file, "utf8"));
    expect(rows.map((r: { email: string }) => r.email)).toEqual(["a@example.com", "b@example.com"]);
    expect(rows[1].source).toBe("landing");
    expect(typeof rows[0].created_at).toBe("string");
  });
});
