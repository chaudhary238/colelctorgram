// ─────────────────────────────────────────────────────────────
// Scorred — card components (feed, marketplace, lists)
// ─────────────────────────────────────────────────────────────

// Small author line: avatar + name + single feed badge + handle + time (+ in-feed follow)
function AuthorLine({ handle, time, community, onOpen, showFollow }) {
  const u = userOf(handle);
  const c = community ? COMMUNITIES.find(x => x.id === community) : null;
  const { followed, toggleFollow } = useAppState();
  const { flashToast } = useNav();
  const isMe = handle === 'you';
  const following = followed[handle];
  const [sheetBadge, setSheetBadge] = React.useState(null);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {sheetBadge && <BadgeSheet badge={sheetBadge} onClose={() => setSheetBadge(null)}/>}
      <button onClick={onOpen} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <Avatar name={u.name} color={u.color} size={38} verified={u.tier === 'Top Seller' || u.tier === 'Trusted'}/>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'nowrap', overflow: 'hidden' }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1, minWidth: 0 }}>{u.name}</span>
          {/* Single feed badge — priority: First Start > Monthly > Rank */}
          <FeedBadgePill u={u} onClick={setSheetBadge}/>
          {showFollow && !isMe && (
            <button onClick={(e) => { e.stopPropagation(); toggleFollow(handle); flashToast(following ? `Unfollowed @${u.handle}` : `Following @${u.handle} · +2 XP`); }}
              style={{
                padding: '3px 8px', borderRadius: 999, cursor: 'pointer', lineHeight: 1,
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0,
                background: following ? 'transparent' : 'var(--stamp-red-soft)',
                color: following ? 'var(--ink-faint)' : 'var(--stamp-red)',
                border: `1px solid ${following ? 'var(--border-strong)' : 'var(--stamp-red)'}`,
              }}>{following ? 'Following' : '+ Follow'}</button>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--slate-400)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          @{u.handle}{c ? ` · ${c.name}` : ''} · {time}
        </div>
      </div>
    </div>
  );
}

// ── Post card (showcase / discussion / review) — BRD §8.5, §9.3 ──
function PostCard({ post, showFollow = false }) {
  if (post.type === 'iso') return <ISOCard post={post}/>;
  const { push } = useNav();
  const { hearted, saved, toggleHeart, toggleSave, flashToast, setOverlay } = { ...useAppState(), ...useNav() };
  const liked = hearted[post.id];
  const isSaved = saved[post.id];
  const item = post.refSku ? catOf(post.refSku) : null;
  const open = () => push({ name: 'post', id: post.id });
  const openUser = () => push({ name: 'profile', user: post.user });

  // inline comments — BRD v1.2 §9.3 (expand in feed, no page nav)
  const baseComments = COMMENTS[post.id] || [];
  const [showComments, setShowComments] = React.useState(false);
  const [extra, setExtra] = React.useState([]);
  const [draft, setDraft] = React.useState('');
  const commentCount = (baseComments.length || post.comments || 0) + extra.length;
  const addComment = () => { if (draft.trim()) { setExtra(x => [...x, { user: 'you', time: 'now', body: draft.trim() }]); setDraft(''); } };
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div
      style={{ background: 'var(--card-surface)', borderRadius: 20, margin: '0 14px 12px', boxShadow: 'var(--card-shadow)', transition: 'transform 200ms cubic-bezier(0.22,1,0.36,1), box-shadow 200ms' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow-lifted)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}>
      <div style={{ padding: '16px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <AuthorLine handle={post.user} time={post.time} community={post.community} onOpen={openUser} showFollow={showFollow}/>
        </div>
        <div onClick={open} style={{ cursor: 'pointer', marginTop: 11 }}>
          {post.type === 'review' && post.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Stars n={post.rating}/>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{item ? `reviewing ${item.brand}` : `${post.rating} / 5`}</span>
            </div>
          )}
          {post.title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, letterSpacing: '-0.025em', lineHeight: 1.22, marginBottom: 5 }}>{post.title}</div>}
          {post.body && (
            <div>
              <div style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-soft)',
                display: expanded ? 'block' : '-webkit-box', WebkitLineClamp: expanded ? undefined : 3,
                WebkitBoxOrient: 'vertical', overflow: expanded ? 'visible' : 'hidden' }}>{post.body}</div>
              {!expanded && post.body.length > 130 && (
                <button onClick={e => { e.stopPropagation(); setExpanded(true); }} style={{
                  background: 'none', border: 'none', padding: '3px 0 0', cursor: 'pointer',
                  fontSize: 13.5, fontWeight: 600, color: 'var(--ink-faint)', fontFamily: 'var(--font-body)',
                }}>read more</button>
              )}
            </div>
          )}
          {post.tags && post.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {post.tags.map(t => (
                <span key={t} style={{ fontSize: 13, fontWeight: 600, color: 'var(--plum)' }}>#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* images — user-uploaded gallery, else a seed single image via refSku */}
      {post.images && post.images.length > 0 ? (
        <div onClick={open} style={{ cursor: 'pointer', padding: '12px 18px 0', position: 'relative' }}>
          <PostImages images={post.images}/>
          {post.images.length > 1 && (
            <div style={{ position: 'absolute', top: 22, right: 28, pointerEvents: 'none' }}>
              <GlassPill>📸 {post.images.length}</GlassPill>
            </div>
          )}
        </div>
      ) : post.image && item ? (
        <div onClick={open} style={{ cursor: 'pointer', padding: '12px 18px 0', position: 'relative' }}>
          <ProductPhoto tone={post.tone} ratio="3/2"/>
        </div>
      ) : null}

      {/* poll — BRD v1.2 §9.6 */}
      {post.type === 'poll' && post.poll && <PollBlock post={post}/>}



      {/* quick actions + social proof metadata row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '12px 18px 10px' }}>
        <ActionBtn icon={<Ico d={Icons.heart} size={20}/>} label={(post.likes || 0) + (liked ? 1 : 0)} active={liked}
          onClick={() => { toggleHeart(post.id); }}/>
        <ActionBtn icon={<Ico d={Icons.comment} size={20}/>} label={commentCount} active={showComments}
          onClick={() => setShowComments(v => !v)}/>
        <ActionBtn icon={<Ico d={Icons.share} size={19}/>} onClick={() => setOverlay({ name: 'share', label: `${userOf(post.user).name.split(' ')[0]}'s post` })}/>
        <div style={{ flex: 1 }}/>
        <ActionBtn icon={<Ico d={Icons.bookmark} size={20}/>} active={isSaved} activeColor="var(--ink)"
          onClick={() => { toggleSave(post.id); flashToast(isSaved ? 'Removed from saved' : 'Saved'); }}/>
      </div>
      {/* social proof + location metadata strip */}
      {((post.likes > 0) || post.city) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px 14px', flexWrap: 'wrap' }}>
          {post.likes > 0 && (() => {
            const allHandles = Object.keys(USERS);
            const seed = post.id ? post.id.charCodeAt(post.id.length - 1) : 0;
            const likers = allHandles.filter((_, i) => (seed + i) % 4 !== 0).slice(0, 3).map(h => USERS[h]);
            return <StackedAvatars items={likers} label={`${(post.likes || 0) + (liked ? 1 : 0)} liked`}/>;
          })()}
          {post.city && <LocationTag>{post.city}</LocationTag>}
        </div>
      )}

      {/* inline comments (expand in feed — no page navigation) */}
      {showComments && <CommentThread post={post}/>}
    </div>
  );
}

// Renders comment text with @mentions highlighted + tappable
function renderCommentBody(text, push) {
  return text.split(/(@\w+)/g).map((p, i) =>
    p.startsWith('@')
      ? <span key={i}
          onClick={push ? (e) => { e.stopPropagation(); push({ name: 'profile', user: p.slice(1) }); } : undefined}
          style={{ color: 'var(--stamp-red)', fontWeight: 700, cursor: push ? 'pointer' : 'default' }}>{p}</span>
      : p
  );
}

// Input that shows a user-picker dropdown when @ is typed
function MentionInput({ value, onChange, onSubmit, placeholder, size, autoFocus }) {
  const h = size === 'sm' ? 34 : 38;
  const fs = size === 'sm' ? 13.5 : 14;
  const px = size === 'sm' ? 12 : 13;
  const ref = React.useRef();
  const [mentioning, setMentioning] = React.useState(null);

  const handleChange = (e) => {
    const v = e.target.value;
    const cur = e.target.selectionStart;
    const before = v.slice(0, cur);
    const m = before.match(/@(\w*)$/);
    setMentioning(m ? { start: cur - m[0].length, query: m[1] } : null);
    onChange(v);
  };

  const insertMention = (handle) => {
    const cur = ref.current ? ref.current.selectionStart : value.length;
    const before = value.slice(0, mentioning.start);
    const after = value.slice(cur);
    const next = before + '@' + handle + ' ' + after;
    onChange(next);
    setMentioning(null);
    setTimeout(() => {
      if (!ref.current) return;
      ref.current.focus();
      const pos = (before + '@' + handle + ' ').length;
      ref.current.setSelectionRange(pos, pos);
    }, 0);
  };

  const allUsers = Object.values(USERS);
  const suggestions = mentioning
    ? allUsers.filter(u =>
        u.handle.toLowerCase().includes(mentioning.query.toLowerCase()) ||
        u.name.toLowerCase().includes(mentioning.query.toLowerCase())
      ).slice(0, 4)
    : [];

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      {suggestions.length > 0 && (
        <div style={{
          position: 'absolute', bottom: h + 6, left: 0, right: 0, zIndex: 30,
          background: 'var(--paper)', border: '1px solid var(--border-strong)',
          borderRadius: 15, overflow: 'hidden',
          boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
        }}>
          {suggestions.map((u, i) => (
            <button key={u.handle}
              onMouseDown={e => { e.preventDefault(); insertMention(u.handle); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 13px', background: 'none', cursor: 'pointer',
                border: 'none', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                textAlign: 'left',
              }}>
              <Avatar name={u.name} color={u.color} size={30}/>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>{u.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>@{u.handle}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      <input
        ref={ref}
        autoFocus={autoFocus}
        value={value}
        onChange={handleChange}
        onKeyDown={e => {
          if (e.key === 'Escape') setMentioning(null);
          if (e.key === 'Enter' && !suggestions.length) onSubmit && onSubmit();
        }}
        placeholder={placeholder || 'Add a comment…'}
        style={{
          width: '100%', height: h, padding: `0 ${px}px`,
          borderRadius: 999, border: '1px solid var(--border-strong)',
          background: 'var(--paper-soft)', fontFamily: 'var(--font-body)',
          fontSize: fs, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// Instagram-style comments: per-comment likes + reply threads
function CommentThread({ post }) {
  const { push } = useNav();
  const seed = (COMMENTS[post.id] || []).map((c, i) => ({ id: 'seed' + i, user: c.user, time: c.time, body: c.body, likes: c.likes || 0, liked: false, replies: [] }));
  const [comments, setComments] = React.useState(seed);
  const [draft, setDraft] = React.useState('');
  const [replyTo, setReplyTo] = React.useState(null);
  const [replyDraft, setReplyDraft] = React.useState('');

  const add = () => { if (!draft.trim()) return; setComments(cs => [...cs, { id: 'u' + Date.now(), user: 'you', time: 'now', body: draft.trim(), likes: 0, liked: false, replies: [] }]); setDraft(''); };
  const like = (id) => setComments(cs => cs.map(c => c.id === id ? { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) } : c));
  const likeReply = (cid, rid) => setComments(cs => cs.map(c => c.id === cid ? { ...c, replies: c.replies.map(r => r.id === rid ? { ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) } : r) } : c));
  const addReply = (cid) => { if (!replyDraft.trim()) return; setComments(cs => cs.map(c => c.id === cid ? { ...c, replies: [...c.replies, { id: 'r' + Date.now(), user: 'you', time: 'now', body: replyDraft.trim(), likes: 0, liked: false }] } : c)); setReplyDraft(''); setReplyTo(null); };
  const [menuId, setMenuId] = React.useState(null);
  const [editingId, setEditingId] = React.useState(null);
  const [editDraft, setEditDraft] = React.useState('');
  const startEdit  = (c) => { setEditingId(c.id); setEditDraft(c.body); setMenuId(null); };
  const saveEdit   = (id) => { setComments(cs => cs.map(c => c.id === id ? { ...c, body: editDraft } : { ...c, replies: c.replies.map(r => r.id === id ? { ...r, body: editDraft } : r) })); setEditingId(null); };
  const deleteComment = (id) => { setComments(cs => cs.filter(c => c.id !== id).map(c => ({ ...c, replies: c.replies.filter(r => r.id !== id) }))); setMenuId(null); };

  const Row = ({ c, reply, onLike, onReply, pushFn }) => {
    const cu = c.user === 'you' ? { name: 'You', color: 'var(--ink)' } : userOf(c.user);
    const isOwn = c.user === 'you';
    const isEditing = editingId === c.id;
    const menuOpen  = menuId === c.id;
    return (
      <div style={{ display: 'flex', gap: 9 }}>
        <Avatar name={cu.name} color={cu.color} size={reply ? 26 : 30}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: 14, padding: '10px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cu.name}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)', flexShrink: 0 }}>{c.time}</span>
              {isOwn && (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button onClick={() => setMenuId(menuOpen ? null : c.id)} style={{ background: 'none', border: 'none', padding: '0 3px', cursor: 'pointer', color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', fontSize: 15, lineHeight: 1, letterSpacing: '0.05em' }}>···</button>
                  {menuOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 30, background: 'var(--paper)', border: '1px solid var(--border-strong)', borderRadius: 11, boxShadow: '0 4px 18px rgba(0,0,0,0.13)', overflow: 'hidden', minWidth: 112 }}>
                      <button onClick={() => startEdit(c)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', textAlign: 'left' }}>
                        <Ico d={Icons.edit} size={14}/>Edit
                      </button>
                      <button onClick={() => deleteComment(c.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--stamp-red)', textAlign: 'left' }}>
                        <Ico d={Icons.trash} size={14}/>Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {isEditing ? (
              <div style={{ marginTop: 6, display: 'flex', gap: 7, alignItems: 'center' }}>
                <input value={editDraft} onChange={e => setEditDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') setEditingId(null); }}
                  autoFocus style={{ flex: 1, height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--paper)', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}/>
                <button onClick={() => saveEdit(c.id)} style={{ flexShrink: 0, background: 'var(--ink)', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', color: 'var(--paper)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12 }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontFamily: 'var(--font-body)', fontSize: 12 }}>Cancel</button>
              </div>
            ) : (
              <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.45, marginTop: 2 }}>{renderCommentBody(c.body, pushFn)}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '5px 12px 0', fontSize: 12 }}>
            <button onClick={onLike} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: c.liked ? 'var(--stamp-red)' : 'var(--ink-faint)', fontWeight: 600 }}>
              <Ico d={Icons.heart} size={14} fill={c.liked ? 'var(--stamp-red)' : 'none'}/>{c.likes > 0 ? c.likes : 'Like'}
            </button>
            {onReply && <button onClick={onReply} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink-faint)', fontWeight: 600 }}>Reply</button>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {comments.map(c => (
          <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Row c={c} pushFn={push} onLike={() => like(c.id)} onReply={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyDraft(''); }}/>
            {c.replies.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 30 }}>
                {c.replies.map(r => <Row key={r.id} c={r} reply pushFn={push} onLike={() => likeReply(c.id, r.id)}/>)}
              </div>
            )}
            {replyTo === c.id && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingLeft: 30 }}>
                <Avatar name="You" color="var(--ink)" size={26}/>
                <MentionInput
                  size="sm" autoFocus value={replyDraft}
                  onChange={v => setReplyDraft(v)}
                  onSubmit={() => addReply(c.id)}
                  placeholder={`Reply to @${c.user === 'you' ? 'you' : c.user}…`}
                />
                <IconButton icon={<Ico d={Icons.send} size={15}/>} active={!!replyDraft.trim()} onClick={() => addReply(c.id)}/>
              </div>
            )}
          </div>
        ))}
        {comments.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>No comments yet — say something.</div>}
      </div>
      <div style={{ display: 'flex', gap: 9, alignItems: 'center', marginTop: 14 }}>
        <Avatar name="You" color="var(--ink)" size={30}/>
        <MentionInput value={draft} onChange={setDraft} onSubmit={add} placeholder="Add a comment… type @ to tag"/>
        <IconButton icon={<Ico d={Icons.send} size={17}/>} active={!!draft.trim()} onClick={add}/>
      </div>
    </div>
  );
}

// Poll block — BRD v1.2 §9.6 (post type = poll)
function PollBlock({ post }) {
  const [vote, setVote] = React.useState(null);
  const total = post.poll.reduce((s, o) => s + o.votes, 0) + (vote != null ? 1 : 0);
  return (
    <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {post.poll.map((o, i) => {
        const votes = o.votes + (vote === i ? 1 : 0);
        const pct = total ? Math.round((votes / total) * 100) : 0;
        const picked = vote === i;
        return (
          <button key={i} onClick={() => setVote(i)} style={{
            position: 'relative', overflow: 'hidden', textAlign: 'left', cursor: 'pointer',
            border: `1px solid ${picked ? 'var(--ink)' : 'var(--border-strong)'}`, borderRadius: 13,
            background: 'var(--paper-soft)', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          }}>
            {vote != null && <div style={{ position: 'absolute', inset: 0, width: pct + '%', background: picked ? 'var(--plum-soft)' : 'var(--bone)', transition: 'width 280ms var(--ease-out)' }}/>}
            <span style={{ position: 'relative', fontSize: 14, fontWeight: picked ? 600 : 500, color: 'var(--ink)' }}>{o.label}</span>
            {vote != null && <span style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-mute)' }}>{pct}%</span>}
          </button>
        );
      })}
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{total} votes{vote == null ? ' · tap to vote' : ''}</div>
    </div>
  );
}

// ── Admin / release card — BRD §10 ────────────────────────────
function AdminCard({ post }) {
  const { push, flashToast } = useNav();
  const { interested, toggleInterested } = useAppState();
  const item = post.sku ? catOf(post.sku) : null;
  return (
    <div style={{ background: 'var(--card-surface)', borderRadius: 20, margin: '0 14px 12px', padding: '16px 18px', boxShadow: 'var(--card-shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <SealMark size={30}/>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Scorred</span>
            <Badge style={{ background: 'var(--slate-800)', color: 'var(--paper)', borderRadius: 5 }}>Official</Badge>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>New release · {post.time}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 5 }}>{post.title}</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-mute)', lineHeight: 1.5 }}>{post.body}</div>
          <div style={{ marginTop: 11 }}>
            <Button size="sm" variant={interested[post.sku] ? 'secondary' : 'grail'} icon={<Ico d={Icons.bell} size={15}/>}
              onClick={() => { toggleInterested(post.sku); flashToast(interested[post.sku] ? 'Alert removed' : 'Alert set - we will ping you when it lists'); }}>
              {interested[post.sku] ? 'Alert on' : 'Notify me'}</Button>
          </div>
        </div>
        {item && (
          <button onClick={() => push({ name: 'item', sku: item.sku })} style={{ width: 88, flexShrink: 0, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
            <ProductPhoto tone={post.tone} ratio="1/1"/>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Listing announcement card (in feed) — BRD §8.4 FE-07 ──────
function ListingFeedCard({ id }) {
  const { push } = useNav();
  const l = listingOf(id);
  const c = catOf(l.sku);
  const seller = userOf(l.seller);
  return (
    <div style={{ background: 'var(--card-surface)', borderRadius: 20, margin: '0 14px 12px', padding: '16px 18px', boxShadow: 'var(--card-shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Avatar name={seller.name} color={seller.color} size={34}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>@{seller.handle} listed an item</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{(l.ships || '').split(' · ')[0]} · {l.posted}</div>
        </div>
        <Badge variant="default">For sale</Badge>
      </div>
      <button onClick={() => push({ name: 'listing', id })} style={{
        display: 'flex', gap: 13, width: '100%', textAlign: 'left', border: '1px solid var(--slate-200)',
        background: 'var(--slate-50)', borderRadius: 16, padding: 12, cursor: 'pointer',
        boxShadow: 'var(--shadow-1)',
      }}>
        <div style={{ width: 96, flexShrink: 0 }}><ProductPhoto tone={c.tone} ratio="1/1"/></div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.25 }}>{c.title}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', margin: '3px 0 8px' }}>{l.condition}</div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
            <span style={{ fontSize: 17, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}><Money value={l.price}/></span>
            {l.retail > l.price && <Money value={l.retail} strike size={12}/>}
          </div>
        </div>
      </button>
    </div>
  );
}

// ── Marketplace grid card — BRD §9.8 ──────────────────────────
function MarketCard({ id, listing }) {
  const { push, flashToast } = useNav();
  const { saved, toggleSave, dbWishlist, toggleDbWishlist } = useAppState();
  const l = listing || listingOf(id);
  const c = l.sku ? catOf(l.sku) : { tone: l.tone || 'ink', title: l.title, cat: l.cat };
  const seller = userOf(l.seller);
  const isSaved = saved[id];
  const wishKey = l.sku || id;
  const isWished = !!(dbWishlist || {})[wishKey];
  const status = l.status;
  const sym = l.sym || '₹';
  return (
    <button onClick={() => push({ name: 'listing', id })}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.025) translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow-lifted)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}
      onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.boxShadow = 'none'; }}
      onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}
      onPointerLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}
      style={{
        background: 'var(--card-surface)', border: `1px solid ${l.mine ? 'var(--verified-teal)' : 'var(--slate-200)'}`, borderRadius: 16,
        overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, display: 'flex', flexDirection: 'column',
        transition: 'transform 80ms var(--ease-out), box-shadow 80ms',
        boxShadow: 'var(--card-shadow)',
      }}>
      <div style={{ position: 'relative' }}>
        <ProductPhoto tone={c.tone} ratio="1/1" rounded={0}/>
        <div onClick={(e) => { e.stopPropagation(); toggleDbWishlist(wishKey); flashToast(isWished ? 'Removed from wishlist' : 'Added to wishlist'); }}
          title={isWished ? 'In your wishlist' : 'Add to wishlist'} style={{
          position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 10,
          background: isWished ? 'rgba(176,119,36,0.85)' : 'rgba(15,23,42,0.46)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--paper)', cursor: 'pointer', transition: 'background 150ms',
        }}>
          <Ico d={Icons.star} size={16} fill={isWished ? 'currentColor' : 'none'}/>
        </div>
        <div onClick={(e) => { e.stopPropagation(); toggleSave(id); }}
          title={isSaved ? 'Saved' : 'Save listing'} style={{
          position: 'absolute', bottom: 8, right: 8, width: 32, height: 32, borderRadius: 10,
          background: isSaved ? 'rgba(255,36,66,0.80)' : 'rgba(15,23,42,0.46)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--paper)', cursor: 'pointer', transition: 'background 150ms',
        }}>
          <Ico d={Icons.heart} size={16} fill={isSaved ? 'var(--stamp-red)' : 'none'}/>
        </div>

        {l.mine && status === 'available' && (
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <Badge variant="teal">Just listed</Badge>
          </div>
        )}
        {!l.mine && status !== 'available' && (
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <Badge variant={status === 'sold' ? 'success' : 'warning'}>{statusLabel(status)}</Badge>
          </div>
        )}
      </div>
      <div style={{ padding: '11px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25, color: 'var(--ink)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 32 }}>{c.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', flexWrap: 'nowrap' }}>
          <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}><Money value={l.price} currency={sym}/></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-faint)' }}>
          <Avatar name={seller.name} color={seller.color} size={16}/>
          {l.mine ? (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>You · just now</span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Ico d={Icons.shield} size={12} stroke={2} style={{ color: 'var(--verified-teal)', flexShrink: 0 }}/>
              Vouched by {seller.vouchesReceived}
            </span>
          )}
        </div>

        {!l.mine && (
          <div role="button" tabIndex={0}
            onClick={(e) => { e.stopPropagation(); push({ name: 'chat', user: l.seller, listing: l.id, intent: 'buy' }); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2, height: 34,
              borderRadius: 11, background: 'var(--ink)', color: 'var(--paper)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5,
            }}>
            <Ico d={Icons.message} size={14}/>Message
          </div>
        )}
      </div>
    </button>
  );
}

// ── Event card — BRD §9.13 ────────────────────────────────────
function EventCard({ ev, onOpen }) {
  const { rsvp } = useAppState();
  const status = rsvp[ev.id];
  const count = goingCount(ev, rsvp);
  return (
    <button onClick={onOpen} style={{
      display: 'flex', gap: 12, width: '100%', textAlign: 'left', alignItems: 'stretch',
      background: 'var(--card-surface)', border: `1px solid ${status === 'going' ? 'var(--emerald)' : 'var(--slate-200)'}`,
      borderRadius: 16, padding: 14, cursor: 'pointer',
      boxShadow: 'var(--card-shadow)', opacity: ev.past ? 0.72 : 1,
    }}>
      {/* Date block */}
      <div style={{
        width: 54, flexShrink: 0, borderRadius: 10, background: 'var(--slate-800)', color: 'var(--paper)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0', gap: 1,
      }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--grail-gold)' }}>{ev.month}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, lineHeight: 1 }}>{ev.date}</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{ev.day}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
        {/* Title + mode badge in same row */}
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--ink)' }}>{ev.title}</div>

        {/* Venue */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--ink-mute)' }}>
          <Ico d={Icons.pin} size={13} stroke={2} style={{ flexShrink: 0 }}/> {ev.where}
        </div>

        {/* Time + going count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--slate-400)' }}>
            <Ico d={Icons.clock} size={13} stroke={2} style={{ flexShrink: 0 }}/>
            {ev.time}{ev.endTime ? ` – ${ev.endTime}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {status === 'going' && <Badge variant="success">Going</Badge>}
            {status === 'interested' && <Badge variant="warning">Interested</Badge>}
            <span style={{ fontSize: 12, color: 'var(--slate-400)', fontFamily: 'var(--font-mono)' }}>{count} going</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// Renders either a real uploaded image or a placeholder tone swatch
function PostImg({ src, tone, ratio, style }) {
  const url = typeof src === 'string' && src.startsWith('data:') ? src : null;
  if (url) {
    const paddingMap = { '3/2': '66.67%', '1/1': '100%', 'auto': '100%' };
    const pb = paddingMap[ratio] || '66.67%';
    return (
      <div style={{ position: 'relative', paddingBottom: pb, overflow: 'hidden', ...style }}>
        <img src={url} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}/>
      </div>
    );
  }
  return <ProductPhoto tone={tone || src || 'ink'} ratio={ratio || '3/2'} rounded={0} style={style}/>;
}

// Post image gallery — 1 full, 2 side-by-side, 3+ grid (first big)
function PostImages({ images }) {
  const n = images.length;
  if (n === 1) {
    return (
      <div style={{ borderRadius: 12, overflow: 'hidden' }}>
        <PostImg src={images[0]} ratio="3/2"/>
      </div>
    );
  }
  if (n === 2) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, borderRadius: 12, overflow: 'hidden' }}>
        {images.map((t, i) => <PostImg key={i} src={t} ratio="1/1"/>)}
      </div>
    );
  }
  const rest = images.slice(1, 4);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 4, borderRadius: 12, overflow: 'hidden' }}>
      <PostImg src={images[0]} ratio="1/1"/>
      <div style={{ display: 'grid', gridTemplateRows: `repeat(${rest.length}, 1fr)`, gap: 4 }}>
        {rest.map((t, i) => (
          <div key={i} style={{ position: 'relative', minHeight: 0 }}>
            <PostImg src={t} ratio="auto" style={{ height: '100%' }}/>
            {i === rest.length - 1 && n > 4 && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,17,15,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--paper)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>+{n - 4}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Community card — BRD §9.12 ────────────────────────────────
function CommunityCard({ com, onOpen }) {
  const { joined, toggleJoin, comRequested, requestJoin, cancelRequest, flashToast } = { ...useAppState(), ...useNav() };
  const isJoined = joined[com.id];
  const requested = !!(comRequested && comRequested[com.id]);
  const isPrivate = com.privacy === 'private' || com.invite;
  const youAdmin = adminsOf(com.id).some(a => a.handle === 'you');
  const tones = { plum: 'var(--plum)', forest: 'var(--forest)', teal: 'var(--verified-teal)', red: 'var(--stamp-red)', ink: 'var(--ink)', gold: 'var(--grail-gold)' };
  const onJoin = () => {
    if (isJoined) { toggleJoin(com.id); flashToast(`Left ${com.name}`); return; }
    if (isPrivate) {
      if (requested) { cancelRequest(com.id); flashToast('Request withdrawn'); }
      else { requestJoin(com.id); flashToast('Request sent — an admin will review it'); }
    } else { toggleJoin(com.id); flashToast(`Joined ${com.name}`); }
  };
  const label = isJoined ? 'Joined' : isPrivate ? (requested ? 'Requested' : 'Request') : 'Join';
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'var(--card-surface)', border: '1px solid var(--slate-200)', borderRadius: 16, padding: 14, boxShadow: 'var(--card-shadow)' }}>
      <button onClick={onOpen} style={{
        width: 50, height: 50, borderRadius: 12, flexShrink: 0, border: 'none', cursor: 'pointer',
        background: tones[com.tone] || 'var(--ink)', color: 'var(--paper)',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{com.tag}</button>
      <button onClick={onOpen} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{com.name}</span>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {isPrivate && <Badge variant="secondary">Private</Badge>}
            {youAdmin && <Badge variant="teal">Admin</Badge>}
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', margin: '3px 0 4px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{com.short}</div>
        <div style={{ fontSize: 11.5, color: 'var(--slate-400)', fontFamily: 'var(--font-mono)' }}>{com.members.toLocaleString('en-IN')} members</div>
      </button>
      {youAdmin
        ? <Button size="sm" variant="secondary" onClick={onOpen}>Open</Button>
        : <Button size="sm" variant={isJoined || requested ? 'secondary' : 'dark'} onClick={onJoin}>{label}</Button>}
    </div>
  );
}

// ── ISO (In Search Of) card — BRD §9.x ──────────────────────
function ISOCard({ post }) {
  const { push } = useNav();
  const { hearted, saved, toggleHeart, toggleSave } = useAppState();
  const { flashToast } = useNav();
  const liked = hearted[post.id];
  const isSaved = saved[post.id];
  const [showComments, setShowComments] = React.useState(false);

  return (
    <div style={{ background: 'var(--card-surface)', borderRadius: 20, margin: '0 14px 12px', boxShadow: 'var(--card-shadow)' }}>
      <div style={{ padding: '16px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <AuthorLine handle={post.user} time={post.time} community={post.community}
            onOpen={() => push({ name: 'profile', user: post.user })}/>
          <PostTypeTag type="iso"/>
        </div>

        {/* WANTED card */}
        <div style={{
          marginTop: 12, borderRadius: 16, overflow: 'hidden',
          background: 'rgba(232,163,61,0.07)', border: '1.5px solid rgba(232,163,61,0.32)',
          padding: '14px 16px', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%) rotate(15deg)',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 30,
            letterSpacing: '0.2em', color: 'rgba(176,119,36,0.1)',
            textTransform: 'uppercase', pointerEvents: 'none', userSelect: 'none',
          }}>WANTED</div>

          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
            letterSpacing: '-0.01em', color: 'var(--ink)', lineHeight: 1.25,
            marginBottom: 10, paddingRight: 48,
          }}>{post.isoItem}</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {post.isoBudget && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 9px', borderRadius: 6,
                background: 'rgba(176,119,36,0.15)', fontFamily: 'var(--font-mono)',
                fontSize: 12, fontWeight: 700, color: '#9A6010',
              }}>
                <Ico d={Icons.tag} size={11}/>Max ₹{Number(post.isoBudget).toLocaleString('en-IN')}
              </span>
            )}
            {post.isoCond && post.isoCond !== 'Any' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 9px', borderRadius: 6, background: 'var(--bone)', fontSize: 12, fontWeight: 600, color: 'var(--ink-mute)' }}>
                {post.isoCond}
              </span>
            )}
            {post.isoCity && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 6, background: 'var(--bone)', fontSize: 12, fontWeight: 500, color: 'var(--ink-mute)' }}>
                <Ico d={Icons.pin} size={11}/>{post.isoCity}
              </span>
            )}
          </div>
        </div>

        {post.body && (
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55, marginTop: 9 }}>{post.body}</div>
        )}
      </div>

      {post.images && post.images.length > 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <PostImages images={post.images}/>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px 16px' }}>
        <ActionBtn icon={<Ico d={Icons.heart} size={19}/>} label={(post.likes || 0) + (liked ? 1 : 0)} active={liked}
          onClick={() => toggleHeart(post.id)}/>
        <ActionBtn icon={<Ico d={Icons.comment} size={19}/>} label={post.comments || 0} active={showComments}
          onClick={() => setShowComments(v => !v)}/>
        <ActionBtn icon={<Ico d={Icons.bookmark} size={19}/>} active={isSaved} activeColor="var(--ink)"
          onClick={() => { toggleSave(post.id); flashToast(isSaved ? 'Removed from saved' : 'Saved'); }}/>
        <ActionBtn icon={<Ico d={Icons.share} size={19}/>}
          onClick={() => setOverlay({ name: 'share', label: `${userOf(post.user).name.split(' ')[0]}'s ISO` })}/>
        <div style={{ flex: 1 }}/>
        {post.user !== 'you' && (
          <Button size="sm" variant="teal" icon={<Ico d={Icons.message} size={15}/>}
            onClick={() => push({ name: 'chat', user: post.user, intent: 'iso', isoItem: post.isoItem })}>
            I have this
          </Button>
        )}
      </div>
      {showComments && <CommentThread post={post}/>}
    </div>
  );
}

Object.assign(window, { AuthorLine, PostCard, ISOCard, CommentThread, PostImages, PollBlock, AdminCard, ListingFeedCard, MarketCard, EventCard, CommunityCard });
