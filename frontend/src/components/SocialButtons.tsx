"use client";

import { useEffect, useState } from "react";
import { api, storeTokens } from "@/lib/api";

/* Social sign-in (DF-37a), config-gated. Renders a provider button ONLY when the
   backend reports that provider is configured (GET /auth/providers) — so nothing
   dead ships before the founder adds credentials. When enabled, the button runs
   the provider's real flow and exchanges the credential at /auth/oauth/{provider}. */

interface Providers { google: boolean; apple: boolean }

// Google Identity Services / AppleID JS attach a global when their script loads.
declare global {
  interface Window {
    google?: { accounts?: { id?: { initialize: (o: object) => void; prompt: () => void } } };
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

  async function google() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return onError?.("Google sign-in is not configured");
    await loadScript("https://accounts.google.com/gsi/client");
    window.google?.accounts?.id?.initialize({
      client_id: clientId,
      callback: (res: { credential: string }) => finish("/auth/oauth/google", res.credential),
    });
    window.google?.accounts?.id?.prompt();
  }

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
      <div style={{ display: "flex", gap: 11 }}>
        {providers.google && <SocialBtn label="Google" onClick={google} />}
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
