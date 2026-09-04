// ─────────────────────────────────────────────────────────────
// Engagement rewards — Collector XP, ranks & leaderboards
// RewardCard (profile), RewardsView (earn + ladder), LeaderboardView
// ─────────────────────────────────────────────────────────────

// Colored rank tile — flat fill, rank icon (or padlock when locked)
function TierBadge({ tier, size = 40, locked = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3, flexShrink: 0, position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: locked ? 'var(--bone)' : tier.c, color: locked ? 'var(--ink-ghost)' : 'var(--paper)',
      boxShadow: locked ? 'none' : `0 2px 8px ${tier.c}55, inset 0 1px 0 rgba(255,255,255,0.35)`,
    }}>
      {!locked && <span style={{ position: 'absolute', top: '-30%', left: '-10%', width: '70%', height: '70%', borderRadius: '50%', background: 'rgba(255,255,255,0.28)', filter: 'blur(2px)' }}/>}
      <Ico d={locked ? Icons.lock : tier.icon} size={Math.round(size * 0.5)} stroke={2} style={{ position: 'relative' }}/>
    </div>
  );
}

// Season medallion — circular metal badge earned at end of a cycle
function SeasonBadge({ b, size = 40 }) {
  const m = badgeMeta(b);
  return (
    <div title={`${b.title} · ${b.period}`} style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center', background: m.fill, color: m.ink,
      boxShadow: `inset 0 0 0 ${Math.max(1.5, size * 0.055)}px ${m.ring}, 0 1px 5px ${m.ring}55`,
    }}>
      <span style={{ position: 'absolute', top: '8%', left: '14%', width: '46%', height: '38%', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', filter: 'blur(1px)' }}/>
      <Ico d={m.icon} size={Math.round(size * 0.46)} stroke={2.2} style={{ position: 'relative' }}/>
    </div>
  );
}

// BadgeIcon — single badge tile for shelf (all types)
function BadgeIcon({ b, size = 26, onTap }) {
  const TIER_EMOJI = { gold: '🥇', silver: '🥈', bronze: '🥉', finalist: '🏅' };
  const TIER_NAME = { gold: 'Gold Badge', silver: 'Silver Badge', bronze: 'Bronze Badge', finalist: 'Finalist Badge', rank: b.label, firstStart: b.label };
  const tooltipTitle = b.type === 'season' ? TIER_NAME[b.tier] || 'Season Badge' : b.label;
  return (
    <button onClick={e => { e.stopPropagation(); onTap && onTap(b); }}
      title={tooltipTitle}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
      {(b.type === 'season' || b.type === 'rank') ? (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: b.color, color: b.textColor || '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `inset 0 0 0 ${Math.max(1.5, size * 0.055)}px rgba(255,255,255,0.25), 0 1px 4px rgba(0,0,0,0.2)`,
          fontSize: size * 0.52,
        }}>{TIER_EMOJI[b.tier] || '🏅'}</div>
      ) : (
        <div style={{
          width: size, height: size, borderRadius: Math.round(size * 0.3),
          background: b.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.5, boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        }}>{b.emoji}</div>
      )}
    </button>
  );
}

// BadgeShelf — profile header: ALL badge types, each individually tappable.
// Tap a badge → BadgeSheet explanation. "View all" text → trophy case.
function BadgeShelf({ u, onOpen, style }) {
  const [sheetBadge, setSheetBadge] = React.useState(null);
  const all = allBadgesOf(u);
  if (!all.length) return null;

  // Group: firstStart badges first (by id), then season by tier
  // Max 3 slots — firstStart has priority
  const groups = {};
  // First: firstStart badges (each unique, no stacking)
  all.filter(b => b.type === 'firstStart').forEach(b => {
    const key = 'first-' + b.id;
    if (!groups[key]) groups[key] = { b, count: 1 };
  });
  // Then: season badges grouped by tier
  all.filter(b => b.type === 'season').forEach(b => {
    const key = 'season-' + (b.tier || 'finalist');
    if (!groups[key]) groups[key] = { b, count: 0 };
    groups[key].count++;
  });
  const slots = Object.values(groups).slice(0, 3);
  const overflow = Object.values(groups).length - slots.length;
  return (
    <>
      {sheetBadge && <BadgeSheet badge={sheetBadge} onClose={() => setSheetBadge(null)}/>}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, ...style }}>
        {slots.map(({ b, count }, i) => (
          <span key={(b.id || b.label) + i} style={{ marginLeft: i ? -6 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px var(--paper)', position: 'relative' }}>
            <BadgeIcon b={b} size={26} onTap={setSheetBadge}/>
            {count > 1 && (
              <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 14, height: 14, borderRadius: 999, background: 'var(--stamp-red)', color: '#fff', fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid var(--paper)', lineHeight: 1 }}>{count}</span>
            )}
          </span>
        ))}
        {overflow > 0 && (
          <button onClick={onOpen} style={{
            marginLeft: -4, width: 26, height: 26, borderRadius: '50%',
            background: 'var(--bone)', border: '2px solid var(--paper)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9, color: 'var(--ink-mute)',
            cursor: 'pointer',
          }}>+{overflow}</button>
        )}
        <button onClick={onOpen} style={{
          marginLeft: 4, padding: '3px 8px', borderRadius: 999, border: '1px solid var(--border)',
          background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11,
          color: 'var(--ink-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {all.length} badge{all.length !== 1 ? 's' : ''}
          <Ico d={Icons.chevR} size={12} style={{ color: 'var(--ink-ghost)' }}/>
        </button>
      </div>
    </>
  );
}

// Progress helpers shared by card + screen
function rankProgress(xp) {
  const tier = tierOf(xp);
  const next = nextTierOf(xp);
  const span = next ? next.at - tier.at : 1;
  const pct = next ? Math.min(100, Math.max(3, Math.round(((xp - tier.at) / span) * 100))) : 100;
  const need = next ? next.at - xp : 0;
  return { tier, next, pct, need, idx: tierIndexOf(xp) };
}

// Small archetype pill — "what they contribute"
function ArchetypeChip({ arche, size = 'md' }) {
  const sm = size === 'sm';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: sm ? 4 : 5, padding: sm ? '2px 7px 2px 5px' : '3px 9px 3px 6px', borderRadius: 999, background: 'var(--bone)', border: `1px solid ${arche.c}33` }}>
      <span style={{ width: sm ? 15 : 18, height: sm ? 15 : 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: arche.c, color: 'var(--paper)' }}>
        <Ico d={arche.icon} size={sm ? 9 : 11} stroke={2.2}/>
      </span>
      <span style={{ fontSize: sm ? 11 : 12, fontWeight: 700, color: arche.c, letterSpacing: '0.01em' }}>{arche.name}</span>
    </span>
  );
}

// Compact rank card — lives in the profile header (own + others)
function RewardCard({ u, isMe }) {
  const { push } = useNav();
  const { tier, next, pct, need, idx } = rankProgress(u.xp);
  return (
    <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'stretch' }}>
      <div style={{ flex: 1, background: `color-mix(in oklab, ${tier.c} 12%, var(--paper-soft))`, border: `1px solid color-mix(in oklab, ${tier.c} 45%, var(--border))`, borderRadius: 14, padding: '11px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TierBadge tier={tier} size={34}/>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.01em', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink)' }}>{tier.name}</span>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', fontFeatureSettings: '"tnum" 1', flexShrink: 0 }}>{u.xp.toLocaleString('en-IN')} <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--ink-soft)', letterSpacing: '0.08em' }}>XP</span></div>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.55)', overflow: 'hidden', margin: '8px 0 5px' }}>
          <div style={{ height: '100%', width: pct + '%', background: tier.c, borderRadius: 999, transition: 'width 320ms var(--ease-out)' }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 11, gap: 8 }}>
          <span style={{ color: 'var(--ink-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {next
              ? <><b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{need.toLocaleString('en-IN')} XP</b> to {next.name}</>
              : <span style={{ color: tier.c, fontWeight: 600 }}>Top rank reached</span>}
          </span>
          <span style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', flexShrink: 0 }}>+{u.xpWeek} this week</span>
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
          {isMe && (
            <Button size="sm" variant="dark" style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.zap} size={14}/>}
              onClick={() => push({ name: 'rewards', user: 'you' })}>Earn points</Button>
          )}
          <Button size="sm" variant="secondary" style={{ flex: 1, justifyContent: 'center', background: 'var(--paper)', borderColor: tier.c }} icon={<Ico d={Icons.trophy} size={14}/>}
            onClick={() => push({ name: 'leaderboard' })}>Leaderboard</Button>
        </div>
      </div>
      {isMe && null}
    </div>
  );
}

function EarnRow({ a }) {
  const { push, setOverlay } = useNav();
  const sub = a.type === 'once'
    ? (a.progress ? `${a.progress.done}/${a.progress.total} steps done` : 'One-time')
    : a.type === 'daily' ? 'Once a day' : (a.note || 'Repeatable');

  function handleTap() {
    if (!a.nav) return;
    if (a.nav.name === 'compose') { setOverlay({ name: 'compose', mode: a.nav.mode }); return; }
    push(a.nav);
  }

  return (
    <button onClick={handleTap} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 13, border: '1px solid var(--border)', background: 'var(--paper-soft)', width: '100%', textAlign: 'left', cursor: a.nav ? 'pointer' : 'default' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bone)', color: 'var(--ink-mute)' }}>
        <Ico d={a.icon} size={18}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{a.label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 1 }}>{sub}</div>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13.5, color: 'var(--verified-teal)', flexShrink: 0 }}>+{a.xp}</span>
      {a.nav && <Ico d={Icons.chevR} size={14} style={{ color: 'var(--ink-ghost)', flexShrink: 0 }}/>}
    </button>
  );
}

// Rewards screen — hero + daily check-in + ways to earn + rank ladder
function RewardsView() {
  const { push, flashToast } = useNav();
  const u = ME;
  const { tier, next, pct, need, idx } = rankProgress(u.xp);
  const [checked, setChecked] = React.useState(false);

  return (
    <Screen nav={false} header={<DetailHeader title="Rewards" subtitle="Collector XP"
      trailing={<Button size="sm" variant="secondary" icon={<Ico d={Icons.trophy} size={15}/>} onClick={() => push({ name: 'leaderboard' })}>Ranks</Button>}/>}>
      <div style={{ padding: '16px' }}>
        {/* hero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 16px 22px', borderRadius: 18, border: '1px solid var(--border)', background: 'var(--paper-soft)' }}>
          <TierBadge tier={tier} size={66}/>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em', marginTop: 12 }}>{tier.name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', letterSpacing: '0.04em', marginTop: 3 }}>
            {u.xp.toLocaleString('en-IN')} XP
          </div>
          <div style={{ width: '100%', marginTop: 16 }}>
            <div style={{ height: 10, borderRadius: 999, background: 'var(--bone)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: pct + '%', background: tier.c, borderRadius: 999, transition: 'width 360ms var(--ease-out)' }}/>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 9, lineHeight: 1.5 }}>
              {next
                ? <><b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{need.toLocaleString('en-IN')} XP</b> to unlock <b style={{ color: tier.c }}>{next.name}</b></>
                : 'You’ve reached the top rank — Legend.'}
            </div>
          </div>
        </div>

        {/* daily check-in */}
        <style>{`
          @keyframes scr-pop-in { 0% { opacity: 0; transform: scale(0.4); } 70% { transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } }
          .scr-pop-in { animation: scr-pop-in 400ms cubic-bezier(.34,1.56,.64,1) both; }
        `}</style>
        <button onClick={() => { if (!checked) { setChecked(true); flashToast('Checked in · +5 XP'); } }} disabled={checked} style={{
          width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 14, textAlign: 'left',
          cursor: checked ? 'default' : 'pointer',
          border: `1px solid ${checked ? 'var(--border)' : 'var(--grail-gold)'}`,
          background: checked ? 'var(--paper-soft)' : 'var(--grail-gold-soft)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: checked ? 'var(--bone)' : 'var(--grail-gold)', color: checked ? 'var(--ink-faint)' : 'var(--ink)' }}>
            {checked ? (
              <img className="scr-pop-in" src={(window.__resources && window.__resources.iconCrop) || "../uploads/icon-crop.png"} width={24} height={24} style={{ objectFit: 'contain', display: 'block' }}/>
            ) : <Ico d={Icons.zap} size={20} stroke={2.2}/>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{checked ? 'Checked in today' : 'Daily check-in'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 1 }}>{checked ? 'Come back tomorrow for more' : 'Tap to claim today’s bonus'}</div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: checked ? 'var(--ink-faint)' : 'var(--grail-gold-deep)' }}>+5</span>
        </button>

{/* ways to earn */}
        <div style={{ marginTop: 24 }}><SectionLabel>Ways to earn</SectionLabel></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 11 }}>
          {EARN_ACTIONS.filter(a => a.id !== 'checkin').map(a => <EarnRow key={a.id} a={a}/>)}
        </div>

        {/* rank ladder */}
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <SectionLabel>Rank ladder</SectionLabel>
          <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>Lifetime · never resets</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 11 }}>
          {REWARD_TIERS.map((t, i) => {
            const reached = u.xp >= t.at;
            const current = i === idx;
            return (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 13,
                border: `1.5px solid ${current ? t.c : 'var(--border)'}`, background: current ? 'var(--paper)' : 'var(--paper-soft)',
                opacity: reached || current ? 1 : 0.7 }}>
                <TierBadge tier={t} size={40} locked={!reached}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{t.name}</span>
                    {current && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9.5, letterSpacing: '0.08em', color: t.c, border: `1px solid ${t.c}`, borderRadius: 999, padding: '2px 7px', textTransform: 'uppercase' }}>You</span>}
                  </div>

                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12.5, color: reached ? 'var(--ink)' : 'var(--ink-faint)' }}>{t.at.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--ink-ghost)', letterSpacing: '0.08em', marginTop: 2 }}>XP</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}

// Leaderboard — weekly / lifetime with podium + ranked list
const MEDALS = ['var(--grail-gold)', '#A6A8AC', '#C08552'];

// When does each board reset? Weekly → next Monday; Lifetime never resets.
function resetInfo(period) {
  if (period === 'all') return { label: 'Lifetime total — never resets', soon: false };
  const now = new Date();
  const d = (8 - now.getDay()) % 7 || 7;
  return { label: `Resets Monday · in ${d} day${d > 1 ? 's' : ''}`, soon: d <= 1 };
}

function LeaderboardView() {
  const { push } = useNav();
  const [period, setPeriod] = React.useState('week'); // 'week' | 'all'
  const rows = leaderboard(period);
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const myIndex = rows.findIndex(r => r.isMe);
  const me = rows[myIndex];
  const periodLabel = { week: 'this week', all: 'lifetime' }[period];
  const unit = 'XP';

  return (
    <Screen nav={false} header={<DetailHeader title="Leaderboard" subtitle="Top collectors"/>}>
      <div style={{ padding: '14px 16px 10px', position: 'sticky', top: 0, zIndex: 3, background: 'var(--paper)' }}>
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
          {[{ id: 'week', label: 'Weekly' }, { id: 'all', label: 'Lifetime' }].map(o => (
            <FilterChip key={o.id} active={period === o.id} onClick={() => setPeriod(o.id)}>{o.label}</FilterChip>
          ))}
        </div>
        {/* reset clock */}
        {(() => { const ri = resetInfo(period); return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9, fontSize: 11.5, color: ri.soon ? 'var(--stamp-red)' : 'var(--ink-faint)' }}>
            <Ico d={Icons.clock} size={13} stroke={2}/>
            <span>{ri.label}</span>
          </div>
        ); })()}
      </div>

      {/* end-of-season prize — makes the reset worth chasing */}
      {period !== 'all' && (
        <div style={{ margin: '14px 16px 0', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 14, background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)' }}>
          <span style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--grail-gold)', color: '#5A3D00' }}>
            <Ico d={Icons.gift} size={17} stroke={2.1}/>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Win a badge when the season ends</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 1 }}>Top 3 earn a permanent badge + up to 300 bonus XP toward your rank</div>
          </div>
        </div>
      )}

      {/* podium — 2 / 1 / 3 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 14, padding: '22px 16px 8px' }}>
        {[top3[1], top3[0], top3[2]].filter(Boolean).map(r => {
          const rank = rows.indexOf(r) + 1;
          const first = rank === 1;
          const medal = MEDALS[rank - 1];
          return (
            <button key={r.key} onClick={() => push({ name: 'profile', user: r.key })} style={{
              flex: 1, maxWidth: 108, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ borderRadius: '50%', padding: 3, background: medal }}>
                  <Avatar name={r.name} color={r.color} size={first ? 68 : 54}/>
                </div>
                <div style={{ position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)', width: 23, height: 23, borderRadius: '50%', background: medal, color: rank === 1 ? 'var(--ink)' : 'var(--paper)', border: '2px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{['🥇','🥈','🥉'][rank-1]}</div>
              </div>
              <div style={{ marginTop: 7, fontSize: 13, fontWeight: 700, color: 'var(--ink)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.isMe ? 'You' : r.name.split(' ')[0]}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: r.tier.c }}/>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{r.points.toLocaleString('en-IN')}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* your standing */}
      {myIndex >= 0 && (
        <div style={{ margin: '12px 16px 6px', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 13, background: 'var(--ink)', color: 'var(--paper)' }}>
          <Ico d={Icons.trend} size={18}/>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>You’re <b style={{ fontFamily: 'var(--font-mono)' }}>#{myIndex + 1}</b> {periodLabel}</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14 }}>{me.points.toLocaleString('en-IN')} <span style={{ fontSize: 10, opacity: 0.7 }}>{unit}</span></span>
        </div>
      )}

      {/* ranks 4+ */}
      <div style={{ padding: '4px 0 24px' }}>
        {rest.map(r => {
          const rank = rows.indexOf(r) + 1;
          return (
            <button key={r.key} onClick={() => push({ name: 'profile', user: r.key })} style={{
              display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left', cursor: 'pointer',
              background: r.isMe ? 'var(--verified-teal-soft)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', padding: '11px 16px' }}>
              <span style={{ width: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: r.isMe ? 'var(--verified-teal)' : 'var(--ink-faint)' }}>{rank}</span>
              <Avatar name={r.name} color={r.color} size={40}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{r.isMe ? 'You' : r.name}</span>
                  <FeedBadgePill u={r} onClick={() => {}}/>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: r.tier.c }}/>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{r.tier.name}</span>
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14.5, color: 'var(--ink)', fontFeatureSettings: '"tnum" 1' }}>{r.points.toLocaleString('en-IN')}</span>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

// Trophy case — all season + first-start badges a member has earned
function BadgesView({ route }) {
  const { push } = useNav();
  const u = route.user === 'you' ? ME : userOf(route.user);
  const isMe = route.user === 'you';
  const all = allBadgesOf(u);
  const first = u.name.split(' ')[0];
  const [sheetBadge, setSheetBadge] = React.useState(null);
  const seasonOnly = all.filter(b => b.type === 'season');
  const totalXp = seasonOnly.reduce((s, b) => {
    const m = badgeMeta({ tier: b.id ? (b.label.includes('Gold') ? 'gold' : b.label.includes('Silver') ? 'silver' : b.label.includes('Bronze') ? 'bronze' : 'finalist') : 'finalist' });
    return s + (m.xp || 0);
  }, 0);

  return (
    <Screen nav={false} header={<DetailHeader title="Badges" subtitle={isMe ? 'Your trophy case' : `${first}'s trophy case`}/>}>
      {sheetBadge && <BadgeSheet badge={sheetBadge} onClose={() => setSheetBadge(null)}/>}
      <div style={{ padding: '16px' }}>
        {all.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--ink-faint)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-ghost)' }}>
                <Ico d={Icons.trophy} size={26}/>
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>No badges yet</div>
            <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{isMe ? 'Finish in a weekly league to earn your first badge.' : `${first} hasn't earned any badges yet.`}</div>
            {isMe && <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}><Button size="sm" variant="dark" icon={<Ico d={Icons.trophy} size={15}/>} onClick={() => push({ name: 'leaderboard' })}>See leaderboard</Button></div>}
          </div>
        ) : (
          <>
            {/* Featured — top badge (firstStart priority, else top season tier) */}
            {(() => {
              const featured = all[0];
              const TIER_LABEL = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze', finalist: 'Finalist' };
              const label = featured.type === 'firstStart' ? featured.label
                : featured.type === 'season' ? (TIER_LABEL[featured.tier] || 'Season') + ' Badge'
                : featured.label;
              const sub = featured.type === 'firstStart' ? 'Permanent · never expires'
                : featured.type === 'season' ? `Season · ${featured.period || 'League'}`
                : 'Rank badge';
              // Unique badge type count (not raw badge count)
              const groups = {};
              all.forEach(b => {
                const key = b.type === 'season' ? 'season-' + (b.tier || 'finalist')
                  : b.type === 'firstStart' ? 'first-' + b.id : 'rank';
                groups[key] = true;
              });
              const uniqueCount = Object.keys(groups).length;
              const totalCount = all.filter(b => b.type === 'season').length;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '22px 16px', borderRadius: 18, border: '1px solid var(--border)', background: 'var(--paper-soft)' }}>
                  <button onClick={() => setSheetBadge(featured)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <BadgeIcon b={featured} size={76} onTap={setSheetBadge}/>
                  </button>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, letterSpacing: '-0.01em', marginTop: 13 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>{sub}</div>
                  <div style={{ display: 'flex', gap: 28, marginTop: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{uniqueCount}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', letterSpacing: '0.06em', marginTop: 2, textTransform: 'uppercase' }}>Badge types</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{totalCount}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', letterSpacing: '0.06em', marginTop: 2, textTransform: 'uppercase' }}>Season wins</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Permanent badges */}
            {all.filter(b => b.type === 'firstStart').length > 0 && (
              <>
                <div style={{ marginTop: 22, marginBottom: 10, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Permanent</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {all.filter(b => b.type === 'firstStart').map(b => (
                    <button key={b.id} onClick={() => setSheetBadge(b)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px',
                      borderRadius: 14, border: '1px solid var(--border)', background: 'var(--paper)',
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                      <BadgeIcon b={b} size={40} onTap={() => {}}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{b.label}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>Permanent · never expires</div>
                      </div>
                      <Ico d={Icons.chevR} size={15} style={{ color: 'var(--ink-ghost)' }}/>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Season badges — grouped by tier */}
            {all.filter(b => b.type === 'season').length > 0 && (() => {
              const groups = {};
              all.filter(b => b.type === 'season').forEach(b => {
                const key = 'season-' + (b.tier || 'finalist');
                if (!groups[key]) groups[key] = { b, count: 0 };
                groups[key].count++;
              });
              const slots = Object.values(groups);
              return (
                <>
                  <div style={{ marginTop: 22, marginBottom: 10, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Season Badges</div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    {slots.map(({ b, count }) => (
                      <button key={b.id} onClick={() => setSheetBadge(b)} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                        padding: '14px 0', borderRadius: 14, border: '1px solid var(--border)',
                        background: 'var(--paper)', cursor: 'pointer', position: 'relative', flex: '1 1 0', minWidth: 0,
                      }}>
                        <div style={{ position: 'relative', display: 'inline-flex' }}>
                          <BadgeIcon b={b} size={56} onTap={() => {}}/>
                          {count > 1 && (
                            <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 999, background: 'var(--stamp-red)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid var(--paper)' }}>{count}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginTop: 10 }}>
                          {b.tier ? b.tier.charAt(0).toUpperCase() + b.tier.slice(1) : b.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{count} badge{count !== 1 ? 's' : ''} · season</div>
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}

            {/* How it works */}
            <div style={{ marginTop: 22, padding: '14px 15px', borderRadius: 14, background: 'var(--bone)', display: 'flex', gap: 11 }}>
              <Ico d={Icons.info} size={17} style={{ color: 'var(--ink-mute)', flexShrink: 0, marginTop: 1 }}/>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                Tap any badge to learn more. Permanent badges never expire. Season badges are earned when weekly leagues end — they're yours forever once earned.
              </div>
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}

// Scrollable filter chip used in the leaderboard sub-filter
function FilterChip({ active, color, icon, onClick, children }) {
  const c = color || 'var(--ink)';
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, whiteSpace: 'nowrap', cursor: 'pointer',
      padding: icon ? '7px 12px 7px 10px' : '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
      border: `1px solid ${active ? c : 'var(--border)'}`,
      background: active ? c : 'var(--paper)',
      color: active ? 'var(--paper)' : 'var(--ink-mute)',
    }}>
      {icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </button>
  );
}

Object.assign(window, { TierBadge, SeasonBadge, BadgeShelf, BadgeIcon, ArchetypeChip, FilterChip, RewardCard, EarnRow, RewardsView, LeaderboardView, BadgesView });
