# Design Changes — Feedback Rounds

Incoming design-feedback iterations from Claude Design (claude.ai/design).
Original/baseline design lives in `../design/` (mobile + web). Each subfolder
here is one exported handoff bundle, dated.

## Bundles

### 2026-06-10_claude-design-handoff/
Source: https://api.anthropic.com/v1/design/h/cZZWaQ695Q26F5yBvPTxGQ (open_file=app/index.html)
Project: "CollectorHub Design System (AV+SA)" — read `chats/` for intent (4 transcripts, 2026-05-28 → 2026-06-09).

**Confirmed scope for implementation (per founder, 2026-06-10): onboarding + feed filter + header only.**
Designed on the mobile prototype (`project/app/`); translate 1:1 to the web app.
Tracked in `.claude/TODO.md` → Milestone 16 (DF-xx items).

In-scope deltas vs `design/mobile`:
- **Onboarding** (`project/app/Onboarding.jsx`): 3 steps (was 4 — "Get specific" removed).
  Step 1 adds Bio (150 char) / Gender F-M toggle / Age slider 13–80+, removes City and
  the "You start as Verified" box. Steps 2–3 become line-by-line checkbox rows (no photo
  tiles). New email-OTP verification screen after signup (`OtpVerify`).
- **Feed filter** (`project/app/FeedView.jsx`): tabs → For You (caret → "Customize feed"
  popover) · Explore (was Latest) · Following. Popover = category checkboxes +
  "Remove Listing posts" (checked by default) + Save. New hashtag pill slider below tabs
  (All + popular tags, drag-scroll, filters feed, empty state).
- **Header** (`project/app/Chrome.jsx`): search moved left next to + create; Messages
  icon (own unread badge → inbox) added next to bell. Notifications overlay
  (`project/app/Overlays.jsx`): Messages section removed; 5 category cards — Likes ·
  Follows · Replies · Vouch (renamed from Trust) · Other (catch-all, incl. deal) — tap
  filters the activity list, Clear resets.

**Also present in this bundle but NOT in confirmed scope — do not implement yet:**
- Global RED / Xiaohongshu theme retune in `project/colors_and_type.css`
  (--paper #FFFFFF, brand #FF2442, Geist headings — replaces warm cream + Bricolage)
- "+" create flow reduced to two options (Create a Post / Create a Listing)
- "Verified" tier/badge removal from profile & onboarding — ⚠ conflicts with BRD §8.3
  trust tiers (Claimed/Shown/Verified) and the sell-requires-verified rule; needs a
  product decision before any code change
