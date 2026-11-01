import { AdminShell } from "./_console/Shell";
import "./admin.css";

// Admin console (Claude Design "Scorred Admin Console"): Montserrat 800/900 is
// the design's display face — loaded for the console only. Plain stylesheet, NOT
// next/font/google: Turbopack's font loader intermittently failed the Vercel build
// on it ("Can't resolve '@vercel/turbopack-next/internal/font/google/font'").
// admin.css falls back to the "Montserrat" family when --adm-disp is unset.
const MONTSERRAT = "https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=swap";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={MONTSERRAT} precedence="default" />
      <AdminShell fontClass="">{children}</AdminShell>
    </>
  );
}
