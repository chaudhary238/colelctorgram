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
function AppBar({ title, wordmark = false }) {
  const { setOverlay, push } = useNav();
  const { readNotifs } = useAppState();
  const unread = NOTIFICATIONS.filter(n => n.unread && !readNotifs[n.id]).length;
  return (
    <div style={{
      flexShrink: 0, paddingTop: 52, background: 'var(--paper)', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px 12px', minHeight: 44 }}>
        {/* create post — top left, Instagram-style */}
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

        {/* title / wordmark */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          {wordmark && <SealMark/>}
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: wordmark ? 22 : 24, letterSpacing: '-0.03em', color: 'var(--ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</span>
        </div>

        {/* search + notifications — top right */}
        <div style={{ display: 'flex', gap: 8 }}>
          <IconButton icon={<Ico d={Icons.search} size={20}/>} onClick={() => setOverlay({ name: 'search' })}/>
          <IconButton icon={<Ico d={Icons.bell} size={20}/>} badge={unread || null}
            onClick={() => setOverlay({ name: 'notifications' })}/>
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
      flexShrink: 0, paddingTop: 52,
      background: transparent ? 'transparent' : 'var(--paper)',
      borderBottom: transparent ? 'none' : '1px solid var(--border)',
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
            <button key={t.id} onClick={() => switchTab(t.id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '5px 0 2px', border: 'none', background: 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-faint)',
              fontWeight: active ? 600 : 500, fontSize: 10, cursor: 'pointer',
              position: 'relative', fontFamily: 'var(--font-body)',
            }}>
              {active && (
                <div style={{
                  position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                  width: 22, height: 3, background: 'var(--stamp-red)', borderRadius: '0 0 4px 4px',
                }}/>
              )}
              <Ico d={t.icon} size={23} stroke={active ? 2 : 1.75}/>
              {t.label}
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
