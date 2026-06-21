// ─────────────────────────────────────────────────────────────
// Community detail — Facebook-Groups-style (BRD §9.12)
// Public vs private · join / request-to-join · Posts / Members / About
// tabs · private locked preview · admin "Manage community" entry.
// ─────────────────────────────────────────────────────────────

function CommunityDetail({ route }) {
  const { push, flashToast, setOverlay } = useNav();
  const { joined, toggleJoin, comRequested, requestJoin, cancelRequest, userCommunities } = useAppState();
  const com = COMMUNITIES.find(c => c.id === route.id) || (userCommunities || []).find(c => c.id === route.id);
  if (!com) return <Screen nav={false} header={<DetailHeader title="Community"/>}><EmptyNote>This community isn’t available.</EmptyNote></Screen>;

  const isMember = !!joined[com.id];
  const requested = !!comRequested[com.id];
  const isPrivate = com.privacy === 'private' || com.invite;
  const founder = userOf(com.founder);
  const [tab, setTab] = React.useState('posts');
  const [accepted, setAccepted] = React.useState(false);
  const postMode = postModeOf(com.id);

  let admins = adminsOf(com.id);
  if (!admins.length && com.founder) admins = [{ handle: com.founder, role: 'Founder' }];
  const isAdmin = admins.some(a => a.handle === 'you');
  const members = membersOf(com.id);
  const reqCount = joinRequestsOf(com.id).length;
  const pendCount = pendingPostsOf(com.id).length;

  const tones = { plum: 'var(--plum)', forest: 'var(--forest)', teal: 'var(--verified-teal)', red: 'var(--stamp-red)', ink: 'var(--ink)', gold: 'var(--grail-gold)' };
  const posts = POSTS.filter(p => p.community === com.id);

  // private + not member + not admin → locked preview
  const locked = isPrivate && !isMember && !isAdmin;

  const startCompose = () => {
    if (!accepted) { setTab('about'); flashToast('Accept the community guidelines first'); return; }
    setOverlay({ name: 'compose', community: com.id });
  };

  const onJoinClick = () => {
    if (isMember) { toggleJoin(com.id); flashToast(`Left ${com.name}`); return; }
    if (isPrivate) {
      if (requested) { cancelRequest(com.id); flashToast('Request withdrawn'); }
      else { requestJoin(com.id); flashToast('Request sent — an admin will review it'); }
    } else {
      toggleJoin(com.id); flashToast(`Joined ${com.name}`);
    }
  };
  const joinLabel = isMember ? 'Joined' : isPrivate ? (requested ? 'Requested' : 'Request to join') : 'Join';

  const tabs = locked
    ? [{ id: 'posts', label: 'About' }]
    : [{ id: 'posts', label: 'Posts' }, { id: 'members', label: `Members` }, { id: 'about', label: 'About' }];
  const activeTab = locked ? 'about' : tab;

  return (
    <Screen nav={false} header={null}>
      {/* banner */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
          <DetailHeader transparent trailing={<IconButton icon={<Ico d={Icons.share} size={17}/>} onClick={() => setOverlay({ name: 'share', label: com.name })}/>}/>
        </div>
        <div style={{ height: 132, background: tones[com.tone] || 'var(--plum)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 25% 30%, rgba(255,255,255,0.18), transparent 55%)' }}/>
          <div style={{ position: 'absolute', right: -20, bottom: -30, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 150, color: 'rgba(255,255,255,0.12)', lineHeight: 1 }}>{com.tag}</div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: -34 }}>
          <div style={{ width: 76, height: 76, borderRadius: 18, background: tones[com.tone] || 'var(--plum)', color: 'var(--paper)', border: '3px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, flexShrink: 0 }}>{com.tag}</div>
          <div style={{ flex: 1, paddingBottom: 4, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {isAdmin && (
              <Button size="sm" variant="secondary" icon={<Ico d={Icons.settings} size={15}/>} onClick={() => push({ name: 'community-manage', id: com.id })}>
                Manage{(reqCount + pendCount) > 0 ? ` · ${reqCount + pendCount}` : ''}
              </Button>
            )}
            {!isAdmin && (
              <Button size="sm" variant={isMember ? 'secondary' : (requested ? 'secondary' : 'dark')} onClick={onJoinClick}>
                {joinLabel}
              </Button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 4px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23, letterSpacing: '-0.025em', margin: 0 }}>{com.name}</h1>
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-mute)', lineHeight: 1.5 }}>{com.short}</div>

        {/* meta row */}
        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12.5, color: 'var(--ink-faint)', flexWrap: 'wrap' }}>
          <span><b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{com.members.toLocaleString('en-IN')}</b> members</span>
          <span><b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{com.posts.toLocaleString('en-IN')}</b> posts</span>
          <span>by @{founder.handle}</span>
        </div>

        {/* privacy + posting badges */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'var(--bone)', border: '1px solid var(--border-strong)' }}>
            <Ico d={isPrivate ? Icons.shield : Icons.globe} size={13} style={{ color: 'var(--ink-mute)' }}/>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)' }}>{isPrivate ? 'Private' : 'Public'}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: postMode === 'approval' ? 'var(--grail-gold-soft)' : 'var(--forest-soft)', border: `1px solid ${postMode === 'approval' ? 'var(--grail-gold)' : 'var(--forest)'}` }}>
            <Ico d={postMode === 'approval' ? Icons.shield : Icons.check} size={13} style={{ color: postMode === 'approval' ? 'var(--grail-gold-deep)' : 'var(--forest)' }}/>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: postMode === 'approval' ? 'var(--grail-gold-deep)' : 'var(--forest)' }}>{postMode === 'approval' ? 'Posts reviewed' : 'Open posting'}</span>
          </span>
          {isAdmin && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'var(--ink)', border: '1px solid var(--ink)' }}>
              <Ico d={Icons.shield} size={13} style={{ color: 'var(--paper)' }}/>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--paper)' }}>You’re an admin</span>
            </span>
          )}
        </div>
      </div>

      {/* tabs */}
      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: 'var(--paper)', padding: '16px 16px 10px', marginTop: 14, borderBottom: '1px solid var(--border)' }}>
        <Segmented value={activeTab} onChange={setTab} options={tabs}/>
      </div>

      {/* LOCKED private preview */}
      {locked ? (
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '8px 0 20px' }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: 'var(--bone)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)', marginBottom: 12 }}>
              <Ico d={Icons.shield} size={24}/>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>This community is private</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', marginTop: 6, maxWidth: 280, lineHeight: 1.55 }}>
              Posts and members are visible once an admin approves your request to join.
            </div>
            <div style={{ marginTop: 16 }}>
              <Button variant={requested ? 'secondary' : 'dark'} icon={<Ico d={requested ? Icons.clock : Icons.userPlus} size={17}/>} onClick={onJoinClick}>
                {requested ? 'Request pending — tap to withdraw' : 'Request to join'}
              </Button>
            </div>
          </div>
          <RulesAndAdmins com={com} admins={admins} push={push}/>
        </div>
      ) : activeTab === 'posts' ? (
        <div>
          {isMember && (accepted ? (
            <button onClick={startCompose} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: 'calc(100% - 32px)', margin: '14px 16px 4px',
              background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 14px', cursor: 'pointer', textAlign: 'left' }}>
              <Avatar name="You" color="var(--ink)" size={30}/>
              <span style={{ fontSize: 14, color: 'var(--ink-faint)' }}>
                {postMode === 'approval' ? `Suggest a post to ${com.name}…` : `Share something with ${com.name}…`}
              </span>
            </button>
          ) : (
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
          {!isMember && (
            <div style={{ margin: '14px 16px 4px', textAlign: 'center', fontSize: 13, color: 'var(--ink-faint)', padding: '8px 0' }}>
              {isPrivate ? 'Request to join to post here.' : 'Join to post and join the conversation.'}
            </div>
          )}
          <div style={{ margin: '8px 0 0' }}>
            {posts.map(p => <PostCard key={p.id} post={p}/>)}
            {posts.length === 0 && <EmptyNote>Quiet so far — be the first to post.</EmptyNote>}
          </div>
        </div>
      ) : activeTab === 'members' ? (
        <div style={{ padding: '14px 16px' }}>
          <SectionLabel>{members.length} members</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {members.map(h => {
              const mu = h === 'you' ? { ...ME, name: 'You', handle: 'you' } : userOf(h);
              const role = roleOf(com.id, h);
              return (
                <button key={h} onClick={() => push({ name: 'profile', user: h })} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: 10, cursor: 'pointer',
                  background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13 }}>
                  <Avatar name={mu.name} color={mu.color} size={40} verified={role && mu.tier !== 'Verified'}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{mu.name}</span>
                      {h !== 'you' && <TierChip tier={mu.tier}/>}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>@{mu.handle}</div>
                  </div>
                  {role && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 9px', borderRadius: 7, background: role === 'Founder' ? 'var(--ink)' : 'var(--bone-deep)', color: role === 'Founder' ? 'var(--paper)' : 'var(--ink-mute)', fontWeight: 700 }}>{role}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          <RulesAndAdmins com={com} admins={admins} push={push}/>
          {isMember && !accepted && (
            <Button size="block" variant="primary" style={{ marginTop: 16 }} onClick={() => { setAccepted(true); setTab('posts'); flashToast('Guidelines accepted — you can post now'); }}>
              Accept guidelines
            </Button>
          )}
          {accepted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, color: 'var(--forest)', fontSize: 13, fontWeight: 600 }}>
              <Ico d={Icons.check} size={16} stroke={2.4}/>You’ve accepted these guidelines.
            </div>
          )}
        </div>
      )}
      <div style={{ height: 24 }}/>
    </Screen>
  );
}

// Rules list + admins list (shared by About tab and the private lock)
function RulesAndAdmins({ com, admins, push }) {
  return (
    <>
      <SectionLabel>Community rules</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {com.rules.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--bone)', color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, paddingTop: 1 }}>{r}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24 }}><SectionLabel>Admins &amp; mods</SectionLabel></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
        {admins.map(a => {
          const au = a.handle === 'you' ? { ...ME, name: 'You', handle: 'you' } : userOf(a.handle);
          return (
            <button key={a.handle} onClick={() => push({ name: 'profile', user: a.handle })} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: 12, cursor: 'pointer',
              background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13 }}>
              <Avatar name={au.name} color={au.color} size={42} verified={au.tier !== 'Verified'}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontWeight: 600, fontSize: 14 }}>{au.name}</span>{a.handle !== 'you' && <TierChip tier={au.tier}/>}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>@{au.handle}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 9px', borderRadius: 7, background: a.role === 'Founder' ? 'var(--ink)' : 'var(--bone-deep)', color: a.role === 'Founder' ? 'var(--paper)' : 'var(--ink-mute)', fontWeight: 700 }}>{a.role}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

Object.assign(window, { CommunityDetail, RulesAndAdmins });
