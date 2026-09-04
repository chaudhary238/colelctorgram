// ─────────────────────────────────────────────────────────────
// Marketplace — BRD §9.8
// Two boards: For sale (listings) · Wanted (ISO). Both share the
// search-with-inline-filter + primary action row pattern from the
// Database page.
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

// Search field with the filter trigger living inside it (Database pattern),
// plus a primary action button to its right.
function MarketSearchRow({ q, onQ, placeholder, activeCount, onFilter, actionLabel, onAction, actionIcon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 9, height: 44, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)' }}>
        <Ico d={Icons.search} size={18} style={{ color: 'var(--ink-faint)', flexShrink: 0 }}/>
        <input value={q} onChange={e => onQ(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink)' }}/>
        {q && (
          <button onClick={() => onQ('')} aria-label="Clear search" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink-faint)', display: 'flex', flexShrink: 0 }}>
            <Ico d={Icons.close} size={15}/>
          </button>
        )}
        <button onClick={onFilter} aria-label={`Filters${activeCount ? ` · ${activeCount} active` : ''}`} style={{
          display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, padding: 0, marginRight: -2,
          background: 'none', border: 'none', cursor: 'pointer',
          color: activeCount ? 'var(--stamp-red)' : 'var(--ink-faint)' }}>
          <Ico d={Icons.filter} size={18} stroke={2}/>
          {activeCount > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{activeCount}</span>}
        </button>
      </div>
      <button onClick={onAction} style={{
        display: 'flex', alignItems: 'center', gap: 5, height: 44, padding: '0 13px', flexShrink: 0,
        borderRadius: 12, border: 'none', background: 'var(--stamp-red)', cursor: 'pointer',
        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
        <Ico d={actionIcon || Icons.plus} size={15} stroke={2.4}/>
        {actionLabel}
      </button>
    </div>
  );
}

function MarketView() {
  const { push, setOverlay } = useNav();
  const { userListings, saved, posts, listingStatus, unlisted } = useAppState();
  const [board, setBoard] = React.useState('sale'); // sale | wanted

  // ── For-sale board state ──
  const [query, setQuery] = React.useState('');
  const [showFilter, setShowFilter] = React.useState(false);
  const [sort, setSort]       = React.useState('new');
  const [cats, setCats]       = React.useState([]);   // [] = All (multi-select)
  const [minPrice, setMinPrice] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');
  const [conds, setConds]     = React.useState([]);   // [] = all
  const [savedOnly, setSavedOnly] = React.useState(false);
  const [mineOnly, setMineOnly] = React.useState(false);

  const toggleArr = (set, val) => set(a => a.includes(val) ? a.filter(x => x !== val) : [...a, val]);

  const SORT_OPTIONS = [
    { id: 'new',     label: 'Newest' },
    { id: 'low',     label: 'Price ↑' },
    { id: 'high',    label: 'Price ↓' },
    { id: 'saved',   label: 'Most saved' },
  ];

  // Condition vocabulary is category-specific (figures use MISB/MIB, TCG uses Mint/Played), so with
  // no category picked there is no meaningful list — showing all of them at once made this the
  // longest section in the sheet. The chips appear once a category narrows them down.
  const CONDS_BY_CAT = React.useMemo(() => {
    return cats.map(id => ({
      cat: id,
      label: (CATEGORIES.find(c => c.id === id) || {}).chipLabel || id,
      options: conditionsFor(id),
    }));
  }, [cats]);

  const activeCount = [
    sort !== 'new', cats.length > 0,
    minPrice !== '', maxPrice !== '',
    conds.length > 0, savedOnly, mineOnly,
  ].filter(Boolean).length;

  const resetAll = () => {
    setSort('new'); setCats([]);
    setMinPrice(''); setMaxPrice('');
    setConds([]); setSavedOnly(false); setMineOnly(false);
    setQuery('');
  };

  const allListings = React.useMemo(
    () => [...userListings, ...MARKET_SEED]
      .filter(x => !(unlisted || {})[x.id])
      .map(x => ({ ...x, status: (listingStatus || {})[x.id] || x.status }))
      .filter(x => x.status !== 'sold'),
    [userListings, listingStatus, unlisted],
  );

  const list = React.useMemo(() => {
    let l = allListings;
    if (savedOnly) l = l.filter(x => saved[x.id]);
    if (mineOnly)  l = l.filter(x => x.seller === 'you' || x.mine);
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

    if      (sort === 'low')     l = [...l].sort((a, b) => a.price - b.price);
    else if (sort === 'high')    l = [...l].sort((a, b) => b.price - a.price);
    else if (sort === 'saved')   l = [...l].sort((a, b) => (b.saves   || 0) - (a.saves   || 0));
    return l;
  }, [query, cats, sort, minPrice, maxPrice, conds, savedOnly, mineOnly, saved, allListings]);

  React.useEffect(() => {
    if (cats.length === 0) return;
    const allowed = cats.reduce((acc, id) => acc.concat(conditionsFor(id).map(c => c.id)), []);
    setConds(cs => cs.filter(c => allowed.includes(c)));
  }, [cats]);

  const isEmpty = allListings.length === 0;

  // ── Wanted (ISO) board state ──
  const [isoQuery, setIsoQuery] = React.useState('');
  const [isoFilterOpen, setIsoFilterOpen] = React.useState(false);
  const [isoCats, setIsoCats] = React.useState([]);
  const [isoSort, setIsoSort] = React.useState('new'); // new | budgetHigh | budgetLow
  const [isoMaxBudget, setIsoMaxBudget] = React.useState('');
  const isoActiveCount = [isoCats.length > 0, isoSort !== 'new', isoMaxBudget !== ''].filter(Boolean).length;
  const isoReset = () => { setIsoCats([]); setIsoSort('new'); setIsoMaxBudget(''); setIsoQuery(''); };

  const allISO = React.useMemo(() => {
    const live = (posts || []).filter(p => p.type === 'iso');
    const seed = typeof ISO_POSTS !== 'undefined' ? ISO_POSTS : [];
    const seen = new Set(live.map(p => p.id));
    return [...live, ...seed.filter(p => !seen.has(p.id))];
  }, [posts]);

  const isoList = React.useMemo(() => {
    let l = allISO;
    if (isoQuery.trim()) {
      const q = isoQuery.toLowerCase();
      l = l.filter(p => ((p.isoItem || '') + ' ' + (p.body || '') + ' ' + (p.user || '') + ' ' + (p.isoCity || '')).toLowerCase().includes(q));
    }
    if (isoCats.length > 0) l = l.filter(p => isoCats.includes(p.cat));
    if (isoMaxBudget !== '') l = l.filter(p => (p.isoBudget || 0) <= Number(isoMaxBudget));
    if (isoSort === 'budgetHigh') l = [...l].sort((a, b) => (b.isoBudget || 0) - (a.isoBudget || 0));
    else if (isoSort === 'budgetLow') l = [...l].sort((a, b) => (a.isoBudget || 0) - (b.isoBudget || 0));
    return l;
  }, [allISO, isoQuery, isoCats, isoSort, isoMaxBudget]);

  const BOARDS = [
    { id: 'sale',   label: 'For sale', icon: Icons.bag,  count: allListings.length },
    { id: 'wanted', label: 'Wanted',   icon: Icons.eye,  count: allISO.length },
  ];

  return (
    <Screen header={<AppBar title="Market"/>}>

      {/* ── Sticky header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 4, background: 'var(--paper)', borderBottom: '1px solid var(--slate-200)' }}>

        {/* board tabs — selling vs looking */}
        <div style={{ display: 'flex', gap: 4, margin: '12px 16px 0', background: 'var(--slate-100)', borderRadius: 14, padding: 4 }}>
          {BOARDS.map(b => {
            const on = board === b.id;
            return (
              <button key={b.id} onClick={() => setBoard(b.id)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                border: 'none', cursor: 'pointer', borderRadius: 10, padding: '8px 6px',
                background: on ? 'var(--paper)' : 'transparent',
                color: on ? 'var(--ink)' : 'var(--slate-500)',
                fontFamily: 'var(--font-body)', fontWeight: on ? 700 : 500, fontSize: 13.5,
                boxShadow: on ? 'var(--shadow-2)' : 'none', transition: 'all 130ms', whiteSpace: 'nowrap' }}>
                <Ico d={b.icon} size={16} stroke={on ? 2.3 : 1.9}/>
                {b.label}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: on ? 'var(--ink-faint)' : 'var(--slate-400)' }}>{b.count}</span>
              </button>
            );
          })}
        </div>

        {board === 'sale' ? (
          <MarketSearchRow q={query} onQ={setQuery} placeholder="Search listings, brands, sellers…"
            activeCount={activeCount} onFilter={() => setShowFilter(v => !v)}
            actionLabel="Sell item" actionIcon={Icons.tag}
            onAction={() => push({ name: 'profile', user: 'you', isMe: true, sell: true })}/>
        ) : (
          <MarketSearchRow q={isoQuery} onQ={setIsoQuery} placeholder="Search what collectors want…"
            activeCount={isoActiveCount} onFilter={() => setIsoFilterOpen(v => !v)}
            actionLabel="Post wanted" actionIcon={Icons.plus}
            onAction={() => setOverlay({ name: 'compose', kind: 'post', type: 'iso' })}/>
        )}

        {board === 'sale' && showFilter && (
          <div style={{ borderTop: '1px solid var(--slate-200)', padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 460, overflowY: 'auto' }}>

            <div>
              <FilterLabel>Quick filters</FilterLabel>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setSavedOnly(v => !v)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${savedOnly ? 'var(--stamp-red)' : 'var(--slate-200)'}`,
                  background: savedOnly ? 'var(--stamp-red)' : 'var(--slate-50)',
                  color: savedOnly ? 'var(--paper)' : 'var(--slate-700)',
                  fontFamily: 'var(--font-body)', fontWeight: savedOnly ? 700 : 500, fontSize: 12.5, whiteSpace: 'nowrap', lineHeight: 1 }}>
                  <Ico d={Icons.heart} size={14} fill={savedOnly ? 'currentColor' : 'none'}/>
                  Saved
                </button>
                <button onClick={() => setMineOnly(v => !v)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${mineOnly ? 'var(--stamp-red)' : 'var(--slate-200)'}`,
                  background: mineOnly ? 'var(--stamp-red)' : 'var(--slate-50)',
                  color: mineOnly ? 'var(--paper)' : 'var(--slate-700)',
                  fontFamily: 'var(--font-body)', fontWeight: mineOnly ? 700 : 500, fontSize: 12.5, whiteSpace: 'nowrap', lineHeight: 1 }}>
                  <Ico d={Icons.tag} size={14}/>
                  Listed by me
                </button>
              </div>
            </div>

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

            <div>
              <FilterLabel>Sort by</FilterLabel>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SORT_OPTIONS.map(o => (
                  <FilterChip key={o.id} active={sort === o.id} onClick={() => setSort(o.id)}>{o.label}</FilterChip>
                ))}
              </div>
            </div>

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

            <div>
              <FilterLabel>Condition</FilterLabel>
              {cats.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 12px', borderRadius: 10,
                  background: 'var(--slate-50)', border: '1px dashed var(--slate-200)' }}>
                  <Ico d={Icons.filter} size={13} style={{ color: 'var(--ink-faint)', flexShrink: 0 }}/>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', lineHeight: 1.4 }}>Pick a category above — conditions differ by category.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {CONDS_BY_CAT.map(group => (
                    <div key={group.cat}>
                      {CONDS_BY_CAT.length > 1 && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', marginBottom: 6 }}>{group.label}</div>
                      )}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {group.options.map(o => (
                          <FilterChip key={group.cat + o.id} active={conds.includes(o.id)} onClick={() => toggleArr(setConds, o.id)}>{o.label}</FilterChip>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {activeCount > 0 && (
              <button onClick={resetAll} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, textAlign: 'left' }}>
                Reset all filters
              </button>
            )}
          </div>
        )}

        {board === 'wanted' && isoFilterOpen && (
          <div style={{ borderTop: '1px solid var(--slate-200)', padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 420, overflowY: 'auto' }}>
            <div>
              <FilterLabel>Category</FilterLabel>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                  <FilterChip key={c.id} active={isoCats.includes(c.id)} onClick={() => toggleArr(setIsoCats, c.id)}>{c.chipLabel}</FilterChip>
                ))}
              </div>
            </div>
            <div>
              <FilterLabel>Sort by</FilterLabel>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <FilterChip active={isoSort === 'new'} onClick={() => setIsoSort('new')}>Newest</FilterChip>
                <FilterChip active={isoSort === 'budgetHigh'} onClick={() => setIsoSort('budgetHigh')}>Budget ↓</FilterChip>
                <FilterChip active={isoSort === 'budgetLow'} onClick={() => setIsoSort('budgetLow')}>Budget ↑</FilterChip>
              </div>
            </div>
            <div>
              <FilterLabel>Max budget</FilterLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink-faint)' }}>₹</span>
                <input value={isoMaxBudget} onChange={e => setIsoMaxBudget(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="Any"
                  style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}/>
              </div>
            </div>
            {isoActiveCount > 0 && (
              <button onClick={isoReset} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, textAlign: 'left' }}>
                Reset all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {board === 'wanted' ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>
              {isoList.length} {isoList.length === 1 ? 'ITEM WANTED' : 'ITEMS WANTED'}
            </span>
            {isoActiveCount > 0 && (
              <button onClick={isoReset} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5 }}>
                Clear filters
              </button>
            )}
          </div>
          {isoList.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 32px', textAlign: 'center', gap: 11, color: 'var(--ink-faint)' }}>
              <Ico d={Icons.eye} size={28} style={{ opacity: 0.3 }}/>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{allISO.length === 0 ? 'Nobody’s hunting yet' : 'Nothing matches these filters'}</div>
              <div style={{ fontSize: 13, lineHeight: 1.55, maxWidth: 260 }}>
                {allISO.length === 0 ? 'Post an ISO and collectors with the piece will reach out.' : 'Try widening the category or budget.'}
              </div>
              {allISO.length === 0
                ? <Button variant="primary" icon={<Ico d={Icons.plus} size={16}/>} onClick={() => setOverlay({ name: 'compose', kind: 'post', type: 'iso' })}>Post an ISO</Button>
                : <button onClick={isoReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stamp-red)', fontWeight: 600, fontFamily: 'var(--font-body)', fontSize: 13 }}>Clear filters</button>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '0 14px 32px' }}>
              {isoList.map(p => <WantedCard key={p.id} post={p}/>)}
            </div>
          )}
        </>
      ) : isEmpty ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--slate-100)', border: '1px solid var(--slate-200)', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <Ico d={Icons.bag} size={28}/>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.01em' }}>Nothing listed yet</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', marginTop: 7, maxWidth: 270, lineHeight: 1.55 }}>
            Pick something from your collection and flip <b style={{ color: 'var(--ink-soft)' }}>List for sale</b> — it shows up here instantly.
          </div>
          <div style={{ marginTop: 20 }}>
            <Button variant="primary" icon={<Ico d={Icons.tag} size={17}/>} onClick={() => push({ name: 'profile', user: 'you', isMe: true, sell: true })}>Sell an item</Button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>
              {savedOnly ? `${list.length} SAVED` : mineOnly ? `${list.length} LISTED BY YOU` : `${list.length} ${list.length === 1 ? 'LISTING' : 'LISTINGS'}`}
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
                <Ico d={savedOnly ? Icons.heart : mineOnly ? Icons.tag : Icons.filter} size={26} style={{ opacity: 0.35 }}/>
                <div style={{ fontSize: 13.5, marginTop: 10 }}>{savedOnly ? 'Nothing saved yet.' : mineOnly ? 'You have nothing listed right now.' : 'No listings match these filters.'}</div>
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

// ── Wanted card — an ISO shown as a product tile, mirroring MarketCard ──
function WantedCard({ post }) {
  const { push, setOverlay } = useNav();
  const u = userOf(post.user);
  const c = post.refSku ? catOf(post.refSku) : null;
  const tone = (c && c.tone) || post.tone || 'ink';
  const conds = (post.isoCond || 'any').split(',').filter(x => x && x !== 'any');

  return (
    <div style={{ background: 'var(--card-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <button onClick={() => push({ name: 'post', id: post.id })} style={{ display: 'block', width: '100%', border: 'none', background: 'none', padding: 0, cursor: 'pointer', position: 'relative' }}>
        <ProductPhoto tone={tone} ratio="1/1" rounded={0}/>
      </button>

      <div style={{ padding: '9px 11px 11px', display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
        <button onClick={() => push({ name: 'post', id: post.id })} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: 'var(--ink)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.isoItem}</div>
        </button>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>BUDGET</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14.5, color: '#9A6010' }}>
            {post.isoBudget ? `₹${Number(post.isoBudget).toLocaleString('en-IN')}` : 'Open'}
          </span>
        </div>

        {(conds.length > 0 || post.isoCity) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {conds.map(x => (
              <span key={x} style={{ padding: '2px 6px', borderRadius: 5, background: 'var(--bone)', fontSize: 10.5, fontWeight: 600, color: 'var(--ink-mute)' }}>{x}</span>
            ))}
            {post.isoCity && <span style={{ padding: '2px 6px', borderRadius: 5, background: 'var(--bone)', fontSize: 10.5, color: 'var(--ink-mute)' }}>{post.isoCity}</span>}
          </div>
        )}

        <button onClick={() => push({ name: 'profile', user: post.user })} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
          <Avatar name={u.name} color={u.color} size={20} frame={avatarFrame(u)} framePip={avatarFramePip(u)}/>
          <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name.split(' ')[0]} · {post.time}</span>
        </button>

        <div style={{ flex: 1 }}/>
        <button onClick={() => push({ name: 'chat', user: post.user, iso: post.id })} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 36, marginTop: 1,
          borderRadius: 10, border: '1px solid var(--verified-teal)', background: 'var(--verified-teal-soft)',
          color: 'var(--verified-teal)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12.5 }}>
          <Ico d={Icons.message} size={14}/>I have this
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { MarketView, WantedCard });
