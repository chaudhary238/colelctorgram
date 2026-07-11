"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, PlusCircle } from "lucide-react";
import { api } from "@/lib/api";
import { ApiCommunity } from "@/components/cards";
import { CategoryChip, SectionLabel, EmptyNote, Button } from "@/components/ui";
import { CommunityCard } from "@/components/cards";
import { ADD_CATEGORIES } from "@/lib/catalog";

// v4 CommunityView filter maps the global CATEGORIES with chipLabel (incl. TCG).
// ADD_CATEGORIES is that 5-category list in v4 order. Kept in lockstep.
const CATEGORIES = ADD_CATEGORIES;

export default function CommunityPage() {
  const router = useRouter();
  const [cats, setCats] = useState<string[]>([]); // [] = all
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleCat = (id: string) =>
    setCats((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));

  useEffect(() => {
    api.get<ApiCommunity[]>("/communities?limit=50")
      .then((data) => setCommunities(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const joined = communities.filter((c) => c.is_member);
  const discover = communities.filter(
    (c) => !c.is_member && (cats.length === 0 || cats.includes(c.category)),
  );

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-7">
      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "14px 20px 0" }}>
        <Link
          href="/search"
          style={{
            flex: 1, display: "flex", alignItems: "center", gap: 9,
            height: 40, padding: "0 14px", borderRadius: 11,
            border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
            color: "var(--ink-faint)", fontSize: 14,
          }}
        >
          <Search size={18} />
          Find a community…
        </Link>
        <Button size="sm" variant="primary" icon={<PlusCircle size={15} />} onClick={() => router.push("/community/new")}>
          Create
        </Button>
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
            <div style={{ display: "flex", gap: 7, margin: "10px 0", overflowX: "auto", paddingBottom: 2 }}>
              <CategoryChip active={cats.length === 0} onClick={() => setCats([])}>All</CategoryChip>
              {CATEGORIES.map((c) => (
                <CategoryChip key={c.id} active={cats.includes(c.id)} onClick={() => toggleCat(c.id)}>
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
    </div>
  );
}
