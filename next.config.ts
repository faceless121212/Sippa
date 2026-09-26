import type { NextConfig } from "next";

// User-created portraits live in Supabase Storage; allow next/image to optimise them.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

const nextConfig: NextConfig = {
  // e2e builds go to their own folder so they never clobber a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/avatars/**" }]
      : [],
  },
};

export default nextConfig;
