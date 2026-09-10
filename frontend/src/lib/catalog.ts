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
// These are the app's ONE set of category names (Change Spec §4.2): the Database filter
// sheet, Create-a-community, Create-an-event, the Market filter and the composer all read
// them from here, so a category can never be worded two ways in two places. `label` is the
// full plural name ("Action Figures"); `chipLabel` is v8's singular chip wording
// (design_v8 data.jsx CATEGORIES) used on selection chips in the add flows.
export const ADD_CATEGORIES = [
  { id: "figures", label: "Action Figures", chipLabel: "Action Figure" },
  { id: "diecast", label: "Diecast", chipLabel: "Diecast" },
  { id: "kits", label: "Model Kits & Lego", chipLabel: "Model Kits & Lego" },
  { id: "designer", label: "Designer Toys & Blind Boxes", chipLabel: "Designer Toys & Blind Boxes" },
  { id: "tcg", label: "Trading Cards (TCG)", chipLabel: "Trading Cards (TCG)" },
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
  // v8 AddListing.jsx:40 byte-exact — "Pokemon" unaccented, "Cardfight Vanguard" plain.
  tcg: ["The Pokemon Company", "Bandai (One Piece TCG)", "Wizards of the Coast (MTG)", "Konami (Yu-Gi-Oh!)", "Bandai (Digimon TCG)", "Bandai (Dragon Ball Super TCG)", "Bushiroad (Weiss Schwarz)", "Bushiroad (Cardfight Vanguard)"],
};

// v8 AddListing.jsx:44-49 byte-exact (DV8 §6#1) — no embellished examples, no ellipses.
export const CAT_META: Record<string, { label: string; titleEg: string; brandEg: string }> = {
  figures: { label: "Action figure", titleEg: "e.g. Iron Man Mark 85", brandEg: "Hot Toys, Bandai, Sideshow" },
  diecast: { label: "Diecast", titleEg: "e.g. Nissan Skyline GT-R R34", brandEg: "Mini GT, Tomica, Hot Wheels" },
  kits: { label: "Model kit / Lego", titleEg: "e.g. RG 1/144 Nu Gundam", brandEg: "LEGO, Bandai, Tamiya" },
  designer: { label: "Designer toy / blind box", titleEg: "e.g. Skullpanda", brandEg: "Pop Mart, Bearbrick, KAWS" },
  tcg: { label: "Trading card / set", titleEg: "e.g. Pokemon SV 151 Booster Box", brandEg: "Pokemon, One Piece TCG, MTG" },
};

// ── Per-category condition vocabulary (DV8-10, ported from design_v8 app/data.jsx). ──
// Condition scales differ per category — collectors use category-specific vocabulary.
// The `id` is what gets STORED (items.condition, listings.condition); `label` is what
// renders on chips; `hint` is the one-line explainer under a selected chip.
export interface ConditionOpt { id: string; label: string; hint: string }
export const CAT_CONDITIONS: Record<string, ConditionOpt[]> = {
  figures: [
    { id: "MISB",  label: "MISB",  hint: "Mint in sealed box" },
    { id: "MIB",   label: "MIB",   hint: "Mint in box · opened" },
    { id: "BIB",   label: "BIB",   hint: "Box in bad shape" },
    { id: "Loose", label: "Loose", hint: "No packaging" },
  ],
  diecast: [
    { id: "Sealed / Carded",         label: "Sealed / Carded",   hint: "Untouched blister or card" },
    { id: "Opened — with packaging", label: "Opened · with box", hint: "Packaging kept" },
    { id: "Loose",                   label: "Loose",             hint: "No packaging" },
  ],
  kits: [
    { id: "Sealed — unbuilt",   label: "Sealed · unbuilt",   hint: "Factory sealed, runners untouched" },
    { id: "Open box — unbuilt", label: "Open box · unbuilt", hint: "Opened but not built" },
    { id: "Built",              label: "Built",              hint: "Assembled" },
  ],
  tcg: [
    { id: "Mint",    label: "Mint",    hint: "Pack-fresh, no wear" },
    { id: "Played",  label: "Played",  hint: "Visible edge or surface wear" },
    { id: "Damaged", label: "Damaged", hint: "Creases, water, tears" },
    { id: "Graded",  label: "Graded",  hint: "Slabbed by a grading company" },
  ],
  designer: [
    { id: "Sealed",           label: "Sealed",           hint: "Blind box unopened" },
    { id: "Displayed w/ box", label: "Displayed w/ box", hint: "Out of box, packaging kept" },
    { id: "Loose",            label: "Loose",            hint: "No packaging" },
  ],
};
export function conditionsFor(cat: string | null | undefined): ConditionOpt[] {
  return CAT_CONDITIONS[cat ?? ""] ?? CAT_CONDITIONS.figures;
}
// Pre-DV8 stored ids (the old app-wide 4-value ladder) — keep them rendering as their
// labels wherever old data still carries them. Never offered as new choices.
export const LEGACY_CONDITION_LABELS: Record<string, string> = {
  sealed_misb: "Sealed",
  mint: "MIB",
  like_new: "BIB",
  good: "Loose",
};
/** Display label for a stored condition id — category vocab → any vocab → legacy → raw id. */
export function conditionLabel(id: string | null | undefined, cat?: string | null): string | null {
  if (!id) return null;
  const inCat = conditionsFor(cat).find((c) => c.id === id);
  if (inCat) return inCat.label;
  for (const opts of Object.values(CAT_CONDITIONS)) {
    const hit = opts.find((c) => c.id === id);
    if (hit) return hit.label;
  }
  return LEGACY_CONDITION_LABELS[id] ?? id;
}

// ── TCG-specific option lists (DV4-01b; reconciled to design_v6 AddListing in DV6-11c —
// broader language set + design's product types unioned with existing ones to avoid orphaning
// already-seeded values like "Case" / "Collection Box"). ──
export const TCG_LANGUAGES = ["EN", "JP", "KR", "TW", "FR", "DE", "IT", "PT", "ES"] as const;
export const TCG_PRODUCT_TYPES = ["Single Card", "Booster Pack", "Booster Box", "Elite Trainer Box", "Collection Box", "Sealed Set", "Bundle", "Case"] as const;
// DV8 grading card — PSA / BGS / CGC plus a free-text "Other" company (design_v8 data.jsx
// GRADERS; the backend stores tcg_grader as free text up to 24 chars).
export const GRADERS = ["PSA", "BGS", "CGC", "Other"] as const;
/** The condition id that means "professionally graded" for a category (tcg only). */
export const GRADED_CONDITION_ID = "Graded";
export const isGradedCondition = (cat: string | null | undefined, cond: string | null | undefined) =>
  cat === "tcg" && cond === GRADED_CONDITION_ID;

// ── Pre-order release-window helpers (DV4-03a). ──
export const PO_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
// v8 CompleteItems.jsx:71 — the finish flow's month select shows FULL names; the
// stored eta string keeps the short form (buildPoEta / PO_MONTHS).
export const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;
export const PO_YEARS = ["2026", "2027", "2028", "2029"] as const;
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
