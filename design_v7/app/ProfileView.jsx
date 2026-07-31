// ─────────────────────────────────────────────────────────────
// Profile (own & others) — BRD §9.11
// Header + trust signals + tabs: Posts / Collection / Communities / Trades
// ─────────────────────────────────────────────────────────────

function ProfileView({ route }) {
  const handle = route.user;
  const isMe = !!route.isMe || handle === 'you';
  // Cross-scope references (split files)
  const CollectionTab = window.CollectionTab;
  const { push, pop, flashToast, setOverlay } = useNav();
  const { followed, toggleFollow, joined, profile, vouched, saved, posts: livePosts } = useAppState();
  const u = isMe ? { ...ME, ...profile } : userOf(handle);
  const isVouched = !!vouched[handle];
  const [tab, setTab] = React.useState('collection');
  const isFollowing = followed[handle];

  // ── More menu state ──
  const [moreOpen, setMoreOpen]       = React.useState(false);
  const [reportOpen, setReportOpen]   = React.useState(false);
  const [blockOpen, setBlockOpen]     = React.useState(false);
  const [isBlocked, setIsBlocked]     = React.useState(false);
  const [reportReason, setReportReason] = React.useState(null);
  const [reportSent, setReportSent]   = React.useState(false);

  const REPORT_REASONS = [
    'Fake / impersonation',
    'Counterfeit / replica listings',
    'Scam or fraud attempt',
    'Harassment or abuse',
    'Spam',
    'Other',
  ];

  const handleBlock = () => {
    setIsBlocked(true);
    setBlockOpen(false);
    setMoreOpen(false);
    flashToast(`@${u.handle} blocked`);
  };

  const handleReport = () => {
    setReportSent(true);
    setTimeout(() => {
      setReportOpen(false);
      setMoreOpen(false);
      setReportSent(false);
      setReportReason(null);
      flashToast('Report submitted — thank you');
    }, 1200);
  };

  // livePosts already destructured above from useAppState()
  const allISOSeed = typeof ISO_POSTS !== 'undefined' ? ISO_POSTS : [];
  const myItems = MY_ITEMS || [];
  const myCommunities = COMMUNITIES.filter(c => joined[c.id]);
  const myPosts = React.useMemo(() => {
    const seed = POSTS.filter(p => p.user === handle);
    const isoSeed = allISOSeed.filter(p => p.user === handle);
    const live = isMe ? (livePosts || []) : [];
    const all = [...live, ...seed, ...isoSeed];
    // dedupe by id
    const seen = new Set();
    return all.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
  }, [handle, isMe, livePosts]);

  const header = isMe
    ? <AppBar title="My Space"/>
    : <DetailHeader title={u.name} subtitle={'@' + u.handle}
        trailing={<IconButton icon={<Ico d={Icons.more} size={18}/>} onClick={() => setMoreOpen(true)}/>}/>;

  return (
    <Screen header={header} nav={isMe}>
      {/* ── More / Report / Block sheets ── */}
      {(moreOpen || reportOpen || blockOpen) && (
        <div onClick={() => { setMoreOpen(false); setReportOpen(false); setBlockOpen(false); setReportReason(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>

          {/* Main more menu */}
          {moreOpen && !reportOpen && !blockOpen && (
            <div onClick={e => e.stopPropagation()} style={{
              width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 0 32px',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
            }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 18px' }}/>
              {[{
                icon: Icons.share, label: 'Copy profile link',
                onClick: () => { setMoreOpen(false); flashToast('Profile link copied'); },
              }, {
                icon: Icons.flag, label: isBlocked ? 'Unblock @' + u.handle : 'Block @' + u.handle, danger: false,
                onClick: () => { setMoreOpen(false); setTimeout(() => setBlockOpen(true), 80); },
              }, {
                icon: Icons.close, label: 'Report @' + u.handle, danger: true,
                onClick: () => { setMoreOpen(false); setTimeout(() => setReportOpen(true), 80); },
              }].map(item => (
                <button key={item.label} onClick={item.onClick} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: item.danger ? 'var(--stamp-red)' : 'var(--ink)',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: item.danger ? '#FEE2E2' : 'var(--paper-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
                    <Ico d={item.icon} size={18}/>
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15 }}>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Report sheet */}
          {reportOpen && (
            <div onClick={e => e.stopPropagation()} style={{
              width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 0 32px',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
            }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 0' }}/>
              <div style={{ padding: '16px 20px 10px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Report @{u.handle}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 3 }}>Why are you reporting this account?</div>
              </div>
              {reportSent ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 8px', gap: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--paper-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ico d={Icons.check} size={24} style={{ color: 'var(--forest)' }}/>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Report submitted</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>We'll review this within 24 hrs</div>
                </div>
              ) : (
                <>
                  {REPORT_REASONS.map(reason => (
                    <button key={reason} onClick={() => setReportReason(reason)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 20px', background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink)', fontWeight: reportReason === reason ? 600 : 400 }}>{reason}</span>
                      {reportReason === reason && <Ico d={Icons.check} size={16} style={{ color: 'var(--stamp-red)' }}/>}
                    </button>
                  ))}
                  <div style={{ padding: '14px 20px 0' }}>
                    <Button variant="primary" style={{ width: '100%', justifyContent: 'center', opacity: reportReason ? 1 : 0.45 }}
                      onClick={reportReason ? handleReport : undefined}>
                      Submit report
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Block confirmation */}
          {blockOpen && (
            <div onClick={e => e.stopPropagation()} style={{
              width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 0 32px',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
            }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 0' }}/>
              <div style={{ padding: '20px 20px 6px', textAlign: 'center' }}>
                <Avatar name={u.name} color={u.color} size={56} style={{ margin: '0 auto 12px' }}/>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Block @{u.handle}?</div>
                <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 6, lineHeight: 1.55, maxWidth: 280, margin: '6px auto 0' }}>
                  They won't be able to see your profile, listings or messages. You can unblock them anytime from Settings.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '20px 20px 0' }}>
                <Button variant="primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--stamp-red)', borderColor: 'var(--stamp-red)' }}
                  onClick={handleBlock}>
                  {isBlocked ? 'Unblock' : 'Block'} @{u.handle}
                </Button>
                <Button variant="secondary" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setBlockOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* identity header */}
      <div style={{ padding: '18px 16px 0' }}>
        {/* ── Instagram-style header: avatar + 3 key stats, then name/bio full-width ── */}
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>

          {/* Avatar only — no extra slots that affect height */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              {isMe ? (
                <button onClick={() => push({ name: 'edit-avatar' })} aria-label="Change profile photo"
                  style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block' }}>
                  <Avatar name={u.name} color={u.color} photo={u.photo} size={76} frame={avatarFrame(u)} framePip={avatarFramePip(u)}/>
                  <span style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: 'var(--stamp-red)', color: 'var(--paper)', border: '2.5px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ico d={Icons.camera} size={13}/>
                  </span>
                </button>
              ) : (
                <Avatar name={u.name} color={u.color} photo={u.photo} size={76} frame={avatarFrame(u)} framePip={avatarFramePip(u)}/>
              )}
            </div>
          </div>

          {/* 4 key stats — followers, following, vouches in/out (consolidated, no separate stat bar below) */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
            {[{
              n: u.followers, label: 'Followers', onClick: () => push({ name: 'follows', user: u.handle, mode: 'followers' }),
            }, {
              n: u.following, label: 'Following', onClick: () => push({ name: 'follows', user: u.handle, mode: 'following' }),
            }, {
              n: u.vouchesReceived + u.vouchesGiven + (isMe ? Object.keys(vouched).length : (vouched[handle] ? 1 : 0)), label: 'Vouches', onClick: () => push({ name: 'vouches', user: u.handle, mode: 'received' }),
            }].map(({ n, label, accent, icon, onClick }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <span style={{ width: 1, alignSelf: 'center', height: 30, background: 'var(--border)', flexShrink: 0 }}/>}
                <button onClick={onClick} title={n.toLocaleString('en-IN')} style={{
                  flex: 1, minWidth: 0, background: 'none', border: 'none', padding: '4px 4px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {icon && <Ico d={icon} size={12} stroke={2.2} style={{ color: accent, flexShrink: 0 }}/>}
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: accent || 'var(--s900)', lineHeight: 1, letterSpacing: '-0.03em', fontFeatureSettings: '"tnum" 1', whiteSpace: 'nowrap' }}>{compactNum(n)}</span>
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--slate-400)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Name + handle + presence — full width below */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.025em', color: 'var(--ink)' }}>{u.name}</div>
            <BadgeShelf u={u} onOpen={() => push({ name: 'badges', user: handle })}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--slate-400)' }}>@{u.handle} · {u.city}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: presenceOf(u.handle) === 'Online now' ? 'var(--forest)' : 'var(--ink-ghost)', display: 'inline-block' }}/>
              <span style={{ fontSize: 12, color: presenceOf(u.handle) === 'Online now' ? 'var(--forest)' : 'var(--ink-faint)', fontWeight: presenceOf(u.handle) === 'Online now' ? 600 : 400 }}>{presenceOf(u.handle)}</span>
            </span>
          </div>
          {u.bio && <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.55, marginTop: 7 }}>{u.bio}</div>}
        </div>

        {/* Request a vouch shortcut — own profile only */}
        {isMe && (
          <button onClick={() => push({ name: 'vouch-request' })} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            marginTop: 8, padding: '10px 13px', borderRadius: 11,
            background: 'var(--verified-teal-soft)', border: '1px solid var(--verified-teal)',
            cursor: 'pointer', textAlign: 'left',
          }}>
            <Ico d={Icons.shield} size={16} style={{ color: 'var(--verified-teal)', flexShrink: 0 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--verified-teal)' }}>Request a vouch</span>
              <span style={{ fontSize: 12, color: 'var(--verified-teal)', opacity: 0.75, marginLeft: 6 }}>Ask collectors who know you</span>
            </div>
            <Ico d={Icons.chevR} size={15} style={{ color: 'var(--verified-teal)', opacity: 0.7, flexShrink: 0 }}/>
          </button>
        )}

        {/* engagement rewards — rank, XP & leaderboard entry */}
        <RewardCard u={u} isMe={isMe}/>

        {/* actions */}
        {isMe ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 14 }}>
            <div style={{ display: 'flex', gap: 9 }}>
              <Button variant={isFollowing ? 'secondary' : 'dark'} style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { toggleFollow(handle); flashToast(isFollowing ? `Unfollowed @${u.handle}` : `Following @${u.handle}`); }}>
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button variant="dark" style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.message} size={16}/>}
                onClick={() => push({ name: 'chat', user: handle })}>Message</Button>
            </div>
            <Button variant={isVouched ? 'secondary' : 'teal'} style={{ width: '100%', justifyContent: 'center', ...(isVouched ? { borderColor: 'var(--verified-teal)', color: 'var(--verified-teal)' } : null) }}
              icon={<Ico d={isVouched ? Icons.check : Icons.shield} size={17} stroke={isVouched ? 2.6 : 2}/>}
              onClick={() => push({ name: 'vouch', user: handle, mode: 'give' })}>
              {isVouched ? 'Vouched · Edit' : `Vouch for ${u.name.split(' ')[0]}`}
            </Button>
          </div>
        )}
      </div>

      {/* tabs */}
      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: 'var(--paper)', padding: '16px 16px 10px', marginTop: 8, borderBottom: '1px solid var(--slate-200)' }}>
        <Segmented value={tab} onChange={setTab}
          options={[
            { id: 'collection', label: 'Collection' },
            { id: 'posts', label: 'Posts' },
          ]}/>
      </div>

      <div style={{ padding: '14px 16px 28px' }}>
        {tab === 'collection' && <CollectionTab items={myItems} u={u} isMe={isMe}/>}
        {tab === 'posts' && (
          myPosts.length
            ? <div style={{ margin: '0 -16px' }}>
                {myPosts.map(p =>
                  p.type === 'iso'
                    ? <ISOCard key={p.id} post={p}/>
                    : <PostCard key={p.id} post={p}/>
                )}
              </div>
            : <EmptyNote>{isMe ? "You haven't posted yet. Tap + to showcase a piece." : 'No posts yet.'}</EmptyNote>
        )}
      </div>
    </Screen>
  );
}

function StatTile({ icon, n, l, accent, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
      background: 'none', border: 'none', padding: '14px 4px', cursor: onClick ? 'pointer' : 'default',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }} title={(n || 0).toLocaleString('en-IN')}>
        <Ico d={icon} size={15} stroke={1.9} style={{ color: accent || 'var(--ink-mute)' }}/>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', fontFeatureSettings: '"tnum" 1', lineHeight: 1 }}>{compactNum(n)}</span>
      </span>
      <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1, textAlign: 'center', color: 'var(--ink-faint)', letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{l}</span>
    </button>
  );
}

function StatDivider() {
  return <span style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '11px 0' }}/>;
}

// Followers / Following list (BRD v1.2 §9.11) — tappable counts open this
function FollowList({ route }) {
  const { push } = useNav();
  const { followed, toggleFollow, flashToast } = { ...useAppState(), ...useNav() };
  const subject = route.user === 'you' ? ME : userOf(route.user);
  const mode = route.mode || 'followers';
  // build a plausible list from the user directory
  const people = Object.values(USERS).filter(u => u.handle !== route.user);
  const count = mode === 'followers' ? subject.followers : subject.following;
  return (
    <Screen nav={false} header={<DetailHeader title={mode === 'followers' ? 'Followers' : 'Following'} subtitle={`@${subject.handle} · ${count.toLocaleString('en-IN')}`}/>}>
      <div style={{ padding: '8px 0 24px' }}>
        {people.map(u => {
          const isFollowing = followed[u.handle];
          return (
            <div key={u.handle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => push({ name: 'profile', user: u.handle })} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <Avatar name={u.name} color={u.color} size={44}/>
              </button>
              <button onClick={() => push({ name: 'profile', user: u.handle })} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: presenceOf(u.handle) === 'Online now' ? 'var(--forest)' : 'transparent' }}/>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>@{u.handle} · {u.deals} deals</div>
              </button>
              <Button size="sm" variant={isFollowing ? 'secondary' : 'dark'}
                onClick={() => { toggleFollow(u.handle); flashToast(isFollowing ? `Unfollowed @${u.handle}` : `Following @${u.handle}`); }}>
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

// ── Vouches: independent peer endorsements (not tied to a deal) ──
// A vouch can be given by anyone, for any reason — including history
// from outside Scorred. Anyone can also request a vouch.
const VOUCH_RELATIONS = [
  'Traded on Scorred', 'Traded off-app', 'Met in person',
  'Known from a community', 'Trusted collector friend', 'Vouched on request',
];
function vouchRelOf(handle, salt = 0) {
  const s = (handle || 'x').split('').reduce((a, c) => a + c.charCodeAt(0), 0) + salt;
  return VOUCH_RELATIONS[s % VOUCH_RELATIONS.length];
}

// Vouches received / given list — mirrors FollowList (BRD §8.2)
function VouchList({ route }) {
  const { push, flashToast } = useNav();
  const { followed, toggleFollow } = useAppState();
  const subject = route.user === 'you' ? ME : userOf(route.user);
  const isMe = route.user === 'you';
  const received = (route.mode || 'received') === 'received';
  const count = received ? subject.vouchesReceived : subject.vouchesGiven;
  const people = Object.values(USERS).filter(u => u.handle !== route.user);
  const list = people.slice(0, Math.max(0, Math.min(people.length, count)));

  return (
    <Screen nav={false} header={<DetailHeader
      title={received ? 'Vouches received' : 'Vouches given'}
      subtitle={`@${subject.handle} · ${count} ${received ? 'received' : 'given'}`}
      trailing={isMe && received
        ? <Button size="sm" variant="teal" icon={<Ico d={Icons.shield} size={15}/>} onClick={() => push({ name: 'vouch', user: 'you', mode: 'request' })}>Request</Button>
        : (!isMe ? <Button size="sm" variant="teal" icon={<Ico d={Icons.shield} size={15}/>} onClick={() => push({ name: 'vouch', user: subject.handle, mode: 'give' })}>Vouch</Button> : null)}/>}>
      <div style={{ padding: '8px 0 24px' }}>
        {list.map(u => {
          const isFollowing = followed[u.handle];
          const rel = vouchRelOf(u.handle, received ? 0 : 3);
          return (
            <div key={u.handle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => push({ name: 'profile', user: u.handle })} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <Avatar name={u.name} color={u.color} size={44}/>
              </button>
              <button onClick={() => push({ name: 'profile', user: u.handle })} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <Ico d={Icons.shield} size={12} stroke={2} style={{ color: 'var(--verified-teal)', flexShrink: 0 }}/>
                  <span style={{ fontSize: 12, color: 'var(--ink-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rel}</span>
                </div>
              </button>
              <Button size="sm" variant={isFollowing ? 'secondary' : 'dark'}
                onClick={() => { toggleFollow(u.handle); flashToast(isFollowing ? `Unfollowed @${u.handle}` : `Following @${u.handle}`); }}>
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          );
        })}
        {list.length === 0 && <EmptyNote>{received ? 'No vouches yet.' : "Hasn't vouched for anyone yet."}</EmptyNote>}
      </div>
    </Screen>
  );
}

// Vouch composer (give) + request flow — independent of any deal
function VouchView({ route }) {
  if ((route.mode || 'give') === 'request') return <VouchRequestView/>;
  const { pop, flashToast } = useNav();
  const u = userOf(route.user);
  const REL = [
    { id: 'app', label: 'Traded on Scorred', icon: Icons.swap },
    { id: 'offapp', label: 'Traded off-app', icon: Icons.bag },
    { id: 'person', label: 'Met in person', icon: Icons.users },
    { id: 'community', label: 'Known from a community', icon: Icons.globe },
    { id: 'friend', label: 'Trusted collector friend', icon: Icons.shield },
  ];
  const { vouched, addVouch, removeVouch, addNotif } = useAppState();
  const existing = vouched[route.user];
  const [rel, setRel] = React.useState(existing ? existing.rel : null);
  const [note, setNote] = React.useState(existing ? (existing.note || '') : '');
  const first = u.name.split(' ')[0];
  const editing = !!existing;
  const send = () => {
    if (!rel) return;
    const relLabel = (REL.find(r => r.id === rel) || {}).label || rel;
    addVouch(route.user, { rel, note });
    addNotif({ kind: 'vouch', user: 'you', text: `You vouched for @${u.handle} · ${relLabel}`, ref: { type: 'profile', id: u.handle } });
    pop();
    flashToast(editing ? `Vouch for @${u.handle} updated` : `Vouch sent to @${u.handle}`);
  };
  const remove = () => { removeVouch(route.user); pop(); flashToast(`Vouch for @${u.handle} removed`); };

  return (
    <Screen nav={false} header={<DetailHeader title={editing ? 'Edit vouch' : 'Vouch'} subtitle={'@' + u.handle}
      trailing={<Button size="sm" variant="teal" onClick={send} disabled={!rel}>{editing ? 'Update' : 'Send'}</Button>}/>}>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <Avatar name={u.name} color={u.color} size={46}/>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{u.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>@{u.handle} · {u.city}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14, padding: '12px 14px', background: 'var(--verified-teal-soft)', border: '1px solid var(--verified-teal)', borderRadius: 12 }}>
          <Ico d={Icons.shield} size={18} style={{ color: 'var(--verified-teal)', flexShrink: 0, marginTop: 1 }}/>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            A vouch is your personal endorsement — it doesn't need a sale or trade. Vouch for anyone you trust, including people you know from outside Scorred.
          </div>
        </div>

        <div style={{ marginTop: 18 }}><SectionLabel>How do you know them?</SectionLabel></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 10 }}>
          {REL.map(r => {
            const on = rel === r.id;
            return (
              <button key={r.id} onClick={() => setRel(r.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', cursor: 'pointer',
                padding: '12px 14px', borderRadius: 13,
                border: `1.5px solid ${on ? 'var(--verified-teal)' : 'var(--border-strong)'}`,
                background: on ? 'var(--verified-teal-soft)' : 'var(--paper-soft)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: on ? 'var(--verified-teal)' : 'var(--bone)', color: on ? 'var(--paper)' : 'var(--ink-mute)' }}>
                  <Ico d={r.icon} size={18}/>
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{r.label}</span>
                <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${on ? 'var(--verified-teal)' : 'var(--border-strong)'}`, background: on ? 'var(--verified-teal)' : 'transparent', color: 'var(--paper)' }}>
                  {on && <Ico d={Icons.check} size={12} stroke={3}/>}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 18 }}><SectionLabel>Add a note (optional)</SectionLabel></div>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
          placeholder={`Why do you vouch for ${first}?`}
          style={{ width: '100%', marginTop: 10, padding: '12px 13px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', resize: 'none', fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}/>

        <Button variant="teal" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }} disabled={!rel}
          icon={<Ico d={Icons.shield} size={17}/>} onClick={send}>{editing ? 'Update vouch' : `Vouch for ${first}`}</Button>
        {editing && (
          <Button variant="secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 10, color: 'var(--stamp-red)', borderColor: 'var(--stamp-red)' }}
            icon={<Ico d={Icons.close} size={16} stroke={2.4}/>} onClick={remove}>Remove vouch</Button>
        )}
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
          Your vouch will appear on @{u.handle}'s profile.
        </div>
      </div>
    </Screen>
  );
}

// Request a vouch — anyone can ask collectors who know them
function VouchRequestView() {
  const { push, flashToast } = useNav();
  const { addNotif } = useAppState();
  const [sent, setSent] = React.useState({});
  const people = Object.values(USERS);
  const sendRequest = (u) => {
    setSent(s => ({ ...s, [u.handle]: true }));
    addNotif({ kind: 'vouch', user: u.handle, text: `Vouch request sent to @${u.handle} — they will be notified.`, ref: { type: 'profile', id: u.handle } });
    flashToast(`Vouch request sent to @${u.handle}`);
  };
  return (
    <Screen nav={false} header={<DetailHeader title="Request a vouch" subtitle="Ask people who know you"/>}>
      <div style={{ padding: '14px 16px 6px' }}>
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--verified-teal-soft)', border: '1px solid var(--verified-teal)', borderRadius: 12 }}>
          <Ico d={Icons.shield} size={18} style={{ color: 'var(--verified-teal)', flexShrink: 0, marginTop: 1 }}/>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            Vouches build trust independent of trades. Ask collectors who know you — from a deal, a meet-up, a community, or anywhere — to vouch for you.
          </div>
        </div>
      </div>
      <div style={{ padding: '4px 0 24px' }}>
        {people.map(u => {
          const done = sent[u.handle];
          return (
            <div key={u.handle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => push({ name: 'profile', user: u.handle })} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <Avatar name={u.name} color={u.color} size={44}/>
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>@{u.handle} · {u.city}</div>
              </div>
              <Button size="sm" variant={done ? 'secondary' : 'dark'} disabled={done}
                onClick={() => sendRequest(u)}>
                {done ? 'Requested' : 'Request'}
              </Button>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

Object.assign(window, { ProfileView, FollowList, VouchList, VouchView, VouchRequestView });
