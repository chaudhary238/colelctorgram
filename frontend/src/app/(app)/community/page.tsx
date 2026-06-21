"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, PlusCircle } from "lucide-react";
import { api } from "@/lib/api";
import { ApiCommunity } from "@/components/cards";
import { CategoryChip, SectionLabel, EmptyNote } from "@/components/ui";
import { CommunityCard } from "@/components/cards";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "figures", label: "Figures" },
  { id: "designer", label: "Designer" },
  { id: "kits", label: "Kits & Lego" },
  { id: "diecast", label: "Diecast" },
];

export default function CommunityPage() {
  const [cat, setCat] = useState("all");
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiCommunity[]>("/communities?limit=50")
      .then((data) => setCommunities(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const joined = communities.filter((c) => c.is_member);
  const discover = communities.filter((c) => !c.is_member && (cat === "all" || c.category.toLowerCase().includes(cat)));

  return (
    <div className="w-full max-w-[760px] flex flex-col pb-7">
      <div style={{ padding: "14px 20px 0" }}>
        <Link
          href="/search"
          style={{
            display: "flex", alignItems: "center", gap: 9, width: "100%",
            height: 40, padding: "0 14px", borderRadius: 11,
            border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
            color: "var(--ink-faint)", fontSize: 14,
          }}
        >
          <Search size={18} />
          Find a community…
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 76, borderRadius: 14, background: "var(--bone)" }} />
          ))}
        </div>
      ) : (
        <>
          {joined.length > 0 && (
            <div style={{ padding: "18px 20px 0" }}>
              <SectionLabel>Your communities</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                {joined.map((c) => <CommunityCard key={c.id} community={c} />)}
              </div>
            </div>
          )}

          <div style={{ padding: "20px 20px 0" }}>
            <SectionLabel>Discover</SectionLabel>
            <div style={{ display: "flex", gap: 7, margin: "10px 0", overflowX: "auto" }}>
              {CATEGORIES.map((c) => (
                <CategoryChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                  {c.label}
                </CategoryChip>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {discover.map((c) => <CommunityCard key={c.id} community={c} />)}
              {discover.length === 0 && <EmptyNote>You&rsquo;ve joined everything in this category.</EmptyNote>}
            </div>
          </div>
        </>
      )}

      <div style={{ padding: "20px 20px 0" }}>
        <Link
          href="/community/new"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", height: 46, borderRadius: 12, border: "1px dashed var(--border-strong)",
            background: "transparent", color: "var(--ink-mute)",
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
          }}
        >
          <PlusCircle size={18} />
          Create a new community
        </Link>
      </div>
    </div>
  );
}
