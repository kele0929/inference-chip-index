import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino-pretty", "lokijs", "encoding"],
  outputFileTracingIncludes: {
    "/*": ["./data/generated/**/*"],
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
