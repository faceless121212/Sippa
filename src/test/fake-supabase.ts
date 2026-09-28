/**
 * In-memory stand-in for the Supabase query builder, for speed/regression tests.
 *
 * Every awaited query waits `latencyMs`, like a real network round-trip. Queries that
 * start while a round is in flight share it (they'd run in parallel on a real network);
 * a query started after it finishes opens a new round. Tests assert how many sequential
 * rounds a loader needs, so a change that turns parallel queries back into a waterfall
 * fails — independent of how fast or busy the machine is.
 */
type Row = Record<string, unknown>;

export function createFakeSupabase(tables: Record<string, Row[]>, latencyMs = 20) {
  const log: string[] = [];
  let current: Promise<void> | null = null;
  let roundCount = 0;
  const joinRound = () => {
    if (!current) {
      roundCount++;
      current = new Promise((r) =>
        setTimeout(() => {
          current = null;
          r();
        }, latencyMs),
      );
    }
    return current;
  };

  function from(table: string) {
    const filters: ((r: Row) => boolean)[] = [];
    // Filters on embedded rows ("rel.col"): trim the nested array, keep the parent row.
    const nested: ((r: Row) => Row)[] = [];
    let op: "select" | "insert" | "update" = "select";
    let payload: Row | Row[] = {};
    let head = false;
    let countEmbeds: string[] = [];
    let limitN: number | undefined;
    let orderBy: { col: string; asc: boolean } | undefined;

    const run = async (single: boolean) => {
      log.push(`${op}:${table}`);
      await joinRound();
      const rows = (tables[table] ??= []);
      if (op === "insert") {
        const added = (Array.isArray(payload) ? payload : [payload]).map((r, i) => ({
          id: `${table}-${rows.length + i + 1}`,
          ...r,
        }));
        rows.push(...added);
        return { data: single ? added[0] : added, error: null };
      }
      if (op === "update") {
        rows.filter((r) => filters.every((f) => f(r))).forEach((r) => Object.assign(r, payload));
        return { data: null, error: null };
      }
      let out = rows.filter((r) => filters.every((f) => f(r)));
      if (orderBy) {
        const { col, asc } = orderBy;
        out = [...out].sort((a, b) => (a[col]! < b[col]! ? -1 : a[col]! > b[col]! ? 1 : 0) * (asc ? 1 : -1));
      }
      if (head) return { data: null, count: out.length, error: null };
      if (limitN !== undefined) out = out.slice(0, limitN);
      out = out.map((r) => nested.reduce((acc, f) => f(acc), r));
      if (countEmbeds.length) {
        const fk = `${table.replace(/s$/, "")}_id`;
        out = out.map((r) => ({
          ...r,
          ...Object.fromEntries(
            countEmbeds.map((rel) => [
              rel,
              [{ count: (tables[rel] ?? []).filter((x) => x[fk] === r.id).length }],
            ]),
          ),
        }));
      }
      return { data: single ? (out[0] ?? null) : out, count: out.length, error: null };
    };

    const q = {
      select: (cols?: string, opts?: { head?: boolean }) => {
        head = Boolean(opts?.head);
        // Embedded counts like "chats(count)": computed from the related table via <table>_id.
        countEmbeds = [...(cols ?? "").matchAll(/(\w+)\(count\)/g)].map((m) => m[1]);
        return q;
      },
      eq: (k: string, v: unknown) => {
        const [rel, col] = k.split(".");
        if (col)
          nested.push((r) => ({
            ...r,
            [rel]: ((r[rel] as Row[] | undefined) ?? []).filter((x) => x[col] === v),
          }));
        else filters.push((r) => r[k] === v);
        return q;
      },
      neq: (k: string, v: unknown) => (filters.push((r) => r[k] !== v), q),
      in: (k: string, vs: unknown[]) => (filters.push((r) => vs.includes(r[k])), q),
      is: (k: string, v: unknown) => (filters.push((r) => (r[k] ?? null) === v), q),
      not: (k: string, _op: "is", v: unknown) => (filters.push((r) => (r[k] ?? null) !== v), q),
      gte: (k: string, v: string | number) => (filters.push((r) => (r[k] as string | number) >= v), q),
      order: (col: string, o?: { ascending?: boolean }) => (
        (orderBy = { col, asc: o?.ascending ?? true }),
        q
      ),
      limit: (n: number) => ((limitN = n), q),
      insert: (p: Row | Row[]) => ((op = "insert"), (payload = p), q),
      // Upsert with ignoreDuplicates: rows whose conflict key already exists are skipped.
      upsert: (p: Row | Row[], o?: { onConflict?: string }) => {
        op = "insert";
        const keys = o?.onConflict?.split(",") ?? [];
        const existing = (tables[table] ??= []);
        payload = (Array.isArray(p) ? p : [p]).filter(
          (r) => !keys.length || !existing.some((e) => keys.every((k) => e[k] === r[k])),
        );
        return q;
      },
      update: (p: Row) => ((op = "update"), (payload = p), q),
      maybeSingle: () => run(true),
      single: () => run(true),
      then: <T>(res: (v: Awaited<ReturnType<typeof run>>) => T, rej?: (e: unknown) => T) =>
        run(false).then(res, rej),
    };
    return q;
  }

  /** Runs `fn` and reports how many sequential round-trips it took. */
  async function rounds<T>(fn: () => Promise<T>): Promise<{ result: T; rounds: number; queries: string[] }> {
    log.length = 0;
    roundCount = 0;
    const result = await fn();
    return { result, rounds: roundCount, queries: [...log] };
  }

  return { client: { from }, from, log, rounds };
}
