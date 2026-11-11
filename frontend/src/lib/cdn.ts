// Image delivery (founder 2026-11-11). Uploads stay full-quality masters in R2; screens get
// sized copies cut by Cloudflare Image Transformations on media.scorred.com:
//   width=…        a fixed ladder, so each photo has only a handful of variants (each unique
//                  photo×width counts once a month against the 5,000 free transformations)
//   format=auto    AVIF → WebP → JPEG by browser support; colour profiles converted properly
//   fit=scale-down never upscales, never crops (shape is the CSS's job, as before)
//   onerror=redirect  any transform failure (e.g. free quota hit) falls back to the original
// Resized copies also drop EXIF, incl. GPS location that raw phone uploads carry.
// Old rows still saying pub-….r2.dev (throttled, uncached) are served from media.scorred.com.

const MEDIA = "https://media.scorred.com";
const OURS = /^https:\/\/(?:media\.scorred\.com|pub-[a-z0-9]+\.r2\.dev)\/(.+)$/;
// App uploads only. catalogue/ (Explore ingestion) is already ~50 KB a file — resizing
// 15k of them would burn the free quota for nothing, so they only get the host swap.
const RESIZABLE = /^(?:posts|uploads|avatars)\/[^?]+\.(?:jpe?g|png|webp|heic|avif)$/i;
// 1200 = a 390px phone at 3× (1170px) — without it phones jumped to 1600 (~⅓ more bytes).
const LADDER = [128, 256, 480, 960, 1200, 1600] as const;

/** `sizes` hints for srcset, matching our layouts (max content column 680px). */
export const SIZES = {
  feed: "(max-width: 680px) 100vw, 640px",
  hero: "(max-width: 680px) 100vw, 680px",
  tile: "(max-width: 680px) 50vw, 240px",
  chat: "(max-width: 680px) 70vw, 360px",
} as const;

function resized(key: string, w: number) {
  return `${MEDIA}/cdn-cgi/image/width=${w},format=auto,fit=scale-down,onerror=redirect/${key}`;
}

/** URL for an image shown about `width` CSS-px-times-density wide (rounded up the ladder).
 *  Non-Scorred URLs (hotlinked shop images) pass through untouched. */
export function cdnImg(url: string, width: number): string;
export function cdnImg(url: string | null | undefined, width: number): string | undefined;
export function cdnImg(url: string | null | undefined, width: number) {
  if (!url) return undefined;
  const m = OURS.exec(url);
  if (!m) return url;
  const key = m[1];
  if (!RESIZABLE.test(key)) return `${MEDIA}/${key}`;
  return resized(key, LADDER.find((w) => w >= width) ?? LADDER[LADDER.length - 1]);
}

/** srcset for fluid images (pair with a SIZES entry); undefined when not resizable. */
export function cdnSrcSet(url: string | null | undefined, widths: readonly number[] = [480, 960, 1200, 1600]) {
  const m = url ? OURS.exec(url) : null;
  if (!m || !RESIZABLE.test(m[1])) return undefined;
  return widths.map((w) => `${resized(m[1], w)} ${w}w`).join(", ");
}
