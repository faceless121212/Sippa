import type { Metadata } from "next";
import { SegmentLanding } from "@/components/segments/SegmentLanding";

export const metadata: Metadata = {
  title: { absolute: "Sippa Love — AI romance that remembers you" },
  description: "Slow burns and sweet flirting with AI characters who remember your day. 18+.",
  alternates: { canonical: "/love" },
};

export default function Page() {
  return <SegmentLanding id="love" />;
}
