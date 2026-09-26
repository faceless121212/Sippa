/**
 * Makes an existing account an admin (or removes admin with --revoke).
 *   npm run admin:grant -- you@example.com [--revoke]
 */
import { createClient } from "@supabase/supabase-js";

async function main() {
  const email = process.argv.slice(2).find((a) => a.includes("@"))?.toLowerCase();
  const revoke = process.argv.includes("--revoke");
  if (!email) throw new Error("Usage: npm run admin:grant -- you@example.com [--revoke]");
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await admin
    .from("profiles")
    .update({ is_admin: !revoke })
    .eq("email", email)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error(`No account with email ${email}. Sign up first.`);
  await admin.from("audit_log").insert({
    actor_id: null,
    action: revoke ? "admin.revoke" : "admin.grant",
    target_type: "user",
    target_id: data[0].id,
    meta: { via: "cli" },
  });
  console.log(`${revoke ? "Removed admin from" : "Granted admin to"} ${email}.`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
