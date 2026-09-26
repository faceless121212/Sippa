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
        background: "linear-gradient(135deg, #14100E 0%, #2A221E 60%, #4A2A1E 100%)",
        color: "#F6EFE9",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <svg width="96" height="96" viewBox="0 0 32 32">
          <path
            d="M12 4 q-2 2.5 0 5 M16.5 3.5 q-2 3 0 6"
            stroke="#E8A35C"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M6 12 h17 v6 a7 7 0 0 1 -7 7 h-3 a7 7 0 0 1 -7 -7 z" fill="#E8A35C" />
          <path d="M23 14 h1.3 a3 3 0 0 1 0 6 H22.5" stroke="#E8A35C" strokeWidth="2.2" fill="none" />
        </svg>
        <div style={{ fontSize: 96, fontWeight: 700 }}>{siteConfig.name}</div>
      </div>
      <div style={{ marginTop: 32, fontSize: 56, color: "#E8A35C" }}>{siteConfig.tagline}</div>
      <div style={{ marginTop: 24, fontSize: 32, color: "#A89A90" }}>
        Lovers · Friends · Famous minds — chat or create your own AI character.
      </div>
    </div>,
    size,
  );
}
