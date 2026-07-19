"use client";

import { useEffect, useRef, useState } from "react";
import { api, storeTokens } from "@/lib/api";

/* Social sign-in (DF-37a), config-gated. Renders a provider button ONLY when the
   backend reports that provider is configured (GET /auth/providers) — so nothing
   dead ships before the founder adds credentials.
   Google uses the official RENDERED button (google.accounts.id.renderButton): it
   opens the account chooser on click and returns an ID-token `credential` we
   exchange at /auth/oauth/google. We deliberately do NOT use One Tap `prompt()` —
   that path depends on FedCM / third-party-cookie state and fails silently with a
   separate login window when FedCM is blocked or in cooldown. */

interface Providers { google: boolean; apple: boolean }

// Google Identity Services / AppleID JS attach a global when their script loads.
declare global {
  interface Window {
    google?: { accounts?: { id?: {
      initialize: (o: object) => void;
      renderButton: (el: HTMLElement, o: object) => void;
    } } };
    AppleID?: { auth?: { init: (o: object) => void; signIn: () => Promise<{ authorization: { id_token: string } }> } };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.async = true; s.onload = () => resolve(); s.onerror = () => reject();
    document.head.appendChild(s);
  });
}

export function SocialButtons({ onError }: { onError?: (msg: string) => void }) {
  const [providers, setProviders] = useState<Providers | null>(null);
  const googleWrapRef = useRef<HTMLDivElement>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<Providers>("/auth/providers").then(setProviders).catch(() => setProviders({ google: false, apple: false }));
  }, []);

  async function finish(path: string, credential: string) {
    try {
      const { access_token, refresh_token } = await api.post<{ access_token: string; refresh_token: string }>(path, { credential });
      storeTokens(access_token, refresh_token);
      window.location.assign("/feed");
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Sign-in failed");
    }
  }

  // Mount Google's official button once the provider is enabled + the target div exists.
  useEffect(() => {
    if (!providers?.google || !googleBtnRef.current) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) { onError?.("Google sign-in is not configured"); return; }
    let cancelled = false;
    loadScript("https://accounts.google.com/gsi/client")
      .then(() => {
        if (cancelled || !googleBtnRef.current) return;
        window.google?.accounts?.id?.initialize({
          client_id: clientId,
          callback: (res: { credential: string }) => finish("/auth/oauth/google", res.credential),
        });
        // The rendered button is a fixed-px Google iframe (max 400). Track the column width.
        const w = Math.min(400, Math.max(200, googleWrapRef.current?.clientWidth || 320));
        googleBtnRef.current.innerHTML = "";
        window.google?.accounts?.id?.renderButton(googleBtnRef.current, {
          type: "standard", theme: "outline", size: "large",
          text: "continue_with", shape: "rectangular",
          logo_alignment: "center", width: w,
        });
      })
      .catch(() => onError?.("Couldn't load Google sign-in"));
    return () => { cancelled = true; };
  }, [providers?.google]); // eslint-disable-line react-hooks/exhaustive-deps

  async function apple() {
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    if (!clientId) return onError?.("Apple sign-in is not configured");
    await loadScript("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js");
    window.AppleID?.auth?.init({ clientId, scope: "name email", redirectURI: window.location.origin, usePopup: true });
    try {
      const res = await window.AppleID!.auth!.signIn();
      await finish("/auth/oauth/apple", res.authorization.id_token);
    } catch {
      onError?.("Apple sign-in was cancelled");
    }
  }

  if (!providers || (!providers.google && !providers.apple)) return null;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>or continue with</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {providers.google && (
          <div ref={googleWrapRef} style={{ display: "flex", justifyContent: "center", minHeight: 44 }}>
            <div ref={googleBtnRef} />
          </div>
        )}
        {providers.apple && <SocialBtn label="Apple" onClick={apple} />}
      </div>
    </>
  );
}

function SocialBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ flex: 1, height: 48, borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14.5, cursor: "pointer" }}
    >
      {label}
    </button>
  );
}
