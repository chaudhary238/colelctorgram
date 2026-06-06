"use client";

import { useState } from "react";
import { MapPin, Monitor, Users, Plus } from "lucide-react";
import { MOCK_EVENTS, shortDate } from "@/lib/mock";
import { cn } from "@/lib/utils";

const MODE_TABS = [
  { id: "all", label: "All" },
  { id: "in_person", label: "In-person" },
  { id: "online", label: "Online" },
];

const CATEGORY_FILTERS = [
  { id: "all", label: "All" },
  { id: "figures", label: "Figures" },
  { id: "designer", label: "Designer" },
  { id: "kits", label: "Kits" },
  { id: "diecast", label: "Diecast" },
];

const CATEGORY_COLORS: Record<string, string> = {
  figures: "bg-[var(--stamp-red-soft)] text-[var(--stamp-red-deep)]",
  designer: "bg-[var(--plum-soft)] text-[var(--plum)]",
  kits: "bg-[var(--verified-teal-soft)] text-[var(--verified-teal)]",
  diecast: "bg-[var(--grail-gold-soft)] text-[var(--grail-gold-deep)]",
};

export default function EventsPage() {
  const [modeTab, setModeTab] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [interests, setInterests] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_EVENTS.map((e) => [e.id, e.is_interested]))
  );

  const events = MOCK_EVENTS.filter((e) => {
    if (modeTab !== "all" && e.mode !== modeTab) return false;
    if (catFilter !== "all" && e.category !== catFilter) return false;
    return true;
  });

  function toggleInterest(id: string) {
    setInterests((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Events
          </h1>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--stamp-red)] text-white hover:bg-[var(--stamp-red-deep)] transition-colors">
            <Plus size={13} strokeWidth={2.5} />
            Submit
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-t border-[var(--border)]">
          {MODE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setModeTab(t.id)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors",
                modeTab === t.id
                  ? "border-[var(--ink)] text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink-mute)]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto border-t border-[var(--border)]">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCatFilter(f.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border shrink-0 transition-colors",
                catFilter === f.id
                  ? "bg-[var(--ink)] text-white border-transparent"
                  : "bg-[var(--bone)] border-[var(--border-strong)] text-[var(--ink-mute)] hover:border-[var(--ink-ghost)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events list */}
      <div className="p-4 space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)] text-center py-10">No events found.</p>
        ) : (
          events.map((event) => {
            const { day, month } = shortDate(event.date);
            const isInterested = interests[event.id];

            return (
              <div
                key={event.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4 hover:shadow-[var(--shadow-1)] transition-shadow cursor-pointer"
              >
                <div className="flex gap-4">
                  {/* Date block */}
                  <div className="w-12 shrink-0 rounded-xl bg-[var(--stamp-red-soft)] flex flex-col items-center justify-center py-2 border border-[var(--stamp-red-soft)]">
                    <span className="text-[10px] font-bold text-[var(--stamp-red)] tracking-widest">{month}</span>
                    <span className="text-xl font-extrabold text-[var(--stamp-red-deep)] leading-tight">{day}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[var(--ink)] leading-snug line-clamp-2">
                          {event.title}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleInterest(event.id)}
                        className={cn(
                          "shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors mt-0.5",
                          isInterested
                            ? "bg-[var(--bone)] border-[var(--border-strong)] text-[var(--ink)]"
                            : "bg-[var(--stamp-red)] border-transparent text-white hover:bg-[var(--stamp-red-deep)]"
                        )}
                      >
                        {isInterested ? "Interested" : "Attend"}
                      </button>
                    </div>

                    {/* Category */}
                    {event.category && (
                      <span className={cn(
                        "inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                        CATEGORY_COLORS[event.category] ?? "bg-[var(--bone)] text-[var(--ink-mute)]"
                      )}>
                        {event.category}
                      </span>
                    )}

                    {/* Location */}
                    <div className="flex items-center gap-3 mt-2">
                      {event.mode === "online" ? (
                        <span className="flex items-center gap-1 text-xs text-[var(--ink-faint)]">
                          <Monitor size={11} />
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-[var(--ink-faint)]">
                          <MapPin size={11} />
                          {event.venue ?? event.city}
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-xs text-[var(--ink-faint)]">
                        <Users size={11} />
                        {event.interest_count.toLocaleString()} interested
                      </span>
                    </div>

                    {/* Host */}
                    <p className="text-[10px] text-[var(--ink-ghost)] mt-1.5">
                      by {event.host.name} · @{event.host.handle}
                    </p>
                  </div>
                </div>

                {/* Description preview */}
                <p className="text-xs text-[var(--ink-faint)] mt-3 line-clamp-2 leading-relaxed border-t border-[var(--border)] pt-2.5">
                  {event.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
