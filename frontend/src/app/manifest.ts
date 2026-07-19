import type { MetadataRoute } from "next";

// Web App Manifest (P-01). Lean PWA: installability + offline app-shell; no web-push
// (the Expo app owns push). Icons generated from the brand seal into public/.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Scorred",
    short_name: "Scorred",
    description: "Community-first platform for hobby collectors — showcase, discover, connect, trade.",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF", // --paper (splash bg)
    theme_color: "#FFFFFF", // matches the --paper AppBar chrome
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
