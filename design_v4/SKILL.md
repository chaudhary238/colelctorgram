---
name: collectorhub-design
description: Use this skill to generate well-branded interfaces and assets for CollectorHub — an India-focused MVP marketplace + community app for toy / figure / diecast / Lego collectors. Contains essential design guidelines, colors, type, fonts, assets, and a full UI kit for prototyping or shipping production work.
user-invocable: true
---

Read the `README.md` file within this skill first — it has the brand context, content fundamentals, full visual foundations write-up, and the iconography rules. Then explore:

- `colors_and_type.css` — all design tokens (CSS custom properties) + `@font-face` blocks. Import this in any HTML you generate.
- `fonts/` — Bricolage Grotesque (display), Geist (body), JetBrains Mono (prices/SKUs/codes).
- `assets/` — logo seal + horizontal wordmark, SVG.
- `preview/` — 25 small HTML specimens of every token group. Use these as worked examples when composing new screens.
- `app/` — the current BRD v1.4 mobile UI kit. The single best reference for what shipped product feels like. Each `.jsx` file is a small per-screen component you can copy or adapt; `shared.jsx` exposes the primitives (`Button`, `Tag`, `Avatar`, `VerifyBadge`, `TrustSignals`, `ProductPhoto`, `Screen`, etc.) on `window`. `v1/` holds the original prototype.

## Defaults at a glance

- **Background**: `--paper` (`#F4EFE6`). Cards: `--paper-soft`. Recessed wells / stage: `--bone`. **Never pure white.**
- **Text**: `--ink` (`#14110F`, warm near-black). Use the `--ink-*` scale for secondary text — do not invent grey ramps.
- **Type**: headlines in Bricolage Grotesque 700–800 with negative letter-spacing. Body in Geist 400/500/600. Prices and SKUs in JetBrains Mono with `font-variant-numeric: tabular-nums`. **No Inter, no Roboto, no Arial.**
- **Brand accents**: stamp-red is CTA + brand mark. Grail-gold is rare / featured / preorder. Verified-teal is trust / vouch. Forest is success. Plum is community. Each comes with `-deep` (press) and `-soft` (tinted bg) variants.
- **Icons**: Lucide outline, 1.75 stroke, `currentColor`, `viewBox="0 0 24 24"`. Inlined set lives on `window.Icons` in the UI kit.
- **Shadows**: warm low-spread `--shadow-1 → --shadow-4`, plus the signature `--shadow-stamp` (hard 2px ink offset, no blur) for the brand seal / CTA / corner stickers. Never use blue-tinted or grey shadows.
- **Radii**: `--r-md 12px` is the default card. Pills for chips and follow buttons. `--r-xl 28px` for large modals and the device frame.
- **Tone**: short, second-person, trader-direct. UPPERCASE only in tags / overlines / stamps. No emoji. No exclamation marks outside toast confirmations.

## When invoked

If the user invokes this skill without other guidance, ask what they want to build (a marketing one-pager? a new in-app screen? a deck? a sticker sheet?), then act as an expert CollectorHub designer.

For **visual artifacts** (mocks, prototypes, slides, decks), copy assets out of this skill and produce static HTML files. Always import `colors_and_type.css`, and reuse components from `app/shared.jsx` rather than reinventing them.

For **production code**, you may copy the JSX components directly — they are simple, dependency-free React, and the CSS tokens are framework-agnostic.

Never substitute the type stack. Never mix in icons from other families (Heroicons, Phosphor, Material) — find the closest Lucide name first. Never introduce a pure-white surface. Stay on the paper-and-stamp metaphor.
