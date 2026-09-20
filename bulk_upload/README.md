# Bulk Post Upload — founder workflow

The fastest way to put real content on Scorred without using the app one post
at a time. **One row in the spreadsheet = one post on the feed.**

## Files here

| File | What it is |
|---|---|
| `Scorred_Posts_Template.xlsx` | The blank template. **Fill the `Posts` sheet.** |
| `Scorred_Posts_SeedBatch_20260919.xlsx` | The 2026-09-19 beta seed batch — use it as a worked example of every post type. |
| `*.ingest_manifest.json` | Audit trail of an ingest run: which row became which post, and where every image came from. |
| `seed_image_sources.json` | License + source page for every crawled seed image (swap list if a takedown ever arrives). |
| `seed_image_manifest_events.json` | Source of each event poster. |

## How to fill (SA / AV)

1. Open `Scorred_Posts_Template.xlsx` (Excel or Google Sheets).
2. Read the **Instructions** sheet once — it lists what each post type needs.
3. Fill one row per post on the **Posts** sheet. Dropdowns only offer valid
   values (accounts, communities, catalogue SKUs, categories).
4. Images: paste direct image links, or Google Drive share links set to
   "Anyone with the link".
5. Send the file to RC.

## How to ingest (RC)

```bash
# 1. Validate — writes nothing, reports every problem row:
backend/.venv/bin/python backend/scripts/ingest_bulk_posts.py bulk_upload/<file>.xlsx

# 2. Apply:
backend/.venv/bin/python backend/scripts/ingest_bulk_posts.py bulk_upload/<file>.xlsx --apply
```

- **Posts go through the live API** (2026-09-20 decision): the script logs in
  as each row's author and posts for real — XP, notifications and counters
  all fire exactly like app usage. Only seed personas (@seed.scorred.com,
  shared `seed_password` in `.prod.env`) and the `collectorhub` admin
  (`seed_admin_password`) can be posted for; rows by real accounts are
  skipped — real people post via the app.
- Target API = `qa_api_base` in `.prod.env`; the DB (validation + backdating)
  comes from `database_url` / `DATABASE_URL`.
- **Images**: with `r2_*` keys in `.prod.env` every image is re-hosted on R2;
  without them the (verified) source URL is stored directly. Google Drive
  links REQUIRE the R2 keys — Drive blocks hotlinking.
- `days_ago` backdates the post's created_at after the API call (cosmetic).
- Regenerate the template whenever accounts/communities/catalogue change:

```bash
backend/.venv/bin/python backend/scripts/make_bulk_post_template.py
```
