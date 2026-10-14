import type { Metadata } from "next";
import { SegmentLanding } from "@/components/segments/SegmentLanding";

export const metadata: Metadata = {
  title: { absolute: "Sippa History — talk to history's greatest minds" },
  description:
    "Debate Marcus Aurelius, ask Marie Curie about radium, or solve a case with a Victorian detective.",
  alternates: { canonical: "/history" },
};

export default function Page() {
  return <SegmentLanding id="history" />;
}
