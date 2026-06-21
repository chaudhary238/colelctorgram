// ─────────────────────────────────────────────────────────────
// Community directory — BRD §9.12
// Joined communities + discover, search by category.
// ─────────────────────────────────────────────────────────────

function CommunityView() {
  const { push, setOverlay, flashToast } = useNav();
  const { joined, userCommunities } = useAppState();
  const [cats, setCats] = React.useState([]); // [] = all
  const toggleCat = (id) => setCats(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id]);

  const all = [...(userCommunities || []), ...COMMUNITIES];
  const joinedList = all.filter(c => joined[c.id] || c.founder === 'you');
  const joinedIds = new Set(joinedList.map(c => c.id));
  let discover = all.filter(c => !joinedIds.has(c.id));
  if (cats.length > 0) discover = discover.filter(c => cats.includes(c.cat));

  return (
    <Screen header={<AppBar title="Community"/>}>
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 0', alignItems: 'center' }}>
        <button onClick={() => setOverlay({ name: 'search' })} style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 9, height: 40, padding: '0 14px',
          borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)',
          color: 'var(--ink-faint)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14,
        }}>
          <Ico d={Icons.search} size={18}/>Find a community…
        </button>
        <Button size="sm" variant="primary" icon={<Ico d={Icons.plusCircle} size={15}/>} onClick={() => push({ name: 'create-community' })}>Create</Button>
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
        <div style={{ display: 'flex', gap: 7, margin: '10px 0', overflowX: 'auto', paddingRight: 16, paddingBottom: 2 }}>
          <CategoryChip active={cats.length === 0} onClick={() => setCats([])}>All</CategoryChip>
          {CATEGORIES.map(c => <CategoryChip key={c.id} active={cats.includes(c.id)} onClick={() => toggleCat(c.id)}>{c.short}</CategoryChip>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {discover.map(c => <CommunityCard key={c.id} com={c} onOpen={() => push({ name: 'community-detail', id: c.id })}/>)}
          {discover.length === 0 && <EmptyNote>You’ve joined everything in this category.</EmptyNote>}
        </div>
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
