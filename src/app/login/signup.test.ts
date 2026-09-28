import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "@/test/fake-supabase";

const tables: Record<string, Record<string, unknown>[]> = {};
const fake = createFakeSupabase(tables, 0);
const users = new Map<string, { email_confirmed_at: string | null }>();
const signUp = vi.fn();

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7", host: "sippa.tech" }),
  cookies: async () => ({ set: vi.fn(), get: vi.fn() }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfigured: true }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    ...fake.client,
    auth: { admin: { getUserById: async (id: string) => ({ data: { user: users.get(id) ?? null } }) } },
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { signUp } }) }));

const { signUp: signUpAction } = await import("./actions");

const form = (email: string) => {
  const f = new FormData();
  f.set("email", email);
  f.set("password", "sippa2026");
  f.set("dob", "1990-01-01");
  f.set("terms", "on");
  f.set("next", "/app");
  return f;
};

beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k];
  tables.profiles = [
    { id: "u-confirmed", email: "taken@example.com" },
    { id: "u-pending", email: "pending@example.com" },
  ];
  users.clear();
  users.set("u-confirmed", { email_confirmed_at: "2026-09-01T00:00:00Z" });
  users.set("u-pending", { email_confirmed_at: null });
  signUp.mockReset().mockResolvedValue({ data: { user: { identities: [{}] } }, error: null });
});

describe("sign-up with an email that's already used", () => {
  it("says the email is already registered, and creates nothing", async () => {
    const res = await signUpAction({ status: "idle" }, form("Taken@Example.com"));
    expect(res).toMatchObject({ status: "error", exists: "confirmed", email: "taken@example.com" });
    expect(res.message).toMatch(/already registered/);
    expect(signUp).not.toHaveBeenCalled();
  });

  it("points unconfirmed accounts to resending the confirmation", async () => {
    const res = await signUpAction({ status: "idle" }, form("pending@example.com"));
    expect(res).toMatchObject({ status: "error", exists: "unconfirmed" });
    expect(res.message).toMatch(/hasn't been confirmed/);
    expect(signUp).not.toHaveBeenCalled();
  });

  it("new emails sign up normally", async () => {
    const res = await signUpAction({ status: "idle" }, form("new@example.com"));
    expect(res).toEqual({ status: "check-email", email: "new@example.com" });
    expect(signUp).toHaveBeenCalledOnce();
  });

  it("falls back to Supabase's own signal (user with no identities)", async () => {
    signUp.mockResolvedValue({ data: { user: { identities: [] } }, error: null });
    const res = await signUpAction({ status: "idle" }, form("ghost@example.com"));
    expect(res).toMatchObject({ exists: "confirmed" });
  });
});
