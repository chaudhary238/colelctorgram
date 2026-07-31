# Change Log

Every entry lists the date, the pages/files touched, and what changed. Newest first.

## 2026-07-29 — Composer cleanup + Contribute guidelines
- **app/Overlays.jsx** — Post composer (Post/ISO/Poll/Review) standardized: category picker switched to the shared `CategoryChip` pill style (matches CommunityView); removed the suggested-tags row, keeping only the custom #tag input; moved the hashtag block above the Emoji/Photo toolbar; condition picker in ISO converted to a native dropdown; Photo made mandatory in ISO (required, "*" indicator); "Post to" changed from multi-select chips to a multi-select checkbox dropdown; added category/budget/condition field headings to match form label patterns. ISO simplified to description-only (no separate "extra details" field). Audience picker collapses by default in the author line.
- **app/ExploreView.jsx** — "Add a new item" guidelines (ContributeGuidelines screen) rewritten: tightened wording; duplicate/bootleg rules moved into the General rules section; added a "How it works" section (internal review, duplicate redirect, XP chargeback, access restrictions for repeat offenders).
- Bundled into `Scorred App (Standalone).html` — all four post types render, no console errors.

## 2026-07-27 (8) — Simplification pass
- **app/FeedView.jsx** — Removed the sticky hashtag filter row from the feed (v2 candidate); "Customise feed" is now a single icon button next to the For You/Explore/Following tabs.
- **app/ProfileView.jsx** — Removed the "Communities" tab (redundant with the dedicated Community nav tab); consolidated the two stat rows (top 3-stat row + second Followers/Following/Vouches bar) into one clean 4-stat row (Followers, Following, Vouch In, Vouch Out) next to the avatar, freeing a full row of vertical space; "Add item" now opens Explore Database instead of the blank listing form.
- **app/ProfileCollection.jsx** — Collection segments simplified to Owned / DB Contributions only (pre-orders now show inside Owned with their PO tag, no separate tab); Chart view adds an in-hand vs pre-order count breakdown above the donut.

Suggested next (not yet done, flagging for a decision):
- Drop the "Deals" stat entirely or fold it into the profile bio line — it lost its slot in the consolidated stat row.
- The Grid/Chart/PO Calendar view switcher could shrink to icon-only buttons to save more width now that Owned/DB Contributions is a single segmented row above it.

## 2026-07-27 (7)
- **app/AddToCollection.jsx** — Removed the "Intel" status option (owned/pre-order only); photo capture is now optional (supports multiple photos) instead of a forced single required field.
- **app/ExploreView.jsx** — Search placeholder changed to "Search your collectibles…"; removed the heart/wishlist-only icon; Brand dropped from filters (too many values to fit as chips); added a Sort control (Popular, Most owned, Most wishlisted, Newest) in the filter sheet alongside Category and Scale.

## 2026-07-27 (6)
- **app/AddToCollection.jsx** — "Add to collection" no longer re-asks catalogue-fixed fields (title/category/brand/scale/description) when coming from Explore Database — shows the catalogue entry as a read-only summary and only asks what's specific to your copy: photo, status (owned/pre-order/intel), condition, price paid, or pre-order tracking. (Fixed a duplicate-block syntax error introduced mid-edit.)
- **app/ExploreView.jsx** — Top bar now matches the reference pattern: one row with search + wishlist-only toggle + a Filters icon button (badge shows active count). Category, Brand, and Scale all moved into the filter bottom sheet instead of stacked chip rows.

## 2026-07-27 (5)
- **app/ExploreView.jsx** — Explore Database browse screen redesigned for scanability: category chips + a single "Filters" trigger (opens a bottom sheet for brand/scale) replace the stacked filter rows; cards now show full-bleed product photos with wishlist/add as small icon overlays on the image instead of a text button row — more items visible per scroll, less text upfront.
- **app/Nav.jsx** — Guideline acceptance is now global per-community state (`guidelinesAccepted`), not local component state — accepting once persists across visits/re-entries.
- **app/CommunityDetail.jsx** — Uses the persisted acceptance; composer bar restyled to match the Home feed's pill design/copy ("Write something or create a post…").

## 2026-07-27 (3)
- **app/CommunityDetail.jsx** — Bottom nav re-enabled on the community detail screen (was hidden like other drill-in pages); now shows below the sticky composer bar.

## 2026-07-27 (2)
- **app/Overlays.jsx** — Back button in the post composer no longer drops to the Post-vs-Add-item chooser when opened directly (Home/Community bars) — it now closes the composer instead.

## 2026-07-27
- **app/App.jsx**, **web/Web.jsx** — Fixed `ComposeOverlay` mount to pass through `overlay.kind`, so the composer bars actually skip the Post-vs-Add-item chooser as intended.
- **app/CommunityDetail.jsx** — Composer trigger now opens with `kind: 'post'` too, going straight to the post-type screen.
- **app/FeedView.jsx** — Composer bar moved from top of Home feed to a sticky bottom footer; copy changed to "Write something or create a post…"; tapping it now opens the post-type picker directly (skips the Post-vs-Add-item chooser).
- **app/CommunityDetail.jsx** — "Share something with [Community]…" composer trigger moved out of the Posts tab body into a sticky bottom footer (shown only on the Posts tab, for accepted members).
- **app/Overlays.jsx** — `ComposeOverlay` now accepts a `kind` prop to open directly on the post-type screen instead of always starting on the Post-vs-Add-item chooser.

## Earlier (pre 2026-07-27) — Explore Database rebuild
- Removed the floating `+` button; replaced with static post-composer bar (Home) — see above for latest position change.
- Added Explore entry point in Market tab.
- "Add an item" duplicated: kept in Profile, added inside Explore.
- Database items: own + wishlist counts, open ratings, per-category adaptive filters (e.g. scale for figures, not TCG).
- "Add to database" flow: guideline popup before form.
- Files: app/ExploreDatabase.jsx, app/DatabaseItemDetail.jsx, app/AddListing.jsx, app/data.jsx, app/App.jsx, app/ProfileView.jsx, app/Nav.jsx.
