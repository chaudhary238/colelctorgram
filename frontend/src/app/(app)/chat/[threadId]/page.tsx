"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Ban, Check, ChevronRight, Flag, Link2, Plus, Send, Shield, Tag, ShoppingBag, Camera, MoreHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { conditionLabel } from "@/lib/catalog";
import { Avatar, Button, Money, ProductPhoto } from "@/components/ui";
import { fireToast } from "@/components/gamification";
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
  // Draft mode — read once as state seeds; useState initial values are mount-only,
  // so router.replace stripping the params (or the user editing the text) never
  // re-seeds the composer. Three callers share this plumbing (DV8 §10#22):
  //   · Ask-about-it:            ?draft=1&sku=…&title=…
  //   · listing "Message seller": ?draft=1&intent=buy&title=…
  //   · ISO "I have this":        ?draft=1&intent=iso&title=…[&sku=…]
  // All of them PRE-FILL the composer (v8 Chat.jsx:90) — nothing is auto-sent.
  const isDraft = searchParams.get("draft") === "1";
  const draftIntent = isDraft ? searchParams.get("intent") : null;
  const draftSku = isDraft ? searchParams.get("sku") : null;
  const draftTitle = searchParams.get("title") ?? "";
  const [data, setData] = useState<ThreadData | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState(
    !isDraft ? ""
      : draftIntent === "buy" ? `Hi! Is the ${draftTitle || "item"} still available? `
      : draftIntent === "iso" ? `Hi! I have ${draftTitle || "it"} — still looking? `
      : draftSku ? `About your ${draftTitle || "item"} — ` : ""
  );
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
  // Held draft context — the sku (when one exists) rides the FIRST send (whatever it
  // says: the context is the tap intent), then it's cleared and the draft params are
  // stripped from the URL. Intent drafts without a sku still hold a ref so the same
  // focus + URL-cleanup path runs; they just send without ref_sku.
  const [pendingRef, setPendingRef] = useState<{ sku: string | null; title: string } | null>(
    draftSku || draftIntent ? { sku: draftSku, title: draftTitle } : null,
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

  // After the first send lands: make sure a sku-carrying draft's chip can render
  // (the refs map from the initial GET predates this sku), drop the held context
  // and strip the draft params from the URL.
  const consumeRef = (ref: { sku: string | null; title: string }) => {
    const sku = ref.sku;
    if (sku) {
      setRefs((r) => (r[sku] ? r : { ...r, [sku]: { title: ref.title, thumbnail_url: null } }));
    }
    setPendingRef(null);
    router.replace(`/chat/${threadId}`);
  };

  const sendText = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    const ref = pendingRef;
    const msg = await api.post<Message>(
      `/threads/${threadId}/messages`,
      ref?.sku ? { body: t, ref_sku: ref.sku } : { body: t },
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
  // DV8 §10#9 (v8 Chat.jsx:107-108,146) — each attach action confirms with a toast.
  const shareListing = async () => {
    if (!data?.listing) return;
    setAttachOpen(false);
    try {
      await sendText(`📦 Sharing listing: ${data.listing.title}`);
      fireToast("Listing shared");
    } catch (e) {
      console.error(e);
    }
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
      fireToast("Photo sent"); // v8 Chat.jsx:107
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
    // v8 Chat.jsx:144 — the no-listing edge copy ends "for item" (DV8 §10#11).
    const what = data?.listing?.title ?? "item";
    setOfferOpen(false);
    setOfferAmt("");
    try {
      await sendText(`💰 Offer: ₹${amt} for ${what}`);
      fireToast("Offer sent!"); // v8 Chat.jsx:146
    } catch (e) {
      console.error(e);
    }
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
              {/* DV8 §10#10 (v8 Chat.jsx:49) — the amount seeds at 90% of asking when a
                  listing is present (display units), re-seeded on every open. */}
              <button onClick={() => { setAttachOpen(false); setOfferAmt(listing ? String(Math.round((listing.price / 100) * 0.9)) : ""); setOfferOpen(true); }} style={attachBtn}>
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
        <ChatMoreMenu
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
            /* v8 shared IconButton (DV8 §10#6) — 40px, r13, 1px --border. */
            <button
              onClick={() => setMoreOpen(true)}
              aria-label="More"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 13, border: "1px solid var(--border)", color: "var(--ink)", background: "none", cursor: "pointer", flexShrink: 0 }}
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

        {/* DV8 §10#21b (v8 Chat.jsx:272-275, shared IconButton) — plus/send are 40px
            r13; the ACTIVE send fills var(--ink), not stamp-red. */}
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <button onClick={() => setAttachOpen(true)} aria-label="Attach" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 13, border: "1px solid var(--border)", background: "transparent", color: "var(--ink-mute)", cursor: "pointer", flexShrink: 0 }}>
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
          <button onClick={send} disabled={sending} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 13, border: "none", background: draft.trim() ? "var(--ink)" : "var(--bone)", color: draft.trim() ? "var(--paper)" : "var(--ink-ghost)", cursor: draft.trim() ? "pointer" : "default", flexShrink: 0 }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// useSearchParams must sit under a Suspense boundary for the production build
// (draft mode: /chat/{id}?draft=1[&intent=buy|iso][&sku=…]&title=…).
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

/* ── ChatMoreMenu — chat-side more/report/block sheet (DV8 §10#13) ──────────────
   Mirror of components/ProfileMoreMenu (another owner's file, which exposes no
   subtitle/context prop), implemented locally so the report sheet can ask
   "Why are you reporting this conversation?" (v8 Chat.jsx:185) instead of
   "…this account?". Everything else — the three menu rows (Copy profile link kept,
   §10#12 deliberate), the required-note report contract (§10#14), the 1100ms
   inline confirm (§10#15) and the real-block-then-/inbox flow (§10#16) — stays
   identical to the profile sheet. If ProfileMoreMenu ever grows a subtitle prop,
   fold this back into it. */

const REPORT_REASONS: { label: string; reason: string }[] = [
  { label: "Fake / impersonation", reason: "other" },
  { label: "Counterfeit / replica listings", reason: "counterfeit" },
  { label: "Scam or fraud attempt", reason: "other" },
  { label: "Harassment or abuse", reason: "harassment" },
  { label: "Spam", reason: "spam" },
  { label: "Other", reason: "other" },
];

type MoreStage = "menu" | "report" | "block";

function ChatMoreMenu({
  targetId, targetHandle, targetName, avatarUrl, onClose, onBlocked,
}: {
  targetId: string;
  targetHandle: string;
  targetName: string;
  avatarUrl: string | null;
  onClose: () => void;
  onBlocked: () => void;
}) {
  const [stage, setStage] = useState<MoreStage>("menu");
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmitReport = Boolean(reason) && note.trim().length > 0;

  function copyLink() {
    const url = `${window.location.origin}/profile/${targetHandle}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    onClose();
  }

  async function doBlock() {
    if (busy) return;
    setBusy(true);
    try {
      await api.post(`/blocks?target_id=${targetId}`);
      onBlocked();
      onClose();
    } catch {
      setBusy(false);
    }
  }

  async function doReport() {
    if (!canSubmitReport || busy) return;
    setBusy(true);
    const picked = REPORT_REASONS.find((r) => r.label === reason)!;
    try {
      await api.post(`/reports`, {
        target_type: "user",
        target_id: targetId,
        reason: picked.reason,
        detail: `${picked.label} — ${note.trim()}`,
      });
      setSent(true);
      setTimeout(onClose, 1100);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.38)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl sm:mb-4"
        style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.12)", padding: "8px 0 28px" }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)", margin: "8px auto 14px" }} />

        {/* ── Main menu ── */}
        {stage === "menu" && (
          <div>
            {[
              { icon: <Link2 size={18} />, label: "Copy profile link", danger: false, onClick: copyLink },
              { icon: <Ban size={18} />, label: `Block @${targetHandle}`, danger: false, onClick: () => setStage("block") },
              { icon: <Flag size={18} />, label: `Report @${targetHandle}`, danger: true, onClick: () => { setReason(null); setNote(""); setStage("report"); } },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 cursor-pointer"
                style={{ background: "none", border: "none", color: item.danger ? "var(--stamp-red)" : "var(--ink)" }}
              >
                <span style={{ width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: item.danger ? "var(--rose-tint-bg)" : "var(--paper-soft)", color: "inherit" }}>
                  {item.icon}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 15 }}>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Report ── */}
        {stage === "report" && (
          <div>
            <div style={{ padding: "0 20px 10px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>Report @{targetHandle}</div>
              {/* v8 Chat.jsx:185 — reporting FROM a thread asks about the conversation. */}
              <div style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 3 }}>Why are you reporting this conversation?</div>
            </div>
            {sent ? (
              <div className="flex flex-col items-center gap-2.5" style={{ padding: "24px 0 8px" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--paper-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={24} style={{ color: "var(--forest)" }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Report submitted</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>We&apos;ll review this within 24 hrs</div>
              </div>
            ) : (
              <>
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setReason(r.label)}
                    className="w-full flex items-center justify-between cursor-pointer"
                    style={{ padding: "13px 20px", background: "none", border: "none", borderBottom: "1px solid var(--border)" }}
                  >
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)", fontWeight: reason === r.label ? 600 : 400 }}>{r.label}</span>
                    {reason === r.label && <Check size={16} style={{ color: "var(--stamp-red)" }} />}
                  </button>
                ))}
                <div style={{ padding: "12px 20px 0" }}>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>Tell us what happened</div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 300))}
                    rows={3}
                    placeholder="Describe the issue — what was said or done, and when."
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.5, color: "var(--ink)", outline: "none", resize: "none" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", fontFamily: "var(--font-mono)", fontSize: 11, color: note.length > 260 ? "var(--stamp-red)" : "var(--ink-ghost)", marginTop: 4 }}>{note.length}/300</div>
                </div>
                <div style={{ padding: "10px 20px 0" }}>
                  <Button variant="primary" style={{ width: "100%", justifyContent: "center" }} disabled={!canSubmitReport || busy} onClick={doReport}>
                    Submit report
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Block confirm ── */}
        {stage === "block" && (
          <div>
            <div style={{ padding: "8px 20px 6px", textAlign: "center" }}>
              <Avatar name={targetName} photo={avatarUrl} size={56} />
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, marginTop: 12 }}>Block @{targetHandle}?</div>
              <div style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 6, lineHeight: 1.55, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
                They won&apos;t be able to see your profile, listings or messages. You can unblock them anytime from Settings.
              </div>
            </div>
            <div className="flex flex-col gap-2" style={{ padding: "18px 20px 0" }}>
              <Button variant="primary" style={{ width: "100%", justifyContent: "center", background: "var(--stamp-red)", borderColor: "var(--stamp-red)" }} disabled={busy} onClick={doBlock}>
                Block @{targetHandle}
              </Button>
              <Button variant="secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setStage("menu")}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
