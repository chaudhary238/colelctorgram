"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { api } from "@/lib/api";

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  label?: string;
  accept?: string;
  /** Show current image */
  previewUrl?: string;
  /** Allow selecting several files at once (DV6-13); onUpload fires per file, in pick order. */
  multiple?: boolean;
  /** In multiple mode, cap how many files this pick accepts (e.g. remaining slots). */
  maxFiles?: number;
}

interface UploadUrlResponse {
  upload_url: string;
  key: string;
  public_url: string;
}

// DV6-13 — downscale + re-encode client-side before upload. A 12MP phone photo (~4–6MB)
// becomes ~200–350KB: ~15× less storage/bandwidth and a much faster upload on mobile.
// Falls back to the original file if the canvas path fails or doesn't help.
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<Blob> {
  // Only recompress raster photos; leave GIF/SVG untouched (animation/vector).
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
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
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export function ImageUploader({ onUpload, label = "Upload image", accept = "image/*", previewUrl, multiple = false, maxFiles }: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Upload one file. `silent` (multiple mode) skips the internal preview — the parent grid
  // shows the thumbnails — and leaves the `uploading` flag to the batch caller.
  const uploadOne = useCallback(async (file: File, silent: boolean) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    try {
      const blob = await compressImage(file);
      const contentType = blob.type || file.type;
      const meta = await api.post<UploadUrlResponse>(
        `/media/upload-url?prefix=uploads&content_type=${encodeURIComponent(contentType)}`
      );
      await fetch(meta.upload_url, { method: "PUT", body: blob, headers: { "Content-Type": contentType } });
      if (!silent) setPreview(meta.public_url);
      onUpload(meta.public_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  }, [onUpload]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    const chosen = multiple ? (maxFiles && maxFiles > 0 ? list.slice(0, maxFiles) : list) : list.slice(0, 1);
    setError(null);
    setUploading(true);
    // Sequential so onUpload appends in the picked order (first = cover).
    for (const f of chosen) await uploadOne(f, multiple);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [multiple, maxFiles, uploadOne]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          minHeight: 100,
          borderRadius: 12,
          border: `2px dashed ${dragging ? "var(--stamp-red)" : "var(--border-strong)"}`,
          background: dragging ? "color-mix(in srgb, var(--stamp-red) 6%, var(--paper))" : "var(--paper-soft)",
          cursor: uploading ? "wait" : "pointer",
          overflow: "hidden",
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Upload preview"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "rgba(20,17,15,0.35)" }} />
            <button
              onClick={clear}
              style={{
                position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%",
                background: "var(--ink)", color: "var(--paper)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={14} />
            </button>
            <div style={{ position: "relative", color: "var(--paper)", fontSize: 12.5, fontWeight: 600 }}>
              Click to replace
            </div>
          </>
        ) : (
          <>
            {uploading ? (
              <div style={{ color: "var(--ink-faint)", fontSize: 13 }}>Uploading…</div>
            ) : (
              <>
                <Upload size={22} style={{ color: "var(--ink-faint)" }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-mute)" }}>{label}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-ghost)", marginTop: 3 }}>
                    Drag & drop or click to browse
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
      {error && (
        <p style={{ fontSize: 12, color: "var(--stamp-red)", marginTop: 6 }}>{error}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

/** Compact inline uploader for avatar — circular, 72px */
export function AvatarUploader({ onUpload, previewUrl }: { onUpload: (url: string) => void; previewUrl?: string }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const meta = await api.post<UploadUrlResponse>(
        `/media/upload-url?prefix=avatars&content_type=${encodeURIComponent(file.type)}`
      );
      await fetch(meta.upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      setPreview(meta.public_url);
      onUpload(meta.public_url);
    } catch {
      // silently fail — text fallback remains
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Change avatar"
      onClick={() => !uploading && inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      style={{
        width: 72, height: 72, borderRadius: "50%", overflow: "hidden", position: "relative",
        background: preview ? "transparent" : "var(--bone)", flexShrink: 0,
        cursor: uploading ? "wait" : "pointer",
        border: "2px solid var(--border-strong)",
      }}
    >
      {preview ? (
        <img src={preview} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ImageIcon size={22} style={{ color: "var(--ink-faint)" }} />
        </div>
      )}
      <div style={{
        position: "absolute", inset: 0, background: "rgba(20,17,15,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: 0, transition: "opacity 0.15s",
      }}
        className="hover:opacity-100"
      >
        <Upload size={16} style={{ color: "var(--paper)" }} />
      </div>
      {uploading && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(20,17,15,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--paper)", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
    </div>
  );
}
