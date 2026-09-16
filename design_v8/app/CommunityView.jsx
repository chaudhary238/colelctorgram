// ─────────────────────────────────────────────────────────────
// Community directory — BRD §9.12
// Joined communities + discover, local search + category filter.
// ─────────────────────────────────────────────────────────────

function CommunityView() {
  const { push } = useNav();
  const { joined, userCommunities } = useAppState();
  const [q, setQ] = React.useState('');
  const [cats, setCats] = React.useState([]);
  const [sort, setSort] = React.useState('members'); // members | newest | name
  const [tab, setTab] = React.useState('yours');
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [draftCats, setDraftCats] = React.useState([]);
  const [draftSort, setDraftSort] = React.useState('members');
  const toggleCat = (id) => setCats(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id]);
  const toggleDraftCat = (id) => setDraftCats(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id]);
  const openSheet = () => { setDraftCats(cats); setDraftSort(sort); setSheetOpen(true); };
  const applySheet = () => { setCats(draftCats); setSort(draftSort); setSheetOpen(false); };
  const clearSheet = () => { setDraftCats([]); setDraftSort('members'); };
  const activeFilterCount = cats.length + (sort !== 'members' ? 1 : 0);

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
  const sortFn = (a, b) => sort === 'newest' ? (b.createdAt || 0) - (a.createdAt || 0) : sort === 'name' ? a.name.localeCompare(b.name) : (b.members || 0) - (a.members || 0);
  const sortedJoined = [...filteredJoined].sort(sortFn);
  const sortedDiscover = [...filteredDiscover].sort(sortFn);

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
            <button onClick={openSheet} aria-label={`Filters${activeFilterCount ? ` · ${activeFilterCount} active` : ''}`} style={{
              display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, padding: 0,
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeFilterCount ? 'var(--stamp-red)' : 'var(--slate-400)' }}>
              <Ico d={Icons.filter} size={17} stroke={2}/>
              {activeFilterCount > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{activeFilterCount}</span>}
            </button>
          </div>
          <Button size="sm" variant="primary" icon={<Ico d={Icons.plusCircle} size={15}/>} onClick={() => push({ name: 'create-community' })}>Create</Button>
        </div>
        {!q && (
          <Segmented
            style={{ marginTop: 10 }}
            options={[
              { id: 'yours', label: `Your communities${filteredJoined.length ? ` (${filteredJoined.length})` : ''}`, icon: Icons.users },
              { id: 'discover', label: 'Discover', icon: Icons.compass },
            ]}
            value={tab}
            onChange={setTab}
          />
        )}
      </div>

      {/* search: flat merged results */}
      {q ? (
        <div style={{ padding: '16px 16px 32px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>{filteredJoined.length + filteredDiscover.length} result{filteredJoined.length + filteredDiscover.length !== 1 ? 's' : ''} for "{q}"</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...sortedJoined, ...sortedDiscover].map(c => <CommunityCard key={c.id} com={c} onOpen={() => push({ name: 'community-detail', id: c.id })}/>)}
          </div>
          {!hasResults && <EmptyNote>No communities match "{q}".</EmptyNote>}
        </div>
      ) : tab === 'yours' ? (
        <div style={{ padding: '18px 16px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sortedJoined.map(c => <CommunityCard key={c.id} com={c} onOpen={() => push({ name: 'community-detail', id: c.id })}/>)}
            {filteredJoined.length === 0 && <EmptyNote>{cats.length > 0 ? 'No communities in this category yet.' : "You haven't joined any communities yet — check Discover."}</EmptyNote>}
          </div>
        </div>
      ) : (
        <div style={{ padding: '18px 16px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sortedDiscover.map(c => <CommunityCard key={c.id} com={c} onOpen={() => push({ name: 'community-detail', id: c.id })}/>)}
            {filteredDiscover.length === 0 && <EmptyNote>{cats.length > 0 ? 'No communities in this category yet.' : "You've joined everything — check back soon."}</EmptyNote>}
          </div>
        </div>
      )}

      {sheetOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 140, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={() => setSheetOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}/>
          <div style={{ position: 'relative', width: '100%', maxHeight: '78%', overflowY: 'auto', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '10px 18px 20px', boxShadow: 'var(--shadow-4)', animation: 'fadeIn 140ms ease' }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--border-strong)', margin: '4px auto 14px' }}/>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Filters</div>
              <button onClick={clearSheet} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }}>Clear</button>
            </div>

            <SectionLabel>Sort by</SectionLabel>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
              <FilterChip active={draftSort === 'members'} onClick={() => setDraftSort('members')}>Most members</FilterChip>
              <FilterChip active={draftSort === 'newest'} onClick={() => setDraftSort('newest')}>Newest</FilterChip>
              <FilterChip active={draftSort === 'name'} onClick={() => setDraftSort('name')}>Name (A–Z)</FilterChip>
            </div>

            <div style={{ marginTop: 20 }}><SectionLabel>Category</SectionLabel></div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
              {CATEGORIES.map(c => (
                <FilterChip key={c.id} active={draftCats.includes(c.id)} onClick={() => toggleDraftCat(c.id)}>{c.chipLabel}</FilterChip>
              ))}
            </div>

            <Button variant="dark" size="block" style={{ marginTop: 22 }} onClick={applySheet}>Apply filters</Button>
          </div>
        </div>
      )}
    </Screen>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--slate-400)' }}>{children}</div>;
}
function EmptyNote({ children }) {
  return (
    <div style={{ padding: '28px 0', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, opacity: 0.16 }}>
        <SealMark size={40}/>
      </div>
      <div style={{ color: 'var(--slate-400)', fontSize: 13 }}>{children}</div>
    </div>
  );
}

Object.assign(window, { CommunityView, SectionLabel, EmptyNote });
