"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Eye, EyeOff, Lock, UserCog, Image as ImageIcon,
  ShieldCheck, UserPlus, MessageCircle, Heart, ArrowLeftRight, CalendarClock,
  Users, Tag as TagIcon, ShoppingBag, Ban, Info, Flag, FileText, ShieldQuestion,
  Star, LogOut, Trash2, KeyRound,
} from "lucide-react";
import { api, clearTokens } from "@/lib/api";
import { useUser, NotifPrefs, PrivacyPrefs } from "@/lib/auth-context";

/* ── Defaults (mirror backend DEFAULT_*_PREFS) ──────────────────── */
const DEFAULT_NOTIF: NotifPrefs = {
  followers: true, messages: true, listing_activity: true, trade_requests: true,
  event_reminders: true, community_activity: false, price_drops: true, new_listings: false,
};
const DEFAULT_PRIVACY: PrivacyPrefs = { messaging: "everyone", wishlist: "followers", show_online: true };

/* ── Building blocks (converted from design ProfileSettings) ────── */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "22px 20px 7px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faint)" }}>
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
        <div style={{ width: 34, height: 34, borderRadius: 9, background: danger ? "var(--stamp-red-wash, #FEE2E2)" : "var(--paper-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: danger ? "var(--stamp-red)" : "var(--ink-mute)" }}>
          {icon}
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
              padding: "6px 12px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap",
              border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
              background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
              fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500,
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

  useEffect(() => {
    if (!user) return;
    setNotif({ ...DEFAULT_NOTIF, ...(user.notif_prefs ?? {}) });
    setPrivacy({ ...DEFAULT_PRIVACY, ...(user.privacy_prefs ?? {}) });
    const pp = user.privacy_portfolio;
    setCollectionVis(pp === "private" || pp === "followers" ? pp : "public");
  }, [user]);

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
      <Row icon={<UserCog size={17} />} label="Edit profile" sub={user ? `@${user.handle}` : undefined} onClick={() => router.push("/profile?edit=profile")} />
      <Row icon={<ImageIcon size={17} />} label="Edit avatar" onClick={() => router.push("/profile?edit=avatar")} />
      <Row icon={<ShieldCheck size={17} />} label="Vouches & endorsements" onClick={() => router.push("/profile?vouch=request")} />
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
      <SectionHeader>Privacy &amp; Safety</SectionHeader>
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
      <Row icon={<Ban size={17} />} label="Blocked users" sub="Manage users you've blocked" onClick={() => router.push("/settings/blocked")} />

      {/* ── Support ───────────────────────────────────────── */}
      <SectionHeader>Support</SectionHeader>
      <Row icon={<Info size={17} />} label="Help centre" onClick={() => flash("Help centre — coming soon")} />
      <Row icon={<Flag size={17} />} label="Report a bug" onClick={() => flash("Bug report — coming soon")} />
      <Row icon={<FileText size={17} />} label="Terms of service" onClick={() => flash("Terms of service — coming soon")} />
      <Row icon={<ShieldQuestion size={17} />} label="Privacy policy" onClick={() => flash("Privacy policy — coming soon")} />
      <Row icon={<Star size={17} />} label="Rate Scorred" onClick={() => flash("Thanks for the love! ⭐")} />

      {/* ── Account actions ───────────────────────────────── */}
      <SectionHeader>Account</SectionHeader>
      <Row
        icon={<LogOut size={17} />} label="Log out" danger
        onClick={() => { clearTokens(); window.location.assign("/auth/signin"); }}
      />
      <Row
        icon={<Trash2 size={17} />} label="Delete account" sub="This cannot be undone" danger
        onClick={() => flash("Please contact support to delete your account.")}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 20px", fontSize: 12.5, color: "var(--ink-faint)" }}>
        <Lock size={13} /> {user?.email ?? "—"}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 60, background: "var(--ink)", color: "var(--paper)", padding: "10px 18px", borderRadius: 999, fontSize: 13, fontWeight: 500, boxShadow: "var(--shadow-3)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
