export const REPORT_REASONS = [
  { id: "minor", label: "Looks like or involves a minor" },
  { id: "real_person", label: "Impersonates a real person" },
  { id: "sexual", label: "Sexually explicit" },
  { id: "hate", label: "Hate or harassment" },
  { id: "self_harm", label: "Encourages self-harm" },
  { id: "spam", label: "Spam or scam" },
  { id: "other", label: "Something else" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["id"];
export const REPORT_REASON_IDS = REPORT_REASONS.map((r) => r.id) as [ReportReason, ...ReportReason[]];
