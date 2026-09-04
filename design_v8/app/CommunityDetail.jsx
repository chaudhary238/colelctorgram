// ─────────────────────────────────────────────────────────────
// Community detail — Facebook-Groups-style (BRD §9.12)
// Public vs private · join / request-to-join · Posts / Members / Rules
// tabs · private locked preview · pending-review lock · admin entry.
// ─────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  if (!role) return null;
  const tone = role === 'Founder' || role === 'Admin' ? { bg: 'var(--stamp-red)', fg: 'var(--paper)' }
    : { bg: 'var(--bone-deep)', fg: 'var(--ink-mute)' };
  const label = role === 'Founder' ? 'Admin' : role;
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 6, background: tone.bg, color: tone.fg, fontWeight: 700, flexShrink: 0 }}>{label}</span>;
}

function CommunityDetail({ route }) {
  const { push, flashToast, setOverlay } = useNav();
  const {
    joined, toggleJoin, comRequested, requestJoin, cancelRequest, userCommunities, guidelinesAccepted, acceptGuidelines,
    communityRoleOverrides, communityRemoved, removedCommunityPosts, removeCommunityPost, posts: userPosts,
    approveCommunityDemo, declineUserPost, dismissPendingPost,
  } = useAppState();
  const com = COMMUNITIES.find(c => c.id === route.id) || (userCommunities || []).find(c => c.id === route.id);
  if (!com) return <Screen nav={false} header={<DetailHeader title="Community"/>}><EmptyNote>This community isn’t available.</EmptyNote></Screen>;

  const isMember = !!joined[com.id];
  const requested = !!comRequested[com.id];
  const isPrivate = com.privacy === 'private' || com.invite;
  const founder = userOf(com.founder);
  const [tab, setTab] = React.useState('posts');
  const accepted = !!guidelinesAccepted[com.id];
  const postMode = postModeOf(com.id);

  let admins = adminsOf(com.id);
  if (!admins.length && com.founder) admins = [{ handle: com.founder, role: 'Founder' }];
  const myRole = roleOfWithOverride(com.id, 'you', communityRoleOverrides);
  const isAdmin = roleCanManage(myRole);           // any manage access (Founder/Admin/Mod)
  const isFullAdmin = roleCanFullAdmin(myRole);    // Founder/Admin — settings, remove member/post
  const [leaveConfirm, setLeaveConfirm] = React.useState(false);
  const members = membersOf(com.id).filter(h => !(communityRemoved[com.id] && communityRemoved[com.id][h]));
  const reqCount = joinRequestsOf(com.id).length;
  const pendCount = pendingPostsOf(com.id).length;

  const tones = { plum: 'var(--plum)', forest: 'var(--forest)', teal: 'var(--verified-teal)', red: 'var(--stamp-red)', ink: 'var(--ink)', gold: 'var(--grail-gold)' };
  const posts = POSTS.filter(p => p.community === com.id && !removedCommunityPosts[p.id]);
  const myPending = (userPosts || []).filter(p => p.community === com.id && (p.status === 'pending' || p.status === 'declined'));

  // pending platform review — no activity until approved (founder can still reach Manage to edit/close)
  const pendingReview = !communityApproved(com);
  // private + not member + not admin → locked preview
  const locked = isPrivate && !isMember && !isAdmin;

  const startCompose = () => {
    if (!accepted) { setTab('rules'); flashToast('Accept the community guidelines first'); return; }
    setOverlay({ name: 'compose', community: com.id, kind: 'post' });
  };

  const onJoinClick = () => {
    if (isPrivate) {
      if (requested) { cancelRequest(com.id); flashToast('Request withdrawn'); }
      else { requestJoin(com.id); flashToast('Request sent — an admin will review it'); }
    } else { toggleJoin(com.id); flashToast(`Joined ${com.name}`); }
  };
  const leaveCommunity = () => { toggleJoin(com.id); flashToast(`Left ${com.name}`); setLeaveConfirm(false); };

  const realTabs = locked || pendingReview
    ? [{ id: 'posts', label: 'Rules' }]
    : [
        { id: 'posts', label: 'Posts' },
        { id: 'members', label: 'Members' },
        ...(myPending.length > 0 ? [{ id: 'pending', label: `Pending ${myPending.length}` }] : []),
        { id: 'rules', label: 'Rules' },
      ];
  const activeTab = (locked || pendingReview) ? 'rules' : tab;

  const bannerStyle = com.bannerUrl
    ? { backgroundImage: `url(${com.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: tones[com.tone] || 'var(--plum)' };

  return (
    <Screen header={null} footer={!locked && !pendingReview && activeTab === 'posts' && isMember && accepted ? (
      <div style={{ background: 'var(--paper)', borderTop: '1px solid var(--slate-200)', padding: '10px 16px calc(10px + env(safe-area-inset-bottom))' }}>
        <button onClick={startCompose} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', height: 48, padding: '0 8px 0 16px',
          borderRadius: 14, border: '1.5px solid var(--ink)', background: 'var(--paper)', cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', textAlign: 'left' }}>
          Write something or create a post…
          <div style={{ marginLeft: 'auto', width: 34, height: 34, borderRadius: 10, background: 'var(--ink)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ico d={Icons.plus} size={18} stroke={2.2}/>
          </div>
        </button>
      </div>
    ) : null}>
      {/* banner */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
          <DetailHeader transparent trailing={<IconButton icon={<Ico d={Icons.share} size={17}/>} onClick={() => setOverlay({ name: 'share', label: com.name })}/>}/>
        </div>
        <div style={{ height: 132, position: 'relative', overflow: 'hidden', ...bannerStyle }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 25% 30%, rgba(255,255,255,0.18), transparent 55%)' }}/>
          {!com.bannerUrl && <div style={{ position: 'absolute', right: -20, bottom: -30, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 150, color: 'rgba(255,255,255,0.12)', lineHeight: 1 }}>{com.tag}</div>}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: -34 }}>
          <div style={{ width: 76, height: 76, borderRadius: 18, background: com.photoUrl ? `center/cover url(${com.photoUrl})` : (tones[com.tone] || 'var(--plum)'), color: 'var(--paper)', border: '3px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, flexShrink: 0 }}>{!com.photoUrl && com.tag}</div>
          <div style={{ flex: 1, paddingBottom: 4, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {isAdmin && (
              <Button size="sm" variant="secondary" icon={<Ico d={Icons.settings} size={15}/>} onClick={() => push({ name: 'community-manage', id: com.id })}>
                Manage community{(reqCount + pendCount) > 0 ? ` · ${reqCount + pendCount}` : ''}
              </Button>
            )}
            {!isAdmin && !pendingReview && !isMember && (
              <Button size="sm" variant={requested ? 'secondary' : 'dark'} onClick={onJoinClick}>
                {requested ? 'Requested' : (isPrivate ? 'Request to join' : 'Join')}
              </Button>
            )}
            {!isAdmin && isMember && (
              <Button size="sm" variant="secondary" icon={<Ico d={Icons.close} size={15}/>} onClick={() => setLeaveConfirm(true)}>Leave</Button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 4px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23, letterSpacing: '-0.025em', margin: 0 }}>{com.name}</h1>
          {myRole && <RoleBadge role={myRole}/>}
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
          {!pendingReview && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: postMode === 'approval' ? 'var(--grail-gold-soft)' : 'var(--forest-soft)', border: `1px solid ${postMode === 'approval' ? 'var(--grail-gold)' : 'var(--forest)'}` }}>
              <Ico d={postMode === 'approval' ? Icons.shield : Icons.check} size={13} style={{ color: postMode === 'approval' ? 'var(--grail-gold-deep)' : 'var(--forest)' }}/>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: postMode === 'approval' ? 'var(--grail-gold-deep)' : 'var(--forest)' }}>{postMode === 'approval' ? 'Posts reviewed' : 'Open posting'}</span>
            </span>
          )}
          {pendingReview && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)' }}>
              <Ico d={Icons.clock} size={13} style={{ color: 'var(--grail-gold-deep)' }}/>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--grail-gold-deep)' }}>Pending platform review</span>
            </span>
          )}
        </div>
      </div>

      {/* tabs */}
      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: 'var(--paper)', padding: '16px 16px 10px', marginTop: 14, borderBottom: '1px solid var(--border)' }}>
        <Segmented value={activeTab} onChange={setTab} options={realTabs}/>
      </div>

      {/* PENDING PLATFORM REVIEW — blocks all activity */}
      {pendingReview ? (
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '8px 0 20px' }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--grail-gold-deep)', marginBottom: 12 }}>
              <Ico d={Icons.clock} size={24}/>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Awaiting platform review</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', marginTop: 6, maxWidth: 300, lineHeight: 1.55 }}>
              New communities are checked before they go live — no posts, joins or activity happen until it’s approved. You’ll be notified.
            </div>
            {isFullAdmin && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <Button size="sm" variant="secondary" icon={<Ico d={Icons.settings} size={15}/>} onClick={() => push({ name: 'community-manage', id: com.id })}>Manage community</Button>
                <button onClick={() => { approveCommunityDemo(com.id); flashToast('Approved — the community is now live (demo)'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontFamily: 'var(--font-body)', fontSize: 11.5, textDecoration: 'underline' }}>Simulate platform approval (demo)</button>
              </div>
            )}
          </div>
          <RulesAndAdmins com={com} admins={admins} push={push}/>
        </div>
      ) : locked ? (
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
          {isMember && (accepted ? null : (
            <div style={{ margin: '14px 16px 4px', background: 'var(--bone)', border: '1px solid var(--border)', borderRadius: 13, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Ico d={Icons.shield} size={17} style={{ color: 'var(--ink-mute)' }}/>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Read the guidelines before posting</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', lineHeight: 1.5, margin: '7px 0 12px' }}>{com.name} asks every member to accept its house rules before their first post.</div>
              <div style={{ display: 'flex', gap: 9 }}>
                <Button size="sm" variant="secondary" onClick={() => setTab('rules')}>View rules</Button>
                <Button size="sm" variant="dark" onClick={() => { acceptGuidelines(com.id); flashToast('Guidelines accepted — you can post now'); }}>Accept &amp; continue</Button>
              </div>
            </div>
          ))}
          {!isMember && (
            <div style={{ margin: '14px 16px 4px', textAlign: 'center', fontSize: 13, color: 'var(--ink-faint)', padding: '8px 0' }}>
              {isPrivate ? 'Request to join to post here.' : 'Join to post and join the conversation.'}
            </div>
          )}
          <div style={{ margin: '8px 0 0' }}>
            {posts.map(p => <PostCard key={p.id} post={p} canModerate={isFullAdmin} onRemove={(reason) => { removeCommunityPost(p.id, reason); flashToast('Post removed'); }}/>)}
            {posts.length === 0 && <EmptyNote>Quiet so far — be the first to post.</EmptyNote>}
          </div>
        </div>
      ) : activeTab === 'pending' ? (
        <div style={{ padding: '14px 16px' }}>
          <SectionLabel>Your posts awaiting review</SectionLabel>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', margin: '8px 2px 14px', lineHeight: 1.5 }}>These aren’t visible to the community yet. Once approved, they’ll publish and clear from here automatically.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myPending.map(p => (
              <div key={p.id} style={{ background: 'var(--paper-soft)', border: `1px solid ${p.status === 'declined' ? 'var(--stamp-red)' : 'var(--border)'}`, borderRadius: 14, padding: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: p.status === 'declined' ? 'var(--stamp-red-soft)' : 'var(--grail-gold-soft)', color: p.status === 'declined' ? 'var(--stamp-red)' : 'var(--grail-gold-deep)' }}>
                    <Ico d={p.status === 'declined' ? Icons.close : Icons.clock} size={11}/>{p.status === 'declined' ? 'Declined' : 'Pending review'}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{p.time}</span>
                </div>
                {p.title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.title}</div>}
                <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{p.body}</div>
                {p.status === 'declined' && (
                  <>
                    {p.declineReason && <div style={{ fontSize: 12, color: 'var(--stamp-red)', marginTop: 8 }}>Reason: {p.declineReason}</div>}
                    <button onClick={() => dismissPendingPost(p.id)} style={{ marginTop: 10, background: 'none', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '6px 11px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600 }}>Dismiss</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'members' ? (
        <div style={{ padding: '14px 16px' }}>
          <SectionLabel>{members.length} members</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {members.map(h => {
              const mu = h === 'you' ? { ...ME, name: 'You', handle: 'you' } : userOf(h);
              const role = roleOfWithOverride(com.id, h, communityRoleOverrides);
              return (
                <button key={h} onClick={() => push({ name: 'profile', user: h })} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: 10, cursor: 'pointer',
                  background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13 }}>
                  <Avatar name={mu.name} color={mu.color} size={40} verified={role && mu.tier !== 'Verified'}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{mu.name}</span>

                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>@{mu.handle}</div>
                  </div>
                  <RoleBadge role={role}/>
                </button>
              );
            })}
          </div>
          {isMember && !isAdmin && (
            <button onClick={() => setLeaveConfirm(true)} style={{ marginTop: 20, width: '100%', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }}>Leave community</button>
          )}
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          <RulesAndAdmins com={com} admins={admins} push={push} overrides={communityRoleOverrides}/>
          {isMember && !accepted && (
            <Button size="block" variant="primary" style={{ marginTop: 16 }} onClick={() => { acceptGuidelines(com.id); setTab('posts'); flashToast('Guidelines accepted — you can post now'); }}>
              Accept guidelines
            </Button>
          )}
          {accepted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, color: 'var(--forest)', fontSize: 13, fontWeight: 600 }}>
              <Ico d={Icons.check} size={16} stroke={2.4}/>You’ve accepted these guidelines.
            </div>
          )}
          {isMember && !isAdmin && (
            <button onClick={() => setLeaveConfirm(true)} style={{ marginTop: 20, width: '100%', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }}>Leave community</button>
          )}
        </div>
      )}
      {leaveConfirm && (
        <>
          <div onClick={() => setLeaveConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,17,15,0.4)', zIndex: 140 }}/>
          <div style={{ position: 'fixed', left: 20, right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 141, background: 'var(--paper)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-2)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>Leave {com.name}?</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 6 }}>
              {isPrivate ? "You'll need to request to join again to get back in." : "You can rejoin anytime, but you'll lose your role and any unread activity here."}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <Button variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setLeaveConfirm(false)}>Cancel</Button>
              <Button variant="destructive" style={{ flex: 1, justifyContent: 'center' }} onClick={leaveCommunity}>Leave</Button>
            </div>
          </div>
        </>
      )}
      <div style={{ height: 24 }}/>
    </Screen>
  );
}

// Rules list (collapsible past a cap) + admins list — shared by Rules tab and locked previews
function RulesAndAdmins({ com, admins, push, overrides }) {
  const RULE_CAP = 4;
  const [showAll, setShowAll] = React.useState(false);
  const rules = com.rules || [];
  const visible = showAll ? rules : rules.slice(0, RULE_CAP);
  return (
    <>
      <SectionLabel>Community rules</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {visible.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--bone)', color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, paddingTop: 1 }}>{r}</div>
          </div>
        ))}
      </div>
      {rules.length > RULE_CAP && (
        <button onClick={() => setShowAll(s => !s)} style={{ marginTop: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink-faint)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5 }}>
          {showAll ? 'Show fewer rules' : `Show all ${rules.length} rules`}
        </button>
      )}
      <div style={{ marginTop: 24 }}><SectionLabel>Admins &amp; mods</SectionLabel></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
        {admins.map(a => {
          const au = a.handle === 'you' ? { ...ME, name: 'You', handle: 'you' } : userOf(a.handle);
          const role = overrides ? roleOfWithOverride(com.id, a.handle, overrides) : a.role;
          return (
            <button key={a.handle} onClick={() => push({ name: 'profile', user: a.handle })} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: 12, cursor: 'pointer',
              background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13 }}>
              <Avatar name={au.name} color={au.color} size={42} verified={au.tier !== 'Verified'}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontWeight: 600, fontSize: 14 }}>{au.name}</span></div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>@{au.handle}</div>
              </div>
              <RoleBadge role={role}/>
            </button>
          );
        })}
      </div>
    </>
  );
}

Object.assign(window, { CommunityDetail, RulesAndAdmins, RoleBadge });
