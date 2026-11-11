import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { Analytics } from "@/components/Analytics";
import { PHProvider } from "@/components/PHProvider";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

// Plain Google Fonts stylesheet, NOT next/font/google: Turbopack's font loader keeps
// failing Vercel builds ("Can't resolve '@vercel/turbopack-next/internal/font/google/font'",
// Montserrat in admin 2026-11-01, JetBrains Mono here 2026-11-11). The --font-geist-sans /
// --font-geist-mono / --font-jetbrains variables globals.css binds to are set on :root there.
const FONTS = "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&family=JetBrains+Mono:wght@400;500;600&display=swap";

export const metadata: Metadata = {
  title: "Scorred",
  description: "Community-first platform for hobby collectors — showcase, discover, connect, trade.",
  // manifest link is injected automatically from app/manifest.ts.
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Scorred" },
  icons: { apple: "/apple-touch-icon.png" },
};

// viewport-fit=cover lets the env(safe-area-inset-*) pads in the mobile chrome
// actually take effect in standalone/notch (PWA). themeColor matches the AppBar.
export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      {/* suppressHydrationWarning: extensions (Grammarly et al.) inject attributes
          onto <body> before hydration — suppresses the attribute-mismatch noise on
          this element only, one level deep. It does NOT hide real mismatches in the tree. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ServiceWorker />
        <PHProvider>
          <AuthProvider>
            <Analytics />
            {children}
          </AuthProvider>
        </PHProvider>
      </body>
    </html>
  );
}
