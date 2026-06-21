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

// Overlapping badge shelf for the profile header — tap to open trophy case
function BadgeShelf({ u, onOpen, style }) {
  const bs = badgesOf(u);
  if (!bs.length) return null;
  const shown = bs.slice(0, 4);
  return (
    <button onClick={onOpen} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 9, padding: '4px 9px 4px 4px',
      background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 999, cursor: 'pointer', ...style }}>
      <span style={{ display: 'flex' }}>
        {shown.map((b, i) => (
          <span key={b.id} style={{ marginLeft: i ? -9 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px var(--paper-soft)' }}>
            <SeasonBadge b={b} size={24}/>
          </span>
        ))}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>{bs.length} badge{bs.length > 1 ? 's' : ''}</span>
      <Ico d={Icons.chevR} size={14} style={{ color: 'var(--ink-ghost)' }}/>
    </button>
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
  const arche = archetypeOf(u);
  return (
    <div style={{ marginTop: 14, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px 12px' }}>
        <TierBadge tier={tier} size={46}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>{tier.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>RANK {idx + 1}/{REWARD_TIERS.length}</span>
          </div>
          <div style={{ marginTop: 5 }}><ArchetypeChip arche={arche} size="sm"/></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: 'var(--ink)', fontFeatureSettings: '"tnum" 1', lineHeight: 1 }}>{u.xp.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.1em', marginTop: 3 }}>XP</div>
        </div>
      </div>
      <div style={{ padding: '0 15px 13px' }}>
        <div style={{ height: 8, borderRadius: 999, background: 'var(--bone)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', background: tier.c, borderRadius: 999, transition: 'width 320ms var(--ease-out)' }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 7, fontSize: 11.5 }}>
          <span style={{ color: 'var(--ink-faint)' }}>
            {next
              ? <><b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{need.toLocaleString('en-IN')} XP</b> to {next.name}</>
              : <span style={{ color: tier.c, fontWeight: 600 }}>Top rank reached</span>}
          </span>
          <span style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>+{u.xpWeek} this week</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 15px 15px' }}>
        {isMe && (
          <Button size="sm" variant="dark" style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.zap} size={15}/>}
            onClick={() => push({ name: 'rewards', user: 'you' })}>Earn points</Button>
        )}
        <Button size="sm" variant={isMe ? 'secondary' : 'dark'} style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.trophy} size={15}/>}
          onClick={() => push({ name: 'leaderboard' })}>Leaderboard</Button>
      </div>
    </div>
  );
}

// A single "way to earn" row
function EarnRow({ a }) {
  const sub = a.type === 'once'
    ? (a.progress ? `${a.progress.done}/${a.progress.total} steps done` : 'One-time')
    : a.type === 'daily' ? 'Once a day' : 'Repeatable';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 13, border: '1px solid var(--border)', background: 'var(--paper-soft)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bone)', color: 'var(--ink-mute)' }}>
        <Ico d={a.icon} size={18}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{a.label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 1 }}>{sub}</div>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13.5, color: 'var(--verified-teal)' }}>+{a.xp}</span>
    </div>
  );
}

// Rewards screen — hero + daily check-in + ways to earn + rank ladder
function RewardsView() {
  const { push, flashToast } = useNav();
  const u = ME;
  const { tier, next, pct, need, idx } = rankProgress(u.xp);
  const arche = archetypeOf(u);
  const mix = contribMix(u);
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
            {u.xp.toLocaleString('en-IN')} XP · RANK {idx + 1} OF {REWARD_TIERS.length}
          </div>
          <div style={{ marginTop: 11 }}><ArchetypeChip arche={arche}/></div>
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
        <button onClick={() => { if (!checked) { setChecked(true); flashToast('Checked in · +5 XP'); } }} disabled={checked} style={{
          width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 14, textAlign: 'left',
          cursor: checked ? 'default' : 'pointer',
          border: `1px solid ${checked ? 'var(--border)' : 'var(--grail-gold)'}`,
          background: checked ? 'var(--paper-soft)' : 'var(--grail-gold-soft)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: checked ? 'var(--bone)' : 'var(--grail-gold)', color: checked ? 'var(--ink-faint)' : 'var(--ink)' }}>
            <Ico d={checked ? Icons.check : Icons.zap} size={20} stroke={2.2}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{checked ? 'Checked in today' : 'Daily check-in'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 1 }}>{checked ? 'Come back tomorrow for more' : 'Tap to claim today’s bonus'}</div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: checked ? 'var(--ink-faint)' : 'var(--grail-gold-deep)' }}>+5</span>
        </button>

        {/* contribution mix — what your XP is made of → drives archetype */}
        <div style={{ marginTop: 22 }}><SectionLabel>Your contribution mix</SectionLabel></div>
        <div style={{ marginTop: 11, padding: '15px 15px 13px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--paper-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: arche.c, color: 'var(--paper)' }}>
              <Ico d={arche.icon} size={17} stroke={2.1}/>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>You’re a <span style={{ color: arche.c }}>{arche.name}</span></div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 1 }}>{arche.blurb}</div>
            </div>
          </div>
          {/* stacked bar */}
          <div style={{ display: 'flex', height: 9, borderRadius: 999, overflow: 'hidden', background: 'var(--bone)' }}>
            {mix.map(m => m.pct > 0 && <span key={m.key} style={{ width: m.pct + '%', background: m.arche.c }}/>)}
          </div>
          {/* legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 13 }}>
            {mix.map(m => (
              <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, flexShrink: 0, background: m.arche.c }}/>
                <span style={{ fontSize: 13, color: 'var(--ink-soft)', flex: 1 }}>{m.label}</span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{m.arche.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, color: 'var(--ink)', width: 38, textAlign: 'right' }}>{m.pct}%</span>
              </div>
            ))}
          </div>
        </div>

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
                  <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>{t.perk}</div>
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

// Leaderboard — weekly / monthly / all-time with podium + ranked list
const MEDALS = ['var(--grail-gold)', '#A6A8AC', '#C08552'];

// When does each board reset? Weekly → next Monday; Monthly → 1st next month;
// All-time & contribution totals are lifetime and never reset.
function resetInfo(mode, period) {
  if (mode !== 'xp' || period === 'all') {
    return { label: 'Lifetime total — never resets', soon: false };
  }
  const now = new Date();
  if (period === 'week') {
    const d = (8 - now.getDay()) % 7 || 7;       // days until next Monday
    return { label: `Resets Monday · in ${d} day${d > 1 ? 's' : ''}`, soon: d <= 1 };
  }
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const d = Math.ceil((end - now) / 86400000);
  const mn = end.toLocaleString('en-US', { month: 'short' });
  return { label: `Resets ${mn} 1 · in ${d} day${d > 1 ? 's' : ''}`, soon: d <= 2 };
}

function LeaderboardView() {
  const { push } = useNav();
  const [mode, setMode] = React.useState('xp');     // 'xp' | 'contrib'
  const [period, setPeriod] = React.useState('week'); // xp window
  const [cat, setCat] = React.useState('posts');      // contribution key
  const active = mode === 'xp' ? period : cat;
  const rows = leaderboard(active);
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const myIndex = rows.findIndex(r => r.isMe);
  const me = rows[myIndex];
  const periodLabel = mode === 'xp'
    ? { week: 'this week', month: 'this month', all: 'all-time' }[period]
    : `in ${CONTRIB_LABELS[cat]}`;
  const unit = mode === 'xp' ? 'XP' : 'pts';
  const catChips = [
    { id: 'posts', ...ARCHETYPES.posts }, { id: 'social', ...ARCHETYPES.social },
    { id: 'collection', ...ARCHETYPES.collection }, { id: 'market', ...ARCHETYPES.market },
  ];

  return (
    <Screen nav={false} header={<DetailHeader title="Leaderboard" subtitle="Top collectors"/>}>
      <div style={{ padding: '14px 16px 10px', position: 'sticky', top: 0, zIndex: 3, background: 'var(--paper)' }}>
        <Segmented value={mode} onChange={setMode}
          options={[{ id: 'xp', label: 'By XP' }, { id: 'contrib', label: 'By contribution' }]}/>
        {/* sub-filter */}
        <div style={{ display: 'flex', gap: 7, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
          {mode === 'xp'
            ? [{ id: 'week', label: 'Weekly' }, { id: 'month', label: 'Monthly' }, { id: 'all', label: 'All-time' }].map(o => (
                <FilterChip key={o.id} active={period === o.id} onClick={() => setPeriod(o.id)}>{o.label}</FilterChip>
              ))
            : catChips.map(o => (
                <FilterChip key={o.id} active={cat === o.id} color={o.c} onClick={() => setCat(o.id)}
                  icon={<Ico d={o.icon} size={13} stroke={2.1}/>}>{o.name}</FilterChip>
              ))}
        </div>
        {/* reset clock */}
        {(() => { const ri = resetInfo(mode, period); return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9, fontSize: 11.5, color: ri.soon ? 'var(--stamp-red)' : 'var(--ink-faint)' }}>
            <Ico d={Icons.clock} size={13} stroke={2}/>
            <span>{ri.label}</span>
          </div>
        ); })()}
      </div>

      {/* end-of-season prize — makes the reset worth chasing */}
      {!(mode === 'xp' && period === 'all') && (
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
                <div style={{ position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)', width: 23, height: 23, borderRadius: '50%', background: medal, color: rank === 1 ? 'var(--ink)' : 'var(--paper)', border: '2px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11.5 }}>{rank}</div>
              </div>
              <div style={{ marginTop: 7, fontSize: 13, fontWeight: 700, color: 'var(--ink)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.isMe ? 'You' : r.name.split(' ')[0]}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: mode === 'contrib' ? r.arche.c : r.tier.c }}/>
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
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{r.isMe ? 'You' : r.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: mode === 'contrib' ? r.arche.c : r.tier.c }}/>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{mode === 'contrib' ? r.arche.name : r.tier.name}</span>
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

// Trophy case — all season badges a member has earned
function BadgesView({ route }) {
  const { push } = useNav();
  const u = route.user === 'you' ? ME : userOf(route.user);
  const isMe = route.user === 'you';
  const bs = badgesOf(u);
  const top = bs[0];
  const totalXp = bs.reduce((s, b) => s + (badgeMeta(b).xp || 0), 0);
  const first = u.name.split(' ')[0];

  return (
    <Screen nav={false} header={<DetailHeader title="Badges" subtitle={isMe ? 'Your trophy case' : `${first}’s trophy case`}/>}>
      <div style={{ padding: '16px' }}>
        {bs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--ink-faint)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-ghost)' }}>
                <Ico d={Icons.trophy} size={26}/>
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{isMe ? 'No badges yet' : 'No badges yet'}</div>
            <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{isMe ? 'Finish in a weekly or monthly league to earn your first badge.' : `${first} hasn’t placed in a league yet.`}</div>
            {isMe && <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}><Button size="sm" variant="dark" icon={<Ico d={Icons.trophy} size={15}/>} onClick={() => push({ name: 'leaderboard' })}>See leaderboard</Button></div>}
          </div>
        ) : (
          <>
            {/* featured badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '22px 16px', borderRadius: 18, border: '1px solid var(--border)', background: 'var(--paper-soft)' }}>
              <SeasonBadge b={top} size={76}/>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, letterSpacing: '-0.01em', marginTop: 13 }}>{top.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 3 }}>{badgeMeta(top).kindLabel} · {top.period} · {badgeMeta(top).label}</div>
              <div style={{ display: 'flex', gap: 18, marginTop: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{bs.length}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', letterSpacing: '0.06em', marginTop: 2, textTransform: 'uppercase' }}>Badges</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }}/>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{totalXp.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', letterSpacing: '0.06em', marginTop: 2, textTransform: 'uppercase' }}>Bonus XP</div>
                </div>
              </div>
            </div>

            {/* all badges grid */}
            <div style={{ marginTop: 22 }}><SectionLabel>All badges</SectionLabel></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 11 }}>
              {bs.map(b => {
                const m = badgeMeta(b);
                return (
                  <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 12px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--paper-soft)' }}>
                    <SeasonBadge b={b} size={48}/>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', marginTop: 10 }}>{b.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{m.kindLabel} · {b.period}</div>
                    <div style={{ marginTop: 9, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--verified-teal)' }}>+{m.xp} XP</div>
                  </div>
                );
              })}
            </div>

            {/* how it works */}
            <div style={{ marginTop: 22, padding: '14px 15px', borderRadius: 14, background: 'var(--bone)', display: 'flex', gap: 11 }}>
              <Ico d={Icons.info} size={17} style={{ color: 'var(--ink-mute)', flexShrink: 0, marginTop: 1 }}/>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                Badges are earned when a weekly or monthly league ends. The top 3 take gold, silver & bronze; everyone in the top 10 earns a finalist badge. Standings reset each cycle — your badges are permanent.
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

Object.assign(window, { TierBadge, SeasonBadge, BadgeShelf, ArchetypeChip, FilterChip, RewardCard, EarnRow, RewardsView, LeaderboardView, BadgesView });
