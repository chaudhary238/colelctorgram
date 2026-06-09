"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry / console for now
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 16,
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <AlertTriangle size={40} style={{ color: "var(--stamp-red)", opacity: 0.7 }} />
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 20,
            color: "var(--ink)",
            marginBottom: 6,
          }}
        >
          Something went wrong
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-faint)", maxWidth: 320 }}>
          {error.message || "An unexpected error occurred. Please try again."}
        </div>
      </div>
      <button
        onClick={reset}
        style={{
          height: 40,
          padding: "0 24px",
          borderRadius: 10,
          border: "none",
          background: "var(--stamp-red)",
          color: "var(--paper)",
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
