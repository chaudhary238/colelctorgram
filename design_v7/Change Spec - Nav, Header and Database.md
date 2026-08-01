# Change Spec — Navigation, Header & Database

Behavioural spec for implementation. Visual design is supplied separately — this document defines **what changes, what it does, and how state behaves**, not styling.

Scope: the app header, the Activity/Messages merge, the Database screen, and the filter sheet.

---

## 1. Header — reduced to four controls

The header previously carried five equal-weight controls (create, search, events, messages, notifications) with two competing unread badges. It is now four.

**Final arrangement:** Create · Search — Wordmark/Title — Events · Activity

- Two controls on each side so the centered wordmark sits at true optical center. **Preserve this balance** — adding a control to one side unbalances the title.
- The header component gains a `leading` slot rendered first in the left cluster, alongside the existing `trailing` slot rendered last in the right cluster. Screens supply their own primary action through `leading`.
- Create Post is the **only colored control** in the header. Everything else is a neutral icon button. This is deliberate: one primary action, visually unambiguous. Do not add a second colored header control.

### 1.1 Create Post behaviour

- Icon is a **plus**, not a pencil — it reads as "add", consistent with the rest of the app.
- Tapping it opens the composer **directly on the four post types** (Post / ISO / Poll / Review). There is **no intermediate "Post or Add item?" chooser** — that step was removed.
- The composer receives an explicit post-kind on open, so its back button closes the composer rather than falling back to the removed chooser screen.
- Supplied by the Home feed through the `leading` slot.

### 1.2 Removed from the header

- The standalone **Messages** icon (merged into Activity — §2).
- Home's inline composer bar. It previously sat in the feed body, then in a sticky footer; both are gone. The header plus button is the **single** entry point for creating a post from Home.

---

## 2. Messages and Notifications merged into one Activity inbox

Two adjacent bell/message icons each carried their own red badge, so users could not tell which unread mattered.

- **One bell icon** in the header. Its badge is the **sum** of activity unread and total message unread; hidden entirely at zero.
- The Notifications overlay is renamed **Activity** and gains two segments at the top:
  - **Activity** — the existing notification list. Categories, read state, and all existing behaviour are unchanged.
  - **Messages** — the conversation list that previously lived at the standalone inbox route. Each row shows avatar, name, a single-line truncated message preview, timestamp, and a per-conversation unread count. Tapping a row opens that chat thread exactly as before.
- **Each segment label carries its own unread count**, so the combined header badge is disambiguated as soon as the overlay opens.
- Segment naming: the second segment is labelled **Messages**, not "DMs" — it matches the term used elsewhere in the app.
- Switching between segments must **preserve scroll position and read state** in each.
- The standalone inbox route stays mounted so existing deep links continue to work; only the header entry point moved.

### 2.1 Events

- Events remains a header icon, on the right side before Activity. It was briefly moved into the Database body during exploration — that was reverted. There should be **no duplicate Events link** inside Database.

---

## 3. Database screen

The middle tab is **Database** (grid icon). Its search is scoped to **catalogue items only** — an earlier experiment made it global across posts, people, communities, and events; that was reverted. Search matches item fields only.

### 3.1 Search row — one line, three controls

Search field, filter trigger, and Add item now share a single row:

- **Search field** flexes to fill available width and must be allowed to shrink, so the Add item button never clips on narrow screens (390px baseline).
- **Filter trigger moved inside the search field**, at its right edge. It is icon-only with no divider or container — the field reads as one clean object.
  - Neutral when no filters are applied.
  - Turns into the accent state with an **inline count** when filters are active.
  - Opens the existing filter sheet.
- **Add item** is a labelled button (icon + text), not an icon-only control — it was previously an unlabeled plus, which was not understandable. It must not shrink or wrap. Goes to the add-to-database flow.
- The **item count** line moved below this row.
- The old full-width "Add item — can't find something?" **footer button is removed**.

### 3.2 Pagination

- The grid renders **8 items initially**, then a full-width **"Show 8 more"** button beneath it.
- Each tap reveals 8 more. The button disappears when everything is shown.
- The button label states only how many more will be shown — no "N left" counter.
- **The page size resets to 8 whenever the query, selected categories, scale, or sort changes.** Otherwise a user who has paged deep and then filters lands mid-list.

### 3.3 "Can't find it?" prompt

At the very bottom of the list, after the pagination button:

- A distinct dashed-border card (visually different from the item cards, so it isn't mistaken for a result).
- Headline asks whether the user found what they were looking for; supporting line states that adding an item earns XP once it passes review.
- Contains an **Add an item** action going to the same add-to-database flow.
- This is the third and final entry point into that flow, alongside the search-row button and the profile "Add item" action.

---

## 4. Filter sheet — multi-select categories

Category filtering was single-select via a dropdown-style list, with an "All categories" option and a long scroll.

### 4.1 Multi-select

- Category state changes from **a single value to an array**. Filtering keeps an item if its category is in the selected array.
- **An empty array means no category restriction** — this replaces the removed "All categories" option, which should be **deleted**, not hidden. An explicit "all" option is redundant once selection is multiple.
- Selection is expressed as **tick chips**: each chip toggles independently, and selected chips show a check mark plus the accent treatment. It must be obvious at a glance that multiple can be on at once.
- The sheet's draft state mirrors this — categories are staged in the draft while the sheet is open and only committed on apply, as with the other filters.

### 4.2 Category labels

- Chips use the **full category names**, matching the wording used in Communities and Events: Action Figures, Diecast, Model Kits & Lego, Designer Toys & Blind Boxes, Trading Cards (TCG). No abbreviations or short forms — the same category must never be worded two ways in different parts of the app.

### 4.3 Default selection from sign-up interests

- On first mount, both the live and draft category selections are **pre-populated with the categories the user chose at sign-up**. A collector who signed up for Diecast should not have to filter to Diecast on every visit.
- **Clear** empties the selection entirely (back to unrestricted), rather than reverting to the sign-up defaults.

### 4.4 Scale options depend on category

- Changing the category selection **resets scale to "all"**, because scale vocabularies differ per category and a stale scale would silently zero the results.
- Category-specific scale options are only offered when **exactly one** category is selected. With zero or multiple selected, show the union of scales present in the filtered set.

### 4.5 Active filter count

- The count shown on the filter trigger is: number of selected categories, plus one if scale is not "all", plus one if sort is not the default. It drives both the trigger's active state and its inline number.

---

## 5. Scale notation standardised

- Scale is written with a **forward slash** everywhere in the app — `1/7`, `1/300` — never a colon.
- One catalogue entry (the LEGO Eiffel Tower) used `1:300` and has been corrected. Any importer, seed data, or user-entered scale should normalise to the slash form so filters group correctly; a colon-form value will not match its slash-form siblings.

---

## Acceptance criteria

- Header has exactly four controls; wordmark is optically centered; Create Post is the only colored one and opens the four post types directly, with no chooser step.
- A single header badge combines message and activity unread; each Activity segment shows its own count.
- Switching between Activity and Messages preserves scroll and read state; existing chat deep links still resolve.
- Database search matches items only.
- At 390px width, the Database search row shows all three controls with no clipping and no wrapping.
- The filter trigger reflects active state and count inside the search field.
- The filter sheet opens with the user's sign-up categories pre-ticked; multiple categories can be selected; there is no "All categories" option; Clear empties the selection.
- Changing any filter or the query resets pagination to 8.
- The add-to-database flow is reachable from three places: the search-row button, the "Can't find it?" card, and the profile.
- No scale value anywhere renders with a colon.
- No console errors on any tab.
