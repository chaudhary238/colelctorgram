// ─────────────────────────────────────────────────────────────
// Marketplace (Browse) — BRD §9.8
// ─────────────────────────────────────────────────────────────

function FilterLabel({ children }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--slate-400)', marginBottom: 8 }}>
      {children}
    </div>
  );
}

function FilterChip({ active, onClick, children, icon, style }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '7px 13px', borderRadius: 10, cursor: 'pointer',
      border: `1px solid ${active ? 'var(--slate-900)' : 'var(--slate-200)'}`,
      background: active ? 'var(--slate-900)' : 'var(--slate-50)',
      color: active ? 'var(--paper)' : 'var(--slate-700)',
      fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12.5,
      whiteSpace: 'nowrap', lineHeight: 1, transition: 'all 120ms',
      ...style,
    }}>
      {icon && <Ico d={icon} size={13} stroke={1.75}/>}
      {children}
    </button>
  );
}

function MarketView() {
  const { push } = useNav();
  const { userListings, saved } = useAppState();

  const [query, setQuery] = React.useState('');
  const [showSaved, setShowSaved] = React.useState(false);
  const [showFilter, setShowFilter] = React.useState(false);
  const [sort, setSort]       = React.useState('new');
  const [cats, setCats]       = React.useState([]);   // [] = All (multi-select)
  const [minPrice, setMinPrice] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');
  const [conds, setConds]     = React.useState([]);   // [] = all
  const [shipOnly, setShipOnly]   = React.useState(false);

  const toggleArr = (set, val) => set(a => a.includes(val) ? a.filter(x => x !== val) : [...a, val]);

  const SORT_OPTIONS = [
    { id: 'new',     label: 'Newest' },
    { id: 'low',     label: 'Price ↑' },
    { id: 'high',    label: 'Price ↓' },
    { id: 'saved',   label: 'Most Saved' },
    { id: 'watched', label: 'Most Watched' },
  ];

  const COND_OPTIONS = ['Sealed', 'MIB', 'BIB', 'Loose'];

  const activeCount = [
    sort !== 'new', cats.length > 0,
    minPrice !== '', maxPrice !== '',
    conds.length > 0,
    shipOnly,
  ].filter(Boolean).length;

  const resetAll = () => {
    setSort('new'); setCats([]);
    setMinPrice(''); setMaxPrice('');
    setConds([]);
    setShipOnly(false);
    setQuery('');
  };

  const allListings = React.useMemo(
    () => [...userListings, ...MARKET_SEED].filter(x => x.status !== 'sold'),
    [userListings],
  );

  const list = React.useMemo(() => {
    let l = allListings;

    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(x =>
        (x.title  || '').toLowerCase().includes(q) ||
        (x.brand  || '').toLowerCase().includes(q) ||
        (x.seller || '').toLowerCase().includes(q) ||
        (x.desc   || '').toLowerCase().includes(q)
      );
    }
    if (cats.length > 0)   l = l.filter(x => cats.includes(x.cat));
    if (minPrice !== '')   l = l.filter(x => x.price >= Number(minPrice));
    if (maxPrice !== '')   l = l.filter(x => x.price <= Number(maxPrice));
    if (conds.length > 0)  l = l.filter(x => conds.includes(x.condition));
    if (shipOnly)          l = l.filter(x => x.shipIncl);

    if      (sort === 'low')     l = [...l].sort((a, b) => a.price - b.price);
    else if (sort === 'high')    l = [...l].sort((a, b) => b.price - a.price);
    else if (sort === 'saved')   l = [...l].sort((a, b) => (b.saves   || 0) - (a.saves   || 0));
    else if (sort === 'watched') l = [...l].sort((a, b) => (b.watching|| 0) - (a.watching|| 0));
    return l;
  }, [query, cats, sort, minPrice, maxPrice, conds, shipOnly, allListings]);

  const savedListings = React.useMemo(
    () => allListings.filter(l => saved[l.id]),
    [allListings, saved],
  );

  const isEmpty = allListings.length === 0;

  return (
    <Screen header={<AppBar title="Market"/>}>

      {/* ── Sticky header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 4, background: 'var(--paper)', borderBottom: '1px solid var(--slate-200)' }}>

        {/* Search + saved + filter */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 9, height: 44, padding: '0 14px',
            borderRadius: 13, border: '1px solid var(--slate-200)', background: 'var(--card-surface)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <Ico d={Icons.search} size={17} style={{ color: 'var(--ink-faint)', flexShrink: 0 }}/>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search listings, brands, sellers…"
              style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink-faint)', display: 'flex', alignItems: 'center' }}>
                <Ico d={Icons.close} size={15}/>
              </button>
            )}
          </div>

          {/* Saved toggle */}
          <button onClick={() => { setShowSaved(v => !v); setShowFilter(false); }} style={{
            position: 'relative', width: 44, height: 44, borderRadius: 13, flexShrink: 0,
            background: showSaved ? 'var(--stamp-red)' : 'var(--card-surface)',
            color: showSaved ? 'var(--paper)' : 'var(--slate-700)',
            border: `1px solid ${showSaved ? 'var(--stamp-red)' : 'var(--slate-200)'}`,
            boxShadow: showSaved ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Ico d={Icons.heart} size={18} fill={showSaved ? 'currentColor' : 'none'}/>
            {savedListings.length > 0 && !showSaved && (
              <span style={{
                position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 3px',
                borderRadius: 999, background: 'var(--stamp-red)', color: 'var(--paper)',
                fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid var(--paper)',
              }}>{savedListings.length}</span>
            )}
          </button>

          <button onClick={() => { setShowFilter(v => !v); setShowSaved(false); }} style={{
            position: 'relative', width: 44, height: 44, borderRadius: 13, flexShrink: 0,
            background: showFilter || activeCount > 0 ? 'var(--slate-900)' : 'var(--card-surface)',
            color:      showFilter || activeCount > 0 ? 'var(--paper)' : 'var(--slate-700)',
            border: `1px solid ${showFilter || activeCount > 0 ? 'var(--slate-900)' : 'var(--slate-200)'}`,
            boxShadow: showFilter || activeCount > 0 ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Ico d={Icons.filter} size={18}/>
            {activeCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 3px',
                borderRadius: 999, background: 'var(--stamp-red)', color: 'var(--paper)',
                fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid var(--paper)',
              }}>{activeCount}</span>
            )}
          </button>
        </div>


        {showFilter && (
          <div style={{ borderTop: '1px solid var(--slate-200)', padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 460, overflowY: 'auto' }}>

            {/* Category — multi-select chips */}
            <div>
              <FilterLabel>Category</FilterLabel>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
                {CATEGORIES.map(c => (
                  <FilterChip key={c.id} active={cats.includes(c.id)} onClick={() => toggleArr(setCats, c.id)}>{c.chipLabel}</FilterChip>
                ))}
              </div>
              {cats.length > 0 && (
                <button onClick={() => setCats([])} style={{ marginTop: 7, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink-faint)', fontFamily: 'var(--font-body)', fontSize: 12 }}>
                  Clear category selection
                </button>
              )}
            </div>

            {/* Sort */}
            <div>
              <FilterLabel>Sort by</FilterLabel>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SORT_OPTIONS.map(o => (
                  <FilterChip key={o.id} active={sort === o.id} onClick={() => setSort(o.id)}>{o.label}</FilterChip>
                ))}
              </div>
            </div>

            {/* Price range — from / to inputs */}
            <div>
              <FilterLabel>Price range</FilterLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <div style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink-faint)' }}>₹</span>
                  <input value={minPrice} onChange={e => setMinPrice(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="From"
                    style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}/>
                </div>
                <span style={{ flexShrink: 0, color: 'var(--ink-faint)', fontSize: 13 }}>–</span>
                <div style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink-faint)' }}>₹</span>
                  <input value={maxPrice} onChange={e => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="To"
                    style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}/>
                </div>
              </div>
            </div>

            {/* Condition */}
            <div>
              <FilterLabel>Condition</FilterLabel>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {COND_OPTIONS.map(c => (
                  <FilterChip key={c} active={conds.includes(c)} onClick={() => toggleArr(setConds, c)}>{c}</FilterChip>
                ))}
              </div>
            </div>

            {/* Quick toggles */}
            <div>
              <FilterLabel>Quick filters</FilterLabel>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <FilterChip active={shipOnly}  onClick={() => setShipOnly(v => !v)}  icon={Icons.send}>Shipping incl.</FilterChip>
              </div>
            </div>

            {/* Reset */}
            {activeCount > 0 && (
              <button onClick={resetAll} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, textAlign: 'left' }}>
                Reset all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {showSaved ? (
        <div style={{ padding: '14px 16px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>
              {savedListings.length} SAVED
            </span>
          </div>
          {savedListings.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', color: 'var(--ink-faint)', textAlign: 'center' }}>
              <Ico d={Icons.heart} size={28} style={{ opacity: 0.3 }}/>
              <div style={{ fontSize: 13.5, marginTop: 10 }}>No saved listings yet.</div>
              <div style={{ fontSize: 12.5, marginTop: 4, color: 'var(--ink-ghost)' }}>Tap ❤️ on any listing to save it here.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {savedListings.map(l => <MarketCard key={l.id} id={l.id} listing={l}/>)}
            </div>
          )}
        </div>
      ) : isEmpty ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--slate-100)', border: '1px solid var(--slate-200)', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <Ico d={Icons.bag} size={28}/>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.01em' }}>Nothing listed yet</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', marginTop: 7, maxWidth: 270, lineHeight: 1.55 }}>
            Add an item and flip <b style={{ color: 'var(--ink-soft)' }}>List for sale</b> — it shows up here instantly.
          </div>
          <div style={{ marginTop: 20 }}>
            <Button variant="primary" icon={<Ico d={Icons.tag} size={17}/>} onClick={() => push({ name: 'add-listing' })}>Add an item</Button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>
              {list.length} {list.length === 1 ? 'LISTING' : 'LISTINGS'}
            </span>
            {activeCount > 0 && (
              <button onClick={resetAll} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5 }}>
                Clear filters
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '0 14px 32px' }}>
            {list.map(l => <MarketCard key={l.id} id={l.id} listing={l}/>)}
            {list.length === 0 && (
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 0', color: 'var(--ink-faint)' }}>
                <Ico d={Icons.filter} size={26} style={{ opacity: 0.35 }}/>
                <div style={{ fontSize: 13.5, marginTop: 10 }}>No listings match these filters.</div>
                <button onClick={resetAll} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stamp-red)', fontWeight: 600, fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </Screen>
  );
}

Object.assign(window, { MarketView });

function ISOBoardContent({ push }) {
  const { posts } = useAppState();
  const { setOverlay } = useNav();
  const allISO = React.useMemo(() => {
    const live = (posts || []).filter(p => p.type === 'iso');
    const seed = typeof ISO_POSTS !== 'undefined' ? ISO_POSTS : [];
    // deduplicate by id
    const seen = new Set(live.map(p => p.id));
    return [...live, ...seed.filter(p => !seen.has(p.id))];
  }, [posts]);

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>
          {allISO.length} {allISO.length === 1 ? 'COLLECTOR' : 'COLLECTORS'} LOOKING
        </span>
        <Button size="sm" variant="grail" icon={<Ico d={Icons.edit} size={14}/>}
          onClick={() => { setOverlay({ name: 'compose' }); }}>Post ISO</Button>
      </div>
      {allISO.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 32px', textAlign: 'center', gap: 12, color: 'var(--ink-faint)' }}>
          <Ico d={Icons.search} size={28} style={{ opacity: 0.3 }}/>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>No ISOs yet</div>
          <div style={{ fontSize: 13, lineHeight: 1.55, maxWidth: 260 }}>Be the first — let collectors know what you're hunting.</div>
          <Button variant="teal" icon={<Ico d={Icons.edit} size={16}/>} onClick={() => setOverlay({ name: 'compose' })}>Post an ISO</Button>
        </div>
      ) : (
        allISO.map(post => <ISOCard key={post.id} post={post}/>)
      )}
    </div>
  );
}
