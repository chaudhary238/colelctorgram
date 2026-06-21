// ─────────────────────────────────────────────────────────────
// Community detail — BRD §9.12
// ─────────────────────────────────────────────────────────────

function CommunityDetail({ route }) {
  const { push, flashToast, setOverlay } = useNav();
  const { joined, toggleJoin } = useAppState();
  const com = COMMUNITIES.find(c => c.id === route.id);
  const isJoined = joined[com.id];
  const founder = userOf(com.founder);
  const [tab, setTab] = React.useState('posts');
  const [accepted, setAccepted] = React.useState(false); // guidelines gate (v1.2 §9.12)
  const postMode = postModeOf(com.id);
  const admins = adminsOf(com.id);
  const tones = { plum: 'var(--plum)', forest: 'var(--forest)', teal: 'var(--verified-teal)', red: 'var(--stamp-red)', ink: 'var(--ink)' };
  const posts = POSTS.filter(p => p.community === com.id);

  const startCompose = () => {
    if (!accepted) { setTab('about'); flashToast('Accept the community guidelines first'); return; }
    setOverlay({ name: 'compose', community: com.id });
  };

  return (
    <Screen nav={false} header={null}>
      {/* banner */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
          <DetailHeader transparent trailing={<IconButton icon={<Ico d={Icons.share} size={17}/>} onClick={() => flashToast('Invite link copied')}/>}/>
        </div>
        <div style={{ height: 132, background: tones[com.tone], position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 25% 30%, rgba(255,255,255,0.18), transparent 55%)' }}/>
          <div style={{ position: 'absolute', right: -20, bottom: -30, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 150, color: 'rgba(255,255,255,0.12)', lineHeight: 1 }}>{com.tag}</div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: -34 }}>
          <div style={{ width: 76, height: 76, borderRadius: 18, background: tones[com.tone], color: 'var(--paper)', border: '3px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, flexShrink: 0 }}>{com.tag}</div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <Button size="sm" variant={isJoined ? 'secondary' : 'dark'} style={{ float: 'right' }}
              onClick={() => { toggleJoin(com.id); flashToast(isJoined ? `Left ${com.name}` : `Joined ${com.name}`); }}>
              {isJoined ? 'Joined' : (com.invite ? 'Request invite' : 'Join')}
            </Button>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23, letterSpacing: '-0.025em', margin: '12px 0 4px' }}>{com.name}</h1>
        <div style={{ fontSize: 14, color: 'var(--ink-mute)', lineHeight: 1.5 }}>{com.short}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12.5, color: 'var(--ink-faint)' }}>
          <span><b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{com.members.toLocaleString('en-IN')}</b> members</span>
          <span><b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{com.posts.toLocaleString('en-IN')}</b> posts</span>
          <span>by @{founder.handle}</span>
        </div>
        {/* posting mode badge — BRD v1.2 §9.12 */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '5px 10px', borderRadius: 999, background: postMode === 'approval' ? 'var(--grail-gold-soft)' : 'var(--forest-soft)', border: `1px solid ${postMode === 'approval' ? 'var(--grail-gold)' : 'var(--forest)'}` }}>
          <Ico d={postMode === 'approval' ? Icons.shield : Icons.check} size={13} style={{ color: postMode === 'approval' ? 'var(--grail-gold-deep)' : 'var(--forest)' }}/>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: postMode === 'approval' ? 'var(--grail-gold-deep)' : 'var(--forest)' }}>{postMode === 'approval' ? 'Posts reviewed by admins' : 'Open posting'}</span>
        </div>
      </div>

      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: 'var(--paper)', padding: '16px 16px 10px', marginTop: 14, borderBottom: '1px solid var(--border)' }}>
        <Segmented value={tab} onChange={setTab} options={[{ id: 'posts', label: 'Posts' }, { id: 'about', label: 'Rules & info' }]}/>
      </div>

      {tab === 'posts' ? (
        <div>
          {isJoined && (accepted ? (
            <button onClick={startCompose} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: 'calc(100% - 32px)', margin: '14px 16px 4px',
              background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 14px', cursor: 'pointer', textAlign: 'left' }}>
              <Avatar name="You" color="var(--ink)" size={30}/>
              <span style={{ fontSize: 14, color: 'var(--ink-faint)' }}>
                {postMode === 'approval' ? `Suggest a post to ${com.name}…` : `Share something with ${com.name}…`}
              </span>
            </button>
          ) : (
            /* guidelines-accept gate (v1.2 §9.12) */
            <div style={{ margin: '14px 16px 4px', background: 'var(--bone)', border: '1px solid var(--border)', borderRadius: 13, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Ico d={Icons.shield} size={17} style={{ color: 'var(--ink-mute)' }}/>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Read the guidelines before posting</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', lineHeight: 1.5, margin: '7px 0 12px' }}>{com.name} asks every member to accept its house rules before their first post.</div>
              <div style={{ display: 'flex', gap: 9 }}>
                <Button size="sm" variant="secondary" onClick={() => setTab('about')}>View rules</Button>
                <Button size="sm" variant="dark" onClick={() => { setAccepted(true); flashToast('Guidelines accepted — you can post now'); }}>Accept &amp; continue</Button>
              </div>
            </div>
          ))}
          <div style={{ margin: '8px 0 0' }}>
            {posts.map(p => <PostCard key={p.id} post={p}/>)}
            {posts.length === 0 && <EmptyNote>Quiet so far — be the first to post.</EmptyNote>}
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          <SectionLabel>Community rules</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {com.rules.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--bone)', color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, paddingTop: 1 }}>{r}</div>
              </div>
            ))}
          </div>

          {isJoined && !accepted && (
            <Button size="block" variant="primary" style={{ marginTop: 16 }} onClick={() => { setAccepted(true); setTab('posts'); flashToast('Guidelines accepted — you can post now'); }}>
              Accept guidelines
            </Button>
          )}
          {accepted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, color: 'var(--forest)', fontSize: 13, fontWeight: 600 }}>
              <Ico d={Icons.check} size={16} stroke={2.4}/>You’ve accepted these guidelines.
            </div>
          )}

          {/* visible admins / mods — BRD v1.2 §9.12 */}
          <div style={{ marginTop: 24 }}><SectionLabel>Admins &amp; mods</SectionLabel></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
            {admins.map(a => {
              const au = userOf(a.handle);
              return (
                <button key={a.handle} onClick={() => push({ name: 'profile', user: a.handle })} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: 12, cursor: 'pointer',
                  background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13 }}>
                  <Avatar name={au.name} color={au.color} size={42} verified={au.tier !== 'Verified'}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontWeight: 600, fontSize: 14 }}>{au.name}</span><TierChip tier={au.tier}/></div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>@{au.handle}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 9px', borderRadius: 7, background: a.role === 'Founder' ? 'var(--ink)' : 'var(--bone-deep)', color: a.role === 'Founder' ? 'var(--paper)' : 'var(--ink-mute)', fontWeight: 700 }}>{a.role}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ height: 24 }}/>
    </Screen>
  );
}

Object.assign(window, { CommunityDetail });
