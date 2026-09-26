import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { legalSlugs } from "./legal/[slug]/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${siteConfig.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...legalSlugs.map((slug) => ({
      url: `${siteConfig.url}/legal/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
