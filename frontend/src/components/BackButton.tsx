"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Context-aware back control for detail pages.
 *
 * Detail headers used to hardcode `<Link href="/feed">` (post), `/market` (listing),
 * `/profile` (item) etc. — so "back" always jumped to a fixed surface regardless of
 * where the user came from (e.g. Search → Post → back landed on Feed). This goes back
 * to the actual previous page when there is in-app history, and only falls back to the
 * section home on a cold/deep-link entry (history depth ≤ 1).
 */
export function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();

  function onBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Back"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)",
        background: "transparent", color: "var(--ink)", cursor: "pointer",
      }}
    >
      <ArrowLeft size={18} />
    </button>
  );
}
