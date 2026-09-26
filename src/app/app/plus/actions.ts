"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { STRIPE_ITEMS, type StripeItem } from "@/config/site";
import { requireAdult } from "@/lib/auth";
import { demoCancel, demoFulfil } from "@/lib/billing/demo";
import { paymentsMode } from "@/lib/billing/mode";

const itemSchema = z.enum(Object.keys(STRIPE_ITEMS) as [StripeItem, ...StripeItem[]]);

export async function confirmDemoPurchase(form: FormData) {
  const viewer = await requireAdult("/app/plus");
  if (paymentsMode() !== "demo") redirect("/app/plus");
  const item = itemSchema.parse(form.get("item"));
  const nonce = z.string().uuid().parse(form.get("nonce"));
  if (STRIPE_ITEMS[item].mode === "subscription" && viewer.profile?.plan === "plus") redirect("/app/plus");
  const result = await demoFulfil(viewer.user.id, item, nonce);
  redirect(`/app/plus/success?demo=${result.kind}${result.kind === "beans" ? `&beans=${result.beans}` : ""}`);
}

export async function cancelDemoPlus() {
  const viewer = await requireAdult("/app/plus");
  if (paymentsMode() !== "demo") redirect("/app/plus");
  await demoCancel(viewer.user.id);
  redirect("/app/plus");
}
