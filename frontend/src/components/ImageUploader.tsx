"use client";

import { cdnImg } from "@/lib/cdn";
import { useCallback, useRef, useState } from "react";
import { Camera, Upload, X, ImageIcon } from "lucide-react";
import { AVATAR_EDGE, uploadImage } from "@/lib/image";

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
  /** Fixed tile height (px). Defaults to the classic min-height 100 drop zone. */
  height?: number;
  /** DV8 events cover style — solid 1px border, r14, single-row icon+label empty state. */
  compact?: boolean;
  /** DV8 add-photo tile — square (height×height, default 72), 2px dashed r10,
      column camera-20 + "Add" empty state (design_v8 AddListing.jsx:731). */
  tile?: boolean;
  /** Tile only — required-photo tried state: border + glyphs go stamp-red. */
  bad?: boolean;
}


export function ImageUploader({ onUpload, label = "Upload image", accept = "image/*", previewUrl, multiple = false, maxFiles, height, compact = false, tile = false, bad = false }: ImageUploaderProps) {
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
      const url = await uploadImage(file, "uploads");
      if (!silent) setPreview(url);
      onUpload(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(/failed to fetch/i.test(msg) ? "Upload blocked — check the image server (R2/CORS) setup." : msg);
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
          flexDirection: compact ? "row" : "column",
          alignItems: "center",
          justifyContent: "center",
          gap: tile ? 4 : 8,
          ...(tile
            ? { width: height ?? 72, height: height ?? 72, flexShrink: 0 }
            : height ? { height } : { minHeight: 100 }),
          borderRadius: tile ? 10 : compact ? 14 : 12,
          border: compact
            ? `1px solid ${dragging ? "var(--stamp-red)" : "var(--border-strong)"}`
            : `2px dashed ${dragging || (tile && bad) ? "var(--stamp-red)" : "var(--border-strong)"}`,
          background: dragging ? "color-mix(in srgb, var(--stamp-red) 6%, var(--paper))" : "var(--paper-soft)",
          cursor: uploading ? "wait" : "pointer",
          overflow: "hidden",
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        {preview ? (
          <>
            <img
              src={cdnImg(preview, 480)}
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
              <div style={{ color: "var(--ink-faint)", fontSize: tile ? 10 : 13 }}>{tile ? "…" : "Uploading…"}</div>
            ) : tile ? (
              // v8 add-photo tile — camera 20 over a 10px "Add"; both go stamp-red
              // when a required photo is still missing after a tried submit.
              <>
                <Camera size={20} style={{ color: bad ? "var(--stamp-red)" : "var(--ink-faint)" }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: bad ? "var(--stamp-red)" : "var(--ink-ghost)" }}>{label}</span>
              </>
            ) : compact ? (
              // v8 EventCreate cover tile — one row, icon beside the label, no browse hint.
              <>
                <Camera size={19} style={{ color: "var(--ink-mute)" }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-mute)" }}>{label}</span>
              </>
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
      const url = await uploadImage(file, "avatars", AVATAR_EDGE);
      setPreview(url);
      onUpload(url);
    } catch (e) {
      // Surface the failure in the console instead of failing dead-silently.
      console.error("Avatar upload failed:", e);
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
        <img src={cdnImg(preview, 256)} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
