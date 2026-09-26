import type { Metadata } from "next";
import { headers } from "next/headers";
import { CreatorWizard } from "@/components/creator/CreatorWizard";
import { categories, type CategoryId } from "@/config/categories";
import { siteConfig } from "@/config/site";
import { requireAdult } from "@/lib/auth";
import { countryFromHeaders, helplinesFor } from "@/lib/safety/crisis";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Create" };

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const viewer = await requireAdult("/app/create");
  const { category } = await searchParams;
  const { data } = await createAdminClient()
    .from("profiles")
    .select("free_creations_used")
    .eq("id", viewer.user.id)
    .maybeSingle();
  const plan = viewer.profile!.plan;
  const left =
    plan === "plus"
      ? null
      : Math.max(0, siteConfig.freeCharacterCreations - (data?.free_creations_used ?? 0));
  const initial = categories.some((c) => c.id === category) ? (category as CategoryId) : undefined;

  return (
    <CreatorWizard
      initialCategory={initial}
      adult={viewer.profile!.is_adult}
      creationsLeft={left}
      helplines={helplinesFor(countryFromHeaders(await headers())).lines}
    />
  );
}
