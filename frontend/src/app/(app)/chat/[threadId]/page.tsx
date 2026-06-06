"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Send, Check, Clock, Shield, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { Avatar, Stars, VerifyBadge, Money } from "@/components/ui";

interface ChatUser {
  id: string;
  handle: string | null;
  name: string | null;
  avatar_url: string | null;
  tier: string;
  rating: number;
  deals_count: number;
}

interface ChatListing {
  id: string;
  title: string;
  price: number;
  status: string;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  is_deal_init: boolean;
  created_at: string;
}

interface ThreadData {
  thread_id: string;
  other_user: ChatUser | null;
  listing: ChatListing | null;
  unread: number;
  messages: Message[];
}

type DealState = null | "requested" | "confirmed";

export default function ChatPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const [data, setData] = useState<ThreadData | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [dealState, setDealState] = useState<DealState>(null);
  const [makePublic, setMakePublic] = useState(false);
  const [sending, setSending] = useState(false);
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
  }, [localMessages, dealState]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const msg = await api.post<Message>(`/threads/${threadId}/messages`, { body: draft.trim() });
      setLocalMessages((prev) => [...prev, msg]);
      setDraft("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const other = data?.other_user;
  const listing = data?.listing;

  // Determine "my" messages: those not sent by other_user
  const otherId = other?.id;
  const isMe = (msg: Message) => msg.sender_id !== otherId;

  if (!data) {
    return (
      <div className="w-full max-w-[680px] flex flex-col" style={{ height: "100vh", background: "var(--bone)", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--ink-faint)", fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[680px] flex flex-col" style={{ height: "100vh", overflow: "hidden", background: "var(--bone)" }}>
      {/* Header */}
      <div style={{ flexShrink: 0, background: "var(--paper)", borderBottom: "1px solid var(--border)", padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/inbox" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)" }}>
            <ArrowLeft size={18} />
          </Link>
          <Link href={`/profile/${other?.handle}`} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, textDecoration: "none" }}>
            <Avatar name={other?.name ?? "?"} size={36} verified={other?.tier === "top_seller"} />
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{other?.name ?? "Unknown"}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{other?.rating}★ · {other?.deals_count} deals</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Scrollable message body */}
      <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {/* Public thread toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 20px 0", padding: "11px 13px", background: makePublic ? "rgba(0,180,160,0.08)" : "var(--paper)", border: `1px solid ${makePublic ? "var(--verified-teal)" : "var(--border)"}`, borderRadius: 13 }}>
          {makePublic ? <Eye size={18} style={{ color: "var(--verified-teal)", flexShrink: 0 }} /> : <EyeOff size={18} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{makePublic ? "Public thread" : "Make thread public"}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.4 }}>
              {makePublic ? "Anyone can read this Q&A on the listing." : "Let other buyers see your questions & the seller's answers."}
            </div>
          </div>
          <button onClick={() => setMakePublic((v) => !v)} style={{ width: 44, height: 26, borderRadius: 999, border: "none", background: makePublic ? "var(--verified-teal)" : "var(--bone-deep)", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 160ms" }}>
            <span style={{ position: "absolute", top: 3, left: makePublic ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "var(--paper)", transition: "left 160ms", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </button>
        </div>

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
            <VerifyBadge tier="shown" />
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

          {dealState === "confirmed" && (
            <div style={{ alignSelf: "center", background: "var(--bone-deep)", color: "var(--ink-mute)", fontSize: 11.5, padding: "4px 12px", borderRadius: 999, margin: "6px 0" }}>
              Deal completed · recorded on both profiles
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "var(--ink-faint)", padding: "0 32px 12px", lineHeight: 1.5 }}>
          First time trading with @{other?.handle}? Deals complete off-platform — check trust signals & ask for an in-hand video.
        </div>
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, borderTop: "1px solid var(--border)", background: "var(--paper)", padding: "10px 20px 24px" }}>
        {dealState !== "confirmed" && (
          <div style={{ marginBottom: 10 }}>
            {!dealState && (
              <button onClick={() => setDealState("requested")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 44, borderRadius: 12, border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--paper)", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14 }}>
                <Check size={16} />Mark as sold / traded to @{other?.handle}
              </button>
            )}
            {dealState === "requested" && (
              <div style={{ background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <Clock size={17} style={{ color: "var(--grail-gold-deep)", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12.5, color: "var(--ink-soft)" }}>Waiting for @{other?.handle} to confirm the deal.</span>
                <button onClick={() => setDealState("confirmed")} style={{ height: 32, padding: "0 12px", borderRadius: 8, border: "none", background: "var(--grail-gold-deep)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                  Simulate confirm
                </button>
              </div>
            )}
          </div>
        )}

        {dealState === "confirmed" && (
          <div style={{ marginBottom: 10, background: "var(--forest-soft)", border: "1px solid var(--forest)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--forest)", fontWeight: 600, fontSize: 13 }}>
              <Shield size={16} />Deal confirmed
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 12.5, color: "var(--ink-mute)" }}>Rate this trade:</span>
              <Stars n={5} size={18} />
              <button style={{ marginLeft: "auto", height: 32, padding: "0 12px", borderRadius: 8, border: "none", background: "var(--verified-teal)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                Leave vouch
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 11, border: "1px solid var(--border)", background: "transparent", color: "var(--ink-mute)", cursor: "pointer" }}>
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
