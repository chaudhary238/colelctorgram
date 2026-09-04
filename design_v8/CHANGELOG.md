# Change Log

Every entry lists the date, the pages/files touched, and what changed. Newest first.

## 2026-08-24 — Community moderation and settings overhaul; Events rebuild
See "Community and Events Change Review.html" for the full before/after with rationale.

**Community** — platform-approval gating (no activity until approved); banner/photo upload
in Create; rules character cap + collapsible; full "Manage community" sheet (rename/photos/
description/rules/delete); reason box on member removal; clickable requester profiles;
"About" tab renamed "Rules"; "Joined" CTA renamed "Open"; per-community "Pending" tab for
unapproved posts (clickable to review); Admin/Mod role badges on posts/comments; permission
split (Mods approve only; Admins also edit settings and remove members/posts); admin
post-removal. Design fixes: community card badges reserve fixed height always; "Founder"
renamed "Admin" everywhere; role picker and "Remove member" aligned as matching pills on
the far right.

**Events** — removed pincode + map; added City picker (matches profile onboarding), full-
address Venue textarea, Free/Paid toggle with multi-currency price, optional Ticket link
and Contact fields. Event-community links now point to the specific bound community.
Create-event form persists across a "create community" detour. Added full "Edit event
details" sheet in Manage Event (cover, title, categories, time, city, venue, description,
pricing, ticket/contact). Cover photo shrunk to a 96px banner. Time inputs switched to
native pickers, displayed as "4:00 pm".

Files: app/Nav.jsx, app/EventCreate.jsx, app/EventDetail.jsx, app/EventManage.jsx,
app/Cards.jsx, app/CommunityDetail.jsx, app/CommunityManage.jsx.

## 2026-08-19 — One edit-item page, Reserved removed, filter cleanup

### 1. Edit / List / Sold / Unmark — one page, not three
"List for sale" (`SellView`, no photo/description) and "Edit condition & price"
(`CompleteItemsView` single-item, no photo) were dead-end stubs living apart from
"Edit listing" (`AddListingView`), which already had photos, condition, price and
description. All three are now the same page for in-hand items.

- **app/AddListing.jsx** — `AddListingView` now also accepts `route.itemId` (an owned
  copy, listed or not). Saves condition/price/photos/description back to the copy via
  `saveItemInfo`, and creates, updates, or drops the market listing depending on the
  "List for sale" toggle in the same screen. Header/CTA read "Edit item" / "Save" /
  "Save & list for sale" in this mode.
- **app/ItemDetail.jsx** — Manage sheet: "Edit condition & price" and "Edit listing" merged
  into one "Edit item" row (works whether or not it's currently listed); "List for sale"
  opens the same page with the toggle defaulted on. Pre-order items still use the separate
  pre-order editor (ETA/deposit fields, can't be listed anyway).
- Wishlist star removed from the item page action row once you own a copy — Manage replaces it.

### 2. Reserved status removed
Simplified listing states to `available` / `sold` only, per feedback that Reserved added a
step nobody used. Removed from `Tag` (`components/labels/Tag.jsx`/`.d.ts`), `STATUS_LABEL`
(`app/shared.jsx`), `app/ListingView.jsx` (button state, manage-sheet rows, status tag), and
the seeded reserved listing in `app/data.jsx` (now `available`).

### 3. Owned filter: Sold always visible, new "Just owned" view
**app/ProfileCollection.jsx** — the owned-tab filter previously hid "Sold" until something had
sold, and had no way to see items that are plain-owned (not pre-order, not listed, not sold).
Replaced the checkbox list with a single-select chip row: **All / Pre-order / Listed / Sold /
Just owned** — one tap picks a view and closes immediately.

## 2026-08-18 — Standardised item page, quick-add collection, unified listing page

The big theme of this session: **one page per concept, less vertical space, and no invented data.**
Grouped by decision rather than by file so it reads in order on a call.

### 1. One item page everywhere
The database entry and a collection item were two separate components that had drifted apart.
They are now literally the same page — differences are one card and one button, not two designs.

- **app/ItemDetail.jsx**, **app/App.jsx** — The `explore-item` (database) route now renders `ItemDetail`.
  Photo, title, Scorred Reviewed seal, contributor line, own/wishlisted stats, About, rating and
  comments are identical by construction. Only the footer CTA and the ownership card differ.
- **Ownership slot** — a single collapsible card directly under the title, the only variable region:
  - *Owned* → `About your copy` · `Owned · Sealed · ₹4,800` (price visible to you only)
  - *Pre-order* → same card, gold tint, `Your pre-order` with ETA + balance due in the collapsed line;
    order timeline, total, deposit and balance inside. The separate gold timeline card was folded in.
  - *Listed* → same card plus a `Listed` tag and a `Sale · ₹5,400 · View listing →` row **inside** it,
    so there is never a second competing price block.
  - *Visitor* → identical card, header `In @meera's collection`, price row dropped, plus
    `Ask @meera about it`. All three states default collapsed for consistency.
- **DB Contributions** get no ownership card (nobody owns them) — the contributor line covers it.

### 2. Item page made compact
- Provenance collapsed from two stacked pills to one line: `Scorred Reviewed · Added by @you`.
- Community stats went from two large numeric tiles to one row: `301 own this | 178 wishlisted`
  (renamed from "own"/"want"; wishlist now uses the star icon to match the rest of the app).
- **About this item** is collapsible with `Read more`, and absorbed the specs grid.
- **Rating** sits last and stays open. The average was previously only stated in grey text —
  it is now a score block: large `4.7 /5`, gold stars filled to the true fraction, `96 ratings`,
  divider, then your own tappable stars.
- **Comments** follow as a normal thread, same pattern as a post.

### 3. Quick-add + finish-later (new flow)
Adding an item no longer opens a form, so several items can be added in a row.

- **app/ExploreView.jsx**, **app/Nav.jsx** — `+` on any database item adds it instantly.
  Toast teaches the reward at the moment it is earned: `+5 XP · Added to collection` /
  `+20 XP when you add condition & price`.
- **Completeness bar is deliberately tiny** — two fields: condition + price paid
  (pre-order: ETA + total). Photos, notes and order dates stay optional forever.
- **Portfolio value is private until complete** — a visitor sees `Value not shared · —`;
  you see the real number with a lock, plus a persistent card:
  `Only you can see your portfolio value · 8 of 10 items complete · +40 XP to finish · Finish 2 →`
  with a progress bar. (Chosen over hiding the whole portfolio, which punishes one missing field.)
- **Markers, not badges** — an incomplete tile's value line becomes `Add price →` / `Add condition →` /
  `Add details →` in gold: the tile shows what's missing in the slot where the data belongs, so no
  badge layer is needed and the grid still looks like a working app.
- **app/CompleteItems.jsx** (new) — `Finish your items`: one item at a time, fixed catalogue card,
  condition chips + price, `Save & next`, skip allowed, progress bar. Also serves single-item edit.
- **Pre-orders** keep structured dates (Month/Quarter/Year/Not announced + year selects) so the
  pre-order calendar can still bucket them, plus an optional deposit field.
- Item menu gained `Change to pre-order` / `It arrived — mark as owned` — the one thing a silent
  add can get wrong.

### 4. One listing page, and it does less
- **app/ListingView.jsx** — There were two components (seed listings vs user-created), so the same
  listing looked different depending on where you tapped it, and the user-created one referenced
  state it never declared (`status`, `manageOpen`, `setListing`) — your own listings would crash.
  Any source now normalises into one shape and renders one page: market card, `View listing` inside
  a collection item, and My Space all land identically.
- **Removed** the "Your order" card entirely (quantity stepper, shipping/local-pickup toggle, est. total).
- **Removed** the `Sealed / Mint / Like new / Good / Fair / For parts` ladder — leftover seed data
  that contradicted the real category-specific conditions.
- **Tabs restructured**: `Selling terms` leads (Condition, Quantity if >1, Ships from, Shipping,
  Returns, Trades + condition notes and description); `About the item` holds catalogue facts
  (Brand, Scale, Release year, Category) read from the same database entry, with `Read more` and a
  `View database entry →` link. Shipping appeared twice — now once. `Watching` removed.
- **Q&A** is collapsible with the question count in the header.

### 5. "Is this price fair?" now works — seller-only intel
Purpose: give the seller a signal on whether to adjust the price.
- **Visitor** votes Too low / Fair / Too high, sees a confirmation and a `Change` link — and
  **never sees percentages**, so votes can't anchor buyers' expectations.
- **Seller** sees the same card as a stacked bar + legend (`11% / 67% / 22%`), a plain-language
  recommendation ("Most collectors think ₹5,400 is too high — consider trimming it"), an
  `Adjust price` button, and an empty state before any votes land.
- A notification fires each time a vote arrives on your listing (one seeded so it's visible).

### 6. Copy, naming and removals
- Market filter chip renamed to **Saved** (was "Saved only" with a trailing count that read like a
  stepper); sort reads "Most saved", header "3 SAVED", empty state "Nothing saved yet."
- **Market condition filter** now appears only after a category is picked — it previously stacked
  every category's vocabulary at once, making it the longest block in the sheet. Empty state:
  "Pick a category above — conditions differ by category."
- **Deals** stat removed from the trust row everywhere (nothing in the product tracks deals) —
  now Vouches · Replies · Joined.
- **SKU** removed from all user-facing surfaces (item page, listing page, chat threads) — it stays
  an internal key only.

### Bugs found and fixed while testing this flow
- **Listed tag on items with no listing** — the tag read a seed flag on the shared catalogue row, so
  it appeared on every collector's copy. Now one source of truth (`activeListingFor`) drives the
  tag, the tap target, the filter count and the item page.
- **Pre-orders showing as for sale** — the listing lookup matched on SKU alone, and the collection
  legitimately holds the same SKU as both an owned copy and a pre-order, so pre-ordered copies
  inherited the owned copy's listing. A pre-order is not in hand and can now never show a listing.
- **Same SKU twice broke identity** — everything was keyed by SKU, so tapping the pre-order tile
  opened the owned copy and filling one copy's price patched both. Now keyed by item id end to end.
- **Search ignored items outside your interests** — the category filter was pre-seeded from your
  interests and also applied to search, so typing "Pokémon" returned nothing. Search now spans the
  whole catalogue unless you set filters yourself.
- **Quick-add silently refused wishlisted items** — the guard counted wishlist rows as owned.
- **Pre-order ETAs read as "TBD"** — dates are stored structurally but were read as a plain string,
  so every pre-order also counted as incomplete. One shared `etaLabel()` now formats them, and an
  explicit "not announced" counts as an answer rather than a gap.
- **Crash: condition chips** — options are `{id, label, hint}` objects rendered directly as labels,
  which blanked the screen on any owned item in the finish flow. (Condition hints now show too.)
- **Crash: month picker** — `MONTH_FULL`/`MONTH_SHORT` were declared inside the calendar component
  and invisible to other files; they now live in `app/data.jsx`. `etaPrecision: 'day'` also shares
  the Month chip and preserves the exact day instead of silently degrading it on save.
- **My own listing had no listing record** — a seed `listed: true` flag with nothing behind it, so
  the tag, the in-card row and Unlist all resolved to nothing. Two real listing rows added.

### Open items for the call
- The heart on listing pages still says "Saved to watchlist" — align to "Saved"?
- Older seed listings have no SKU, so they don't get the `View database entry` link.
  Fixed once every listing is created through the add flow.
- `MY_ITEMS` seed data still holds the same Gundam kit as three separate pre-orders — realistic?
- Whether the finish flow should also collect the order date (currently optional, never asked).

## 2026-07-29 — Composer cleanup + Contribute guidelines
- **app/Overlays.jsx** — Post composer (Post/ISO/Poll/Review) standardized: category picker switched to the shared `CategoryChip` pill style (matches CommunityView); removed the suggested-tags row, keeping only the custom #tag input; moved the hashtag block above the Emoji/Photo toolbar; condition picker in ISO converted to a native dropdown; Photo made mandatory in ISO (required, "*" indicator); "Post to" changed from multi-select chips to a multi-select checkbox dropdown; added category/budget/condition field headings to match form label patterns. ISO simplified to description-only (no separate "extra details" field). Audience picker collapses by default in the author line.
- **app/ExploreView.jsx** — "Add a new item" guidelines (ContributeGuidelines screen) rewritten: tightened wording; duplicate/bootleg rules moved into the General rules section; added a "How it works" section (internal review, duplicate redirect, XP chargeback, access restrictions for repeat offenders).
- Bundled into `Scorred App (Standalone).html` — all four post types render, no console errors.

## 2026-07-27 (8) — Simplification pass
- **app/FeedView.jsx** — Removed the sticky hashtag filter row from the feed (v2 candidate); "Customise feed" is now a single icon button next to the For You/Explore/Following tabs.
- **app/ProfileView.jsx** — Removed the "Communities" tab (redundant with the dedicated Community nav tab); consolidated the two stat rows (top 3-stat row + second Followers/Following/Vouches bar) into one clean 4-stat row (Followers, Following, Vouch In, Vouch Out) next to the avatar, freeing a full row of vertical space; "Add item" now opens Explore Database instead of the blank listing form.
- **app/ProfileCollection.jsx** — Collection segments simplified to Owned / DB Contributions only (pre-orders now show inside Owned with their PO tag, no separate tab); Chart view adds an in-hand vs pre-order count breakdown above the donut.

Suggested next (not yet done, flagging for a decision):
- ~~Drop the "Deals" stat entirely~~ — done 2026-08-18, removed from the trust row.
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
