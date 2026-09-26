"use client";

import { Flag, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { REPORT_REASONS } from "@/lib/report";
import { buttonClass } from "../ui/button";

/** Report flow (spec §6.8): pick a reason, optional details, sent to the moderation queue. */
export function ReportButton({
  targetType,
  targetId,
  label = "Report",
}: {
  targetType: "character" | "message";
  targetId: string;
  label?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const d = dialog.current;
    const reset = () => setStatus("idle");
    d?.addEventListener("close", reset);
    return () => d?.removeEventListener("close", reset);
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("sending");
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_type: targetType,
        target_id: targetId,
        reason: form.get("reason"),
        details: String(form.get("details") ?? "") || undefined,
      }),
    }).catch(() => null);
    if (res?.ok) return setStatus("done");
    const data = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    setMessage(data?.error ?? "Couldn't send. Try again.");
    setStatus("error");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={buttonClass({ variant: "ghost", size: "sm", className: "text-muted" })}
      >
        <Flag className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="report-title"
        className="bg-bg text-text border-border m-auto w-[min(92vw,420px)] rounded-2xl border p-0 backdrop:bg-black/50"
      >
        <div className="p-5">
          <div className="flex items-center justify-between">
            <h2 id="report-title" className="text-lg font-extrabold">
              Report
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className="hover:bg-surface-2 rounded-lg p-1.5"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {status === "done" ? (
            <p role="status" className="mt-4 text-sm">
              Thanks — our team will review it. Clear violations are hidden automatically.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-3">
              <fieldset className="space-y-1.5">
                <legend className="mb-2 text-sm font-semibold">What&apos;s wrong?</legend>
                {REPORT_REASONS.map((r, i) => (
                  <label
                    key={r.id}
                    className="hover:bg-surface flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      required
                      defaultChecked={i === 0}
                      className="accent-[var(--text)]"
                    />
                    {r.label}
                  </label>
                ))}
              </fieldset>
              <label className="block text-sm font-semibold">
                Details <span className="text-muted font-normal">(optional)</span>
                <textarea
                  name="details"
                  maxLength={1000}
                  rows={3}
                  className="border-border bg-surface focus:border-text mt-1.5 w-full rounded-lg border p-3 text-sm font-normal focus:outline-none"
                />
              </label>
              {status === "error" && (
                <p role="alert" className="text-lover-ink text-sm font-medium">
                  {message}
                </p>
              )}
              <button
                type="submit"
                disabled={status === "sending"}
                className={buttonClass({ className: "w-full" })}
              >
                {status === "sending" ? "Sending…" : "Send report"}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
