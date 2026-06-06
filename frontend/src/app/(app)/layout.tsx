import { Sidebar } from "@/components/Sidebar";
import { RightRail } from "@/components/RightRail";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex w-full min-h-screen"
      style={{ background: "var(--bone)" }}
    >
      <Sidebar />

      {/* Center column — fixed width, matches Web.jsx WEB_COL_W = 680 */}
      <main className="flex-1 min-w-0 h-screen flex justify-start overflow-hidden">
        <div className="flex gap-8 h-screen flex-1 min-w-0">
          <div
            className="ch-col relative h-screen overflow-hidden shrink-0 border-r border-[var(--border)] bg-[var(--paper)]"
            style={{ width: 680 }}
          >
            <div className="h-full overflow-y-auto">
              {children}
            </div>
          </div>

          {/* Right rail — only on Home root */}
          <RightRail />
        </div>
      </main>
    </div>
  );
}
