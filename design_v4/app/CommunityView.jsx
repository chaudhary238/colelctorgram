// ─────────────────────────────────────────────────────────────
// Community directory — BRD §9.12
// Joined communities + discover, local search + category filter.
// ─────────────────────────────────────────────────────────────

function CommunityView() {
  const { push } = useNav();
  const { joined, userCommunities } = useAppState();
  const [q, setQ] = React.useState('');
  const [cats, setCats] = React.useState([]);
  const toggleCat = (id) => setCats(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id]);

  const all = [...(userCommunities || []), ...COMMUNITIES];
  const seen = new Set(); const deduped = all.filter(c => seen.has(c.id) ? false : seen.add(c.id));

  const qMatch = (c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.short || '').toLowerCase().includes(q.toLowerCase());
  const catMatch = (c) => cats.length === 0 || cats.includes(c.cat);

  const joinedList = deduped.filter(c => joined[c.id] || c.founder === 'you');
  const joinedIds = new Set(joinedList.map(c => c.id));
  const discover = deduped.filter(c => !joinedIds.has(c.id));

  const filteredJoined   = joinedList.filter(c => qMatch(c) && catMatch(c));
  const filteredDiscover = discover.filter(c => qMatch(c) && catMatch(c));
  const hasResults = filteredJoined.length + filteredDiscover.length > 0;

  return (
    <Screen header={<AppBar title="Community"/>}>
      {/* sticky search + category filter */}
      <div style={{ position: 'sticky', top: 0, zIndex: 4, background: 'var(--paper)', borderBottom: '1px solid var(--slate-200)', padding: '12px 16px 10px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 9, height: 40, padding: '0 14px',
            borderRadius: 13, border: '1px solid var(--slate-200)', background: 'var(--card-surface)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <Ico d={Icons.search} size={17} style={{ color: 'var(--slate-400)', flexShrink: 0 }}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search communities…"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)' }}/>
            {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--slate-400)', display: 'flex', alignItems: 'center' }}><Ico d={Icons.close} size={14} stroke={2}/></button>}
          </div>
          <Button size="sm" variant="primary" icon={<Ico d={Icons.plusCircle} size={15}/>} onClick={() => push({ name: 'create-community' })}>Create</Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, paddingBottom: 2 }}>
          {CATEGORIES.map(c => <CategoryChip key={c.id} active={cats.includes(c.id)} onClick={() => toggleCat(c.id)}>{c.chipLabel}</CategoryChip>)}
          {cats.length > 0 && <button onClick={() => setCats([])} style={{ background: 'none', border: 'none', padding: '4px 2px', cursor: 'pointer', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5 }}>Clear</button>}
        </div>
      </div>

      {/* search: flat merged results */}
      {q ? (
        <div style={{ padding: '16px 16px 32px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>{filteredJoined.length + filteredDiscover.length} result{filteredJoined.length + filteredDiscover.length !== 1 ? 's' : ''} for "{q}"</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...filteredJoined, ...filteredDiscover].map(c => <CommunityCard key={c.id} com={c} onOpen={() => push({ name: 'community-detail', id: c.id })}/>)}
          </div>
          {!hasResults && <EmptyNote>No communities match "{q}".</EmptyNote>}
        </div>
      ) : (
        <>
          {/* your communities */}
          {filteredJoined.length > 0 && (
            <div style={{ padding: '18px 16px 0' }}>
              <IconLabel icon={Icons.users} style={{ marginBottom: 10 }}>Your communities</IconLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                {filteredJoined.map(c => <CommunityCard key={c.id} com={c} onOpen={() => push({ name: 'community-detail', id: c.id })}/>)}
              </div>
            </div>
          )}

          {/* discover */}
          <div style={{ padding: '20px 16px 32px' }}>
            <IconLabel icon={Icons.compass} style={{ marginBottom: 10 }}>Discover</IconLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {filteredDiscover.map(c => <CommunityCard key={c.id} com={c} onOpen={() => push({ name: 'community-detail', id: c.id })}/>)}
              {filteredDiscover.length === 0 && <EmptyNote>{cats.length > 0 ? 'No communities in this category yet.' : "You've joined everything — check back soon."}</EmptyNote>}
            </div>
          </div>
        </>
      )}
    </Screen>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--slate-400)' }}>{children}</div>;
}
function EmptyNote({ children }) {
  return <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--slate-400)', fontSize: 13 }}>{children}</div>;
}

Object.assign(window, { CommunityView, SectionLabel, EmptyNote });
