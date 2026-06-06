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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{u.name}</span>
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
  const { push } = useNav();
  const { hearted, saved, toggleHeart, toggleSave, flashToast } = { ...useAppState(), ...useNav() };
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
    <div style={{ background: 'var(--paper)', borderBottom: '8px solid var(--bone)' }}>
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <AuthorLine handle={post.user} time={post.time} community={post.community} onOpen={openUser} showFollow={showFollow}/>
          <PostTypeTag type={post.type}/>
        </div>
        <div onClick={open} style={{ cursor: 'pointer', marginTop: 11 }}>
          {post.type === 'review' && item && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Stars n={post.rating}/>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>reviewing {item.brand}</span>
            </div>
          )}
          <div style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-soft)' }}>{post.body}</div>
        </div>
      </div>

      {post.image && item && (
        <div onClick={open} style={{ cursor: 'pointer', padding: '12px 16px 0' }}>
          <ProductPhoto tone={post.tone} ratio="3/2" label={item.sku}/>
        </div>
      )}

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
        <ActionBtn icon={<Ico d={Icons.share} size={19}/>} onClick={() => flashToast('Link copied to clipboard')}/>
        <div style={{ flex: 1 }}/>
        <ActionBtn icon={<Ico d={Icons.bookmark} size={20}/>} active={isSaved} activeColor="var(--ink)"
          onClick={() => { toggleSave(post.id); flashToast(isSaved ? 'Removed from saved' : 'Saved'); }}/>
      </div>

      {/* inline comments (expand in feed — no page navigation) */}
      {showComments && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px 14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {[...baseComments, ...extra].map((cm, i) => {
              const cu = userOf(cm.user);
              return (
                <div key={i} style={{ display: 'flex', gap: 9 }}>
                  <Avatar name={cm.user === 'you' ? 'You' : cu.name} color={cm.user === 'you' ? 'var(--ink)' : cu.color} size={30}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{cm.user === 'you' ? 'You' : cu.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{cm.time}</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.45, marginTop: 1 }}>{cm.body}</div>
                  </div>
                </div>
              );
            })}
            {commentCount === 0 && <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>No comments yet — say something.</div>}
          </div>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center', marginTop: 13 }}>
            <Avatar name="You" color="var(--ink)" size={30}/>
            <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()}
              placeholder="Add a comment…"
              style={{ flex: 1, height: 38, padding: '0 13px', borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', outline: 'none' }}/>
            <IconButton icon={<Ico d={Icons.send} size={17}/>} active={!!draft.trim()} onClick={addComment}/>
          </div>
        </div>
      )}
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
            <Button size="sm" variant="grail" icon={<Ico d={Icons.bell} size={15}/>}
              onClick={() => flashToast('Wishlist alert set — we’ll ping you when it lists')}>Notify me</Button>
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
function MarketCard({ id }) {
  const { push } = useNav();
  const { saved, toggleSave } = useAppState();
  const l = listingOf(id);
  const c = catOf(l.sku);
  const seller = userOf(l.seller);
  const isSaved = saved[id];
  const status = l.status;
  return (
    <button onClick={() => push({ name: 'listing', id })} style={{
      background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14,
      overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, display: 'flex', flexDirection: 'column',
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
        {status !== 'available' && (
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <Tag kind={status === 'sold' ? 'sold' : 'reserved'}>{status}</Tag>
          </div>
        )}
        {l.trade && status === 'available' && (
          <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
            <Stamp color="var(--ink)" rotate={-3} style={{ fontSize: 9 }}>Trade OK</Stamp>
          </div>
        )}
      </div>
      <div style={{ padding: '9px 10px 11px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25, color: 'var(--ink)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 32 }}>{c.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
          <span style={{ fontSize: 15 }}><Money value={l.price}/></span>
          <div style={{ marginLeft: 'auto' }}><VerifyBadge tier={l.verify}/></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-faint)' }}>
          <Avatar name={seller.name} color={seller.color} size={15}/>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seller.rating}★ · {seller.deals} deals</span>
        </div>
      </div>
    </button>
  );
}

// ── Event card — BRD §9.13 ────────────────────────────────────
function EventCard({ ev, onOpen }) {
  const { interested } = useAppState();
  const going = interested[ev.id];
  return (
    <button onClick={onOpen} style={{
      display: 'flex', gap: 12, width: '100%', textAlign: 'left', alignItems: 'stretch',
      background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14, padding: 12, cursor: 'pointer',
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
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
          <Tag kind={ev.mode === 'Online' ? 'vouch' : 'event'}>{ev.mode}</Tag>
          {going && <Tag kind="sold">Going</Tag>}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--ink)' }}>{ev.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--ink-mute)', marginTop: 5 }}>
          <Ico d={Icons.pin} size={14} stroke={2}/>{ev.where}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 3 }}>
          <Ico d={Icons.clock} size={14} stroke={2}/>{ev.when} · {ev.interested} interested
        </div>
      </div>
    </button>
  );
}

// ── Community card — BRD §9.12 ────────────────────────────────
function CommunityCard({ com, onOpen }) {
  const { joined, toggleJoin, flashToast } = { ...useAppState(), ...useNav() };
  const isJoined = joined[com.id];
  const tones = { plum: 'var(--plum)', forest: 'var(--forest)', teal: 'var(--verified-teal)', red: 'var(--stamp-red)', ink: 'var(--ink)' };
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14, padding: 12 }}>
      <button onClick={onOpen} style={{
        width: 50, height: 50, borderRadius: 12, flexShrink: 0, border: 'none', cursor: 'pointer',
        background: tones[com.tone] || 'var(--ink)', color: 'var(--paper)',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{com.tag}</button>
      <button onClick={onOpen} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>{com.name}</span>
          {com.invite && <Tag kind="reserved">Invite</Tag>}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', margin: '2px 0 3px', lineHeight: 1.4 }}>{com.short}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{com.members.toLocaleString('en-IN')} members</div>
      </button>
      <Button size="sm" variant={isJoined ? 'secondary' : 'dark'}
        onClick={() => { toggleJoin(com.id); flashToast(isJoined ? `Left ${com.name}` : `Joined ${com.name}`); }}>
        {isJoined ? 'Joined' : (com.invite ? 'Request' : 'Join')}
      </Button>
    </div>
  );
}

Object.assign(window, { AuthorLine, PostCard, PollBlock, AdminCard, ListingFeedCard, MarketCard, EventCard, CommunityCard });
