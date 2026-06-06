"use client";

import { useState, useRef } from "react";
import { X, Search, Plus, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CatalogueHit {
  sku: string;
  title: string;
  brand: string;
  category: string;
  thumbnail_url: string | null;
}

type ItemStatus = "owned" | "wishlist" | "preorder";

interface AddToCollectionSheetProps {
  onClose: () => void;
  onAdded: () => void;
}

export function AddToCollectionSheet({ onClose, onAdded }: AddToCollectionSheetProps) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CatalogueHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CatalogueHit | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [status, setStatus] = useState<ItemStatus>("owned");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setHits([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.get<{ hits: CatalogueHit[] }>(`/catalogue/search?q=${encodeURIComponent(q)}`);
        setHits(data.hits);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 280);
  }

  async function handleAdd() {
    if (!selected && !customTitle.trim()) return;
    setAdding(true);
    setError("");
    try {
      await api.post("/items", {
        sku: selected?.sku ?? undefined,
        custom_title: customMode ? customTitle.trim() : undefined,
        status,
      });
      onAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setAdding(false);
    }
  }

  const STATUS_OPTIONS: { value: ItemStatus; label: string; desc: string }[] = [
    { value: "owned", label: "Owned", desc: "In your collection" },
    { value: "wishlist", label: "Wishlist", desc: "Want to get" },
    { value: "preorder", label: "Pre-order", desc: "Ordered, not yet arrived" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 shrink-0">
          <h2 className="font-bold text-base text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Add to collection
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--bone)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          {!selected && !customMode && (
            <>
              {/* Search */}
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] pointer-events-none"
                />
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Search catalogue…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--stamp-red)] transition-colors"
                  autoFocus
                />
              </div>

              {/* Results */}
              {searching && (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-[var(--bone)] animate-pulse" />
                  ))}
                </div>
              )}

              {!searching && hits.length > 0 && (
                <div className="space-y-1">
                  {hits.map((hit) => (
                    <button
                      key={hit.sku}
                      onClick={() => setSelected(hit)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bone)] transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[var(--bone-deep)] overflow-hidden shrink-0 flex items-center justify-center">
                        {hit.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={hit.thumbnail_url} alt={hit.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[var(--ink-ghost)] text-xs">img</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--ink)] truncate">{hit.title}</p>
                        <p className="text-xs text-[var(--ink-faint)]">{hit.brand} · {hit.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!searching && query.length > 1 && hits.length === 0 && (
                <p className="text-sm text-[var(--ink-faint)] text-center py-2">
                  No results — add it yourself?
                </p>
              )}

              {/* Custom entry CTA */}
              <button
                onClick={() => setCustomMode(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[var(--border-strong)] text-[var(--ink-faint)] text-sm hover:border-[var(--ink-ghost)] hover:text-[var(--ink-mute)] transition-colors"
              >
                <Plus size={15} />
                Add custom item (not in catalogue)
              </button>
            </>
          )}

          {customMode && (
            <div>
              <button
                onClick={() => setCustomMode(false)}
                className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] mb-3 flex items-center gap-1"
              >
                ← Back to search
              </button>
              <label className="block text-xs font-medium text-[var(--ink-mute)] mb-1.5">Item title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Kaws Companion Open Edition"
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--stamp-red)] transition-colors"
              />
            </div>
          )}

          {selected && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--bone)] border border-[var(--border-strong)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--bone-deep)] overflow-hidden shrink-0 flex items-center justify-center">
                {selected.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.thumbnail_url} alt={selected.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[var(--ink-ghost)] text-xs">img</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--ink)] truncate">{selected.title}</p>
                <p className="text-xs text-[var(--ink-faint)]">{selected.brand}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-[var(--ink-faint)] hover:text-[var(--ink)] p-1"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {(selected || customMode) && (
            <div>
              <label className="block text-xs font-medium text-[var(--ink-mute)] mb-2">Status</label>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-colors",
                      status === opt.value
                        ? "border-[var(--stamp-red)] bg-[var(--stamp-red-soft)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                      status === opt.value
                        ? "border-[var(--stamp-red)] bg-[var(--stamp-red)]"
                        : "border-[var(--border-strong)]"
                    )}>
                      {status === opt.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--ink)]">{opt.label}</p>
                      <p className="text-xs text-[var(--ink-faint)]">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-[var(--stamp-red)]">{error}</p>}
        </div>

        {/* Footer */}
        {(selected || (customMode && customTitle.trim())) && (
          <div className="border-t border-[var(--border)] px-4 py-3 shrink-0">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-full py-2.5 rounded-xl bg-[var(--stamp-red)] text-white font-semibold text-sm hover:bg-[var(--stamp-red-deep)] transition-colors disabled:opacity-60"
            >
              {adding ? "Adding…" : `Add to ${status === "wishlist" ? "wishlist" : status === "preorder" ? "pre-orders" : "collection"}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
