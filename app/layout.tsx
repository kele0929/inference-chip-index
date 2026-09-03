import type { Metadata } from "next";
import type { ReactNode } from "react";
import { datasetStatus } from "@/lib/dataset";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inference Chip Index",
  description:
    "Find the fastest verified inference hardware for your workload. Rankings compare an exact MLPerf Inference v6.0 Closed slice only.",
};

const links = [
  ["Leaderboard", "/leaderboard"],
  ["Methodology", "/methodology"],
  ["API", "/api-docs"],
  ["Updates", "/updates"],
] as const;

export default function RootLayout({ children }: { children: ReactNode }) {
  const status = datasetStatus();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,650&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a className="sr-only focus:not-sr-only" href="#content">
          Skip to content
        </a>
        <header className="border-b border-[var(--rule)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-4">
            <div>
              <p className="mono text-[11px] tracking-[0.18em] uppercase text-[var(--muted)]">
                Inference Chip Index
              </p>
              <p className="serif text-xl leading-tight">Exact-slice MLPerf v6.0 Closed</p>
            </div>
            <nav aria-label="Primary" className="flex flex-wrap gap-4 text-sm">
              {links.map(([label, href]) => (
                <a key={href} href={href} className="underline-offset-4 hover:underline">
                  {label}
                </a>
              ))}
            </nav>
          </div>
          <div className="border-t border-[var(--rule)] bg-[#efe8d8]">
            <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 py-2 text-[11px] sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <dt className="text-[var(--muted)]">Release</dt>
                <dd className="mono">{status.manifest.release} / {status.manifest.division}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Source commit</dt>
                <dd className="mono">
                  <a className="underline" href={`${status.manifest.sourceRepository}/commit/${status.sourceCommit}`}>
                    {status.sourceCommit.slice(0, 12)}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Last reviewed</dt>
                <dd className="mono">{status.manifest.lastReviewedAt}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Freshness</dt>
                <dd className="mono">{status.freshnessState}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Published results</dt>
                <dd className="mono">{status.counts.publishedResults}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Slices</dt>
                <dd className="mono">{status.counts.slices}</dd>
              </div>
            </dl>
          </div>
        </header>
        <main id="content">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-[var(--muted)]">
          Official MLPerf numbers stay attached to their source commit. No chip is claimed to be universally fastest.
        </footer>
      </body>
    </html>
  );
}
