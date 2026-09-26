import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#000000",
        color: "#FFFFFF",
      }}
    >
      <div style={{ display: "flex", fontSize: 140, fontWeight: 800, letterSpacing: "-0.05em" }}>
        sippa<span style={{ color: "#C3FF00" }}>.</span>
      </div>
      <div style={{ marginTop: 32, fontSize: 56, color: "#C3FF00" }}>{siteConfig.tagline}</div>
      <div style={{ marginTop: 24, fontSize: 32, color: "#B3B3B3" }}>
        Lovers · Friends · Famous minds — chat or create your own AI character.
      </div>
    </div>,
    size,
  );
}
