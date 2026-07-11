import { Sidebar } from "@/components/Sidebar";
import { ContextualRail } from "@/components/ContextualRail";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-h-screen" style={{ background: "var(--paper)" }}>
      <Sidebar />

      {/* Single scroll area on a uniform background. Every page keeps its own
          left-aligned 680px column; the contextual rail rides alongside on all
          routes (ContextualRail decides its own widgets per route, ≥1280px). */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="flex justify-start gap-8">
          <div className="w-full max-w-[680px] min-w-0">{children}</div>
          <div className="hidden xl:block shrink-0">
            <div className="sticky top-0">
              <ContextualRail />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
