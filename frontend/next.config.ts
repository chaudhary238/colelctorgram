import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Add-item flow moved off the market namespace (query strings carry over).
    return [{ source: "/market/new", destination: "/add/catalogue", permanent: false }];
  },
};

export default nextConfig;
