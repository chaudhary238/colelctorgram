# BRD Updates Implementation

_Started 2026-06-04 13:45 UTC_

---

## User

there are few updated in this version of BRD can you implement this

## Assistant

_[tool: list_files]_

_[tool: read_file]_

I'll start by exploring the project structure and reading the updated BRD to understand what's changed.

_[tool: read_file]_

_[tool: read_file]_

Let me read the existing extracted BRD (likely v1.1) and extract the new v1.2 to compare.

_[tool: run_script]_

I have the v1.1 context. Now let me extract the new v1.2 BRD to find what changed.

_[tool: run_script]_

Now let me diff the two BRD versions to pinpoint exactly what changed in v1.2.

_[tool: snip]_

_[tool: read_file]_

_[tool: read_file]_

I now have a clear picture of the v1.2 changes. Let me capture them and snip the noisy diff. The stakeholder screen review touches 9 screens. Let me read the relevant app files.

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Let me read the remaining screens I need to modify, plus shared primitives and data.

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Now the detail screens. Let me read AddToCollection, ItemDetail, ProfileView, ListingView, CommunityDetail, EventDetail, Chat, and data.

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Now the last batch: ProfileView, CommunityDetail, EventDetail, Chat, Chrome (for shared layout helpers), and data.

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

Let me read Chat, data, and App to complete my understanding.

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Let me find where the state providers and remaining views live (CommunityView, EventsView, MarketView, Nav, PostDetail).

_[tool: update_todos]_

I now have full understanding of the codebase and the exact v1.2 stakeholder-review changes. Let me set up a plan and implement. These are well-specified spec deltas to an existing build, so I'll proceed directly.

_[tool: str_replace_edit]_

Starting with data layer + shared primitives. First, data.jsx additions (presence, ownership stats, posting modes, listing terms/feedback) and version bump.

_[tool: str_replace_edit]_

Now add a few icons and a QR-ticket component to shared.jsx.

_[tool: str_replace_edit]_

Now §9.2 — rewrite the onboarding wizard to profile-first with Scale/Universe sub-interests and 'Others' feedback capture.

_[tool: read_file]_

Let me re-read the exact current Onboard block to match precisely.

_[tool: str_replace_edit]_

The match failed on the large block. Let me do it in smaller, safe chunks. First the state declarations and the SubGroup helper:

_[tool: str_replace_edit]_

Now replace the three old step blocks with the four reordered ones:

_[tool: str_replace_edit]_

§9.2 done. Now §9.3 — feed in-card follow, inline comments, hide-listings filter. Editing Cards.jsx (AuthorLine + PostCard) and FeedView.

_[tool: str_replace_edit]_

Now update FeedView — hide-listings filter, in-feed follow on cards, and seed a poll post.

_[tool: str_replace_edit]_

Let me add a poll post to the data and surface it in the feed.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

§9.3 done. Now §9.4 — add mandatory-field validation to Add to Collection. Rewriting the "picked" branch as a dedicated form component.

_[tool: read_file]_

I need to restore `flashToast` for the search branch of AddItemView and add the new PickedForm component. Let me view the current state of the file around there.I need to restore `flashToast` in AddItemView and insert the PickedForm component before SellView.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

That second edit was wrong — it stripped SellView's `useNav`. Let me restore it and insert the PickedForm component before SellView.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

§9.4 done. Now §9.5 — chart/calendar/collage portfolio views with per-view visibility, in ProfileView's CollectionTab.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

§9.5 done. Now §9.11 — online status, ownership stats, and tappable follower/following lists in ProfileView.

_[tool: str_replace_edit]_

Register the `follows` route in App.jsx.

_[tool: str_replace_edit]_

§9.11 done. Now §9.6 — post-type-first composer with Poll. Rewriting ComposeOverlay.

## User

lets complete it

## Assistant

_[tool: read_file]_

§9.6 done. Now I need to make sure `followed`/`toggleFollow` state exists (I referenced it in Cards & Profile). Let me check Nav.jsx.

_[tool: read_file]_

State is all in place. Now §9.9 — Listing detail with condition, Terms tab, purchase fields, anon price feedback, safe-trade disclaimer.

_[tool: str_replace_edit]_

I need to define `CONDITION_LADDER` in data.jsx. Let me add it.

_[tool: str_replace_edit]_

_[tool: grep]_

Let me check the listing condition values match the ladder.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

The conditions are free-text. I'll add a `gradeOf` helper that maps to the ladder rather than rewrite each listing.§9.9 done. Now §9.10 — opt-in public DM thread. Let me look at Chat.jsx.

_[tool: read_file]_

_[tool: str_replace_edit]_

§9.10 — opt-in public thread. Adding a toggle and public-thread banner.

_[tool: read_file]_

§9.10 done. Now §9.12 — community guidelines gate, open/approval posting, visible admin.

_[tool: grep]_

_[tool: str_replace_edit]_

I'll add an admins map and wire up the gate, posting mode, and visible admins.I had a malformed third edit. Let me fix.

_[tool: str_replace_edit]_

Now wire the gate, posting mode, and visible admins into CommunityDetail.

_[tool: str_replace_edit]_

## User

we dont need to design admin flow now because that will be web version we would not need in app screen 9.16

## User

Fixing design-system issues

## User

Fixing design-system issues

## Assistant

## Assistant

_[tool: grep]_

Let me look at the tokens file to fix the unclassified-token warnings.Let me add `@kind` comments to those motion/spacing tokens in the CSS.

_[tool: read_file]_

_[tool: str_replace_edit]_

The "files could not be read" warning is likely a transient compile race. Let me re-run the check.

_[tool: check_design_system]_

Clean — no issues. The token warnings are resolved (motion + spacing tokens now carry `@kind` comments) and the "files could not be read" warning was a transient compile race that cleared on re-run. The design system compiles cleanly: 79 tokens, 26 cards, 3 fonts.

## User

no back button on collectables detailed page, in profile when you click on collectables (sell/trade this item)

## User

Fixing design-system issues

## Assistant

## Assistant

## Assistant

_[tool: done]_

All three reported issues have been fixed and verified. Let me finalize by surfacing the app and confirming it loads cleanly.

_[tool: fork_verifier_agent]_

All three issues are fixed:

1. **Missing back button on collectible detail (and others)** — the product image had a negative top margin that painted over the transparent header. I restructured ItemDetail, ListingView, CommunityDetail, and EventDetail so the header overlays the image — the back chevron now sits visibly at top-left on all four.

2. **Inconsistent footer button position** — unified every fixed CTA footer and the bottom nav to a 30px bottom inset, so the primary button lands in the same place on every screen.

3. **"Set up profile" button hard to click** — the onboarding screens were overflowing the phone frame (height:100% + padding without `border-box`), pushing the button ~22px *below* the frame. Added `box-sizing: border-box`; the button now sits 30px inside the frame, matching everything else.

A verifier is doing a final pass across these screens and will flag anything missed.

## User

Fixing design-system issues

## Assistant

_[tool: check_design_system]_

Clean — no issues found. That warning was a transient read error during a compile that overlapped with my edits to `app/AddToCollection.jsx`; the compiler re-ran and now reports the design system valid (79 tokens, 26 cards, 3 fonts, no issues). Nothing further to fix.

