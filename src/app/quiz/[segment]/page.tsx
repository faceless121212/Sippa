import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Quiz } from "@/components/segments/Quiz";
import { isSegmentId, segmentIds, segments } from "@/config/segments";

type Props = { params: Promise<{ segment: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return segmentIds.map((segment) => ({ segment }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segment } = await params;
  if (!isSegmentId(segment)) return {};
  return { title: segments[segment].quizTitle, robots: { index: false } };
}

/** Ad → quiz → match → sign-up → offer → chat (the deck's main flow). No account needed for the quiz. */
export default async function QuizPage({ params }: Props) {
  const { segment } = await params;
  if (!isSegmentId(segment)) notFound();
  return <Quiz segment={segment} />;
}
