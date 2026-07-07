// ─────────────────────────────────────────────────────────────
// Post detail & discussion — BRD §9.7
// ─────────────────────────────────────────────────────────────

function PostDetail({ route }) {
  const { push, flashToast, setOverlay } = useNav();
  const { hearted, toggleHeart, saved, toggleSave } = useAppState();
  const all = [...POSTS];
  const post = all.find(p => p.id === route.id) || POSTS[0];
  const u = userOf(post.user);
  const item = post.refSku ? catOf(post.refSku) : null;
  const comments = COMMENTS[post.id] || [];
  const liked = hearted[post.id];
  const isSaved = saved[post.id];

  return (
    <Screen nav={false} header={<DetailHeader title="Post"/>}>
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
        <ActionBtn icon={<Ico d={Icons.comment} size={21}/>} label={comments.length}/>
        <ActionBtn icon={<Ico d={Icons.share} size={20}/>} onClick={() => setOverlay({ name: 'share', label: `${userOf(post.user).name.split(' ')[0]}’s post` })}/>
        <div style={{ flex: 1 }}/>
        <ActionBtn icon={<Ico d={Icons.bookmark} size={21}/>} active={isSaved} activeColor="var(--ink)" onClick={() => toggleSave(post.id)}/>
      </div>

      {/* comments — Instagram-style threads + likes */}
      <CommentThread post={post}/>
    </Screen>
  );
}

Object.assign(window, { PostDetail });
