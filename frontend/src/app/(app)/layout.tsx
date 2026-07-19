import { Sidebar } from "@/components/Sidebar";
import { ContextualRail } from "@/components/ContextualRail";
import { MobileAppBar } from "@/components/MobileAppBar";
import { BottomNav } from "@/components/BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-h-screen" style={{ background: "var(--paper)" }}>
      {/* Desktop nav (≥lg). Below lg it's hidden and the mobile AppBar +
          BottomNav take over (R-01). DELIBERATE WEB DEVIATION: the 245px
          Sidebar stays desktop-only; v6's AppBar is mobile-only chrome. */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Single scroll area on a uniform background (stays <main> — R-01). Every
          page keeps its own left-aligned 680px column; the contextual rail rides
          alongside on all routes (ContextualRail decides its own widgets per
          route, ≥1280px). */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <MobileAppBar />
        <InstallPrompt />
        <div className="flex justify-start gap-8 pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0">
          <div className="w-full max-w-[680px] min-w-0">{children}</div>
          <div className="hidden xl:block shrink-0">
            <div className="sticky top-0">
              <ContextualRail />
            </div>
          </div>
        </div>
        <BottomNav />
      </main>
    </div>
  );
}
