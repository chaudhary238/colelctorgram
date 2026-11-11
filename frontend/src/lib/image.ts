import { api } from "@/lib/api";

// DV6-13 — downscale + re-encode client-side before upload. The upload is the MASTER copy
// (sized renditions for feed/grid/avatars should be cut from it at the CDN), so it stays high-res:
// 2560px / q0.9 keeps zoom-level detail at ~0.6–1.2MB instead of a raw 4–24MB phone file
// (founder 2026-11-11: 1600px / q0.82 showed visible softness + colour loss).
// Every upload goes through uploadImage() below: until 2026-11-11 only ImageUploader
// compressed, so composer/avatar/chat/community photos landed in R2 at 3–24 MB.
export const PHOTO_EDGE = 2560;
export const AVATAR_EDGE = 512; // shown at ≤96px; 512 keeps retina crisp
const JPEG_QUALITY = 0.9; // canvas draws in sRGB, so P3 phone colours are converted, not misread

export async function compressImage(file: File, maxEdge = PHOTO_EDGE): Promise<Blob> {
  // Only recompress raster photos; leave GIF/SVG untouched (animation/vector).
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", JPEG_QUALITY));
    // Always prefer the re-encode when it worked, even if a few KB bigger: it carries no
    // EXIF, so the phone's GPS location never reaches public storage (founder 2026-11-11).
    return blob ?? file;
  } catch {
    return file; // e.g. HEIC on a browser that can't decode it — upload as-is
  }
}

interface UploadUrlResponse { upload_url: string; key: string; public_url: string }

/** Compress → presign → PUT to R2. Returns the public URL; throws on any failure.
 *  fetch resolves on a 4xx/5xx, so an R2 403 (CORS/signature/creds) is checked
 *  explicitly — else we'd hand back a URL for an object that was never stored. */
export async function uploadImage(file: File, prefix: "uploads" | "posts" | "avatars", maxEdge = PHOTO_EDGE): Promise<string> {
  const blob = await compressImage(file, maxEdge);
  const contentType = blob.type || file.type;
  const meta = await api.post<UploadUrlResponse>(
    `/media/upload-url?prefix=${prefix}&content_type=${encodeURIComponent(contentType)}`
  );
  const res = await fetch(meta.upload_url, { method: "PUT", body: blob, headers: { "Content-Type": contentType } });
  if (!res.ok) throw new Error(`Storage rejected the upload (HTTP ${res.status})`);
  return meta.public_url;
}
