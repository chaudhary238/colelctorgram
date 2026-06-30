// ─────────────────────────────────────────────────────────────
// Shared catalogue / add-item constants (design_v4 AddListing + AddToCollection).
// Single source so the market AddListing form and the AddToCollection sheet stay in
// lockstep with v4. — TODO M20 DV4-01 (TCG) · DV4-03 (pre-order) · DV4-05 (currency)
// ─────────────────────────────────────────────────────────────

// ── Currencies — INR default, common collector markets after (DV4-05). ──
export const CURRENCIES = [
  { code: "INR", sym: "₹" },
  { code: "USD", sym: "$" },
  { code: "EUR", sym: "€" },
  { code: "GBP", sym: "£" },
  { code: "JPY", sym: "¥" },
  { code: "AED", sym: "د.إ" },
  { code: "SGD", sym: "S$" },
] as const;
export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export const symOf = (code: string): string =>
  (CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]).sym;

// Format a minor-unit amount in its currency, e.g. (123400, "INR") → "₹1,234".
export function formatMoney(amountMinor: number, currency: string = "INR"): string {
  return `${symOf(currency)}${Math.round(amountMinor / 100).toLocaleString("en-IN")}`;
}

// ── Category chips for the add forms — figure-first, with TCG (DV4-01). ──
export const ADD_CATEGORIES = [
  { id: "figures", label: "Action Figure" },
  { id: "diecast", label: "Diecast" },
  { id: "kits", label: "Model Kits & Lego" },
  { id: "designer", label: "Designer Toys & Blind Boxes" },
  { id: "tcg", label: "Trading Cards (TCG)" },
] as const;

// Per-category scale options (designer + tcg use no scale — null).
export const CAT_SCALES: Record<string, string[] | null> = {
  figures: ["1/1", "1/2", "1/3", "1/4", "1/6", "1/10", "1/12"],
  diecast: ["1/64", "1/43", "1/24", "1/18", "1/12"],
  kits: ["1/144", "1/100", "1/72", "1/60", "1/48", "1/35", "1/24", "Non-scale"],
  designer: null,
  tcg: null,
};

// Per-category brand suggestions (type-ahead).
export const CAT_BRANDS: Record<string, string[]> = {
  figures: ["Hot Toys", "Sideshow", "Bandai", "S.H.Figuarts", "McFarlane Toys", "NECA", "Mezco", "Good Smile Company", "Kotobukiya", "Threezero", "Iron Studios", "Prime 1 Studio", "Hasbro", "Mattel", "Funko", "Medicom", "XM Studios", "Queen Studios", "Storm Collectibles", "Sentinel"],
  diecast: ["Mini GT", "Hot Wheels", "Tomica", "Inno64", "Tarmac Works", "AUTOart", "Kyosho", "Maisto", "Bburago", "Greenlight", "Matchbox", "GT Spirit", "Solido", "Schuco", "Norev", "Spark"],
  kits: ["LEGO", "Bandai", "Tamiya", "Revell", "Kotobukiya", "Hasegawa", "Aoshima", "Meng", "Academy", "Trumpeter", "Good Smile Company"],
  designer: ["Pop Mart", "Medicom (Bearbrick)", "KAWS", "Funko", "Jellycat", "Sonny Angel", "Kidrobot", "Superplastic", "Unbox Industries", "52Toys", "How2Work"],
  tcg: ["The Pokémon Company", "Bandai (One Piece TCG)", "Wizards of the Coast (MTG)", "Konami (Yu-Gi-Oh!)", "Bandai (Digimon TCG)", "Bandai (Dragon Ball Super TCG)", "Bushiroad (Weiss Schwarz)", "Bushiroad (Cardfight!! Vanguard)"],
};

export const CAT_META: Record<string, { label: string; titleEg: string; brandEg: string }> = {
  figures: { label: "Action figure", titleEg: "e.g. Iron Man Mark 85 — Endgame", brandEg: "Hot Toys, Bandai, Sideshow…" },
  diecast: { label: "Diecast", titleEg: "e.g. Nissan Skyline GT-R R34 — Bayside Blue", brandEg: "Mini GT, Tomica, Hot Wheels…" },
  kits: { label: "Model kit / Lego", titleEg: "e.g. RG 1/144 Nu Gundam", brandEg: "LEGO, Bandai, Tamiya…" },
  designer: { label: "Designer toy / blind box", titleEg: "e.g. Skullpanda — Tell Me What You Want", brandEg: "Pop Mart, Bearbrick, KAWS…" },
  tcg: { label: "Trading card / set", titleEg: "e.g. Pokémon SV 151 Booster Box (EN)", brandEg: "Pokémon, One Piece TCG, MTG…" },
};

// ── TCG-specific option lists (DV4-01b). ──
export const TCG_LANGUAGES = ["EN", "JP", "KR", "TW", "Other"] as const;
export const TCG_PRODUCT_TYPES = ["Single Card", "Booster Pack", "Booster Box", "Elite Trainer Box", "Collection Box", "Case"] as const;
export const TCG_GRADERS = ["PSA", "BGS", "CGC"] as const;

// ── Pre-order release-window helpers (DV4-03a). ──
export const PO_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export const PO_YEARS = ["2026", "2027", "2028"] as const;
export type PoPrecision = "date" | "month" | "quarter" | "year" | "tbd";

// Build the human ETA string stored in `preorder_eta` from the precision picker.
export function buildPoEta(
  prec: PoPrecision,
  v: { date?: string; monthIdx?: string; quarter?: string; year?: string }
): string | null {
  if (prec === "tbd") return "Date to be announced";
  if (prec === "date") {
    if (!v.date) return null;
    const d = new Date(v.date);
    return isNaN(d.getTime()) ? v.date : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }
  if (prec === "month") {
    if (v.monthIdx === undefined || v.monthIdx === "") return v.year ?? null;
    return `${PO_MONTHS[Number(v.monthIdx)]} ${v.year ?? ""}`.trim();
  }
  if (prec === "quarter") return v.quarter ? `Q${v.quarter} ${v.year ?? ""}`.trim() : (v.year ?? null);
  if (prec === "year") return v.year ?? null;
  return null;
}
