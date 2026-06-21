// ─────────────────────────────────────────────────────────────
// CollectorHub — app chrome: AppBar, DetailHeader, BottomNav
// ─────────────────────────────────────────────────────────────

// Wordmark seal used in the home app bar
function SealMark({ size = 26 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 6, background: 'var(--stamp-red)',
      color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size * 0.62,
      transform: 'rotate(-4deg)', boxShadow: 'var(--shadow-stamp)', flexShrink: 0,
    }}>C</div>
  );
}

// Top bar for root tabs:  [+ create]   Title / wordmark   [search] [bell•]
function AppBar({ title, wordmark = false, trailing }) {
  const { setOverlay, push } = useNav();
  const { readNotifs, liveNotifs } = useAppState();
  const allNotifs = [...(liveNotifs || []), ...NOTIFICATIONS];
  const unread = allNotifs.filter(n => n.unread && !readNotifs[n.id]).length;
  const msgUnread = INBOX.reduce((s, m) => s + m.unread, 0);

  // Web (Instagram-style): slim column header — wordmark/title only; actions live in the sidebar.
  if (window.CH_WEB) {
    return (
      <div style={{
        flexShrink: 0, background: 'var(--paper)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px 15px', minHeight: 30 }}>
          {wordmark && <SealMark size={24}/>}
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: wordmark ? 20 : 21, letterSpacing: '-0.03em', color: 'var(--ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flexShrink: 0, paddingTop: 52, background: 'var(--paper)', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 12px', minHeight: 44 }}>
        {/* create post + search — top left */}
        <button onClick={() => setOverlay({ name: 'compose' })} aria-label="Create post" style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: 'var(--ink)', color: 'var(--paper)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
          onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
          onPointerUp={(e) => e.currentTarget.style.transform = ''}
          onPointerLeave={(e) => e.currentTarget.style.transform = ''}>
          <Ico d={Icons.plus} size={22} stroke={2.2}/>
        </button>
        <IconButton icon={<Ico d={Icons.search} size={20}/>} onClick={() => setOverlay({ name: 'search' })}/>

        {/* title / wordmark */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, justifyContent: 'center' }}>
          {wordmark && <SealMark/>}
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: wordmark ? 22 : 24, letterSpacing: '-0.03em', color: 'var(--ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</span>
        </div>

        {/* messages + notifications — top right */}
        <div style={{ display: 'flex', gap: 8 }}>
          <IconButton icon={<Ico d={Icons.message} size={20}/>} badge={msgUnread || null}
            onClick={() => push({ name: 'inbox' })}/>
          <IconButton icon={<Ico d={Icons.bell} size={20}/>} badge={unread || null}
            onClick={() => setOverlay({ name: 'notifications' })}/>
          {trailing && <div style={{ marginLeft: 2 }}>{trailing}</div>}
        </div>
      </div>
    </div>
  );
}

// Header for pushed detail screens
function DetailHeader({ title, subtitle, trailing, onBack, transparent = false }) {
  const { pop } = useNav();
  return (
    <div style={{
      flexShrink: 0, paddingTop: window.CH_WEB ? 14 : 52,
      background: transparent ? 'transparent' : 'var(--paper)',
      borderBottom: transparent ? 'none' : '1px solid var(--border)',
      position: window.CH_WEB && !transparent ? 'sticky' : 'static', top: 0, zIndex: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 12px', minHeight: 40 }}>
        <button onClick={onBack || pop} aria-label="Back" style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: transparent ? 'rgba(20,17,15,0.5)' : 'transparent',
          color: transparent ? 'var(--paper)' : 'var(--ink)',
          border: transparent ? 'none' : '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          backdropFilter: transparent ? 'blur(6px)' : 'none',
        }}>
          <Ico d={Icons.back} size={20}/>
        </button>
        {title != null && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19,
              letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.15,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 1 }}>{subtitle}</div>}
          </div>
        )}
        {trailing && <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>{trailing}</div>}
      </div>
    </div>
  );
}

// Bottom tab bar — 5 tabs (BRD IA: Home / Market / Community / Events / Profile)
function BottomNav() {
  if (window.CH_WEB) return null;   // web uses the left sidebar instead
  const { tab, switchTab } = useNav();
  const tabs = [
    { id: 'feed',      label: 'Home',      icon: Icons.home },
    { id: 'market',    label: 'Market',    icon: Icons.bag },
    { id: 'community', label: 'Community', icon: Icons.users },
    { id: 'events',    label: 'Events',    icon: Icons.calendar },
    { id: 'me',        label: 'Profile',   icon: Icons.user },
  ];
  return (
    <div style={{ flexShrink: 0, paddingBottom: 30, background: 'var(--paper)', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', padding: '8px 4px 2px' }}>
        {tabs.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => switchTab(t.id)}
              onPointerDown={e => e.currentTarget.style.opacity = '0.65'}
              onPointerUp={e => e.currentTarget.style.opacity = ''}
              onPointerLeave={e => e.currentTarget.style.opacity = ''}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '5px 2px 2px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'opacity 80ms',
              }}>
              <div style={{
                width: 48, height: 28, borderRadius: 10,
                background: active ? 'var(--stamp-red-soft)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 200ms var(--ease-out)',
              }}>
                <Ico d={t.icon} size={21} stroke={active ? 2.2 : 1.75}
                  style={{ color: active ? 'var(--stamp-red)' : 'var(--ink-faint)', transition: 'color 200ms' }}/>
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 400,
                color: active ? 'var(--stamp-red)' : 'var(--ink-faint)',
                transition: 'color 200ms',
                letterSpacing: active ? '-0.01em' : '0.01em',
              }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Standard screen shell: appbar/header + scroll body + bottom nav
function Screen({ header, children, nav = true, footer, bodyRef, bg = 'var(--paper)' }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: bg, color: 'var(--ink)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.5,
    }}>
      {header}
      <div ref={bodyRef} style={{ flex: 1, overflow: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
        {children}
      </div>
      {footer}
      {nav && <BottomNav/>}
    </div>
  );
}

Object.assign(window, { SealMark, AppBar, DetailHeader, BottomNav, Screen });
