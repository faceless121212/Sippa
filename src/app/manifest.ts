import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { withBase } from "@/lib/paths";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — AI characters`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: withBase("/"),
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#000000",
    icons: [
      { src: withBase("/pwa-icon/192"), sizes: "192x192", type: "image/png" },
      { src: withBase("/pwa-icon/512"), sizes: "512x512", type: "image/png" },
      { src: withBase("/pwa-icon/512-maskable"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
