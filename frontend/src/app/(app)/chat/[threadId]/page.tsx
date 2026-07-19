"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plus, Send, Shield, Tag, Share2, MoreHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { Avatar, Money } from "@/components/ui";
import { ProfileMoreMenu } from "@/components/ProfileMoreMenu";
import { BackButton } from "@/components/BackButton";

interface ChatUser {
  id: string;
  handle: string | null;
  name: string | null;
  avatar_url: string | null;
  rating: number;
}

interface ChatListing {
  id: string;
  title: string;
  price: number;
  status: string;
  seller_id: string;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  created_at: string;
}

interface ThreadData {
  thread_id: string;
  viewer_id: string;
  other_user: ChatUser | null;
  listing: ChatListing | null;
  unread: number;
  messages: Message[];
}

export default function ChatPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const router = useRouter();
  const [data, setData] = useState<ThreadData | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmt, setOfferAmt] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<ThreadData>(`/threads/${threadId}/messages`)
      .then((d) => {
        setData(d);
        setLocalMessages(d.messages ?? []);
      })
      .catch(console.error);
  }, [threadId]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [localMessages]);

  const sendText = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    const msg = await api.post<Message>(`/threads/${threadId}/messages`, { body: t });
    setLocalMessages((prev) => [...prev, msg]);
  };

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await sendText(draft);
      setDraft("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // v3 attach actions — message-based, fully real (no mock/dead controls).
  const shareListing = async () => {
    if (!data?.listing) return;
    setAttachOpen(false);
    await sendText(`📦 Sharing listing: ${data.listing.title}`).catch(console.error);
  };
  const sendOffer = async () => {
    if (!offerAmt) return;
    const amt = Number(offerAmt).toLocaleString("en-IN");
    const what = data?.listing?.title ?? "this item";
    setOfferOpen(false);
    setOfferAmt("");
    await sendText(`💰 Offer: ₹${amt} for ${what}`).catch(console.error);
  };

  const other = data?.other_user;
  const listing = data?.listing;
  const viewerId = data?.viewer_id;

  const isMe = (msg: Message) => msg.sender_id === viewerId;

  if (!data) {
    return (
      <div className="w-full max-w-[680px] flex flex-col" style={{ height: "100vh", background: "var(--bone)", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--ink-faint)", fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[680px] flex flex-col" style={{ height: "100vh", overflow: "hidden", background: "var(--bone)" }}>
      {/* ── Attach sheet (v3) ── */}
      {attachOpen && (
        <div onClick={() => setAttachOpen(false)} className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.38)" }}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl sm:mb-4" style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.12)", padding: "8px 0 28px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)", margin: "8px auto 18px" }} />
            <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: listing ? "1fr 1fr" : "1fr", gap: 12 }}>
              <button onClick={() => { setAttachOpen(false); setOfferAmt(""); setOfferOpen(true); }} style={attachBtn}>
                <span style={attachIcon}><Tag size={22} /></span>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>Make offer</span>
              </button>
              {listing && (
                <button onClick={shareListing} style={attachBtn}>
                  <span style={attachIcon}><Share2 size={22} /></span>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>Share listing</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Offer sheet (v3) ── */}
      {offerOpen && (
        <div onClick={() => setOfferOpen(false)} className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.38)" }}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl sm:mb-4" style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.12)", padding: "8px 20px 28px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)", margin: "8px auto 18px" }} />
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Make an offer</div>
            {listing && <div style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 16 }}>Listed at <b style={{ color: "var(--ink)" }}><Money value={Math.round(listing.price / 100)} /></b></div>}
            <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-strong)", borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
              <span style={{ padding: "0 14px", fontSize: 18, fontWeight: 700, color: "var(--ink-faint)", borderRight: "1px solid var(--border)", height: 50, display: "flex", alignItems: "center" }}>₹</span>
              <input autoFocus type="number" value={offerAmt} onChange={(e) => setOfferAmt(e.target.value)} placeholder="Enter amount"
                style={{ flex: 1, height: 50, padding: "0 14px", border: "none", outline: "none", fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 600, color: "var(--ink)", background: "none" }} />
            </div>
            <button onClick={sendOffer} disabled={!offerAmt} className="w-full py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50" style={{ background: "var(--stamp-red)", color: "#fff" }}>
              Send offer
            </button>
          </div>
        </div>
      )}

      {/* ── More menu (block / report) ── */}
      {moreOpen && other && (
        <ProfileMoreMenu
          targetId={other.id}
          targetHandle={other.handle ?? ""}
          targetName={other.name ?? "this user"}
          avatarUrl={other.avatar_url}
          onClose={() => setMoreOpen(false)}
          onBlocked={() => router.push("/inbox")}
        />
      )}

      {/* Header */}
      <div style={{ flexShrink: 0, background: "var(--paper)", borderBottom: "1px solid var(--border)", padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Context-aware back: returns to wherever you opened this DM from
              (e.g. an ISO post), falling back to the inbox on a cold entry. */}
          <BackButton fallback="/inbox" />
          <Link href={`/profile/${other?.handle}`} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, textDecoration: "none" }}>
            <Avatar name={other?.name ?? "?"} size={36} />
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{other?.name ?? "Unknown"}</div>
              {other?.handle && <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>@{other.handle}</div>}
            </div>
          </Link>
          {other && (
            <button
              onClick={() => setMoreOpen(true)}
              aria-label="More"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)", background: "none", cursor: "pointer" }}
            >
              <MoreHorizontal size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable message body */}
      <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {/* Listing context */}
        {listing && (
          <Link href={`/listing/${listing.id}`} style={{ display: "flex", alignItems: "center", gap: 11, margin: "12px 20px", cursor: "pointer", background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 13, padding: 10, textDecoration: "none" }}>
            <div style={{ width: 44, height: 44, borderRadius: 9, overflow: "hidden", flexShrink: 0, background: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              📦
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing.title}</div>
              <div style={{ fontSize: 13, color: "var(--ink)" }}>
                <Money value={Math.round(listing.price / 100)} />
                {" · "}
                <span style={{ color: "var(--ink-faint)" }}>{listing.status}</span>
              </div>
            </div>
          </Link>
        )}

        {/* Messages */}
        <div style={{ padding: "4px 20px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {localMessages.map((m) => (
            <div key={m.id} style={{ alignSelf: isMe(m) ? "flex-end" : "flex-start", maxWidth: "78%" }}>
              <div style={{ padding: "9px 13px", borderRadius: 16, fontSize: 14.5, lineHeight: 1.45, background: isMe(m) ? "var(--stamp-red)" : "var(--paper)", color: isMe(m) ? "var(--paper)" : "var(--ink)", border: isMe(m) ? "none" : "1px solid var(--border)", borderBottomRightRadius: isMe(m) ? 5 : 16, borderBottomLeftRadius: isMe(m) ? 16 : 5 }}>
                {m.body}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--ink-faint)", marginTop: 3, textAlign: isMe(m) ? "right" : "left", padding: "0 4px" }}>
                {timeAgo(m.created_at)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, borderTop: "1px solid var(--border)", background: "var(--paper)", padding: "10px 20px 24px" }}>
        {/* v6 (DV6-07) — deals move off-platform; a safe-trade reminder + vouch CTA
            replace the old mark-sold / confirm / rate controls. */}
        <div style={{ marginBottom: 10, background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)", borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
            <Shield size={16} style={{ color: "var(--verified-teal)", flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--verified-teal)" }}>Trade safely</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 2 }}>Ask for in-hand photos, check vouches, and prefer verified sellers. After a good deal, leave each other a vouch.</div>
              {other?.handle && (
                <button onClick={() => router.push(`/profile/${other.handle}?vouch=give`)} style={{ marginTop: 7, background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--verified-teal)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Shield size={13} />Leave a vouch for @{other.handle}
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <button onClick={() => setAttachOpen(true)} aria-label="Attach" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 11, border: "1px solid var(--border)", background: "transparent", color: "var(--ink-mute)", cursor: "pointer" }}>
            <Plus size={20} />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message…"
            style={{ flex: 1, height: 42, padding: "0 14px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)", outline: "none" }}
          />
          <button onClick={send} disabled={sending} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 11, border: "none", background: draft.trim() ? "var(--stamp-red)" : "var(--bone)", color: draft.trim() ? "var(--paper)" : "var(--ink-ghost)", cursor: draft.trim() ? "pointer" : "default" }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

const attachBtn: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: 9, padding: "16px 8px",
  background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 16, cursor: "pointer", color: "var(--ink)",
};
const attachIcon: React.CSSProperties = {
  width: 46, height: 46, borderRadius: 14, background: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)",
};
