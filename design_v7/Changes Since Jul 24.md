# Changes Since Friday, July 24, 2026

Consolidated by file — everything changed in the project between 2026-07-24 and 2026-07-29.

## app/Overlays.jsx
- Composer back button no longer drops to Post-vs-Add-item chooser when opened directly — closes composer instead.
- `ComposeOverlay` accepts a `kind` prop to open directly on the post-type screen.
- Standardization pass: `CategoryChip` pill picker (matches CommunityView), removed suggested-tags row (custom #tag input only), hashtags moved above Emoji/Photo toolbar, ISO condition picker → native dropdown, ISO photo now mandatory (required, "*"), "Post to" changed from multi-select chips to multi-select checkbox dropdown, added category/budget/condition field headings, ISO simplified to description-only (no "extra details"), audience picker collapsed by default in author line.

## app/ExploreView.jsx
- Browse screen redesign: category chips + single "Filters" bottom-sheet trigger; full-bleed product photo cards with wishlist/add icon overlays.
- Top bar restructured: search + wishlist toggle + Filters icon (badge shows active count); Category/Brand/Scale moved into filter sheet.
- Search placeholder changed to "Search your collectibles…"; dropped wishlist-only icon; dropped Brand filter; added Sort control (Popular, Most owned, Most wishlisted, Newest).
- Contribute guidelines (ContributeGuidelines screen) rewritten: tightened wording, duplicate/bootleg rules moved into General rules section, added "How it works" section (internal review, duplicate redirect, XP chargeback, access restrictions for repeat offenders).

## app/FeedView.jsx
- Composer bar moved from top of Home feed to sticky bottom footer; copy changed to "Write something or create a post…"; tapping opens post-type picker directly (skips chooser).
- Dropped sticky hashtag filter row; "Customise feed" is now a single icon button.

## app/ProfileView.jsx
- Removed the Communities tab (redundant with dedicated Community nav tab).
- Consolidated two stat rows into one 4-stat row (Followers, Following, Vouch In, Vouch Out) next to avatar.
- "Add item" now opens Explore Database instead of a blank listing form.

## app/ProfileCollection.jsx
- Collection segments simplified to Owned / DB Contributions only (pre-orders shown inside Owned with PO tag).
- Chart view adds in-hand vs pre-order count breakdown above the donut.

## app/AddToCollection.jsx
- Removed "Intel" status option (owned/pre-order only); photo capture now optional, supports multiple photos.
- No longer re-asks catalogue-fixed fields (title/category/brand/scale/description) when coming from Explore Database — shows read-only catalogue summary, only asks copy-specific fields (photo, status, condition, price paid, pre-order tracking).
- Fixed a duplicate-block syntax error introduced mid-edit.

## app/Nav.jsx
- Guideline acceptance now global per-community persisted state (`guidelinesAccepted`), not local component state.

## app/CommunityDetail.jsx
- Bottom nav re-enabled on community detail screen (below sticky composer bar).
- Composer bar restyled to match Home feed's pill design/copy.
- Composer trigger moved out of Posts tab body into sticky bottom footer (Posts tab only, accepted members); opens with `kind: 'post'`.

## app/App.jsx, web/Web.jsx
- Fixed `ComposeOverlay` mount to pass through `overlay.kind`, so composer bars actually skip the Post-vs-Add-item chooser as intended.

## Scorred App (Standalone).html
- Rebundled with all changes above; all four post types (Post/ISO/Poll/Review) render cleanly, no console errors.
