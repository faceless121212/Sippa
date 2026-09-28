import type { NextConfig } from "next";

// User-created portraits live in Supabase Storage; allow next/image to optimise them.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  // e2e builds go to their own folder so they never clobber a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // Keep pages you just visited for 30 s in the browser, so going back to a section or a chat
    // is instant. Every change clears this cache (revalidatePath in server actions,
    // router.refresh() after API calls), so you never see stale data after doing something.
    staleTimes: { dynamic: 30 },
  },
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/avatars/**" }]
      : [],
  },
};

export default nextConfig;
