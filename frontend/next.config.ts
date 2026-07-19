import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Add-item flow moved off the market namespace (query strings carry over).
    return [{ source: "/market/new", destination: "/add/catalogue", permanent: false }];
  },
  // Service-worker headers (P-03, per the Next PWA guide): never cache sw.js so
  // updates ship immediately; serve it as JS scoped to the origin.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
