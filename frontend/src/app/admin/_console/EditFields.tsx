"use client";

// The console's "Edit & publish" / "Edit & approve" fields. Title lives in DecisionModal.

import { ImageUploader } from "@/components/ImageUploader";
import { ADD_CATEGORIES, CAT_SCALES } from "@/lib/catalog";
import { splitOfficialLink } from "@/lib/utils";

type Item = Record<string, unknown>;

// ── Official post ────────────────────────────────────────────────────────────
export interface PostDraft { text: string; link: string; tags: string; category: string; images: string[] }

export function postDraft(item: Item): PostDraft {
  const { text, url } = splitOfficialLink(String(item.body ?? ""));
  return { text, link: url ?? "", tags: ((item.tags as string[]) ?? []).join(" "), category: String(item.category ?? ""), images: (item.images as string[]) ?? [] };
}

export const postPayload = (title: string, d: PostDraft) => ({
  title, body: [d.text.trim(), d.link.trim()].filter(Boolean).join("\n\n"),
  tags: d.tags.split(/[\s,]+/), category: d.category || null, images: d.images,
});

export function PostFields({ value, onChange }: { value: PostDraft; onChange: (d: PostDraft) => void }) {
  const set = (patch: Partial<PostDraft>) => onChange({ ...value, ...patch });
  return <>
    <label className="fl">Post text<textarea rows={5} value={value.text} onChange={(e) => set({ text: e.target.value })} /></label>
    <label className="fl">Link (opens from the “View details” button)<input value={value.link} onChange={(e) => set({ link: e.target.value })} placeholder="https://" /></label>
    <label className="fl">Tags (separate with spaces)<input value={value.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="#NewDrops" /></label>
    <label className="fl">Category
      <select value={value.category} onChange={(e) => set({ category: e.target.value })}>
        <option value="">None (shows to everyone)</option>
        {ADD_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
    </label>
    {value.category && <div className="flag">With a category, this post is hidden from anyone who turned that category off in Customize feed.</div>}
    <PhotoEditor urls={value.images} onRemove={(u) => set({ images: value.images.filter((x) => x !== u) })}
      onAdd={(u) => set({ images: [...value.images, u] })} />
  </>;
}

// ── Database entry ───────────────────────────────────────────────────────────
export interface EntryDraft {
  brand: string; category: string; scale: string; year: string; rupees: string; description: string;
  photos: string[]; removed: string[]; cover: string | null;
}

export function entryDraft(item: Item): EntryDraft {
  return {
    brand: String(item.brand ?? ""), category: String(item.category ?? ""), scale: String(item.scale ?? ""), year: String(item.year ?? ""),
    rupees: item.est_retail_price ? String(Number(item.est_retail_price) / 100) : "", description: String(item.desc ?? ""),
    photos: (item.photos as string[]) ?? [], removed: [], cover: (item.thumbnail_url as string) ?? null,
  };
}

export const entryPayload = (title: string, d: EntryDraft, item: Item) => ({
  entry: {
    title, brand: d.brand, category: d.category, scale: d.scale || null, year: d.year || null,
    description: d.description, est_retail_price: Math.round(Number(d.rupees || 0) * 100),
    // Only a deliberate change: the server picks the next cover when the current one is removed.
    ...(d.cover !== item.thumbnail_url && d.cover && !d.removed.includes(d.cover) ? { thumbnail_url: d.cover } : {}),
  },
  remove_photos: d.removed,
});

export function EntryFields({ value, onChange }: { value: EntryDraft; onChange: (d: EntryDraft) => void }) {
  const set = (patch: Partial<EntryDraft>) => onChange({ ...value, ...patch });
  const scales = CAT_SCALES[value.category];
  return <>
    <label className="fl">Brand<input value={value.brand} onChange={(e) => set({ brand: e.target.value })} /></label>
    <label className="fl">Category
      <select value={value.category} onChange={(e) => set({ category: e.target.value })}>
        {ADD_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
    </label>
    <label className="fl">Scale
      <input value={value.scale} onChange={(e) => set({ scale: e.target.value })} list="adm-scales" placeholder={scales ? "e.g. 1/64" : "Leave empty if none"} />
      <datalist id="adm-scales">{scales?.map((s) => <option key={s} value={s} />)}</datalist>
    </label>
    <label className="fl">Year<input value={value.year} onChange={(e) => set({ year: e.target.value })} maxLength={8} /></label>
    <label className="fl">Estimated value (₹)<input type="number" min={0} value={value.rupees} onChange={(e) => set({ rupees: e.target.value })} /></label>
    <label className="fl">Description<textarea rows={4} value={value.description} onChange={(e) => set({ description: e.target.value })} /></label>
    <PhotoEditor urls={value.photos} cover={value.cover} onCover={(u) => set({ cover: u })}
      onRemove={(u) => set({ photos: value.photos.filter((x) => x !== u), removed: [...value.removed, u] })}
      onAdd={(u) => set({ photos: [...value.photos, u], cover: u })}
      note="Removing a photo takes it off this entry. Collectors keep theirs on their own item. A new upload becomes the cover." />
  </>;
}

// ── Photos ───────────────────────────────────────────────────────────────────
function PhotoEditor({ urls, cover, onCover, onRemove, onAdd, note }: {
  urls: string[]; cover?: string | null; onCover?: (url: string) => void;
  onRemove: (url: string) => void; onAdd: (url: string) => void; note?: string;
}) {
  return (
    <div className="fl">Photos
      {note && <span className="mut">{note}</span>}
      <div className="photos">
        {urls.map((u) => (
          <div key={u}>
            {/* eslint-disable-next-line @next/next/no-img-element -- R2 photos, admin-only thumbnails */}
            <img className="ph" src={u} alt="" />
            <div>
              {onCover && (u === cover ? <small>Cover</small> : <button type="button" className="lnk" onClick={() => onCover(u)}>Set cover</button>)}
              {" "}<button type="button" className="lnk" onClick={() => onRemove(u)}>Remove</button>
            </div>
          </div>
        ))}
        <div style={{ width: 88 }}><ImageUploader tile height={88} onUpload={onAdd} /></div>
      </div>
    </div>
  );
}
