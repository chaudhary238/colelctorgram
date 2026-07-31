// ─────────────────────────────────────────────────────────────
// CollectorHub — app chrome: AppBar, DetailHeader, BottomNav
// ─────────────────────────────────────────────────────────────

// Scorred icon mark — cropped PNG from brand assets
function SealMark({ size = 26, bg = null }) {
  const iconSrc = (window.__resources && window.__resources.iconCrop) || "../uploads/icon-crop.png";
  const img = <img src={iconSrc} width={size} height={size} style={{ objectFit: 'contain', display: 'block', flexShrink: 0 }}/>;
  if (!bg) return img;
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.22), background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src={iconSrc} width={size * 0.72} height={size * 0.72} style={{ objectFit: 'contain', display: 'block' }}/>
    </div>
  );
}

// Scorred wordmark — cropped PNG from brand assets
function ScorredWordmark({ fontSize = 22 }) {
  const h = Math.max(22, Math.round(fontSize * 1.15));
  const w = Math.round(h * (3487 / 842)); // natural aspect ratio
  const wordmarkSrc = (window.__resources && window.__resources.wordmarkCrop) || "../uploads/wordmark-crop.png";
  return <img src={wordmarkSrc} width={w} height={h} style={{ objectFit: 'contain', display: 'block', flexShrink: 0 }}/>;
}

// Top bar for root tabs:  [+ create·red] [search] — Wordmark / Title — [events] [activity•]
function AppBar({ title, wordmark = false, trailing, leading }) {
  const { setOverlay, push } = useNav();
  const { readNotifs, liveNotifs } = useAppState();
  const allNotifs = [...(liveNotifs || []), ...NOTIFICATIONS];
  const unread = allNotifs.filter(n => n.unread && !readNotifs[n.id]).length;
  const msgUnread = INBOX.reduce((s, m) => s + m.unread, 0);

  // Web (Instagram-style): slim column header — wordmark/title only; actions live in the sidebar.
  if (window.CH_WEB) {
    return (
      <div style={{
        flexShrink: 0, background: 'var(--paper)', borderBottom: '1px solid var(--slate-200)',
        position: 'sticky', top: 0, zIndex: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px 15px', minHeight: 30 }}>
          {wordmark
            ? <ScorredWordmark fontSize={20} textColor="var(--ink)" redColor="var(--stamp-red)"/>
            : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 21, letterSpacing: '-0.03em', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          }
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flexShrink: 0, paddingTop: 52, background: 'var(--paper)', borderBottom: '1px solid var(--slate-200)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 14px', minHeight: 44 }}>
        {/* primary action + search — top left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {leading}
          <IconButton icon={<Ico d={Icons.search} size={20}/>} onClick={() => setOverlay({ name: 'search' })}/>
        </div>

        {/* title / wordmark */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, justifyContent: 'center' }}>
          {wordmark
            ? <ScorredWordmark fontSize={22} textColor="var(--ink)" redColor="var(--stamp-red)"/>
            : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.03em', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          }
        </div>

        {/* events + activity inbox — top right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <IconButton icon={<Ico d={Icons.calendar} size={20}/>} onClick={() => push({ name: 'events' })}/>
          <IconButton icon={<Ico d={Icons.bell} size={20}/>} badge={(unread + msgUnread) || null}
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
      borderBottom: transparent ? 'none' : '1px solid var(--slate-200)',
      position: window.CH_WEB && !transparent ? 'sticky' : 'static', top: 0, zIndex: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 14px', minHeight: 40 }}>
        <button onClick={onBack || pop} aria-label="Back" style={{
          width: 40, height: 40, borderRadius: 13, flexShrink: 0,
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
  if (window.CH_WEB) return null;
  const { tab, switchTab } = useNav();
  const tabs = [
    { id: 'feed',      label: 'Home',      icon: Icons.home },
    { id: 'market',    label: 'Market',    icon: Icons.bag },
    { id: 'database',  label: 'Explore',   icon: Icons.grid },
    { id: 'community', label: 'Community', icon: Icons.users },
    { id: 'me',        label: 'My Space',  icon: Icons.user },
  ];
  return (
    <div style={{ flexShrink: 0, paddingBottom: 30, background: 'var(--paper)', boxShadow: '0 -1px 0 var(--slate-200), 0 -8px 32px rgba(0,0,0,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', padding: '8px 4px 2px' }}>
        {tabs.map(t => {
          const active = tab === t.id;
          const isHome = t.id === 'feed';
          return (
            <button key={t.id} onClick={() => switchTab(t.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 2px 2px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'opacity 80ms' }}>
              <div style={{
                width: active ? 56 : 44, height: 32, borderRadius: 16,
                background: active ? 'var(--stamp-red)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 220ms var(--ease-out)',
                boxShadow: active ? '0 2px 12px rgba(255,36,66,0.3)' : 'none',
              }}>
                {active && isHome
                  ? <img src={(window.__resources && window.__resources.iconCropWhite) || "../uploads/icon-crop-white.png"} width={21} height={21} style={{ objectFit: 'contain', display: 'block' }}/>
                  : <Ico d={t.icon} size={20} stroke={active ? 2.3 : 1.7}
                      style={{ color: active ? '#fff' : 'var(--slate-400)', transition: 'color 200ms' }}/>}
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? 'var(--stamp-red)' : 'var(--slate-400)', transition: 'color 200ms', letterSpacing: active ? '-0.01em' : '0.01em' }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Standard screen shell: appbar/header + scroll body + bottom nav
function Screen({ header, children, nav = true, footer, bodyRef, bg = 'var(--canvas)' }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: bg, color: 'var(--ink)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.6,
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
