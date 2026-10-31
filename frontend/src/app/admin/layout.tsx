import { Montserrat } from "next/font/google";
import { AdminShell } from "./_console/Shell";
import "./admin.css";

// Admin console (Claude Design "Scorred Admin Console"): Montserrat 800/900 is
// the design's display face — loaded for the console only.
const display = Montserrat({ subsets: ["latin"], weight: ["800", "900"], variable: "--adm-disp" });

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell fontClass={display.variable}>{children}</AdminShell>;
}
