import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { PHProvider } from "@/components/PHProvider";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorker />
        <PHProvider>
          <AuthProvider>{children}</AuthProvider>
        </PHProvider>
      </body>
    </html>
  );
}
