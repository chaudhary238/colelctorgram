"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Plus, Send, Shield, Tag, ShoppingBag, Camera, MoreHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { conditionLabel } from "@/lib/catalog";
import { Avatar, Money, ProductPhoto } from "@/components/ui";
import { ProfileMoreMenu } from "@/components/ProfileMoreMenu";
import { BackButton } from "@/components/BackButton";

interface ChatUser {
  id: string;
  handle: string | null;
  name: string | null;
  avatar_url: string | null;
  rating: number;
  // DV8 — header trust subtitle ("N vouches · joined YYYY")
  vouches_count?: number;
  joined_year?: number | null;
}

interface ChatListing {
  id: string;
  title: string;
  price: number;
  status: string;
  seller_id: string;
}

/* DV8 — the context card shows the listing's cover photo + condition, neither of
   which rides in the (deliberately slim) thread payload. One extra fetch of the
   full listing fills them; until it lands the card falls back to the tone
   placeholder with just the price line. */
interface ListingExtra {
  cover_url?: string | null;
  condition?: string | null;
  category?: string | null;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  // DV8 "Ask about it" — the catalogue entry this message is about (context chip)
  ref_sku?: string | null;
  created_at: string;
}

/* DV8 "Ask about it" — GET /threads/{id}/messages batches every tagged sku's
   title + thumbnail into one refs map, so chips render with zero extra requests. */
interface ChatRef {
  title: string;
  thumbnail_url: string | null;
}

interface ThreadData {
  thread_id: string;
  viewer_id: string;
  other_user: ChatUser | null;
  listing: ChatListing | null;
  unread: number;
  refs?: Record<string, ChatRef>;
  messages: Message[];
}

function ChatThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Draft mode ("Ask @owner about it", ?draft=1&sku=…) — read once as state seeds;
  // useState initial values are mount-only, so router.replace stripping the params
  // (or the user editing the text) never re-seeds the composer.
  const draftSku = searchParams.get("draft") === "1" ? searchParams.get("sku") : null;
  const draftTitle = searchParams.get("title") ?? "";
  const [data, setData] = useState<ThreadData | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState(draftSku ? `About your ${draftTitle || "item"} — ` : "");
  const [sending, setSending] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmt, setOfferAmt] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [listingExtra, setListingExtra] = useState<ListingExtra | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  // DV8 "Ask about it" — sku→{title,thumbnail} map for the context chips; seeded by
  // the GET, extended locally when the draft's first send tags a new sku.
  const [refs, setRefs] = useState<Record<string, ChatRef>>({});
  // Held item context from ?draft=1&sku=… — attached to the FIRST send (whatever it
  // says: the context is the tap intent), then cleared and stripped from the URL.
  const [pendingRef, setPendingRef] = useState<{ sku: string; title: string } | null>(
    draftSku ? { sku: draftSku, title: draftTitle } : null,
  );
  const bodyRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<ThreadData>(`/threads/${threadId}/messages`)
      .then((d) => {
        setData(d);
        setLocalMessages(d.messages ?? []);
        setRefs(d.refs ?? {});
        if (d.listing) {
          api.get<ListingExtra>(`/listings/${d.listing.id}`).then(setListingExtra).catch(() => {});
        }
      })
      .catch(console.error);
  }, [threadId]);

  // Focus the prefilled composer with the cursor at the end (not auto-sent).
  useEffect(() => {
    const el = inputRef.current;
    if (data && pendingRef && el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [data, pendingRef]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [localMessages]);

  // After the first send lands with ref_sku: make sure the chip can render (the
  // refs map from the initial GET predates this sku), drop the held context and
  // strip the draft params from the URL.
  const consumeRef = (ref: { sku: string; title: string }) => {
    setRefs((r) => (r[ref.sku] ? r : { ...r, [ref.sku]: { title: ref.title, thumbnail_url: null } }));
    setPendingRef(null);
    router.replace(`/chat/${threadId}`);
  };

  const sendText = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    const ref = pendingRef;
    const msg = await api.post<Message>(
      `/threads/${threadId}/messages`,
      ref ? { body: t, ref_sku: ref.sku } : { body: t },
    );
    setLocalMessages((prev) => [...prev, msg]);
    if (ref) consumeRef(ref);
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
  // DV8 — Photo attach: same R2 presigned-PUT path the composer's uploader uses,
  // then the public URL goes out as an image message (messages carry image_url).
  const sendPhoto = async (file: File) => {
    if (!file.type.startsWith("image/") || photoBusy) return;
    setPhotoBusy(true);
    try {
      const meta = await api.post<{ upload_url: string; public_url: string }>(
        `/media/upload-url?prefix=uploads&content_type=${encodeURIComponent(file.type)}`
      );
      const res = await fetch(meta.upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!res.ok) throw new Error(`Storage rejected the upload (HTTP ${res.status})`);
      // A held draft context rides on the FIRST send even when that send is a photo.
      const ref = pendingRef;
      const msg = await api.post<Message>(
        `/threads/${threadId}/messages`,
        ref ? { image_url: meta.public_url, ref_sku: ref.sku } : { image_url: meta.public_url },
      );
      setLocalMessages((prev) => [...prev, msg]);
      if (ref) consumeRef(ref);
    } catch (e) {
      console.error(e);
    } finally {
      setPhotoBusy(false);
      if (photoRef.current) photoRef.current.value = "";
    }
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
      {/* hidden file input for the Photo attach (DV8) */}
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) sendPhoto(f); }}
      />
      {/* ── Attach sheet (v3) ── */}
      {attachOpen && (
        <div onClick={() => setAttachOpen(false)} className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.38)" }}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl sm:mb-4" style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.12)", padding: "8px 0 28px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)", margin: "8px auto 18px" }} />
            {/* DV8 (Chat.jsx:105-118) — 3-col grid, Photo · Share listing · Make offer in
                that order. Share listing only renders when the thread has a listing (no
                dead control on a plain DM). */}
            <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: listing ? "1fr 1fr 1fr" : "1fr 1fr", gap: 12 }}>
              <button
                onClick={() => { setAttachOpen(false); photoRef.current?.click(); }}
                disabled={photoBusy}
                style={{ ...attachBtn, opacity: photoBusy ? 0.5 : 1 }}
              >
                <span style={attachIcon}><Camera size={22} /></span>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{photoBusy ? "Sending…" : "Photo"}</span>
              </button>
              {listing && (
                <button onClick={shareListing} style={attachBtn}>
                  <span style={attachIcon}><ShoppingBag size={22} /></span>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>Share listing</span>
                </button>
              )}
              <button onClick={() => { setAttachOpen(false); setOfferAmt(""); setOfferOpen(true); }} style={attachBtn}>
                <span style={attachIcon}><Tag size={22} /></span>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>Make offer</span>
              </button>
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
          <Link href={`/profile/${other?.handle}`} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, textDecoration: "none" }}>
            <Avatar name={other?.name ?? "?"} photo={other?.avatar_url} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{other?.name ?? "Unknown"}</div>
              {/* DV8 (Chat.jsx:253) — the subtitle is the trust line: "N vouches · joined
                  YYYY". (v8 also lists deals & response time — neither exists in the
                  payload, deals were retired, so both are skipped.) The listing context
                  lives in the card below, not up here. */}
              {other && (
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {other.vouches_count ?? 0} vouches{other.joined_year ? ` · joined ${other.joined_year}` : ""}
                </div>
              )}
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
            {/* DV8 (Chat.jsx:286-289) — real cover thumbnail (ProductPhoto placeholder
                until the listing fetch lands), and the second line reads price ·
                condition, not the raw status. */}
            <div style={{ width: 44, height: 44, borderRadius: 9, overflow: "hidden", flexShrink: 0 }}>
              <ProductPhoto tone="ink" src={listingExtra?.cover_url ?? null} ratio="1/1" rounded={9} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing.title}</div>
              <div style={{ fontSize: 13, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <Money value={Math.round(listing.price / 100)} />
                {listingExtra?.condition && (
                  <>
                    {" · "}
                    <span style={{ color: "var(--ink-faint)" }}>
                      {conditionLabel(listingExtra.condition, listingExtra.category) ?? listingExtra.condition}
                    </span>
                  </>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Messages */}
        <div style={{ padding: "4px 20px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {localMessages.map((m, i) => (
            <div key={m.id} style={{ alignSelf: isMe(m) ? "flex-end" : "flex-start", maxWidth: "78%" }}>
              {/* DV8 "Ask about it" — item context chip above the FIRST message of a
                  consecutive same-sku run (replies about the same item don't repeat it). */}
              {m.ref_sku && (i === 0 || localMessages[i - 1].ref_sku !== m.ref_sku) && (
                <div style={{ display: "flex", justifyContent: isMe(m) ? "flex-end" : "flex-start", marginBottom: 4 }}>
                  <Link href={`/db/${encodeURIComponent(m.ref_sku)}`} style={{
                    display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, maxWidth: "100%",
                    padding: "5px 8px 5px 5px", borderRadius: 10, background: "var(--bone)",
                    border: "1px solid var(--border)", textDecoration: "none",
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, overflow: "hidden", flexShrink: 0 }}>
                      <ProductPhoto tone="ink" src={refs[m.ref_sku]?.thumbnail_url ?? null} ratio="1/1" rounded={7} />
                    </div>
                    <span style={{ minWidth: 0, fontSize: 12, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {refs[m.ref_sku]?.title || m.ref_sku}
                    </span>
                    <ChevronRight size={13} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
                  </Link>
                </div>
              )}
              <div style={{ padding: m.image_url ? 4 : "9px 13px", borderRadius: 16, fontSize: 14.5, lineHeight: 1.45, background: isMe(m) ? "var(--stamp-red)" : "var(--paper)", color: isMe(m) ? "var(--paper)" : "var(--ink)", border: isMe(m) ? "none" : "1px solid var(--border)", borderBottomRightRadius: isMe(m) ? 5 : 16, borderBottomLeftRadius: isMe(m) ? 16 : 5, overflow: "hidden" }}>
                {m.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.image_url} alt="" style={{ display: "block", maxWidth: "100%", borderRadius: 12 }} />
                )}
                {m.body && <div style={m.image_url ? { padding: "5px 9px 4px" } : undefined}>{m.body}</div>}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--ink-faint)", marginTop: 3, textAlign: isMe(m) ? "right" : "left", padding: "0 4px" }}>
                {timeAgo(m.created_at)}
              </div>
            </div>
          ))}
        </div>

        {/* DV8 (Chat.jsx:311-313) — centred first-trade footnote below the messages. */}
        {other?.handle && (
          <div style={{ textAlign: "center", fontSize: 11, color: "var(--ink-faint)", padding: "0 32px 12px", lineHeight: 1.5 }}>
            First time trading with @{other.handle}? Deals complete off-platform — check trust signals &amp; ask for an in-hand video.
          </div>
        )}
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
            ref={inputRef}
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

// useSearchParams must sit under a Suspense boundary for the production build
// (draft mode: /chat/{id}?draft=1&sku=…&title=…).
export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-[680px] flex flex-col" style={{ height: "100vh", background: "var(--bone)", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--ink-faint)", fontSize: 14 }}>Loading…</div>
      </div>
    }>
      <ChatThread />
    </Suspense>
  );
}

const attachBtn: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: 9, padding: "16px 8px",
  background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 16, cursor: "pointer", color: "var(--ink)",
};
const attachIcon: React.CSSProperties = {
  width: 46, height: 46, borderRadius: 14, background: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)",
};
