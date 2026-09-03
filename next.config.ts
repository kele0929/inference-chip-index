import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino-pretty", "lokijs", "encoding"],
  outputFileTracingIncludes: {
    "/*": ["./data/generated/**/*"],
  },
};

export default nextConfig;

// OpenNext wrangler hook is local `next dev` for Workers only.
// Skip production builds and Vercel/Netlify so standard Next.js preview works.
if (
  process.env.NODE_ENV !== "production" &&
  !process.env.VERCEL &&
  !process.env.NETLIFY
) {
  initOpenNextCloudflareForDev();
}
