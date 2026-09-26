import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/ComingSoon";
import { requireAdult } from "@/lib/auth";

export const metadata: Metadata = { title: "Create" };

export default async function CreatePage() {
  await requireAdult("/app/create");
  return (
    <ComingSoon
      title="The Creator is brewing"
      body="Describe anyone in one line and Sippa builds them. Coming very soon."
    />
  );
}
