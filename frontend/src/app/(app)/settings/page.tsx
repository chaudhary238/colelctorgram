"use client";

import { cloneElement, isValidElement, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Eye, EyeOff, UserCog, Image as ImageIcon,
  ShieldCheck, UserPlus, MessageCircle, Heart, ArrowLeftRight, CalendarClock,
  Users, Tag as TagIcon, ShoppingBag, Ban, Info, Flag, FileText, ShieldQuestion,
  Star, LogOut, Trash2, KeyRound, Download, Scale,
} from "lucide-react";
import { api, clearTokens } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui";
import { useUser, NotifPrefs, PrivacyPrefs } from "@/lib/auth-context";

/* ── Defaults (mirror backend DEFAULT_*_PREFS) ──────────────────── */
const DEFAULT_NOTIF: NotifPrefs = {
  followers: true, messages: true, listing_activity: true, trade_requests: true,
  event_reminders: true, community_activity: false, price_drops: true, new_listings: false,
};
const DEFAULT_PRIVACY: PrivacyPrefs = { messaging: "everyone", wishlist: "followers", show_online: true };

/* ── Building blocks (converted from design ProfileSettings) ────── */
/* `id` makes a section deep-linkable — the My Space account drawer sends
   "Privacy & visibility" and "Help & support" to #privacy / #support so those rows land on
   the relevant block instead of dead-ending at the top of a long screen (v7 points both at
   the bare settings route). scrollMarginTop clears the sticky header. */
function SectionHeader({ children, id }: { children: React.ReactNode; id?: string }) {
  /* v8 (ProfileSettings.jsx:31-35) — body font 10.5/0.09em, not the mono SectionLabel. */
  return (
    <div id={id} style={{ padding: "20px 20px 7px", scrollMarginTop: 64, fontFamily: "var(--font-body)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--ink-faint)" }}>
      {children}
    </div>
  );
}

function Row({ icon, label, sub, trailing, onClick, danger }: {
  icon?: React.ReactNode; label: string; sub?: string; trailing?: React.ReactNode; onClick?: () => void; danger?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 13, padding: "13px 20px",
        borderBottom: "1px solid var(--border)", cursor: onClick ? "pointer" : "default", background: "var(--paper)",
      }}
    >
      {icon && (
        /* v8 ProfileSettings.jsx:44-45 — row glyphs read ink-soft at stroke 1.8
           (danger rows stay stamp-red); the stroke is applied here, Row-level,
           exactly as v8's `<Ico … stroke={1.8}/>` does. */
        <div style={{ width: 34, height: 34, borderRadius: 9, background: danger ? "var(--stamp-red-wash, #FEE2E2)" : "var(--paper-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: danger ? "var(--stamp-red)" : "var(--ink-soft)" }}>
          {isValidElement(icon) ? cloneElement(icon as React.ReactElement<{ strokeWidth?: number }>, { strokeWidth: 1.8 }) : icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 500, color: danger ? "var(--stamp-red)" : "var(--ink)", lineHeight: 1.2 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2, lineHeight: 1.3 }}>{sub}</div>}
      </div>
      {trailing}
      {onClick && !trailing && <ChevronRight size={16} style={{ color: "var(--ink-ghost)", flexShrink: 0 }} />}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch" aria-checked={on} onClick={onToggle}
      style={{ width: 44, height: 26, borderRadius: 13, flexShrink: 0, cursor: "pointer", position: "relative", border: "none", background: on ? "var(--ink)" : "var(--border-strong)", transition: "background 0.2s" }}
    >
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "var(--paper)", transition: "left 0.18s", boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }} />
    </button>
  );
}

function RadioGroup<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id} onClick={() => onChange(o.id)}
            style={{
              /* v8 ProfileSettings.jsx:73-77 — 12px chips at 5px 11px pads. */
              padding: "5px 11px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap",
              border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
              background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
              fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function RadioRow<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--paper)" }}>
      <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 9, color: "var(--ink)" }}>{label}</div>
      <RadioGroup value={value} onChange={onChange} options={options} />
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user, setUser } = useUser();
  const router = useRouter();

  const [notif, setNotif] = useState<NotifPrefs>(DEFAULT_NOTIF);
  const [privacy, setPrivacy] = useState<PrivacyPrefs>(DEFAULT_PRIVACY);
  const [collectionVis, setCollectionVis] = useState<"public" | "followers" | "private">("public");

  // Change password (kept per DF-23, though not in the mobile design)
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  const [toast, setToast] = useState("");
  // Compliance (admin console "Data requests" + "Appeals & grievances")
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  // v8 — the vouch row's "{n} vouches" sub. The profile payload carries the count;
  // fetched once (the settings screen doesn't otherwise load the profile).
  const [vouchCount, setVouchCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.handle) return;
    api.get<{ vouches_received_count?: number }>(`/users/${user.handle}`)
      .then((p) => setVouchCount(p?.vouches_received_count ?? 0))
      .catch(() => {});
  }, [user?.handle]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seed local form state whenever the auth user refreshes
    setNotif({ ...DEFAULT_NOTIF, ...(user.notif_prefs ?? {}) });
    setPrivacy({ ...DEFAULT_PRIVACY, ...(user.privacy_prefs ?? {}) });
    const pp = user.privacy_portfolio;
    setCollectionVis(pp === "private" || pp === "followers" ? pp : "public");
  }, [user]);

  async function requestData(kind: "delete" | "export") {
    if (requesting) return;
    setRequesting(true);
    try {
      const r = await api.post<{ already_open?: boolean }>("/account/data-requests", { kind });
      flash(r?.already_open ? "You already have this request open — we're on it"
        : kind === "delete" ? "Deletion requested — we'll confirm by email" : "Requested — we'll email your data within 30 days");
    } catch {
      flash("Couldn't send the request — try again");
    } finally {
      setRequesting(false);
    }
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function persist(patch: Record<string, unknown>) {
    try {
      const updated = await api.patch<typeof user>("/users/me", patch);
      if (updated && setUser) setUser(updated as Parameters<typeof setUser>[0]);
    } catch {
      flash("Couldn't save — try again");
    }
  }

  function toggleNotif(k: keyof NotifPrefs) {
    const next = { ...notif, [k]: !notif[k] };
    setNotif(next);
    persist({ notif_prefs: next });
  }

  function updatePrivacy(patch: Partial<PrivacyPrefs>) {
    const next = { ...privacy, ...patch };
    setPrivacy(next);
    persist({ privacy_prefs: next });
  }

  function updateCollectionVis(v: "public" | "followers" | "private") {
    setCollectionVis(v);
    persist({ privacy_portfolio: v });
  }

  async function changePassword() {
    setPwError(""); setPwMsg("");
    if (newPw !== confirmPw) { setPwError("Passwords don't match"); return; }
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters"); return; }
    setPwSaving(true);
    try {
      await api.post("/auth/change-password", { current_password: currentPw, new_password: newPw });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPwMsg("Password changed!");
      setTimeout(() => { setPwMsg(""); setShowPwForm(false); }, 2000);
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 42, padding: "0 13px", borderRadius: 10, border: "1px solid var(--border-strong)",
    background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none", boxSizing: "border-box",
  };

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)", background: "transparent", cursor: "pointer" }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Settings</span>
        </div>
      </div>

      {/* ── Account ───────────────────────────────────────── */}
      {/* v4 parity (ProfileSettings.jsx:88-92): Edit profile · Edit avatar · Vouches & endorsements.
          "Change password" is kept as a web-only necessity (no email-reset flow yet — B-71). */}
      <SectionHeader>Account</SectionHeader>
      {/* v8 — Edit profile carries no @handle sub; the vouch row subtitles its count. */}
      <Row icon={<UserCog size={17} />} label="Edit profile" onClick={() => router.push("/profile?edit=profile")} />
      <Row icon={<ImageIcon size={17} />} label="Edit avatar" onClick={() => router.push("/profile?edit=avatar")} />
      <Row
        icon={<ShieldCheck size={17} />}
        label="Vouches & endorsements"
        sub={vouchCount != null ? `${vouchCount} ${vouchCount === 1 ? "vouch" : "vouches"}` : undefined}
        onClick={() => router.push("/profile?vouch=request")}
      />
      <Row icon={<KeyRound size={17} />} label="Change password" onClick={() => setShowPwForm((v) => !v)} />
      {showPwForm && (
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10, background: "var(--paper-soft)" }}>
          <div style={{ position: "relative" }}>
            <input type={showPw ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Current password" style={{ ...inputStyle, paddingRight: 42 }} />
            <button type="button" onClick={() => setShowPw((v) => !v)} style={{ position: "absolute", right: 12, top: 11, background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)" }}>
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <input type={showPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password (min. 8 chars)" style={inputStyle} />
          <input type={showPw ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Confirm new password" style={inputStyle} />
          {pwError && <p style={{ fontSize: 12.5, color: "var(--stamp-red)", margin: 0 }}>{pwError}</p>}
          {pwMsg && <p style={{ fontSize: 12.5, color: "var(--forest)", margin: 0 }}>{pwMsg}</p>}
          <button
            onClick={changePassword}
            disabled={!currentPw || !newPw || !confirmPw || pwSaving}
            style={{ alignSelf: "flex-start", height: 38, padding: "0 20px", borderRadius: 10, border: "none", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: pwSaving ? "wait" : "pointer", opacity: (!currentPw || !newPw || !confirmPw) ? 0.45 : 1 }}
          >
            {pwSaving ? "Updating…" : "Update password"}
          </button>
        </div>
      )}

      {/* ── Notifications ─────────────────────────────────── */}
      <SectionHeader>Notifications</SectionHeader>
      <Row icon={<UserPlus size={17} />} label="New followers" trailing={<Toggle on={notif.followers} onToggle={() => toggleNotif("followers")} />} />
      <Row icon={<MessageCircle size={17} />} label="Messages" trailing={<Toggle on={notif.messages} onToggle={() => toggleNotif("messages")} />} />
      <Row icon={<Heart size={17} />} label="Listing saves & watches" trailing={<Toggle on={notif.listing_activity} onToggle={() => toggleNotif("listing_activity")} />} />
      <Row icon={<ArrowLeftRight size={17} />} label="Trade requests" trailing={<Toggle on={notif.trade_requests} onToggle={() => toggleNotif("trade_requests")} />} />
      <Row icon={<CalendarClock size={17} />} label="Event reminders" trailing={<Toggle on={notif.event_reminders} onToggle={() => toggleNotif("event_reminders")} />} />
      <Row icon={<Users size={17} />} label="Community activity" trailing={<Toggle on={notif.community_activity} onToggle={() => toggleNotif("community_activity")} />} />
      <Row icon={<TagIcon size={17} />} label="Price drops on saved" trailing={<Toggle on={notif.price_drops} onToggle={() => toggleNotif("price_drops")} />} />
      <Row icon={<ShoppingBag size={17} />} label="New listings matching wishlist" trailing={<Toggle on={notif.new_listings} onToggle={() => toggleNotif("new_listings")} />} />

      {/* ── Privacy & Safety ──────────────────────────────── */}
      <SectionHeader id="privacy">Privacy &amp; Safety</SectionHeader>
      <RadioRow
        label="Who can see my collection"
        value={collectionVis}
        onChange={updateCollectionVis}
        options={[{ id: "public", label: "Everyone" }, { id: "followers", label: "Followers" }, { id: "private", label: "Only me" }]}
      />
      <RadioRow
        label="Who can message me"
        value={privacy.messaging}
        onChange={(v) => updatePrivacy({ messaging: v })}
        options={[{ id: "everyone", label: "Everyone" }, { id: "followers", label: "Followers" }, { id: "none", label: "No one" }]}
      />
      <RadioRow
        label="Who can see my wishlist"
        value={privacy.wishlist}
        onChange={(v) => updatePrivacy({ wishlist: v })}
        options={[{ id: "public", label: "Everyone" }, { id: "followers", label: "Followers" }, { id: "private", label: "Only me" }]}
      />
      <Row icon={<Eye size={17} />} label="Show online status" trailing={<Toggle on={privacy.show_online} onToggle={() => updatePrivacy({ show_online: !privacy.show_online })} />} />
      {/* v8 ProfileSettings.jsx:126 — exact sub copy */}
      <Row icon={<Ban size={17} />} label="Blocked users" sub="Manage users you have blocked" onClick={() => router.push("/settings/blocked")} />

      {/* ── Support ───────────────────────────────────────── */}
      <SectionHeader id="support">Support</SectionHeader>
      <Row icon={<Info size={17} />} label="Help centre" onClick={() => flash("Help centre — coming soon")} />
      <Row icon={<Flag size={17} />} label="Report a bug" onClick={() => flash("Bug report — coming soon")} />
      <Row icon={<FileText size={17} />} label="Terms of service" onClick={() => flash("Terms of service — coming soon")} />
      <Row icon={<ShieldQuestion size={17} />} label="Privacy policy" onClick={() => flash("Privacy policy — coming soon")} />
      <Row icon={<Star size={17} />} label="Rate the app" onClick={() => flash("Thanks for the love! ⭐")} />
      <Row icon={<Scale size={17} />} label="Appeal a decision or raise a grievance" sub="We reply within 7 days (grievances: 15)" onClick={() => setAppealOpen(true)} />

      {/* ── Account actions ───────────────────────────────── */}
      <SectionHeader>Account</SectionHeader>
      <Row
        icon={<LogOut size={17} />} label="Log out" danger
        onClick={() => { clearTokens(); window.location.assign("/auth/signin"); }}
      />
      <Row
        icon={<Download size={17} />} label="Download my data" sub="We'll email your data within 30 days"
        onClick={() => requestData("export")}
      />
      <Row
        icon={<Trash2 size={17} />} label="Delete account" sub="This cannot be undone" danger
        onClick={() => setConfirmDelete(true)}
      />
      {confirmDelete && (
        <ConfirmDialog
          title="Delete your account?"
          body="We'll verify the request came from you and delete your account and personal data within 30 days. Your posts and listings come down; this can't be undone."
          confirmLabel="Request deletion"
          busy={requesting}
          onConfirm={async () => { await requestData("delete"); setConfirmDelete(false); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {appealOpen && <AppealSheet onClose={() => setAppealOpen(false)} onSent={() => { setAppealOpen(false); flash("Received — we'll reply in your notifications"); }} />}

      {/* v8 footer (ProfileSettings.jsx:141-143) — centred version line replaces the email row. */}
      <div style={{ textAlign: "center", padding: "22px 20px 4px", fontSize: 11.5, color: "var(--ink-ghost)" }}>
        Scorred · v0.9.1
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 60, background: "var(--ink)", color: "var(--paper)", padding: "10px 18px", borderRadius: 999, fontSize: 13, fontWeight: 500, boxShadow: "var(--shadow-3)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

/* Admin console "Appeals & grievances" — user side. India IT Rules 2021: the
   grievance is acknowledged at once (a notification) and resolved within 15 days. */
function AppealSheet({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [kind, setKind] = useState<"appeal" | "grievance">("appeal");
  const [about, setAbout] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-body)", fontSize: 14, background: "var(--paper)", color: "var(--ink)" };
  async function send() {
    if (text.trim().length < 10 || busy) { setError("Tell us a bit more (at least 10 characters)"); return; }
    setBusy(true);
    try {
      await api.post("/account/appeals", { kind, about: about.trim(), text: text.trim() });
      onSent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send — try again");
      setBusy(false);
    }
  }
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(20,17,15,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: "var(--paper)", borderRadius: "18px 18px 0 0", padding: "20px 20px calc(20px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Appeal or grievance</div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["appeal", "grievance"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} style={{ flex: 1, height: 38, borderRadius: 10, border: "1px solid var(--border-strong)", background: kind === k ? "var(--ink)" : "var(--paper)", color: kind === k ? "var(--paper)" : "var(--ink)", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
              {k === "appeal" ? "Appeal a decision" : "Raise a grievance"}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-faint)", lineHeight: 1.5 }}>
          {kind === "appeal" ? "Disagree with a warning, removal or rejection? Tell us which one and why." : "A complaint about content, another user or how we handled something. We acknowledge it now and resolve it within 15 days."}
        </div>
        <input value={about} onChange={(e) => setAbout(e.target.value)} placeholder={kind === "appeal" ? "What decision? e.g. My event was rejected" : "What is it about?"} style={field} maxLength={200} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Tell us what happened" style={{ ...field, resize: "vertical" }} maxLength={3000} />
        {error && <div style={{ fontSize: 13, color: "var(--stamp-red)" }}>{error}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper)", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={send} disabled={busy} style={{ flex: 2, height: 44, borderRadius: 12, border: "none", background: "var(--ink)", color: "var(--paper)", fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>{busy ? "Sending…" : "Send"}</button>
        </div>
      </div>
    </div>
  );
}
