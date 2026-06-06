// ─────────────────────────────────────────────────────────────
// Post detail & discussion — BRD §9.7
// ─────────────────────────────────────────────────────────────

function PostDetail({ route }) {
  const { push, flashToast } = useNav();
  const { hearted, toggleHeart, saved, toggleSave } = useAppState();
  const all = [...POSTS];
  const post = all.find(p => p.id === route.id) || POSTS[0];
  const u = userOf(post.user);
  const item = post.refSku ? catOf(post.refSku) : null;
  const comments = COMMENTS[post.id] || [];
  const liked = hearted[post.id];
  const isSaved = saved[post.id];
  const [draft, setDraft] = React.useState('');
  const [extra, setExtra] = React.useState([]);

  return (
    <Screen nav={false} header={<DetailHeader title="Post"/>}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '10px 14px 30px', display: 'flex', gap: 9, alignItems: 'center' }}>
          <Avatar name="You" color="var(--ink)" size={32}/>
          <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add a comment…"
            style={{ flex: 1, height: 40, padding: '0 14px', borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', outline: 'none' }}/>
          <IconButton icon={<Ico d={Icons.send} size={18}/>} active={!!draft.trim()}
            onClick={() => { if (draft.trim()) { setExtra(x => [...x, { user: 'you', time: 'now', body: draft.trim() }]); setDraft(''); } }}/>
        </div>
      }>
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AuthorLine handle={post.user} time={post.time} community={post.community} onOpen={() => push({ name: 'profile', user: post.user })}/>
          <PostTypeTag type={post.type}/>
        </div>
        {post.type === 'review' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 0' }}>
            <Stars n={post.rating}/><span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{post.rating}/5 build quality</span>
          </div>
        )}
        <div style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--ink-soft)', margin: '12px 0' }}>{post.body}</div>
      </div>
      {post.image && item && <div style={{ padding: '0 16px' }}><ProductPhoto tone={post.tone} ratio="3/2" label={item.sku}/></div>}
      {item && (
        <div style={{ padding: '12px 16px 0' }}>
          <button onClick={() => push({ name: 'item', sku: item.sku })} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
            background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 12, padding: 10, cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}><ProductPhoto tone={post.tone} ratio="1/1" rounded={8}/></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{item.sku} · view item</div>
            </div>
          </button>
        </div>
      )}

      {/* actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '12px 16px', margin: '6px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <ActionBtn icon={<Ico d={Icons.heart} size={21}/>} label={(post.likes || 0) + (liked ? 1 : 0)} active={liked} onClick={() => toggleHeart(post.id)}/>
        <ActionBtn icon={<Ico d={Icons.comment} size={21}/>} label={comments.length + extra.length}/>
        <ActionBtn icon={<Ico d={Icons.share} size={20}/>} onClick={() => flashToast('Link copied')}/>
        <div style={{ flex: 1 }}/>
        <ActionBtn icon={<Ico d={Icons.bookmark} size={21}/>} active={isSaved} activeColor="var(--ink)" onClick={() => toggleSave(post.id)}/>
      </div>

      {/* comments */}
      <div style={{ padding: '4px 16px 24px' }}>
        <SectionLabel>{comments.length + extra.length} comments</SectionLabel>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[...comments, ...extra].map((cm, i) => {
            const cu = userOf(cm.user);
            return (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <Avatar name={cm.user === 'you' ? 'You' : cu.name} color={cm.user === 'you' ? 'var(--ink)' : cu.color} size={34}/>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{cm.user === 'you' ? 'You' : cu.name}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{cm.time}</span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 2 }}>{cm.body}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { PostDetail });
