import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino-pretty", "lokijs", "encoding"],
  outputFileTracingIncludes: {
    "/*": ["./data/generated/**/*"],
  },
};

export default nextConfig;

// OpenNext wrangler hook is local Cloudflare Workers dev only.
// Vercel/Netlify must not start it or the Next build can fail.
if (!process.env.VERCEL && !process.env.NETLIFY) {
  const { initOpenNextCloudflareForDev } = await import("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
}
