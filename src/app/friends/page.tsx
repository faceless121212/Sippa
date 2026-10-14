import type { Metadata } from "next";
import { SegmentLanding } from "@/components/segments/SegmentLanding";

export const metadata: Metadata = {
  title: { absolute: "Sippa Friends — an AI friend who's always there" },
  description: "Study buddies, gaming partners and late-night listeners who remember what matters to you.",
  alternates: { canonical: "/friends" },
};

export default function Page() {
  return <SegmentLanding id="friends" />;
}
