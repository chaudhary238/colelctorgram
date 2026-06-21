// ─────────────────────────────────────────────────────────────
// CollectorHub — card components (feed, marketplace, lists)
// ─────────────────────────────────────────────────────────────

// Small author line: avatar + name + handle + trust tier + time (+ in-feed follow)
function AuthorLine({ handle, time, community, onOpen, showFollow }) {
  const u = userOf(handle);
  const c = community ? COMMUNITIES.find(x => x.id === community) : null;
  const { followed, toggleFollow } = useAppState();
  const { flashToast } = useNav();
  const isMe = handle === 'you';
  const following = followed[handle];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={onOpen} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <Avatar name={u.name} color={u.color} size={38} verified={u.tier === 'Top Seller' || u.tier === 'Trusted'}/>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflow: 'hidden' }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1, minWidth: 0 }}>{u.name}</span>
          <TierChip tier={u.tier}/>
          {showFollow && !isMe && (
            <button onClick={(e) => { e.stopPropagation(); toggleFollow(handle); flashToast(following ? `Unfollowed @${u.handle}` : `Following @${u.handle}`); }}
              style={{
                marginLeft: 2, padding: '3px 9px', borderRadius: 999, cursor: 'pointer', lineHeight: 1,
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap',
                background: following ? 'transparent' : 'var(--stamp-red-soft)',
                color: following ? 'var(--ink-faint)' : 'var(--stamp-red)',
                border: `1px solid ${following ? 'var(--border-strong)' : 'var(--stamp-red)'}`,
              }}>{following ? 'Following' : '+ Follow'}</button>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

  return (
    <div style={{ background: 'var(--paper)', borderBottom: '4px solid var(--bone)' }}>
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <AuthorLine handle={post.user} time={post.time} community={post.community} onOpen={openUser} showFollow={showFollow}/>
          <PostTypeTag type={post.type}/>
        </div>
        <div onClick={open} style={{ cursor: 'pointer', marginTop: 11 }}>
          {post.type === 'review' && post.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Stars n={post.rating}/>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{item ? `reviewing ${item.brand}` : `${post.rating} / 5`}</span>
            </div>
          )}
          {post.title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em', lineHeight: 1.25, marginBottom: 5 }}>{post.title}</div>}
          {post.body && <div style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-soft)' }}>{post.body}</div>}
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
        <div onClick={open} style={{ cursor: 'pointer', padding: '12px 16px 0' }}>
          <PostImages images={post.images}/>
        </div>
      ) : post.image && item ? (
        <div onClick={open} style={{ cursor: 'pointer', padding: '12px 16px 0' }}>
          <ProductPhoto tone={post.tone} ratio="3/2"/>
        </div>
      ) : null}

      {/* poll — BRD v1.2 §9.6 */}
      {post.type === 'poll' && post.poll && <PollBlock post={post}/>}

      {/* referenced item chip */}
      {item && (
        <div style={{ padding: '12px 16px 0' }}>
          <button onClick={() => push({ name: 'item', sku: item.sku })} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
            background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 12,
            padding: 10, cursor: 'pointer',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
              <ProductPhoto tone={post.tone} ratio="1/1" rounded={8}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{item.sku} · {item.brand}</div>
            </div>
            <Ico d={Icons.back} size={16} stroke={2} style={{ transform: 'rotate(180deg)', color: 'var(--ink-faint)' }}/>
          </button>
        </div>
      )}

      {/* quick actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '10px 16px 14px' }}>
        <ActionBtn icon={<Ico d={Icons.heart} size={20}/>} label={(post.likes || 0) + (liked ? 1 : 0)} active={liked}
          onClick={() => { toggleHeart(post.id); }}/>
        <ActionBtn icon={<Ico d={Icons.comment} size={20}/>} label={commentCount} active={showComments}
          onClick={() => setShowComments(v => !v)}/>
        <ActionBtn icon={<Ico d={Icons.share} size={19}/>} onClick={() => setOverlay({ name: 'share', label: `${userOf(post.user).name.split(' ')[0]}’s post` })}/>
        <div style={{ flex: 1 }}/>
        <ActionBtn icon={<Ico d={Icons.bookmark} size={20}/>} active={isSaved} activeColor="var(--ink)"
          onClick={() => { toggleSave(post.id); flashToast(isSaved ? 'Removed from saved' : 'Saved'); }}/>
      </div>

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
          borderRadius: 13, overflow: 'hidden',
          boxShadow: '0 6px 24px rgba(0,0,0,0.13)',
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

  const Row = ({ c, reply, onLike, onReply, pushFn }) => {
    const cu = c.user === 'you' ? { name: 'You', color: 'var(--ink)' } : userOf(c.user);
    return (
      <div style={{ display: 'flex', gap: 9 }}>
        <Avatar name={cu.name} color={cu.color} size={reply ? 26 : 30}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, padding: '8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cu.name}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)', flexShrink: 0 }}>{c.time}</span>
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.45, marginTop: 2 }}>{renderCommentBody(c.body, pushFn)}</div>
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
    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px 14px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            border: `1px solid ${picked ? 'var(--ink)' : 'var(--border-strong)'}`, borderRadius: 11,
            background: 'var(--paper-soft)', padding: '11px 13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
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
    <div style={{ background: 'var(--paper)', borderBottom: '8px solid var(--bone)', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <SealMark size={30}/>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>CollectorHub</span>
            <Tag kind="misb" style={{ background: 'var(--ink)' }}>Official</Tag>
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
    <div style={{ background: 'var(--paper)', borderBottom: '8px solid var(--bone)', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Avatar name={seller.name} color={seller.color} size={34}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>@{seller.handle} listed an item</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{l.ships.split(' · ')[0]} · {l.posted}</div>
        </div>
        <Tag kind="sale">For sale</Tag>
      </div>
      <button onClick={() => push({ name: 'listing', id })} style={{
        display: 'flex', gap: 12, width: '100%', textAlign: 'left', border: '1px solid var(--border)',
        background: 'var(--paper-soft)', borderRadius: 14, padding: 10, cursor: 'pointer',
      }}>
        <div style={{ width: 96, flexShrink: 0 }}><ProductPhoto tone={c.tone} ratio="1/1"/></div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.25 }}>{c.title}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', margin: '3px 0 8px' }}>{l.condition}</div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 17 }}><Money value={l.price}/></span>
            {l.retail > l.price && <Money value={l.retail} strike size={12}/>}
            <div style={{ marginLeft: 'auto' }}><VerifyBadge tier={l.verify}/></div>
          </div>
        </div>
      </button>
    </div>
  );
}

// ── Marketplace grid card — BRD §9.8 ──────────────────────────
function MarketCard({ id, listing }) {
  const { push, flashToast } = useNav();
  const { saved, toggleSave, wishlistedSkus, toggleWishlistSku } = useAppState();
  const l = listing || listingOf(id);
  const c = l.sku ? catOf(l.sku) : { tone: l.tone || 'ink', title: l.title, cat: l.cat };
  const seller = userOf(l.seller);
  const isSaved = saved[id];
  const isWishlisted = !!(wishlistedSkus || {})[l.sku || id];
  const status = l.status;
  const sym = l.sym || '₹';
  return (
    <button onClick={() => push({ name: 'listing', id })}
      onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.boxShadow = 'none'; }}
      onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      onPointerLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      style={{
        background: 'var(--paper-soft)', border: `1px solid ${l.mine ? 'var(--verified-teal)' : 'var(--border)'}`, borderRadius: 14,
        overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, display: 'flex', flexDirection: 'column',
        transition: 'transform 80ms var(--ease-out), box-shadow 80ms',
        boxShadow: 'var(--shadow-1)',
      }}>
      <div style={{ position: 'relative' }}>
        <ProductPhoto tone={c.tone} ratio="1/1" rounded={0}/>
        <div onClick={(e) => { e.stopPropagation(); toggleSave(id); }} style={{
          position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(244,239,230,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isSaved ? 'var(--stamp-red)' : 'var(--ink-mute)',
        }}>
          <Ico d={Icons.heart} size={16} fill={isSaved ? 'var(--stamp-red)' : 'none'}/>
        </div>
        {/* Wishlist bookmark — bottom right */}
        {!l.mine && (
          <div onClick={(e) => { e.stopPropagation(); toggleWishlistSku(l.sku || id); flashToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist'); }} style={{
            position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 7,
            background: isWishlisted ? 'var(--stamp-red)' : 'rgba(20,17,15,0.52)',
            color: 'var(--paper)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Ico d={Icons.bookmark} size={14} stroke={isWishlisted ? 0 : 1.75} fill={isWishlisted ? 'currentColor' : 'none'}/>
          </div>
        )}
        {l.mine && status === 'available' && (
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <Tag kind="vouch">Just listed</Tag>
          </div>
        )}
        {!l.mine && status !== 'available' && (
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <Tag kind={status === 'sold' ? 'sold' : 'reserved'}>{statusLabel(status)}</Tag>
          </div>
        )}
        {l.trade && status === 'available' && (
          <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
            <Stamp color="var(--ink)" rotate={-3} style={{ fontSize: 9 }}>Trade OK</Stamp>
          </div>
        )}
      </div>
      <div style={{ padding: '9px 10px 11px', display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25, color: 'var(--ink)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 32 }}>{c.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
          <span style={{ fontSize: 15 }}><Money value={l.price} currency={sym}/></span>
          <div style={{ marginLeft: 'auto' }}><VerifyBadge tier={l.verify}/></div>
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
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2, height: 32,
              borderRadius: 9, background: 'var(--ink)', color: 'var(--paper)', cursor: 'pointer',
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
      background: 'var(--paper-soft)', border: `1px solid ${status === 'going' ? 'var(--forest)' : 'var(--border)'}`, borderRadius: 14, padding: 12, cursor: 'pointer',
      opacity: ev.past ? 0.72 : 1,
    }}>
      <div style={{
        width: 58, flexShrink: 0, borderRadius: 10, background: 'var(--ink)', color: 'var(--paper)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0',
      }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--grail-gold)' }}>{ev.month}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, lineHeight: 1 }}>{ev.date}</span>
        <span style={{ fontSize: 10, color: 'var(--ink-ghost)', marginTop: 2 }}>{ev.day}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
          <Tag kind={ev.mode === 'Online' ? 'vouch' : 'event'}>{ev.mode}</Tag>
          {status === 'going' && <Tag kind="sold">Going</Tag>}
          {status === 'interested' && <Tag kind="po">Interested</Tag>}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--ink)' }}>{ev.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--ink-mute)', marginTop: 5 }}>
          <Ico d={Icons.pin} size={14} stroke={2}/>{ev.where}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 3 }}>
          <Ico d={Icons.clock} size={14} stroke={2}/>{ev.when} · {count} going
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
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14, padding: 12 }}>
      <button onClick={onOpen} style={{
        width: 50, height: 50, borderRadius: 12, flexShrink: 0, border: 'none', cursor: 'pointer',
        background: tones[com.tone] || 'var(--ink)', color: 'var(--paper)',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{com.tag}</button>
      <button onClick={onOpen} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>{com.name}</span>
          {isPrivate && <Tag kind="reserved">Private</Tag>}
          {youAdmin && <Tag kind="vouch">Admin</Tag>}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', margin: '2px 0 3px', lineHeight: 1.4 }}>{com.short}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{com.members.toLocaleString('en-IN')} members</div>
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
    <div style={{ background: 'var(--paper)', borderBottom: '4px solid var(--bone)', borderLeft: '4px solid #E8A33D' }}>
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <AuthorLine handle={post.user} time={post.time} community={post.community}
            onOpen={() => push({ name: 'profile', user: post.user })}/>
          <PostTypeTag type="iso"/>
        </div>

        {/* WANTED card */}
        <div style={{
          marginTop: 12, borderRadius: 14, overflow: 'hidden',
          background: 'rgba(232,163,61,0.07)', border: '1.5px solid rgba(232,163,61,0.32)',
          padding: '13px 14px', position: 'relative',
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 14px' }}>
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
