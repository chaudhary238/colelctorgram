// ─────────────────────────────────────────────────────────────
// Manage community — admin dashboard (BRD §9.12)
// Join requests · pending posts · members & roles · settings.
// Mods: approve requests/posts only. Admins/Founder: full power,
// incl. editing community details, removing members/posts, closing it.
// ─────────────────────────────────────────────────────────────

function CommunityManageView({ route }) {
  const { pop, push, flashToast } = useNav();
  const {
    userCommunities, communityRoleOverrides, setCommunityRole, communityRemoved, removeCommunityMember,
    communityRemovalReasons, posts: userPosts, approveUserPost, declineUserPost, removedCommunityPosts,
    removeCommunityPost, approveCommunityDemo, toggleJoin,
  } = useAppState();
  const com = COMMUNITIES.find(c => c.id === route.id) || (userCommunities || []).find(c => c.id === route.id);
  if (!com) return <Screen nav={false} header={<DetailHeader title="Manage community"/>}><EmptyNote>Community not found.</EmptyNote></Screen>;

  const isPrivate = com.privacy === 'private' || com.invite;
  const myRole = roleOfWithOverride(com.id, 'you', communityRoleOverrides);
  const isFullAdmin = roleCanFullAdmin(myRole);
  const isAdmin = roleCanManage(myRole);
  const pendingReview = !communityApproved(com);
  const [seg, setSeg] = React.useState('requests');
  const [leaveStep, setLeaveStep] = React.useState(null); // null | 'confirm' | 'transfer' | 'promote' | 'sole'
  const [succHandle, setSuccHandle] = React.useState(null);

  // local moderation state (seeded from data)
  const [requests, setRequests] = React.useState(joinRequestsOf(com.id));
  const [seedPending, setSeedPending] = React.useState(pendingPostsOf(com.id));
  const livePending = (userPosts || []).filter(p => p.community === com.id && p.status === 'pending');
  const [memberCount, setMemberCount] = React.useState(com.members);
  const [privacy, setPrivacy] = React.useState(isPrivate ? 'private' : 'public');
  const [posting, setPosting] = React.useState(postModeOf(com.id));
  const [decliningId, setDecliningId] = React.useState(null); // post pending a decline reason
  const [declineReasonText, setDeclineReasonText] = React.useState('');
  const [removeTarget, setRemoveTarget] = React.useState(null); // handle pending a removal reason
  const [removeReason, setRemoveReason] = React.useState('');
  const [editOpen, setEditOpen] = React.useState(false);
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [expandedMember, setExpandedMember] = React.useState(null);
  const [roleChangeTarget, setRoleChangeTarget] = React.useState(null); // { handle, role, label }

  const rosterAll = membersOf(com.id).map(h => ({ handle: h, role: roleOfWithOverride(com.id, h, communityRoleOverrides) }));
  const removedSet = communityRemoved[com.id] || {};
  const members = rosterAll.filter(m => !removedSet[m.handle]);
  const otherMembers = members.filter(m => m.handle !== 'you');
  const successorCandidates = otherMembers.filter(m => roleCanManage(m.role));

  const openLeaveFlow = () => {
    if (!isAdmin || successorCandidates.length > 0) { setLeaveStep('confirm'); return; }
    if (otherMembers.length > 0) { setSuccHandle(null); setLeaveStep('promote'); }
    else setLeaveStep('sole');
  };
  const leaveCommunity = () => { toggleJoin(com.id); flashToast(`Left ${com.name}`); setLeaveStep(null); pop(); };
  const confirmSuccessionAndLeave = () => {
    if (!succHandle) return;
    setCommunityRole(com.id, succHandle, 'Admin');
    setCommunityRole(com.id, 'you', null);
    toggleJoin(com.id);
    flashToast(`Left ${com.name} — @${succHandle} is now Admin`);
    setLeaveStep(null);
    pop();
  };

  const approveReq = (h) => { setRequests(r => r.filter(x => x !== h)); setMemberCount(c => c + 1); flashToast(`@${h} approved`); };
  const declineReq = (h) => { setRequests(r => r.filter(x => x !== h)); flashToast(`@${h} declined`); };
  const approveSeedPost = (id) => { setSeedPending(p => p.filter(x => x.id !== id)); flashToast('Post approved & published'); };
  const declineSeedPost = (id, reason) => { setSeedPending(p => p.filter(x => x.id !== id)); flashToast('Post declined'); };
  const startDecline = (id) => { setDecliningId(id); setDeclineReasonText(''); };
  const cancelDecline = () => { setDecliningId(null); setDeclineReasonText(''); };
  const setRole = (h, role) => setCommunityRole(com.id, h, role);
  const requestRoleChange = (h, role, label) => setRoleChangeTarget({ handle: h, role, label });
  const confirmRoleChange = () => { if (!roleChangeTarget) return; setRole(roleChangeTarget.handle, roleChangeTarget.role); flashToast(`@${roleChangeTarget.handle} is now ${roleChangeTarget.label}`); setRoleChangeTarget(null); };
  const confirmRemove = () => { removeCommunityMember(com.id, removeTarget, removeReason.trim()); setMemberCount(c => Math.max(0, c - 1)); flashToast(`@${removeTarget} removed`); setRemoveTarget(null); setRemoveReason(''); };

  const totalPending = requests.length + seedPending.length + livePending.length;
  const tabs = [
    { id: 'requests', label: `Requests${requests.length ? ` ${requests.length}` : ''}` },
    { id: 'posts', label: `Posts${(seedPending.length + livePending.length) ? ` ${seedPending.length + livePending.length}` : ''}` },
    { id: 'members', label: 'Members' },
    ...(isFullAdmin ? [{ id: 'settings', label: 'Settings' }] : []),
  ];

  return (
    <Screen nav={false} header={<DetailHeader title="Manage community" subtitle={com.name}/>}>
      {editOpen && <EditCommunitySheet com={com} onClose={() => setEditOpen(false)}/>}
      {closeOpen && <CloseCommunitySheet com={com} onClose={() => setCloseOpen(false)}/>}
      {roleChangeTarget && (
        <>
          <div onClick={() => setRoleChangeTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,17,15,0.4)', zIndex: 140 }}/>
          <div style={{ position: 'fixed', left: 20, right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 141, background: 'var(--paper)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-2)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>Change role to {roleChangeTarget.label}?</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 6 }}>@{roleChangeTarget.handle} will {roleChangeTarget.role ? `become a ${roleChangeTarget.label}` : 'lose their moderation role'} in {com.name}.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <Button variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setRoleChangeTarget(null)}>Cancel</Button>
              <Button variant="dark" style={{ flex: 1, justifyContent: 'center' }} onClick={confirmRoleChange}>Confirm</Button>
            </div>
          </div>
        </>
      )}
      {removeTarget && (
        <OverlayShell title={`Remove @${removeTarget}`} onClose={() => { setRemoveTarget(null); setRemoveReason(''); }}>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 13.5, color: 'var(--ink-mute)', marginBottom: 12, lineHeight: 1.5 }}>Give a reason \u2014 it helps the member understand why they were removed, and is kept in the moderation log.</div>
            <textarea value={removeReason} onChange={e => setRemoveReason(e.target.value.slice(0, 300))} rows={4} placeholder="e.g. Repeated rule violations, spam, off-platform trade dispute\u2026"
              style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', outline: 'none', resize: 'vertical' }}/>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', textAlign: 'right', margin: '5px 0 16px' }}>{removeReason.length}/300</div>
            <Button size="block" variant="primary" style={{ background: 'var(--stamp-red)', borderColor: 'var(--stamp-red)' }} onClick={confirmRemove}>Remove member</Button>
          </div>
        </OverlayShell>
      )}

      {pendingReview && (
        <div style={{ margin: '14px 16px 0', display: 'flex', gap: 9, alignItems: 'flex-start', padding: 13, background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)', borderRadius: 12, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          <Ico d={Icons.clock} size={15} style={{ flexShrink: 0, marginTop: 1, color: 'var(--grail-gold-deep)' }}/>
          <div>This community is awaiting platform review \u2014 no member or post activity yet. You can still edit its details below.
            {isFullAdmin && <button onClick={() => { approveCommunityDemo(com.id); flashToast('Approved \u2014 now live (demo)'); }} style={{ display: 'block', marginTop: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink)', fontWeight: 700, textDecoration: 'underline' }}>Simulate platform approval (demo)</button>}
          </div>
        </div>
      )}

      {/* stat strip */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px 4px' }}>
        <ManageStat n={memberCount} l="Members" accent="var(--ink)" onClick={() => setSeg('members')}/>
        <ManageStat n={requests.length} l="Requests" accent={requests.length ? 'var(--stamp-red)' : 'var(--ink-mute)'} onClick={() => setSeg('requests')}/>
        <ManageStat n={seedPending.length + livePending.length} l="To review" accent={(seedPending.length + livePending.length) ? 'var(--grail-gold-deep)' : 'var(--ink-mute)'} onClick={() => setSeg('posts')}/>
      </div>

      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: 'var(--paper)', padding: '12px 16px 10px', borderBottom: '1px solid var(--border)' }}>
        <Segmented value={seg} onChange={setSeg} options={tabs}/>
      </div>

      <div style={{ padding: '16px' }}>
        {!isFullAdmin && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '9px 12px', background: 'var(--bone)', border: '1px solid var(--border)', borderRadius: 11, fontSize: 12, color: 'var(--ink-mute)', marginBottom: 14 }}>
            <Ico d={Icons.shield} size={14}/>You're a mod here \u2014 you can approve requests and posts. Removing members/posts and editing community settings needs an admin.
          </div>
        )}

        {/* JOIN REQUESTS */}
        {seg === 'requests' && (
          isPrivate ? (
            requests.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {requests.map(h => {
                  const u = userOf(h);
                  return (
                    <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 11, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13 }}>
                      <button onClick={() => push({ name: 'profile', user: h })} style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        <Avatar name={u.name} color={u.color} size={40}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span></div>
                          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>@{u.handle} · {u.vouchesReceived} vouches</div>
                        </div>
                      </button>
                      <button onClick={() => declineReq(h)} aria-label="Decline" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--paper)', color: 'var(--ink-mute)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ico d={Icons.close} size={15} stroke={2.4}/></button>
                      <button onClick={() => approveReq(h)} aria-label="Approve" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--forest)', background: 'var(--forest)', color: 'var(--paper)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ico d={Icons.check} size={16} stroke={2.6}/></button>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyNote>No pending join requests.</EmptyNote>
          ) : (
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: 13, background: 'var(--bone)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              <Ico d={Icons.globe} size={15} style={{ flexShrink: 0, marginTop: 1, color: 'var(--ink-faint)' }}/>
              This is a <b>public</b> community \u2014 anyone can join instantly, so there are no requests to approve. Switch to private in Settings to review members.
            </div>
          )
        )}

        {/* PENDING POSTS */}
        {seg === 'posts' && (
          (seedPending.length + livePending.length) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {livePending.map(p => {
                const u = userOf(p.user);
                return (
                  <div key={p.id} style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                    <button onClick={() => push({ name: 'profile', user: p.user })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <Avatar name={u.name} color={u.color} size={32}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>@{u.handle} · {p.time}</div>
                      </div>
                    </button>
                    <div style={{ padding: '10px 13px 0' }}>
                      {p.title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>{p.title}</div>}
                      <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55 }}>{p.body}</div>
                    </div>
                    {p.images && p.images.length > 0 && (
                      <div style={{ padding: '10px 13px 0' }}><PostImages images={p.images}/></div>
                    )}
                    {decliningId === p.id ? (
                      <div style={{ padding: '10px 13px 13px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--stamp-red-deep)', marginBottom: 7 }}>Decline this post — why?</div>
                        <textarea value={declineReasonText} onChange={e => setDeclineReasonText(e.target.value.slice(0, 200))} rows={2} placeholder="e.g. Off-topic, breaks community rules…" autoFocus
                          style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--paper)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)', outline: 'none', resize: 'none' }}/>
                        <div style={{ display: 'flex', gap: 9, marginTop: 9 }}>
                          <Button size="sm" variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={cancelDecline}>Cancel</Button>
                          <Button size="sm" variant="primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--stamp-red)', borderColor: 'var(--stamp-red)' }} onClick={() => { declineUserPost(p.id, declineReasonText.trim()); flashToast('Post declined'); cancelDecline(); }}>Confirm decline</Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 9, padding: '12px 13px 13px' }}>
                        <Button size="sm" variant="secondary" style={{ flex: 1, justifyContent: 'center', color: 'var(--stamp-red)', borderColor: 'var(--border-strong)' }} onClick={() => startDecline(p.id)}>Decline</Button>
                        <Button size="sm" variant="dark" style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.check} size={15}/>} onClick={() => { approveUserPost(p.id); flashToast('Post approved & published'); }}>Approve</Button>
                      </div>
                    )}
                  </div>
                );
              })}
              {seedPending.map(p => {
                const u = userOf(p.author);
                return (
                  <div key={p.id} style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                    <button onClick={() => push({ name: 'profile', user: p.author })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <Avatar name={u.name} color={u.color} size={32}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>@{u.handle} · {p.time}</div>
                      </div>
                    </button>
                    <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55, padding: '10px 13px 4px' }}>{p.text}</div>
                    {decliningId === p.id ? (
                      <div style={{ padding: '0 13px 13px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--stamp-red-deep)', marginBottom: 7 }}>Decline this post — why?</div>
                        <textarea value={declineReasonText} onChange={e => setDeclineReasonText(e.target.value.slice(0, 200))} rows={2} placeholder="e.g. Off-topic, breaks community rules…" autoFocus
                          style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--paper)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)', outline: 'none', resize: 'none' }}/>
                        <div style={{ display: 'flex', gap: 9, marginTop: 9 }}>
                          <Button size="sm" variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={cancelDecline}>Cancel</Button>
                          <Button size="sm" variant="primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--stamp-red)', borderColor: 'var(--stamp-red)' }} onClick={() => { declineSeedPost(p.id, declineReasonText.trim()); cancelDecline(); }}>Confirm decline</Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 9, padding: '9px 13px 13px' }}>
                        <Button size="sm" variant="secondary" style={{ flex: 1, justifyContent: 'center', color: 'var(--stamp-red)', borderColor: 'var(--border-strong)' }} onClick={() => startDecline(p.id)}>Decline</Button>
                        <Button size="sm" variant="dark" style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.check} size={15}/>} onClick={() => approveSeedPost(p.id)}>Approve</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : <EmptyNote>Nothing waiting for review. {posting === 'open' ? 'Posts publish instantly here.' : ''}</EmptyNote>
        )}

        {/* MEMBERS */}
        {seg === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map(m => {
              const u = m.handle === 'you' ? { ...ME, name: 'You', handle: 'you' } : userOf(m.handle);
              const isYou = m.handle === 'you';
              const canEdit = isFullAdmin && !isYou;
              const isOpen = expandedMember === m.handle;
              return (
                <div key={m.handle} style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 10, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => push({ name: 'profile', user: m.handle })} style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', flex: 1, minWidth: 0 }}>
                      <Avatar name={u.name} color={u.color} size={38}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>@{u.handle}</div>
                      </div>
                    </button>
                    <RoleBadge role={m.role}/>
                    {canEdit && (
                      <button onClick={() => setExpandedMember(isOpen ? null : m.handle)} aria-label="Edit member" style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border-strong)', background: isOpen ? 'var(--ink)' : 'var(--paper)', color: isOpen ? 'var(--paper)' : 'var(--ink-mute)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Ico d={Icons.edit} size={13}/>
                      </button>
                    )}
                  </div>
                  {canEdit && isOpen && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>Role</div>
                        <div style={{ display: 'inline-flex', border: '1px solid var(--border-strong)', borderRadius: 9, overflow: 'hidden' }}>
                          {[{ id: null, label: 'Member' }, { id: 'Mod', label: 'Mod' }, { id: 'Admin', label: 'Admin' }].map((r, i) => {
                            const on = (m.role || null) === r.id;
                            return (
                              <button key={String(r.id)} onClick={() => on ? null : requestRoleChange(m.handle, r.id, r.label)} style={{
                                fontSize: 11.5, fontWeight: 600, height: 32, padding: '0 12px', border: 'none', borderLeft: i > 0 ? '1px solid var(--border-strong)' : 'none',
                                background: on ? 'var(--ink)' : 'var(--paper)', color: on ? 'var(--paper)' : 'var(--ink-soft)', cursor: 'pointer' }}>{r.label}</button>
                            );
                          })}
                        </div>
                      </div>
                      <button onClick={() => setRemoveTarget(m.handle)} style={{ height: 32, fontSize: 11.5, fontWeight: 600, padding: '0 12px', borderRadius: 9, border: '1px solid var(--stamp-red)', background: 'var(--paper)', color: 'var(--stamp-red)', cursor: 'pointer', whiteSpace: 'nowrap' }}>Remove member</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SETTINGS \u2014 admin/founder only */}
        {seg === 'settings' && isFullAdmin && (
          <div>
            <SectionLabel>Privacy</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '11px 0 20px' }}>
              <CCRadioRow title="Public" sub="Anyone can find and join instantly" on={privacy === 'public'} onClick={() => { setPrivacy('public'); flashToast('Community is now public'); }}/>
              <CCRadioRow title="Private" sub="People request to join \u2014 you approve them" on={privacy === 'private'} onClick={() => { setPrivacy('private'); flashToast('Community is now private'); }}/>
            </div>

            <SectionLabel>Who can post</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '11px 0 20px' }}>
              <CCRadioRow title="Anyone can post" sub="Members post freely" on={posting === 'open'} onClick={() => { setPosting('open'); flashToast('Members can post freely'); }}/>
              <CCRadioRow title="Admin-approved" sub="Posts are reviewed before they show" on={posting === 'approval'} onClick={() => { setPosting('approval'); flashToast('Posts will be reviewed'); }}/>
            </div>

            <SectionLabel>Community details</SectionLabel>
            <div style={{ margin: '11px 0 14px' }}>
              <Button variant="secondary" size="block" icon={<Ico d={Icons.edit} size={16}/>} onClick={() => setEditOpen(true)}>Rename, photos &amp; rules</Button>
            </div>

            <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <Button variant="secondary" size="block" style={{ color: 'var(--stamp-red)', borderColor: 'var(--stamp-red)' }} icon={<Ico d={Icons.close} size={16} stroke={2.4}/>} onClick={() => setCloseOpen(true)}>Close or delete community</Button>
            </div>
            <div style={{ marginTop: 12 }}>
              <Button variant="secondary" size="block" icon={<Ico d={Icons.close} size={16} stroke={2.4}/>} onClick={openLeaveFlow}>Leave community</Button>
            </div>
          </div>
        )}
        {seg === 'members' && !isFullAdmin && isAdmin && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <Button variant="secondary" size="block" icon={<Ico d={Icons.close} size={16} stroke={2.4}/>} onClick={openLeaveFlow}>Leave community</Button>
          </div>
        )}
      </div>
      {leaveStep === 'confirm' && (
        <>
          <div onClick={() => setLeaveStep(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,17,15,0.4)', zIndex: 140 }}/>
          <div style={{ position: 'fixed', left: 20, right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 141, background: 'var(--paper)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-2)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>Leave {com.name}?</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 6 }}>You can rejoin anytime, but you'll lose your role and any unread activity here.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <Button variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setLeaveStep(null)}>Cancel</Button>
              <Button variant="destructive" style={{ flex: 1, justifyContent: 'center' }} onClick={leaveCommunity}>Leave</Button>
            </div>
          </div>
        </>
      )}
      {leaveStep === 'promote' && (
        <>
          <div onClick={() => setLeaveStep(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,17,15,0.4)', zIndex: 140 }}/>
          <div style={{ position: 'fixed', left: 20, right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 141, background: 'var(--paper)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-2)', maxHeight: '76vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>
              Pick a new admin before you leave
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 6 }}>
              You're the only admin left. Every community needs someone managing it, so choose a member to make Admin.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {otherMembers.map(m => {
                const mu = userOf(m.handle);
                const on = succHandle === m.handle;
                return (
                  <button key={m.handle} onClick={() => setSuccHandle(m.handle)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: 10, cursor: 'pointer',
                    background: on ? 'var(--bone)' : 'var(--paper-soft)', border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border)'}`, borderRadius: 13 }}>
                    <Avatar name={mu.name} color={mu.color} size={36}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mu.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>@{mu.handle}</div>
                    </div>
                    {m.role && <RoleBadge role={m.role}/>}
                    {on && <Ico d={Icons.check} size={16} style={{ color: 'var(--ink)' }}/>}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <Button variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setLeaveStep(null)}>Cancel</Button>
              <Button variant="destructive" disabled={!succHandle} style={{ flex: 1, justifyContent: 'center', opacity: succHandle ? 1 : 0.5 }} onClick={confirmSuccessionAndLeave}>Promote &amp; leave</Button>
            </div>
          </div>
        </>
      )}
      {leaveStep === 'sole' && (
        <>
          <div onClick={() => setLeaveStep(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,17,15,0.4)', zIndex: 140 }}/>
          <div style={{ position: 'fixed', left: 20, right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 141, background: 'var(--paper)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-2)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>You're the only member</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 6 }}>There's no one to hand this community to. Close or delete it below instead if you're done with it.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <Button variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setLeaveStep(null)}>Got it</Button>
            </div>
          </div>
        </>
      )}
      <div style={{ height: 24 }}/>
    </Screen>
  );
}

// Rename / photos / description / rules \u2014 admin+ only
function EditCommunitySheet({ com, onClose }) {
  const { flashToast } = useNav();
  const [name, setName] = React.useState(com.name);
  const [desc, setDesc] = React.useState(com.short || '');
  const [rules, setRules] = React.useState((com.rules || []).join('\n'));
  const [banner, setBanner] = React.useState(com.bannerUrl || null);
  const [photo, setPhoto] = React.useState(com.photoUrl || null);
  const bannerRef = React.useRef(); const photoRef = React.useRef();
  const pickImg = (e, setter) => {
    const file = (e.target.files || [])[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = ev => setter(ev.target.result); reader.readAsDataURL(file); e.target.value = '';
  };
  const over = rules.length > COMMUNITY_RULES_MAX;
  const save = () => {
    if (!name.trim() || !desc.trim() || over) { flashToast('Check the name, description and rules length'); return; }
    // Prototype scope: this mutates the in-memory object directly so the change is visible
    // immediately across the app without a dedicated "edit community" store slice.
    com.name = name.trim(); com.short = desc.trim();
    com.rules = rules.split('\n').map(r => r.trim()).filter(Boolean);
    if (banner) com.bannerUrl = banner;
    if (photo) com.photoUrl = photo;
    flashToast('Community details updated');
    onClose();
  };
  return (
    <OverlayShell title="Edit community" onClose={onClose} trailing={<Button size="sm" variant="primary" onClick={save}>Save</Button>}>
      <div style={{ padding: 16 }}>
        <SectionLabel>Photos</SectionLabel>
        <div style={{ position: 'relative', margin: '10px 0 30px' }}>
          <div style={{ position: 'relative', height: 92, borderRadius: 13, overflow: 'hidden', background: banner ? `center/cover url(${banner})` : 'var(--bone)', border: '1px solid var(--border-strong)' }}>
            <input ref={bannerRef} type="file" accept="image/*" hidden onChange={e => pickImg(e, setBanner)}/>
            <button onClick={() => bannerRef.current.click()} style={{ position: 'absolute', inset: 0, width: '100%', border: 'none', background: banner ? 'rgba(20,17,15,0.28)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, color: banner ? '#fff' : 'var(--ink-mute)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5 }}>
              <Ico d={Icons.gallery} size={16}/>{banner ? 'Change banner' : 'Add a banner image'}
            </button>
          </div>
          <input ref={photoRef} type="file" accept="image/*" hidden onChange={e => pickImg(e, setPhoto)}/>
          <button onClick={() => photoRef.current.click()} style={{ position: 'absolute', left: 14, bottom: -26, width: 60, height: 60, borderRadius: 16, border: '3px solid var(--paper)', cursor: 'pointer', background: photo ? `center/cover url(${photo})` : 'var(--ink)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!photo && <Ico d={Icons.camera} size={18}/>}
          </button>
        </div>
        <SectionLabel>Community name</SectionLabel>
        <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', height: 46, padding: '0 13px', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink)', outline: 'none', margin: '10px 0 20px' }}/>
        <SectionLabel>Description</SectionLabel>
        <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 140))} rows={2} style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', outline: 'none', resize: 'none', margin: '10px 0 20px' }}/>
        <SectionLabel>Community rules</SectionLabel>
        <textarea value={rules} onChange={e => setRules(e.target.value.slice(0, COMMUNITY_RULES_MAX))} rows={7} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 13px', borderRadius: 11, border: `1px solid ${over ? 'var(--stamp-red)' : 'var(--border-strong)'}`, background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', outline: 'none', resize: 'vertical', margin: '10px 0 4px' }}/>
        <div style={{ textAlign: 'right', fontSize: 11.5, color: over ? 'var(--stamp-red)' : 'var(--ink-faint)' }}>{rules.length}/{COMMUNITY_RULES_MAX}</div>
      </div>
    </OverlayShell>
  );
}

// Close (pause) or permanently delete \u2014 admin+ only, second confirmation
function CloseCommunitySheet({ com, onClose }) {
  const { flashToast, pop, switchTab } = useNav();
  const [mode, setMode] = React.useState('close'); // close | delete
  const [confirmText, setConfirmText] = React.useState('');
  const ready = mode === 'close' || confirmText.trim().toLowerCase() === com.name.trim().toLowerCase();
  const submit = () => {
    if (!ready) return;
    onClose();
    pop();
    switchTab('community');
    flashToast(mode === 'close' ? `${com.name} closed \u2014 hidden from discovery` : `${com.name} deleted`);
  };
  return (
    <OverlayShell title="Close or delete community" onClose={onClose}>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          <CCRadioRow title="Close community" sub="Hides it from discovery and freezes posting \u2014 members keep read access" on={mode === 'close'} onClick={() => setMode('close')}/>
          <CCRadioRow title="Delete permanently" sub="Removes all posts, members and history. Cannot be undone." on={mode === 'delete'} onClick={() => setMode('delete')}/>
        </div>
        {mode === 'delete' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginBottom: 8 }}>Type <b>{com.name}</b> to confirm.</div>
            <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder={com.name} style={{ width: '100%', boxSizing: 'border-box', height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid var(--stamp-red)', background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none' }}/>
          </div>
        )}
        <Button size="block" variant="primary" style={!ready ? { opacity: 0.5, background: 'var(--stamp-red)', borderColor: 'var(--stamp-red)' } : { background: 'var(--stamp-red)', borderColor: 'var(--stamp-red)' }} onClick={submit}>
          {mode === 'close' ? 'Close community' : 'Permanently delete'}
        </Button>
      </div>
    </OverlayShell>
  );
}

Object.assign(window, { CommunityManageView, EditCommunitySheet, CloseCommunitySheet });
