// ─────────────────────────────────────────────────────────────
// Manage community — admin dashboard (BRD §9.12)
// Join requests · pending posts · members & roles · settings.
// Admins = founder + mods (adminsOf). Moderation is local prototype state.
// ─────────────────────────────────────────────────────────────

function CommunityManageView({ route }) {
  const { pop, push, flashToast } = useNav();
  const { userCommunities } = useAppState();
  const com = COMMUNITIES.find(c => c.id === route.id) || (userCommunities || []).find(c => c.id === route.id);
  if (!com) return <Screen nav={false} header={<DetailHeader title="Manage community"/>}><EmptyNote>Community not found.</EmptyNote></Screen>;

  const isPrivate = com.privacy === 'private' || com.invite;
  const [seg, setSeg] = React.useState('requests');

  // local moderation state (seeded from data)
  const [requests, setRequests] = React.useState(joinRequestsOf(com.id));
  const [pending, setPending] = React.useState(pendingPostsOf(com.id));
  const [members, setMembers] = React.useState(membersOf(com.id).map(h => ({ handle: h, role: roleOf(com.id, h) })));
  const [memberCount, setMemberCount] = React.useState(com.members);
  const [privacy, setPrivacy] = React.useState(isPrivate ? 'private' : 'public');
  const [posting, setPosting] = React.useState(postModeOf(com.id));

  const approveReq = (h) => { setRequests(r => r.filter(x => x !== h)); setMembers(m => [...m, { handle: h, role: null }]); setMemberCount(c => c + 1); flashToast(`@${h} approved`); };
  const declineReq = (h) => { setRequests(r => r.filter(x => x !== h)); flashToast(`@${h} declined`); };
  const approvePost = (id) => { setPending(p => p.filter(x => x.id !== id)); flashToast('Post approved & published'); };
  const declinePost = (id) => { setPending(p => p.filter(x => x.id !== id)); flashToast('Post declined'); };
  const promote = (h) => { setMembers(m => m.map(x => x.handle === h ? { ...x, role: x.role === 'Mod' ? null : 'Mod' } : x)); };
  const removeMember = (h) => { setMembers(m => m.filter(x => x.handle !== h)); setMemberCount(c => Math.max(0, c - 1)); flashToast(`@${h} removed`); };

  const tabs = [
    { id: 'requests', label: `Requests${requests.length ? ` ${requests.length}` : ''}` },
    { id: 'posts', label: `Posts${pending.length ? ` ${pending.length}` : ''}` },
    { id: 'members', label: 'Members' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <Screen nav={false} header={<DetailHeader title="Manage community" subtitle={com.name}/>}>
      {/* stat strip */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px 4px' }}>
        <ManageStat n={memberCount} l="Members" accent="var(--ink)"/>
        <ManageStat n={requests.length} l="Requests" accent={requests.length ? 'var(--stamp-red)' : 'var(--ink-mute)'}/>
        <ManageStat n={pending.length} l="To review" accent={pending.length ? 'var(--grail-gold-deep)' : 'var(--ink-mute)'}/>
      </div>

      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: 'var(--paper)', padding: '12px 16px 10px', borderBottom: '1px solid var(--border)' }}>
        <Segmented value={seg} onChange={setSeg} options={tabs}/>
      </div>

      <div style={{ padding: '16px' }}>
        {/* JOIN REQUESTS */}
        {seg === 'requests' && (
          isPrivate ? (
            requests.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {requests.map(h => {
                  const u = userOf(h);
                  return (
                    <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 11, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13 }}>
                      <button onClick={() => push({ name: 'profile', user: h })} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}><Avatar name={u.name} color={u.color} size={40}/></button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span></div>
                        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>@{u.handle} · {u.deals} deals · {u.vouchesReceived} vouches</div>
                      </div>
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
              This is a <b>public</b> community — anyone can join instantly, so there are no requests to approve. Switch to private in Settings to review members.
            </div>
          )
        )}

        {/* PENDING POSTS */}
        {seg === 'posts' && (
          pending.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {pending.map(p => {
                const u = userOf(p.author);
                return (
                  <div key={p.id} style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px 0' }}>
                      <Avatar name={u.name} color={u.color} size={32}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>@{u.handle} · {p.time}</div>
                      </div>
                      <PostTypeTag type={p.type}/>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55, padding: '10px 13px 12px' }}>{p.text}</div>
                    <div style={{ display: 'flex', gap: 9, padding: '0 13px 13px' }}>
                      <Button size="sm" variant="secondary" style={{ flex: 1, justifyContent: 'center', color: 'var(--stamp-red)', borderColor: 'var(--border-strong)' }} onClick={() => declinePost(p.id)}>Decline</Button>
                      <Button size="sm" variant="dark" style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.check} size={15}/>} onClick={() => approvePost(p.id)}>Approve</Button>
                    </div>
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
              const isFounder = m.role === 'Founder';
              return (
                <div key={m.handle} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 10, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13 }}>
                  <Avatar name={u.name} color={u.color} size={38}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{u.name}</span>
                      {m.role && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 6, background: isFounder ? 'var(--ink)' : 'var(--bone-deep)', color: isFounder ? 'var(--paper)' : 'var(--ink-mute)', fontWeight: 700, flexShrink: 0 }}>{m.role}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>@{u.handle}</div>
                  </div>
                  {!isFounder && !isYou && (
                    <>
                      <button onClick={() => promote(m.handle)} style={{ fontSize: 11.5, fontWeight: 600, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', background: m.role === 'Mod' ? 'var(--bone)' : 'var(--paper)', color: 'var(--ink-soft)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{m.role === 'Mod' ? 'Remove mod' : 'Make mod'}</button>
                      <button onClick={() => removeMember(m.handle)} aria-label="Remove member" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--paper)', color: 'var(--stamp-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ico d={Icons.close} size={14} stroke={2.4}/></button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SETTINGS */}
        {seg === 'settings' && (
          <div>
            <SectionLabel>Privacy</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '11px 0 20px' }}>
              <CCRadioRow title="Public" sub="Anyone can find and join instantly" on={privacy === 'public'} onClick={() => { setPrivacy('public'); flashToast('Community is now public'); }}/>
              <CCRadioRow title="Private" sub="People request to join — you approve them" on={privacy === 'private'} onClick={() => { setPrivacy('private'); flashToast('Community is now private'); }}/>
            </div>

            <SectionLabel>Who can post</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '11px 0 20px' }}>
              <CCRadioRow title="Anyone can post" sub="Members post freely" on={posting === 'open'} onClick={() => { setPosting('open'); flashToast('Members can post freely'); }}/>
              <CCRadioRow title="Admin-approved" sub="Posts are reviewed before they show" on={posting === 'approval'} onClick={() => { setPosting('approval'); flashToast('Posts will be reviewed'); }}/>
            </div>

            <SectionLabel>Rules</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '11px 0 14px' }}>
              {com.rules.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 11 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.45 }}>{r}</span>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="block" icon={<Ico d={Icons.edit} size={16}/>} onClick={() => flashToast('Editing community details — coming soon')}>Edit details &amp; rules</Button>

            <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <Button variant="secondary" size="block" style={{ color: 'var(--stamp-red)', borderColor: 'var(--stamp-red)' }} icon={<Ico d={Icons.close} size={16} stroke={2.4}/>} onClick={() => flashToast('Archiving needs a second confirmation')}>Archive community</Button>
            </div>
          </div>
        )}
      </div>
      <div style={{ height: 24 }}/>
    </Screen>
  );
}

Object.assign(window, { CommunityManageView });
