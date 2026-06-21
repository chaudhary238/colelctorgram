# CollectorHub Design System

> **CollectorHub** is an MVP marketplace and community app for toy / figure / diecast / Lego collectors in India. It blends a marketplace (Hot Toys, Bandai, Tomica, Pop Mart, LEGO, Sideshow), a vouch-based trust graph between collectors, and community spaces with IRL meet-ups.
>
> Tagline (implied from the prototype): *"In-hand or PO. Trade considered."*

This design system was reverse-engineered from a single self-contained prototype HTML file the team provided. The prototype unpacks 14 inlined JSX files, 14 webfont woff2 files, a Lucide-derived icon set, and a fully tokenized colors-and-type system; those have been extracted into the structure below.

---

## Source materials

| Source | Where | Notes |
|---|---|---|
| Prototype HTML | `uploads/CollectorHub Prototype.html` | Single bundled file (1.6 MB). The unbundler scripts read the `__bundler/manifest` + `__bundler/template` blocks. |
| Extracted JSX | `app/` (current) and `v1/` (legacy) | 15 babel-compiled modules: device frame, shared primitives, mock data, nav, 11 screens, root render. |
| Brand CSS tokens | original prototype's first inline `<style>` block | Lifted verbatim into `colors_and_type.css`. |
| Fonts | bundled woff2 from Google Fonts | Subsets for Bricolage Grotesque, Geist, JetBrains Mono. |

No Figma file, codebase repo, or marketing site was provided — the prototype is the canonical source.

---

## Index

| File | What it is |
|---|---|
| `README.md` | This file. |
| `SKILL.md` | Agent-skill front-matter — usable as a downloadable Claude-Code skill. |
| `colors_and_type.css` | All design tokens (CSS custom properties) + font faces. Import this first. |
| `fonts/` | Bundled woff2 files for Bricolage / Geist / JetBrains Mono. |
| `assets/` | Logo seal + horizontal wordmark (SVG). |
| `preview/` | 25 design-system cards rendered in the Design System tab. |
| `app/` | **Current build** — the BRD v1.1-aligned app. Multi-file React (split per screen), interactive `index.html`. This is the canonical UI kit. |
| `v1/` | Legacy — the original prototype recreation, kept as a reference snapshot. |
| `extracted/` | `BRD.txt` (plain-text extraction of the source BRD). Safe to delete. |

---

## Product context

CollectorHub is a mobile product (iOS-first, in a 402×874 device frame). The current `app/` build follows **BRD v1.1** with a five-tab information architecture:

1. **Home (Feed)** — personalised stream: showcase/discussion/review posts, release announcements, listing cards, event cards. Sort (For You / Latest / Top) + source filters.
2. **Market** — filterable 2-column grid of listings (category, price, trade-only) + wishlist-match banner.
3. **Community** — directory (joined + discover) → detail with rules, founder, post stream.
4. **Events** — upcoming list + next-up hero → detail with interested/reminders.
5. **Profile** — trust signals, trust tier, collection portfolio (owned / wishlist / pre-order with verification badges), posts, communities, trades.

Create-post sits **top-left** (Instagram-style); **search + notifications** sit top-right.

The data model is **Item / Listing / Post / Deal** (BRD §8.1): the Item is atomic, Listings and Posts reference Items, Deals record completed trades and unlock transaction-linked trust.

Cross-cutting flows:

- **Onboarding** — splash → email/social auth → interest selection (categories + sub-interests + suggested communities + profile basics) → pre-populated feed.
- **Listing detail** → message seller / propose trade → chat → **mark deal done → confirm → mutual rating + trade vouch**.
- **Item detail** → Sell/Trade (creates a listing; requires Verified ownership).
- **Add to collection** — catalogue search + barcode scan, owned/wishlist/pre-order, in-app ownership photo.
- **Notifications** — wishlist matches, deal confirmations, vouches, follows, community + event pings.
- **Search** — type-ahead across catalogue items, people, communities, events.

Tone is short and trader-direct ("US import, single owner, never displayed."). Numbers are in INR with rupee glyph and `en-IN` formatting. Locations are real Indian cities. Communities are India-specific (*Indian Toy Maniacs*, *Bricks Bangalore*, *JDM Diecast Crew*).

---

## CONTENT FUNDAMENTALS

CollectorHub's voice is the voice of the collector marketplace itself — short, specific, no marketing fluff.

- **Person.** Second person ("Try it. Tap a sale card.") for in-app instructions and toasts. First person plural ("We'll ping you when POs open.") for system actions. Listing copy is first-person singular as if the seller wrote it ("US import, single owner, never displayed.").
- **Sentence length.** Short. Usually under 12 words. Multiple short clauses separated by ` · ` (middle dot) instead of commas in metadata rows: *"MISB · sealed · plastic intact"*, *"Sat · 24 May · 4pm"*, *"Mumbai · pan-India · ₹350"*.
- **Casing.** Sentence case in body. UPPERCASE in tags / overlines / stamps (10–11px, 0.08–0.18em letter-spacing). Brand names retain their own casing: *LEGO*, *Hot Toys*, *Pop Mart*, *Tomica*, *MISB*, *MISP*, *BNIB*, *PO*.
- **Collector shorthand is preserved, not translated.** *MISB* (mint in sealed box), *PO* (pre-order), *BNIB*, *KO* (knock-off), *grail*, *MOC*, *AFOL*, *1/6 scale* — these are first-class words, never spelled out.
- **Currency & numbers.** Always *₹ 18,400* with the rupee glyph, single space, en-IN grouping. Use JetBrains Mono + `tnum` so prices align. *MRP* for retail. Strike-through retail is allowed next to a lower listing price.
- **Time.** Relative for fresh things ("3h", "8h", "1d"), absolute with month abbreviation for events ("Sat · 24 May · 4pm"). Joined dates show as `"Jan '24"`.
- **Calls to action.** Verbs only: *Make offer*, *Notify me*, *DM seller*, *Vouch for Aman*, *RSVP*, *List item*, *Post*. Never *Click here*, *Submit*, *Learn more*.
- **System / admin posts** use a different tone — declarative and brief: *"POs open Friday 6pm IST. Limited to 1 per account at retail."*
- **No emoji** in product copy or component labels. Checkmarks (`✓`) are used as state indicators (`✓ Going`, `✓ Vouched`) but always within text, never as decoration. No 🎉 / 🔥 / 💯.
- **No exclamation marks** outside toast confirmations ("RSVP set. See you there."). Tone is dry, knowing, slightly insider.
- **Trust signals are explicit.** *Vouched*, *Verified*, *MISB · double-boxed · original shipper*, *No KOs ever* — the language assumes the reader knows what counterfeits look like.

Example listing copy (verbatim, see `data.jsx`):

> *Hot Toys MMS601 · Iron Man Mark 85*
> US import, single owner, never displayed. Comes with the original brown shipper. Plastic is intact, magnets all good. Trades considered for grail Sideshow pieces — DM if interested.

---

## VISUAL FOUNDATIONS

The system is built around a *paper-and-stamp* metaphor — warm cream backgrounds (the paper), a near-black warm ink for type, and five accent colours used like rubber stamps pressed onto the page.

**Palette**

- **Paper / cream.** `--paper #F4EFE6` is the default app background. `--paper-soft #FAF6EE` lifts cards. `--bone #E8E1D2` is the stage / sunken wells. Never pure white — `--white` exists but is reserved for tiny inset highlights.
- **Ink.** A six-step warm-black scale (`#14110F → #B8AFA3`) replaces a grey ramp. All UI text reads as warm, not blue-tinged.
- **Brand accents.** Five hues, each used as a *role*, not a decoration:
  - `--stamp-red #D93324` — primary CTA, brand seal, prices, destructive, "post" floating button.
  - `--grail-gold #E8A33D` — rare / featured / pre-order / warning.
  - `--verified-teal #2D8F87` — verified accounts, vouch badge, info.
  - `--forest #2D5F3F` — success, completed trades, "Going" state.
  - `--plum #6B3656` — community / events accent.
  - Each accent also has `-deep` (for press states) and `-soft` (for tinted backgrounds, badges, RSVP rows).

**Type**

- **Bricolage Grotesque** — display family. Used at 700–800 weight for all headlines, screen titles, avatars (initial-letter), tags' stamp text, and the wordmark. Always with negative letter-spacing (`-0.02em → -0.035em`).
- **Geist** — body / UI family. 300–700 weights. Default body is 15px / 1.5 / 400.
- **JetBrains Mono** — prices, SKUs (`MMS601`, `TL-R34`), codes, timestamps in the device chrome, monospaced badges. Always `font-variant-numeric: tabular-nums` and `tnum` feature.

**Spacing & layout**

- **4-pt grid.** Tokens `--s-1` (4) through `--s-16` (64).
- **Container padding.** Screen body uses `20px` horizontal, `16px` vertical between sections. Card interiors use `12–16px`.
- **Fixed elements.** The bottom nav is fixed (74px tall incl. iOS home indicator). The status bar is overlaid (52px). The "post" button overlaps the nav vertically by 6px.
- **Mobile-first.** Everything assumes a 402-wide artboard. No tablet/desktop breakpoints exist yet.

**Backgrounds**

- **Paper field.** The app background is `--paper` everywhere; the *stage* behind the device frame is `--bone` with two soft radial gradients in opposite corners (~4% ink) to give the cream a tactile, lit-from-above feel. No photographic backgrounds.
- **No full-bleed imagery.** All images live inside contained cards or device frames.
- **No hand-drawn illustrations** in the live product. There is one set of stylised "figure silhouette" SVGs used inside `ProductPhoto` as a placeholder when the seller hasn't uploaded a photo — it's a single black silhouette over a 2-stop gradient (see *Components · Product photo*).
- **No repeating patterns.** No noise / paper-grain image. The "paper" feel is achieved through colour + low-spread shadows, not texture.

**Corner radii**

- `--r-xs 4px` — chips, tags, small buttons.
- `--r-sm 8px` — small buttons, secondary cards.
- `--r-md 12px` — default cards, listing cards, modals' inner panels.
- `--r-lg 18px` — lifted cards, bottom sheets.
- `--r-xl 28px` — large modals, the iOS device frame.
- `--r-pill 999px` — category chips, follow buttons, avatar, RSVP.

**Shadows**

Four warm low-spread shadows + one **hard "stamp" shadow** — `2px 2px 0 var(--ink)`. The stamp shadow is the signature move; it appears on the floating "post" button, the grail-gold "Notify me" CTA, the corner sticker stamps, and the brand seal in the stage eyebrow. No blue or grey-tinted shadows anywhere.

`--shadow-inset` adds a subtle top-light highlight + bottom-dark for any element that should read as physically lifted.

**Borders**

- `--border` is `rgba(20,17,15,0.10)` — warm ink at 10%.
- `--border-strong` is the same hue at 18%.
- `--border-faint` at 5%.
- Hairlines (1px) only. Never 2px borders on UI elements.

**Transparency & blur**

- No backdrop-filter / glass / blur on the *content* side. The iOS frame's status bar is an exception — it follows iOS 26 liquid-glass conventions (handled in `IOSFrame.jsx`).
- Soft accent backgrounds (`-soft` tokens like `--forest-soft`) are flat colours, not alpha-on-paper.

**Animation**

- Two easings: `--ease-out cubic-bezier(0.22, 1, 0.36, 1)` and `--ease-spring cubic-bezier(0.34, 1.56, 0.64, 1)`.
- Three durations: `--t-fast 120ms`, `--t-base 200ms`, `--t-slow 320ms`.
- Named keyframes used live in `app/index.html`:
  - `slideInRight` / `slideOutRight` — stack screen push/pop (320ms).
  - `sheetUp` — bottom sheets (200ms).
  - `fadeIn` — overlays.
  - `pop` — toasts and badges (220ms spring).
- Press feedback on `Button` is a `scale(0.97)` during pointer-down (`120ms`).
- Hover states on mobile-first surfaces are minimal; tap states do the work.

**Hover & press states**

- **Buttons** — primary CTAs darken to `*-deep` on hover/press; scale down 3% on pointer-down.
- **Icon buttons** — invert (background becomes `--ink`, fg becomes `--paper`) when active.
- **Tabs** — active tab gets a 3px stamp-red bottom indicator (rendered as a tiny rounded rectangle "tucked under" the icon).
- **Disabled** — `opacity: 0.4`, `cursor: not-allowed`.

**Cards**

A typical card is `--paper-soft` background, `1px solid --border`, `--r-md` (12px) corners, `--shadow-1` (almost imperceptible). No colored left-border accent strips. No drop-shadow + heavy elevation.

**Lifted accent moments** (grail callouts, the seal in the eyebrow, the post button) get the **stamp shadow** instead — a hard offset shadow that looks like ink stamped onto paper rather than a glow.

**Iconography vibe**

Lucide outline at 1.75 stroke. See `ICONOGRAPHY` below.

---

## ICONOGRAPHY

CollectorHub uses **Lucide** outline icons exclusively. The codebase inlines a curated subset of 22 icons as JSX components inside `shared.jsx` (the `Icons` object), each authored as a `viewBox="0 0 24 24"` `<path>` fragment that the shared `<Ico>` wrapper renders with:

- `fill="none"`
- `stroke="currentColor"`
- `strokeWidth={1.75}` (default; some active states bump to 2.4)
- `strokeLinecap="round"` / `strokeLinejoin="round"`
- Default size 20px

Inlined set: `home, bag, users, user, search, bell, plus, heart, message, share, more, back, star, shield, filter, pin, calendar, trend, camera, send, check`.

**Why inline, not CDN.** Lucide is free, MIT-licensed, and tree-shake-friendly — but because the prototype is a single-file artifact, the icons are inlined as path data. For new work in this design system you have two equally valid options:

1. **Copy the `Icons` map from `app/shared.jsx`** — fastest if you only need the existing set.
2. **Pull from the Lucide CDN** (`https://unpkg.com/lucide-static@latest/icons/<name>.svg`) and render with the same stroke / size rules. Treat this as the canonical source.

If you need an icon outside Lucide's set, find the closest Lucide match before reaching for another library. Do not mix icon families inside a screen. Do not use emoji as icons. Do not use Unicode geometric characters as icons (with one exception: `·` middle-dot is the metadata separator; `✓` is allowed inline in text labels like `✓ Vouched`).

**Logos / brand marks** live in `assets/`:

- `assets/logo-stamp.svg` — square seal, the "C" mark. Use at 96px and up.
- `assets/logo-wordmark.svg` — horizontal lockup, seal + wordmark.

There are no per-product mascots, illustrations, or stickers. The closest thing to brand illustration is the `ProductPhoto` placeholder — a generic figure silhouette over a 2-stop gradient — and it is explicitly a stand-in until the user uploads a real listing photo.

---

## Index of preview cards

Twenty-five cards are registered in the Design System tab, grouped by:

- **Brand** — logo stamp · wordmark lockup · UI kit thumbnail
- **Type** — Bricolage / Geist / JetBrains Mono specimens + size scale
- **Colors** — paper · ink · stamp-red · grail-gold · verified-teal · forest+plum · semantic tokens
- **Spacing** — 4-pt scale · radii · shadows
- **Components** — buttons · tags · stamp accents · avatars · category chips · icon set · bottom tab bar · product photo placeholder · screen header

---

## Caveats & open questions

- **No Figma, no repo** — system was reverse-engineered from a single self-contained prototype. If a Figma exists, please share it so we can verify token names + grail screens.
- **No real photography** — every product photo is a generated placeholder. The system has no guidance for shot composition / aspect ratio / colour-grading of real listing photos yet. We've defaulted to `4/3` ratio inside `ProductPhoto`.
- **Lucide icons are inlined** as path data inside `shared.jsx`. If the production app moves to a different icon family this will need re-doing.
- **No marketing / web** surface exists in the source materials, so this design system is mobile-app only. If the team ships a public landing page or web app, a second UI kit will need to be added.
- **No dark mode** — paper-and-ink palette is light-only. Tokens would need a sibling `:root[data-theme="dark"]` block to extend.
