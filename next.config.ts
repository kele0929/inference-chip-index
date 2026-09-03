import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const isPages = process.env.GITHUB_PAGES === "1";
const basePath = isPages ? process.env.NEXT_PUBLIC_BASE_PATH || "/inference-chip-index" : "";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino-pretty", "lokijs", "encoding"],
  outputFileTracingIncludes: {
    "/*": ["./data/generated/**/*"],
  },
  ...(isPages
    ? {
        output: "export" as const,
        trailingSlash: true,
        basePath,
        assetPrefix: basePath || undefined,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;

// OpenNext wrangler hook is local `next dev` for Workers only.
// Skip production builds and Vercel/Netlify/GitHub Pages so standard Next.js preview works.
if (
  !isPages &&
  process.env.NODE_ENV !== "production" &&
  !process.env.VERCEL &&
  !process.env.NETLIFY
) {
  initOpenNextCloudflareForDev();
}
