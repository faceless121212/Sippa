/**
 * In-memory stand-in for the Supabase query builder, for speed/regression tests.
 *
 * Every awaited query takes `latencyMs`, like a real network round-trip. Tests
 * assert how many *sequential* rounds a loader needs (elapsed time / latency), so a
 * change that turns parallel queries back into a waterfall fails loudly.
 */
type Row = Record<string, unknown>;

export function createFakeSupabase(tables: Record<string, Row[]>, latencyMs = 20) {
  const log: string[] = [];

  function from(table: string) {
    const filters: ((r: Row) => boolean)[] = [];
    let op: "select" | "insert" | "update" = "select";
    let payload: Row | Row[] = {};
    let head = false;
    let limitN: number | undefined;
    let orderBy: { col: string; asc: boolean } | undefined;

    const run = async (single: boolean) => {
      log.push(`${op}:${table}`);
      await new Promise((r) => setTimeout(r, latencyMs));
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
      return { data: single ? (out[0] ?? null) : out, count: out.length, error: null };
    };

    const q = {
      select: (_cols?: string, opts?: { head?: boolean }) => ((head = Boolean(opts?.head)), q),
      eq: (k: string, v: unknown) => (filters.push((r) => r[k] === v), q),
      neq: (k: string, v: unknown) => (filters.push((r) => r[k] !== v), q),
      in: (k: string, vs: unknown[]) => (filters.push((r) => vs.includes(r[k])), q),
      is: (k: string, v: unknown) => (filters.push((r) => (r[k] ?? null) === v), q),
      order: (col: string, o?: { ascending?: boolean }) => ((orderBy = { col, asc: o?.ascending ?? true }), q),
      limit: (n: number) => ((limitN = n), q),
      insert: (p: Row | Row[]) => ((op = "insert"), (payload = p), q),
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
    const started = performance.now();
    const result = await fn();
    const elapsed = performance.now() - started;
    return { result, rounds: Math.round(elapsed / latencyMs), queries: [...log] };
  }

  return { client: { from }, from, log, rounds };
}
