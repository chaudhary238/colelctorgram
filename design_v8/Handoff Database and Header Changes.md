# Changes — Database screen & header (latest session)

Diff against the previous build. Files: `app/Chrome.jsx`, `app/FeedView.jsx`, `app/ExploreView.jsx`, `app/Overlays.jsx`, `app/data.jsx`.

## 1. Header (`AppBar`) — final layout

`[create] [search] —— wordmark/title —— [events] [activity]`

- `AppBar` takes a `leading` prop, rendered first in the left cluster (`trailing` unchanged).
- Left: Create Post, then Search. Center: wordmark/title, `flex: 1`, `justify-content: center`, `min-width: 0`, ellipsis. Right: Events (calendar), then Activity (bell + badge).
- Two icons per side so the wordmark sits at true center — keep that balance.

Create Post button — the only colored control in the header:
- 40×40, `border-radius: 12px`, `border: none`, `background: var(--stamp-red)`, white icon
- `box-shadow: 0 2px 8px rgba(199,42,42,0.28)`, `Icons.plus`, size 20, stroke 2.4
- Passed from `FeedView` via `leading`; goes **straight to the 4 post types**: `setOverlay({ name: 'compose', kind: 'post' })` — no Post-vs-Add-item chooser.
- All other header icons stay grey `IconButton`, size 20.

Removed: standalone Messages icon (merged, §2); Home's composer bar in body/footer.

## 2. Messages + Notifications merged into one Activity inbox

- Single bell. Badge = `unread + msgUnread`, or `null` at zero.
- "Notifications" overlay renamed **Activity**, with two `CategoryChip` segments at top (Activity / Messages), each showing its own unread count:
  - **Activity** — existing notifications list, unchanged.
  - **Messages** — conversation list from the `inbox` route: avatar, name, single-line ellipsised preview, mono timestamp, unread pill; row opens the chat thread.
- Keep the `inbox` route mounted for deep links; header no longer points at it.

## 3. Database screen — search row

- Middle tab stays **Database** (`Icons.grid`), screen title `Database`. Search is item-only (not global) — placeholder `Search items…`.
- One row: search field (flex, `min-width: 0`) + **Add item** button. Filters is now an icon **inside** the search field at the right edge:
  - `Icons.filter`, size 18, stroke 2, no border/background, no divider
  - `var(--ink-faint)` by default; `var(--stamp-red)` with an inline mono count when filters are active
  - `aria-label="Filters"` / `"Filters · N active"`
- **Add item** button: height 44, `border-radius: 12px`, `background: var(--stamp-red)`, white text 13px/700, `Icons.plus` size 15 stroke 2.4, `white-space: nowrap`, `flex-shrink: 0` → `push({ name: 'add-to-db' })`.
- Count line (`N items`) sits below the row. The old full-width footer "Add item" button is gone.

## 4. Database — pagination

- Show 8 items, then a full-width **"Show 8 more"** button (44px, `border-radius: 12px`, `var(--border-strong)` border, `var(--paper-soft)`).
- Resets to 8 whenever query, categories, scale, or sort change.

## 5. Database — "Can't find it?" prompt

At the bottom of the list, after pagination:
- Dashed-border card (`1px dashed var(--border-strong)`, `var(--paper-soft)`, radius 14, centered)
- Title: *Can't find what you're looking for?* · Sub: *Add it to the database and earn XP once it's reviewed.*
- Red **Add an item** button (height 38, radius 10) → `push({ name: 'add-to-db' })`

## 6. Filter sheet — category is multi-select tick chips

- `cat` (single string) → **`cats` (array)**; same for `draftCat` → `draftCats`. Filtering: `if (cats.length) l = l.filter(c => cats.includes(c.cat))`. Empty array = all categories.
- **"All categories" chip removed.**
- Chips: height 32, `border-radius: 9px`, 12.5px/600. Off = `var(--border-strong)` border on `var(--paper-soft)`, `var(--ink-mute)`. On = `var(--stamp-red)` border on `var(--stamp-red-soft)`, `var(--stamp-red)`, with a leading `Icons.check` (size 12, stroke 3.4).
- **Full category names** (`c.label`), matching Communities/Events: Action Figures · Diecast · Model Kits & Lego · Designer Toys & Blind Boxes · Trading Cards (TCG).
- **Default selection = the user's sign-up interests** (`ME.interests`), for both `cats` and `draftCats` on mount. `Clear` empties the selection.
- Toggling a category resets scale to `all`. Scale options are derived from the selected categories; `CAT_FILTER_FIELDS` is consulted only when exactly one category is selected.
- `activeFilterCount = cats.length + (scale !== 'all') + (sort !== 'owned')`.

## 7. Scale notation standardised

- Scales use `/` everywhere, never `:`. `app/data.jsx`: LEGO Eiffel Tower `1:300` → `1/300` (only outlier).

## Check before shipping

- 4 header controls, wordmark centered, Create Post the only colored one, opens the 4 post types directly.
- One header badge combining message + activity unread; Activity ↔ Messages keeps scroll and read state.
- Database search row never clips Add item at 390px width.
- Filter icon turns red with a count when filters are on.
- Filter sheet opens with the user's sign-up categories pre-ticked.
- Pagination resets on every filter/query change.
- No console errors on any tab.
