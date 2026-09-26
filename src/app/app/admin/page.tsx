import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { buttonClass } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { REPORT_REASONS } from "@/lib/report";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";
import {
  approveCharacter,
  dismissReport,
  hideCharacter,
  rejectCharacter,
  restoreCharacter,
  setBan,
} from "./actions";

export const metadata: Metadata = { title: "Moderation", robots: { index: false } };

const TABS = [
  { id: "reports", label: "Reports" },
  { id: "pending", label: "Pending public" },
  { id: "hidden", label: "Hidden" },
  { id: "users", label: "Users" },
  { id: "audit", label: "Audit log" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const reasonLabel = (id: string) => REPORT_REASONS.find((r) => r.id === id)?.label ?? id;
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const tab: Tab = TABS.some((t) => t.id === sp.tab) ? (sp.tab as Tab) : "reports";
  const admin = createAdminClient();

  const [{ count: openCount }, { count: pendingCount }] = await Promise.all([
    admin.from("reports").select("id", { count: "exact", head: true }).in("status", ["open", "auto_hidden"]),
    admin.from("characters").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:py-8">
      <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-[-0.03em]">
        <ShieldCheck className="h-7 w-7" aria-hidden="true" /> Moderation
      </h1>
      <nav aria-label="Moderation sections" className="no-scrollbar mt-5 overflow-x-auto">
        <ul className="flex gap-2">
          {TABS.map((t) => {
            const badge = t.id === "reports" ? openCount : t.id === "pending" ? pendingCount : null;
            return (
              <li key={t.id} className="shrink-0">
                <Link
                  href={`/app/admin?tab=${t.id}`}
                  aria-current={tab === t.id ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-semibold",
                    tab === t.id ? "border-text bg-text text-bg" : "border-border hover:bg-surface",
                  )}
                >
                  {t.label}
                  {badge ? (
                    <span className="bg-primary rounded px-1.5 text-[11px] font-bold text-black">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-6">
        {tab === "reports" && <Reports />}
        {tab === "pending" && <Pending />}
        {tab === "hidden" && <Hidden />}
        {tab === "users" && <Users q={sp.q} />}
        {tab === "audit" && <Audit />}
      </div>
    </div>
  );
}

async function Reports() {
  const admin = createAdminClient();
  const { data: reports } = await admin
    .from("reports")
    .select("id,target_type,target_id,reason,details,status,auto_verdict,created_at,reporter_id")
    .in("status", ["open", "auto_hidden"])
    .order("created_at", { ascending: false })
    .limit(100);
  if (!reports?.length) return <Empty text="No open reports. ☕" />;

  const charIds = reports.filter((r) => r.target_type === "character").map((r) => r.target_id);
  const msgIds = reports
    .filter((r) => r.target_type === "message")
    .map((r) => Number(r.target_id))
    .filter(Number.isSafeInteger);
  const [{ data: chars }, { data: msgs }] = await Promise.all([
    charIds.length
      ? admin.from("characters").select("id,name,hook,status,creator_id,avatar_url").in("id", charIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            name: string;
            hook: string;
            status: string;
            creator_id: string | null;
            avatar_url: string | null;
          }[],
        }),
    msgIds.length
      ? admin.from("messages").select("id,content,chat_id,chats(user_id,character_id)").in("id", msgIds)
      : Promise.resolve({ data: [] as { id: number; content: string; chat_id: string; chats: unknown }[] }),
  ]);

  return (
    <ul className="space-y-3">
      {reports.map((r) => {
        const c = chars?.find((x) => x.id === r.target_id);
        const m = msgs?.find((x) => String(x.id) === r.target_id);
        const verdict = r.auto_verdict as {
          review?: { allowed: boolean; explanation: string };
          violates?: boolean;
          explanation?: string;
          openReports?: number;
        } | null;
        return (
          <li key={r.id} className="border-border bg-surface rounded-xl border p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-lover/15 text-lover-ink rounded-md px-2 py-0.5 font-bold">
                {reasonLabel(r.reason)}
              </span>
              <span className="bg-surface-2 rounded-md px-2 py-0.5 font-semibold">{r.target_type}</span>
              {r.status === "auto_hidden" && (
                <span className="rounded-md bg-black px-2 py-0.5 font-bold text-white">auto-hidden</span>
              )}
              <span className="text-muted ml-auto">{when(r.created_at)}</span>
            </div>
            {c && (
              <div className="mt-3 flex items-center gap-3">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                  <CharacterAvatar id={c.id} name={c.name} src={c.avatar_url} sizes="48px" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/app/c/${c.id}`} className="font-bold hover:underline">
                    {c.name}
                  </Link>{" "}
                  <span className="text-muted text-xs">
                    ({c.status}
                    {c.creator_id ? "" : ", official"})
                  </span>
                  <p className="text-muted truncate text-sm">{c.hook}</p>
                </div>
              </div>
            )}
            {m && (
              <blockquote className="bg-bg mt-3 rounded-lg p-3 text-sm whitespace-pre-wrap">
                {m.content.slice(0, 600)}
              </blockquote>
            )}
            {r.details && <p className="mt-2 text-sm">“{r.details}”</p>}
            {verdict && (
              <p className="text-muted mt-2 text-xs">
                Auto-review:{" "}
                {verdict.review
                  ? verdict.review.allowed
                    ? "looks fine"
                    : `violation — ${verdict.review.explanation}`
                  : verdict.violates !== undefined
                    ? verdict.violates
                      ? `violation — ${verdict.explanation}`
                      : "looks fine"
                    : "not available"}
                {verdict.openReports ? ` · ${verdict.openReports} open report(s)` : ""}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={dismissReport}>
                <input type="hidden" name="report_id" value={r.id} />
                <button className={buttonClass({ variant: "secondary", size: "sm" })}>
                  {r.status === "auto_hidden" ? "Dismiss & restore" : "Dismiss"}
                </button>
              </form>
              {c && c.status !== "hidden" && (
                <form action={hideCharacter}>
                  <input type="hidden" name="character_id" value={c.id} />
                  <input type="hidden" name="note" value={`Report: ${reasonLabel(r.reason)}`} />
                  <button className={buttonClass({ size: "sm" })}>Hide character</button>
                </form>
              )}
              {c?.creator_id && <BanButton userId={c.creator_id} label="Ban creator" />}
              {m && (
                <BanButton
                  userId={(m.chats as { user_id: string } | null)?.user_id}
                  label="Ban sender's account"
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function BanButton({ userId, label }: { userId?: string; label: string }) {
  if (!userId) return null;
  return (
    <form action={setBan}>
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="ban" value="1" />
      <button className={buttonClass({ variant: "ghost", size: "sm", className: "text-lover-ink" })}>
        {label}
      </button>
    </form>
  );
}

async function Pending() {
  const { data } = await createAdminClient()
    .from("characters")
    .select("id,name,age,category,hook,description,tags,avatar_url,created_at")
    .eq("status", "pending")
    .order("created_at");
  if (!data?.length) return <Empty text="Nothing waiting for review." />;
  return (
    <ul className="space-y-3">
      {data.map((c) => (
        <li key={c.id} className="border-border bg-surface flex flex-wrap gap-4 rounded-xl border p-4">
          <span className="h-24 w-18 shrink-0 overflow-hidden rounded-lg">
            <CharacterAvatar id={c.id} name={c.name} src={c.avatar_url} sizes="72px" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">
              <Link href={`/app/c/${c.id}`} className="hover:underline">
                {c.name}
              </Link>
              {c.age ? <span className="text-muted font-normal">, {c.age}</span> : null}{" "}
              <span className="text-muted text-xs font-normal">· {c.category}</span>
            </p>
            <p className="text-sm">{c.hook}</p>
            <p className="text-muted mt-1 text-sm">{c.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={approveCharacter}>
                <input type="hidden" name="character_id" value={c.id} />
                <button className={buttonClass({ size: "sm" })}>Approve for Explore</button>
              </form>
              <form action={rejectCharacter} className="flex gap-2">
                <input type="hidden" name="character_id" value={c.id} />
                <label className="sr-only" htmlFor={`note-${c.id}`}>
                  Reason
                </label>
                <input
                  id={`note-${c.id}`}
                  name="note"
                  placeholder="Reason (optional)"
                  className="border-border bg-bg h-9 rounded-lg border px-2 text-sm"
                />
                <button className={buttonClass({ variant: "secondary", size: "sm" })}>Keep unlisted</button>
              </form>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

async function Hidden() {
  const { data } = await createAdminClient()
    .from("characters")
    .select("id,name,hook,moderation_note,avatar_url,updated_at")
    .eq("status", "hidden")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (!data?.length) return <Empty text="No hidden characters." />;
  return (
    <ul className="space-y-2">
      {data.map((c) => (
        <li key={c.id} className="border-border bg-surface flex items-center gap-3 rounded-xl border p-3">
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
            <CharacterAvatar id={c.id} name={c.name} src={c.avatar_url} sizes="40px" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{c.name}</p>
            <p className="text-muted truncate text-xs">{c.moderation_note}</p>
          </div>
          <form action={restoreCharacter}>
            <input type="hidden" name="character_id" value={c.id} />
            <button className={buttonClass({ variant: "secondary", size: "sm" })}>Restore</button>
          </form>
        </li>
      ))}
    </ul>
  );
}

async function Users({ q }: { q?: string }) {
  const admin = createAdminClient();
  const term = q?.trim().toLowerCase().slice(0, 100);
  let req = admin
    .from("profiles")
    .select("id,email,display_name,plan,beans,banned_at,is_admin,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (term) req = req.ilike("email", `%${term.replace(/[%_]/g, "")}%`);
  const { data } = await req;
  return (
    <div>
      <form className="flex gap-2" action="/app/admin">
        <input type="hidden" name="tab" value="users" />
        <label htmlFor="user-q" className="sr-only">
          Search by email
        </label>
        <input
          id="user-q"
          name="q"
          defaultValue={q}
          placeholder="Search by email"
          className="border-border bg-surface h-10 flex-1 rounded-lg border px-3 text-sm"
        />
        <button className={buttonClass({ variant: "secondary" })}>Search</button>
      </form>
      <ul className="divide-border border-border mt-4 divide-y rounded-xl border">
        {(data ?? []).map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{u.email}</p>
              <p className="text-muted text-xs">
                {u.plan} · {u.beans} Flowers{u.is_admin ? " · admin" : ""}
                {u.banned_at ? ` · banned ${when(u.banned_at)}` : ""}
              </p>
            </div>
            {!u.is_admin && (
              <form action={setBan}>
                <input type="hidden" name="user_id" value={u.id} />
                <input type="hidden" name="ban" value={u.banned_at ? "0" : "1"} />
                <button
                  className={buttonClass({
                    variant: u.banned_at ? "secondary" : "ghost",
                    size: "sm",
                    className: u.banned_at ? "" : "text-lover-ink",
                  })}
                >
                  {u.banned_at ? "Unban" : "Ban"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

async function Audit() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("audit_log")
    .select("id,actor_id,action,target_type,target_id,meta,created_at")
    .order("id", { ascending: false })
    .limit(100);
  const actorIds = Array.from(new Set((data ?? []).map((a) => a.actor_id).filter(Boolean))) as string[];
  const { data: actors } = actorIds.length
    ? await admin.from("profiles").select("id,email").in("id", actorIds)
    : { data: [] as { id: string; email: string }[] };
  if (!data?.length) return <Empty text="No actions yet." />;
  return (
    <ol className="divide-border border-border divide-y rounded-xl border text-sm">
      {data.map((a) => (
        <li key={a.id} className="flex flex-wrap gap-x-3 gap-y-1 p-3">
          <span className="text-muted w-28 shrink-0 text-xs">{when(a.created_at)}</span>
          <span className="font-semibold">{a.action}</span>
          <span className="text-muted">
            {a.target_type} {a.target_id.slice(0, 24)}
          </span>
          <span className="text-muted ml-auto text-xs">
            {a.actor_id ? (actors?.find((x) => x.id === a.actor_id)?.email ?? "admin") : "automated"}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="text-muted border-border rounded-xl border border-dashed p-10 text-center text-sm">
      {text}
    </p>
  );
}
