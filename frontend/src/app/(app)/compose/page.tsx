"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Camera, Image, Tag, ChevronRight, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { ApiCommunity } from "@/components/cards";
import { Avatar, PostTypeTag, CategoryChip, SectionLabel, ProductPhoto } from "@/components/ui";

const POST_TYPES = [
  { id: "showcase", label: "Showcase", desc: "Show off a piece from your collection.", color: "var(--verified-teal)", icon: Camera },
  { id: "discussion", label: "Discussion", desc: "Ask the community a question.", color: "var(--plum)", icon: Tag },
  { id: "review", label: "Review", desc: "Rate & review an item you own.", color: "var(--grail-gold-deep)", icon: Tag },
  { id: "poll", label: "Poll", desc: "Put a question to a vote.", color: "var(--stamp-red)", icon: Tag },
] as const;

type PostType = (typeof POST_TYPES)[number]["id"];

export default function ComposePage() {
  const router = useRouter();
  const [type, setType] = useState<PostType | null>(null);
  const [body, setBody] = useState("");
  const [community, setCommunity] = useState("");
  const [choices, setChoices] = useState(["", ""]);
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    api.get<ApiCommunity[]>("/communities?limit=50")
      .then((data) => setCommunities((data ?? []).filter((c) => c.is_member)))
      .catch(console.error);
  }, []);

  const pollValid = choices.filter((c) => c.trim()).length >= 2;
  const canPost = type === "poll" ? body.trim() && pollValid : body.trim();

  const publish = async () => {
    if (!canPost || publishing) return;
    setPublishing(true);
    try {
      const pollOptions = type === "poll"
        ? Object.fromEntries(choices.filter((c) => c.trim()).map((c) => [c.trim(), 0]))
        : null;
      await api.post("/posts", {
        type,
        body,
        community_id: community || null,
        poll_options: pollOptions,
        images: [],
      });
      router.push("/feed");
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(false);
    }
  };

  if (!type) {
    return (
      <div className="w-full max-w-[680px] flex flex-col" style={{ minHeight: "100vh" }}>
        <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/feed" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)" }}>
              <X size={18} />
            </Link>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>New post</span>
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 13.5, color: "var(--ink-mute)", margin: "0 0 14px" }}>
            What are you posting? Selling isn&rsquo;t here — list from an item.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {POST_TYPES.map((t) => (
              <button key={t.id} onClick={() => setType(t.id)} style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left", cursor: "pointer", background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: t.color, color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <t.icon size={21} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>{t.label}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 1 }}>{t.desc}</div>
                </div>
                <ChevronRight size={18} style={{ color: "var(--ink-faint)" }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/feed" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)" }}>
            <X size={18} />
          </Link>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>New post</span>
          <button onClick={publish} disabled={!canPost || publishing} style={{ height: 36, padding: "0 16px", borderRadius: 9, border: "none", background: canPost ? "var(--stamp-red)" : "var(--bone)", color: canPost ? "var(--paper)" : "var(--ink-ghost)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: canPost ? "pointer" : "not-allowed" }}>
            {publishing ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <PostTypeTag type={type === "poll" ? "discussion" : type as "showcase" | "discussion" | "review"} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>
            {POST_TYPES.find((t) => t.id === type)?.label}
          </span>
          <button onClick={() => setType(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Change type
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Avatar name="You" size={38} />
          <textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={type === "poll" ? 2 : 5}
            placeholder={type === "poll" ? "Ask your question…" : type === "discussion" ? "What's on your mind?" : "Say something about it…"}
            style={{ flex: 1, border: "none", outline: "none", resize: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.5, color: "var(--ink)", paddingTop: 7 }}
          />
        </div>

        {type === "poll" && (
          <div style={{ marginTop: 8 }}>
            <SectionLabel>Choices</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {choices.map((ch, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    value={ch}
                    onChange={(e) => setChoices((cs) => cs.map((c, j) => j === i ? e.target.value : c))}
                    placeholder={`Choice ${i + 1}`}
                    style={{ flex: 1, height: 42, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)", outline: "none" }}
                  />
                  {choices.length > 2 && (
                    <button onClick={() => setChoices((cs) => cs.filter((_, j) => j !== i))} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--ink-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {choices.length < 5 && (
              <button onClick={() => setChoices((cs) => [...cs, ""])} style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, cursor: "pointer", padding: 0 }}>
                <Plus size={17} />Add choice
              </button>
            )}
          </div>
        )}

        {type !== "poll" && (
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            {([{ icon: Image, label: "Photo" }, { icon: Camera, label: "Camera" }, { icon: Tag, label: "Tag" }] as const).map(({ icon: Icon, label }) => (
              <button key={label} style={{ display: "flex", alignItems: "center", gap: 7, height: 38, padding: "0 14px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", color: "var(--ink)", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13 }}>
                <Icon size={17} />{label}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 18 }}><SectionLabel>Post to</SectionLabel></div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
          <CategoryChip active={community === ""} onClick={() => setCommunity("")}>Your feed</CategoryChip>
          {communities.map((c) => (
            <CategoryChip key={c.id} active={community === c.id} onClick={() => setCommunity(c.id)}>
              {c.name}
            </CategoryChip>
          ))}
        </div>
      </div>
    </div>
  );
}
