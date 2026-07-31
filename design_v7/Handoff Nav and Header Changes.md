# Changes to Implement — Nav and Header Restructure

Design is attached separately. This is a diff against the previous build, not a spec from scratch.

## 1. Header (`AppBar`, all root tabs)

New order: `[create] [search] — wordmark/title — [events] [activity]`

- Add a `leading` prop, rendered first in the left cluster (`trailing` behaviour unchanged).
- Left cluster: Create Post, then Search.
- Center: wordmark/title, `flex: 1`, `justify-content: center`, `min-width: 0`, ellipsis.
- Right cluster: Events (calendar), then Activity (bell + badge).

Create Post button (the only colored control in the header):
- 40×40, `border-radius: 12px`, `border: none`
- `background: var(--stamp-red)`, white icon, `box-shadow: 0 2px 8px rgba(199,42,42,0.28)`
- `Icons.edit`, size 18, stroke 2
- Passed from `FeedView` via `leading`; opens `setOverlay({ name: 'compose', kind: 'post' })`
- Other header icons stay grey `IconButton`, size 20.

Removed:
- Standalone Messages icon (merged — §2).
- Home's composer bar in the body/footer — header button is the only entry point.

## 2. Merge Messages + Notifications into one Activity inbox

- Single bell. Badge = `unread + msgUnread`, or `null` at zero.
- "Notifications" overlay renamed **Activity**, gains two `CategoryChip` segments at top, each with its own unread count in the label:
  - **Activity** — existing notifications list, behaviour unchanged.
  - **DMs** — the conversation list from the `inbox` route: avatar, name, single-line ellipsised preview, mono timestamp, unread pill; row opens the chat thread.
- Keep the `inbox` route mounted for deep links; header no longer points at it.

## 3. `Database` tab becomes `Explore`, with global search

- Tab id stays `database`; label → `Explore`; icon → `Icons.grid`. Screen title → `Explore`. Still 5 tabs, none removed.
- Search field is now global. Placeholder: `Items, posts, people, communities…`
- Empty query → unchanged catalogue browse (category chips, Filters sheet, 2-up grid, item count).
- Non-empty query → scope chips below the search row, each with a count, zeros included:
  `Items N · Posts N · People N · Communities N · Events N`
  - `Items` is default and renders the existing grid filtered by query; scope resets to `Items` when the field is cleared.
  - Other scopes render result rows (cap 20): 40px media, title, sub line.
    - Posts — author avatar; body or ISO item truncated to 72 chars; sub `@handle · Community`; taps to post.
    - People — avatar w/ verified state; display name; sub `@handle · N deals · N vouches`; taps to profile.
    - Communities — tag block on `var(--ink)`; name; sub member count; taps to community detail.
    - Events — month/day block on `var(--plum)`; title; sub date string; taps to event.
  - Empty non-item scope: `No {scope} match that search.`
  - Empty `Items`: `No items match that search.` + hint naming a scope that has results (`Try Posts above.`).
- Post search covers user posts, seeded feed posts, and ISO posts. People matches name and handle. All matching case-insensitive substring.
- Header search overlay stays as-is for the header icon.

## 4. Explore — Add item moved up

- Remove the full-width "Add item — can't find something?" footer button.
- Add a 44×44 `border-radius: 12px` icon button directly right of Filters in the search row: `Icons.plusCircle`, size 18, stroke 1.8, `var(--stamp-red)` on `var(--slate-50)`, `var(--slate-200)` border, `aria-label="Add item — can't find something?"`, opens `push({ name: 'add-to-db' })`.

## 5. Events

- Header calendar icon → `push({ name: 'events' })`, plus the Explore search scope. No duplicate Events link in the Explore body.

## Check before shipping

- 4 header controls, wordmark visually centered, Create Post the only colored one.
- One header badge combining DM + activity unread.
- Activity ↔ DMs switch keeps scroll and read state.
- Explore scope counts accurate; clearing the field resets to Items + catalogue browse.
- Add item is one tap from the top of Explore; no footer button in Explore or Home.
- No console errors on any tab.
