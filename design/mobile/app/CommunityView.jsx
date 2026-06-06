// ─────────────────────────────────────────────────────────────
// Community directory — BRD §9.12
// Joined communities + discover, search by category.
// ─────────────────────────────────────────────────────────────

function CommunityView() {
  const { push, setOverlay, flashToast } = useNav();
  const { joined } = useAppState();
  const [cat, setCat] = React.useState('all');

  const joinedList = COMMUNITIES.filter(c => joined[c.id]);
  let discover = COMMUNITIES.filter(c => !joined[c.id]);
  if (cat !== 'all') discover = discover.filter(c => c.cat === cat);

  return (
    <Screen header={<AppBar title="Community"/>}>
      <div style={{ padding: '14px 16px 0' }}>
        <button onClick={() => setOverlay({ name: 'search' })} style={{
          display: 'flex', alignItems: 'center', gap: 9, width: '100%', height: 40, padding: '0 14px',
          borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)',
          color: 'var(--ink-faint)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14,
        }}>
          <Ico d={Icons.search} size={18}/>Find a community…
        </button>
      </div>

      {/* your communities */}
      {joinedList.length > 0 && (
        <div style={{ padding: '18px 16px 0' }}>
          <SectionLabel>Your communities</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {joinedList.map(c => <CommunityCard key={c.id} com={c} onOpen={() => push({ name: 'community-detail', id: c.id })}/>)}
          </div>
        </div>
      )}

      {/* discover */}
      <div style={{ padding: '20px 16px 0' }}>
        <SectionLabel>Discover</SectionLabel>
        <div style={{ display: 'flex', gap: 7, margin: '10px 0', overflowX: 'auto' }}>
          <CategoryChip active={cat === 'all'} onClick={() => setCat('all')}>All</CategoryChip>
          {CATEGORIES.map(c => <CategoryChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.short}</CategoryChip>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {discover.map(c => <CommunityCard key={c.id} com={c} onOpen={() => push({ name: 'community-detail', id: c.id })}/>)}
          {discover.length === 0 && <EmptyNote>You’ve joined everything in this category.</EmptyNote>}
        </div>
      </div>

      {/* request a community — BRD §8.8 CM-04 */}
      <div style={{ padding: '20px 16px 28px' }}>
        <button onClick={() => flashToast('Community request sent for review')} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 46,
          borderRadius: 12, border: '1px dashed var(--border-strong)', background: 'transparent',
          color: 'var(--ink-mute)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
        }}>
          <Ico d={Icons.plusCircle} size={18}/>Request a new community
        </button>
      </div>
    </Screen>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{children}</div>;
}
function EmptyNote({ children }) {
  return <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>{children}</div>;
}

Object.assign(window, { CommunityView, SectionLabel, EmptyNote });
