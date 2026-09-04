# CollectorHub Design System

> **CollectorHub** is a community-first social platform for hobby collectors in India — showcase, discover, connect, and trade. Categories: Action Figures · Designer Toys & Blind Boxes · Model Kits & Lego · Diecast · Trading Cards (TCG).
>
> Tagline: *"In-hand or PO. Trade considered."*

Current spec: **BRD v1.4** (24 Jun 2026). Full requirements in `CollectorHub BRD v1.4.html`.

---

## File index

| Path | What it is |
|---|---|
| `CollectorHub BRD v1.4.html` | Full product BRD — vision, scope, data model, screen specs, design system, change log. |
| `colors_and_type.css` | All design tokens (CSS custom properties) + `@font-face` declarations. Import this first in every card and template. |
| `fonts/` | Bundled woff2 files — Geist (primary), Bricolage Grotesque (deprecated), JetBrains Mono. |
| `assets/` | Logo seal + horizontal wordmark (SVG). |
| `preview/` | Static @dsCard thumbnails — Brand, Colors, Type, Spacing, Components groups. |
| `components/actions/` | **Button**, **IconButton** — React ES-module sources + TypeScript defs. |
| `components/identity/` | **Avatar**, **TierChip** — React ES-module sources + TypeScript defs. |
| `components/labels/` | **Tag**, **Badge**, **PostTypeTag**, **Stamp** — React ES-module sources + TypeScript defs. |
| `components/forms/` | **Input**, **Segmented**, **CategoryChip** — React ES-module sources + TypeScript defs. |
| `app/` | Full prototype — multi-file Babel/JSX app wired together in `index.html`. Not compiled into the bundle. |

---

## Exported components (11)

Access via `const { X } = window.CollectorHubDesignSystemRC_293274` after loading `_ds_bundle.js`.

| Component | Group | Props summary |
|---|---|---|
| `Button` | Actions | `variant` (8 options) · `size` (sm/md/lg/block) · `icon` · `disabled` |
| `IconButton` | Actions | `icon` · `active` · `badge` · `size` · `radius` |
| `Avatar` | Identity | `name` · `color` · `size` · `verified` · `photo` |
| `TierChip` | Identity | `tier` (Top Seller / Trusted / Verified) — renders null for base users |
| `Tag` | Labels | `kind` (sale / po / misb / sold / reserved / vouch / event / default) |
| `Badge` | Labels | `variant` (9 options — default/secondary/success/warning/destructive/teal/plum/dark/outline) |
| `PostTypeTag` | Labels | `type` (post / showcase / discussion / review / poll / iso) |
| `Stamp` | Labels | `color` · `rotate` — hard-shadow accent label |
| `Input` | Forms | `value` · `onChange` · `onSubmit` · `placeholder` · `icon` · `disabled` |
| `Segmented` | Forms | `options[]` · `value` · `onChange` — tab/sort switcher |
| `CategoryChip` | Forms | `active` · `onClick` — pill filter chip |

---

## Product context

CollectorHub is mobile-first (iOS/Android). The prototype renders inside a 390×844 device frame. Five-tab IA:

1. **Home (Feed)** — For You / Explore / Following tabs; Customize Feed per-category controls; hashtag filter bar; PostCard / AdminCard / ListingFeedCard / FeedEventCard types.
2. **Market** — 2-column listing grid; filter panel (category, price, condition, sort); ISO Board tab (In Search Of posts).
3. **Community** — public + private (request-to-join); open + approval posting modes; admin tools.
4. **Events** — RSVP (Going / Interested); multi-day support; no tickets/QR in Phase 1.
5. **Profile** — Instagram-style header; Deals/Followers/Vouches stats; Collector XP / rank; season badges; Collection / Posts / Communities / Trades / Saved tabs.

**AppBar layout:** Create (left) · Wordmark (centre) · Search + Messages + Bell (right).

**Data model (BRD §8.1):** Item → Listing → Deal + Post. XP record per user.

**Key flows:** Onboarding (splash → OTP → 3-step wizard) · Add to collection (catalogue search / barcode) · List for sale (from Item, requires Verified) · DM to transact · Deal completion → mutual rating → vouch · Engagement rewards (XP earn → rank → season badge).

---

## Visual foundations (v1.4 canonical)

### Palette

**Clean white** — confirmed canonical as of v1.3. Warm cream spec retired.

| Token | Value | Role |
|---|---|---|
| `--paper` / `--card-surface` | `#FFFFFF` | Card backgrounds, modals |
| `--canvas` | `#F8FAFC` | Screen / scrollable body background |
| `--bone` | `#F5F5F5` | Recessed wells, segmented control bg |
| `--ink` | `#1A1A1A` | Primary text |
| `--ink-mute` | `#666666` | Secondary body |
| `--ink-faint` | `#999999` | Meta, captions, inactive icons |
| `--stamp-red` | `#FF2442` | Primary CTA, brand seal, prices, destructive |
| `--grail-gold` | `#E8A33D` | Rare / featured / pre-order / ISO |
| `--verified-teal` | `#2D8F87` | Verified, vouch, trust signals |
| `--forest` | `#2D5F3F` | Success, Going RSVP, completed trades |
| `--plum` | `#6B3656` | Community / events / Showcaser archetype |

**Canvas + card depth model:** `--canvas` (#F8FAFC) is the scrollable body; `--card-surface` (#FFFFFF) pops cards off it. Do not use `--paper` as a screen background.

### Typography

- **Geist** — canonical display + body font (700–800 display, 300–700 body). Loaded from bundled woff2.
- **Bricolage Grotesque** — deprecated; woff2 files still present. Remove in next bundle pass.
- **JetBrains Mono** — prices, SKUs, codes, timestamps. Always `font-variant-numeric: tabular-nums`.

Font stack: `--font-display: "Geist", system-ui` · `--font-body: "Geist", system-ui` · `--font-mono: "JetBrains Mono", monospace`.

### Corner radii

`--r-xs 4px` · `--r-sm 8px` · `--r-md 14px` · `--r-lg 20px` · `--r-xl 32px` · `--r-pill 999px`.

### Shadows

`--card-shadow: 0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)` — standard floating card.  
`--card-shadow-lifted: 0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)` — hover/lift state.  
`--shadow-stamp: 2px 2px 0 var(--ink)` — hard offset stamp for accent moments.

### Borders

`--border: rgba(0,0,0,0.08)` · `--border-strong: rgba(0,0,0,0.14)` · `--border-faint: rgba(0,0,0,0.04)`.

---

## Content voice

- **Short and trader-direct.** "US import, single owner, never displayed." Not "This wonderful collectible has been carefully stored."
- **Middle-dot metadata rows.** `"MISB · sealed · plastic intact"` · `"Sat · 24 May · 4pm"` · `"Mumbai · pan-India · ₹350"`.
- **Collector shorthand preserved.** MISB, PO, BNIB, KO, grail, MOC, AFOL, 1/6 — never spelled out.
- **Currency.** ₹ with en-IN grouping, JetBrains Mono + `tnum`. Strike-through retail price allowed.
- **No emoji in UI.** No 🔥🎉💯. Checkmarks (`✓`) only as text state indicators.
- **CTAs are verbs only.** Make offer · Notify me · DM seller · Vouch for Aman · List item.
- **Trust signals are explicit.** "MISB · double-boxed · original shipper" · "No KOs ever."

---

## Iconography

Lucide outline icons at 1.75px stroke, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`. Default size 20px. The full inlined icon set is in `app/shared.jsx` (`Icons` object, 60+ icons). For new icons, use the Lucide CDN (`https://unpkg.com/lucide-static@latest/icons/<name>.svg`). Do not mix icon families. Do not use emoji as icons.

---

## Engagement & Rewards system

New in v1.4. Full spec in BRD §8.x.

- **Collector XP** — 10 earn actions (profile completion, verified item, showcase, review, vouch, RSVP, comment, like, daily check-in, referral).
- **Rank ladder** (lifetime, never resets) — Rookie (0) → Fan (250) → Collector (750) → Pro (1,800) → Expert (4,000) → Legend (8,000).
- **Archetypes** — Showcaser / Connector / Archivist / Trader (derived from XP contribution mix).
- **Season badges** — weekly + monthly leagues; Gold / Silver / Bronze / Finalist tiers; permanent.
- **Leaderboard** — By XP (weekly/monthly/all-time) or By contribution (per archetype).

---

## Open items

- Add `--verified-teal-deep` (#236D66), `--forest-deep` (#1F4A2D), `--plum-deep` (#502842) to `colors_and_type.css`.
- Apply 11 pending component corrections from BRD §DS — AppBar, LocationTag, GlassPill, PostTypeTag hex→tokens, ActionBtn color, StackedAvatars, PostCard hover, Screen overscroll, focus rings.
- Remove Bricolage Grotesque woff2 files (deprecated since v1.3, ~200KB dead weight).
- Confirm TCG seed catalogue SKU count for launch.
