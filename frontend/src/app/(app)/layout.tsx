import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-h-screen" style={{ background: "var(--paper)" }}>
      <Sidebar />

      {/* Single scroll area on a uniform background. Each page centers its
          own content (Instagram-style) and chooses its own column count. */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
