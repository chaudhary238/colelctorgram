"use client";

import { Button } from "@/components/ui";

/**
 * "Add a new item" guidelines gate (design_v7 app/ExploreView.jsx → ContributeGuidelines,
 * rewritten 2026-07-29). Shown before the contribute form so the rules land BEFORE
 * someone types a duplicate, not after.
 *
 * Copy is verbatim from v7 — it sets the reactive-moderation expectations the backend
 * actually implements (trust-by-default publish, reports queue, XP dedupe per SKU).
 */
export function ContributeGuidelines({ onAccept, onCancel }: { onAccept: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: 20 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      {/* Column, not one scrolling box: the header and the Cancel/Accept footer are pinned
          and only the rules scroll. The previous single `overflow-y-auto` container let the
          buttons scroll off the bottom edge — on a short viewport the dialog opened with its
          own actions out of frame (founder QA 2026-08-01). */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add a new item"
        className="relative z-10 w-full max-w-[440px] bg-[var(--paper)] shadow-[var(--shadow-3)] flex flex-col"
        style={{ maxHeight: "min(86vh, 640px)", borderRadius: 18 }}
      >
        <div style={{ flexShrink: 0, padding: "22px 22px 0" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, textAlign: "center", marginBottom: 6 }}>
            Add a new item
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-faint)", textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>
            Didn&rsquo;t find what you were looking for? Read the guidelines below before contributing.
          </div>
        </div>

        <div className="overflow-y-auto" style={{ flex: 1, minHeight: 0, padding: "0 22px" }}>
          <div style={{ fontSize: 12, color: "var(--stamp-red-deep)", background: "var(--stamp-red-soft)", borderRadius: 10, padding: "9px 12px", marginBottom: 16, lineHeight: 1.5 }}>
            Please make sure the item doesn&rsquo;t already exist in the catalogue before submitting.
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>General rules</div>
          <ul style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7, margin: "0 0 16px", paddingLeft: 18, listStyle: "disc" }}>
            <li>Use the official product name exactly as it appears on the brand&rsquo;s website.</li>
            <li>Be specific — include the line/series name, not just the character.</li>
            <li>Add at least one clear photo showing the item and its accessories.</li>
            <li>Third-party studios are fine; bootlegs, KOs, or unofficial reproductions are not.</li>
          </ul>

          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>How it works</div>
          <ul style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7, margin: "0 0 18px", paddingLeft: 18, listStyle: "disc" }}>
            <li>Every new entry is reviewed by the Scorred team, and may be edited for accuracy.</li>
            <li>Duplicates are removed — links to your submission redirect to the original entry.</li>
            <li>XP earned from a duplicate is reversed.</li>
            <li>Repeated duplicate submissions may restrict your ability to add new items.</li>
          </ul>
        </div>

        <div style={{ flexShrink: 0, display: "flex", gap: 10, padding: "14px 22px 20px", borderTop: "1px solid var(--border)" }}>
          <Button variant="secondary" style={{ flex: 1, justifyContent: "center" }} onClick={onCancel}>Cancel</Button>
          <Button variant="dark" style={{ flex: 1, justifyContent: "center" }} onClick={onAccept}>Accept</Button>
        </div>
      </div>
    </div>
  );
}
