// ─────────────────────────────────────────────────────────────
// CollectorHub — Web shell (Instagram-style)
// Reuses every mobile screen/component. Swaps the chrome only:
//   bottom tab bar  →  left sidebar
//   device frame    →  centered feed column (+ right rail on Home)
// ─────────────────────────────────────────────────────────────

// Same route table as the mobile app (App.jsx)
const WEB_ROUTES = {
  feed:             (r) => <FeedView/>,
  market:           (r) => <MarketView/>,
  community:        (r) => <CommunityView/>,
  events:           (r) => <EventsView/>,
  profile:          (r) => <ProfileView route={r}/>,
  follows:          (r) => <FollowList route={r}/>,
  listing:          (r) => <ListingView route={r}/>,
  post:             (r) => <PostDetail route={r}/>,
  item:             (r) => <ItemDetail route={r}/>,
  'add-item':       (r) => <AddItemView route={r}/>,
  sell:             (r) => <SellView route={r}/>,
  'community-detail':(r) => <CommunityDetail route={r}/>,
  event:            (r) => <EventDetail route={r}/>,
  inbox:            (r) => <InboxView/>,
  chat:             (r) => <ChatView route={r}/>,
};

// ── Left sidebar ──────────────────────────────────────────────
function NavItem({ icon, label, active, badge, onClick, avatar }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button className="ch-nav" onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, width: '100%', textAlign: 'left',
        border: 'none', cursor: 'pointer', borderRadius: 12, padding: '11px 12px',
        background: hover ? 'var(--bone)' : 'transparent',
        color: 'var(--ink)', fontFamily: 'var(--font-body)',
        transition: 'background 120ms',
      }}>
      <span style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
        {avatar || <Ico d={icon} size={25} stroke={active ? 2.4 : 1.8}/>}
        {badge ? (
          <span style={{
            position: 'absolute', top: -5, right: -6, minWidth: 17, height: 17, padding: '0 4px',
            borderRadius: 999, background: 'var(--stamp-red)', color: 'var(--paper)',
            fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid var(--paper)',
          }}>{badge}</span>
        ) : null}
      </span>
      <span className="ch-nav-label" style={{
        fontSize: 16, fontWeight: active ? 700 : 500,
        letterSpacing: '-0.01em', whiteSpace: 'nowrap',
      }}>{label}</span>
    </button>
  );
}

function WebSidebar() {
  const { tab, switchTab, overlay, setOverlay } = useNav();
  const { readNotifs } = useAppState();
  const unread = NOTIFICATIONS.filter(n => n.unread && !readNotifs[n.id]).length;
  const onTab = (id) => tab === id && !overlay;

  return (
    <nav className="ch-sidebar" style={{
      flexShrink: 0, height: '100vh', boxSizing: 'border-box',
      borderRight: '1px solid var(--border)', background: 'var(--paper)',
      display: 'flex', flexDirection: 'column', padding: '26px 14px 22px',
    }}>
      {/* wordmark */}
      <button onClick={() => switchTab('feed')} style={{
        display: 'flex', alignItems: 'center', gap: 11, border: 'none', background: 'none',
        cursor: 'pointer', padding: '6px 12px 4px', marginBottom: 22,
      }}>
        <SealMark size={30}/>
        <span className="ch-nav-label" style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23,
          letterSpacing: '-0.035em', color: 'var(--ink)',
        }}>CollectorHub</span>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <NavItem icon={Icons.home}     label="Home"     active={onTab('feed')}      onClick={() => switchTab('feed')}/>
        <NavItem icon={Icons.search}   label="Search"   active={overlay && overlay.name === 'search'} onClick={() => setOverlay({ name: 'search' })}/>
        <NavItem icon={Icons.bag}      label="Market"   active={onTab('market')}    onClick={() => switchTab('market')}/>
        <NavItem icon={Icons.users}    label="Community" active={onTab('community')} onClick={() => switchTab('community')}/>
        <NavItem icon={Icons.calendar} label="Events"   active={onTab('events')}    onClick={() => switchTab('events')}/>
        <NavItem icon={Icons.bell}     label="Notifications" badge={unread || null}
          active={overlay && overlay.name === 'notifications'} onClick={() => setOverlay({ name: 'notifications' })}/>
        <NavItem icon={Icons.plusCircle} label="Create" onClick={() => setOverlay({ name: 'compose' })}/>
        <NavItem label="Profile" active={onTab('me')} onClick={() => switchTab('me')}
          avatar={<Avatar name={ME.name} color={ME.color} size={26}/>}/>
      </div>

      <NavItem icon={Icons.settings} label="Settings"
        onClick={() => { if (window.chReset) window.chReset(); }}/>
    </nav>
  );
}

// ── Right rail (Home only) ────────────────────────────────────
function RailFollow({ handle }) {
  const { followed, toggleFollow } = useAppState();
  const { push, flashToast } = useNav();
  const u = userOf(handle);
  const following = followed[handle];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <button onClick={() => push({ name: 'profile', user: handle })} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
        <Avatar name={u.name} color={u.color} size={42} verified={u.tier === 'Top Seller' || u.tier === 'Trusted'}/>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{u.handle}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.tier} · {u.deals} deals</div>
      </div>
      <button onClick={() => { toggleFollow(handle); flashToast(following ? `Unfollowed @${u.handle}` : `Following @${u.handle}`); }}
        style={{
          border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0,
          color: following ? 'var(--ink-faint)' : 'var(--stamp-red)',
          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12.5,
        }}>{following ? 'Following' : 'Follow'}</button>
    </div>
  );
}

function WebRightRail() {
  const { push } = useNav();
  const { followed } = useAppState();
  const suggestions = Object.keys(USERS).filter(h => !followed[h]).slice(0, 4);
  return (
    <aside className="ch-rail" style={{ width: 320, flexShrink: 0, paddingTop: 28, boxSizing: 'border-box' }}>
      {/* current user */}
      <button onClick={() => push({ name: 'profile', user: 'you' })} style={{
        display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left',
        border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px 22px',
      }}>
        <Avatar name={ME.name} color={ME.color} size={50}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>@{ME.handle}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>{ME.name} · {ME.tier}</div>
        </div>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 14px' }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-mute)' }}>Suggested collectors</span>
        <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>See all</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 6px' }}>
        {suggestions.map(h => <RailFollow key={h} handle={h}/>)}
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--ink-ghost)', lineHeight: 1.7, padding: '28px 6px 0' }}>
        About · Help · Press · API · Communities · Events · Privacy · Terms<br/>
        <span style={{ letterSpacing: '0.04em' }}>© 2026 CollectorHub</span>
      </div>
    </aside>
  );
}

// ── Router (same stack model as the mobile app) ───────────────
function WebRouter() {
  const { tab, stacks, overlay } = useNav();
  const stack = stacks[tab];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {stack.map((route, i) => (
        <div key={tab + '-' + i + '-' + route.name} style={{
          position: 'absolute', inset: 0, zIndex: i,
          visibility: i === stack.length - 1 ? 'visible' : 'hidden',
        }}>
          <StackedScreen depth={i}>
            {(WEB_ROUTES[route.name] || WEB_ROUTES.feed)(route)}
          </StackedScreen>
        </div>
      ))}
      {overlay && overlay.name === 'compose' && <ComposeOverlay community={overlay.community}/>}
      {overlay && overlay.name === 'search' && <SearchOverlay/>}
      {overlay && overlay.name === 'notifications' && <NotificationsOverlay/>}
      <Toast/>
    </div>
  );
}

// On the Home tab (root, no overlay) show the right rail beside the column.
// The middle column is ONE consistent width across every tab, sitting flush
// against the sidebar (Instagram-style).
const WEB_COL_W = 680;
function WebStage() {
  const { tab, stacks, overlay } = useNav();
  const stack = stacks[tab];
  const showRail = tab === 'feed' && stack.length === 1 && !overlay;
  return (
    <main className="ch-main" style={{
      flex: 1, minWidth: 0, height: '100vh', overflow: 'hidden',
      display: 'flex', justifyContent: 'flex-start',
    }}>
      <div className="ch-content" style={{
        display: 'flex', gap: 32, height: '100vh', flex: 1, minWidth: 0,
      }}>
        <div className="ch-col" style={{
          width: WEB_COL_W, flexShrink: 0, height: '100vh', position: 'relative', overflow: 'hidden',
          borderRight: '1px solid var(--border)',
          background: 'var(--paper)',
        }}>
          <WebRouter/>
        </div>
        {showRail && <WebRightRail/>}
      </div>
    </main>
  );
}

function WebApp() {
  return (
    <AppStateProvider>
      <NavProvider>
        <div className="ch-shell" style={{
          display: 'flex', width: '100%', minHeight: '100vh',
          background: 'var(--bone)', color: 'var(--ink)',
        }}>
          <WebSidebar/>
          <WebStage/>
        </div>
      </NavProvider>
    </AppStateProvider>
  );
}

ReactDOM.createRoot(document.getElementById('web-mount')).render(<WebApp/>);
