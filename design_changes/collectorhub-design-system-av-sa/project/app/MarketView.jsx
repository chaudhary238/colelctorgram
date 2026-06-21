// ─────────────────────────────────────────────────────────────
// Marketplace (Browse) — BRD §9.8
// ─────────────────────────────────────────────────────────────

function FilterLabel({ children }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>
      {children}
    </div>
  );
}

function FilterChip({ active, onClick, children, icon, style }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
      border: `1px solid ${active ? 'var(--ink)' : 'var(--border-strong)'}`,
      background: active ? 'var(--ink)' : 'var(--paper-soft)',
      color: active ? 'var(--paper)' : 'var(--ink)',
      fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12.5,
      whiteSpace: 'nowrap', lineHeight: 1,
      ...style,
    }}>
      {icon && <Ico d={icon} size={13} stroke={1.75}/>}
      {children}
    </button>
  );
}

// Dual-thumb price range slider
const PRICE_MAX = 200000;
const PRICE_STEP = 2500;

function PriceRangeSlider({ minPrice, maxPrice, setMinPrice, setMaxPrice }) {
  const mn = minPrice === '' ? 0 : Number(minPrice);
  const mx = maxPrice === '' ? PRICE_MAX : Number(maxPrice);
  const minPct = (mn / PRICE_MAX) * 100;
  const maxPct = (mx / PRICE_MAX) * 100;

  return (
    <div>
      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink)' }}>
          ₹{mn === 0 ? '0' : mn.toLocaleString('en-IN')}
        </span>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink)' }}>
          {mx >= PRICE_MAX ? 'Any' : '₹' + mx.toLocaleString('en-IN')}
        </span>
      </div>
      {/* Slider track */}
      <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
        {/* Background track */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, background: 'var(--bone)' }}/>
        {/* Active fill */}
        <div style={{ position: 'absolute', left: minPct + '%', width: (maxPct - minPct) + '%', height: 4, borderRadius: 2, background: 'var(--ink)', transition: 'left 60ms, width 60ms' }}/>
        {/* Min visual thumb */}
        <div style={{ position: 'absolute', left: minPct + '%', transform: 'translateX(-50%)', width: 18, height: 18, borderRadius: '50%', background: 'var(--ink)', border: '3px solid var(--paper)', boxShadow: '0 1px 5px rgba(0,0,0,0.28)', pointerEvents: 'none', zIndex: 2 }}/>
        {/* Max visual thumb */}
        <div style={{ position: 'absolute', left: maxPct + '%', transform: 'translateX(-50%)', width: 18, height: 18, borderRadius: '50%', background: 'var(--ink)', border: '3px solid var(--paper)', boxShadow: '0 1px 5px rgba(0,0,0,0.28)', pointerEvents: 'none', zIndex: 2 }}/>
        {/* Min range input (invisible, interactive) */}
        <input type="range" min={0} max={PRICE_MAX} step={PRICE_STEP} value={mn}
          onChange={e => { const v = Math.min(Number(e.target.value), mx - PRICE_STEP); setMinPrice(v === 0 ? '' : String(v)); }}
          style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: mn > PRICE_MAX * 0.75 ? 5 : 3 }}/>
        {/* Max range input (invisible, interactive) */}
        <input type="range" min={0} max={PRICE_MAX} step={PRICE_STEP} value={mx}
          onChange={e => { const v = Math.max(Number(e.target.value), mn + PRICE_STEP); setMaxPrice(v >= PRICE_MAX ? '' : String(v)); }}
          style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 4 }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-faint)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
        <span>₹0</span><span>₹2L+</span>
      </div>
    </div>
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
  const [tradeOnly, setTradeOnly] = React.useState(false);
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
    tradeOnly, shipOnly,
  ].filter(Boolean).length;

  const resetAll = () => {
    setSort('new'); setCats([]);
    setMinPrice(''); setMaxPrice('');
    setConds([]);
    setTradeOnly(false); setShipOnly(false);
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
    if (tradeOnly)         l = l.filter(x => x.trade);
    if (shipOnly)          l = l.filter(x => x.shipIncl);

    if      (sort === 'low')     l = [...l].sort((a, b) => a.price - b.price);
    else if (sort === 'high')    l = [...l].sort((a, b) => b.price - a.price);
    else if (sort === 'saved')   l = [...l].sort((a, b) => (b.saves   || 0) - (a.saves   || 0));
    else if (sort === 'watched') l = [...l].sort((a, b) => (b.watching|| 0) - (a.watching|| 0));
    return l;
  }, [query, cats, sort, minPrice, maxPrice, conds, tradeOnly, shipOnly, allListings]);

  const savedListings = React.useMemo(
    () => allListings.filter(l => saved[l.id]),
    [allListings, saved],
  );

  const isEmpty = allListings.length === 0;

  return (
    <Screen header={<AppBar title="Market"/>}>

      {/* ── Sticky header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 4, background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>

        {/* Search + saved + filter */}
        <div style={{ display: 'flex', gap: 8, padding: '10px 16px' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 9, height: 40, padding: '0 13px',
            borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)',
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
            position: 'relative', width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: showSaved ? 'var(--stamp-red)' : 'var(--paper-soft)',
            color: showSaved ? 'var(--paper)' : 'var(--ink)',
            border: `1px solid ${showSaved ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
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
            position: 'relative', width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: showFilter || activeCount > 0 ? 'var(--ink)' : 'var(--paper-soft)',
            color:      showFilter || activeCount > 0 ? 'var(--paper)' : 'var(--ink)',
            border: `1px solid ${showFilter || activeCount > 0 ? 'var(--ink)' : 'var(--border-strong)'}`,
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
          <div style={{ borderTop: '1px solid var(--border)', padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 460, overflowY: 'auto' }}>

            {/* Category — multi-select grid */}
            <div>
              <FilterLabel>Category</FilterLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {CATEGORIES.map(c => (
                  <FilterChip key={c.id} active={cats.includes(c.id)} onClick={() => toggleArr(setCats, c.id)} style={{ justifyContent: 'center' }}>{c.label}</FilterChip>
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

            {/* Price range — dual thumb slider */}
            <div>
              <FilterLabel>Price range</FilterLabel>
              <PriceRangeSlider minPrice={minPrice} maxPrice={maxPrice} setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}/>
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
                <FilterChip active={tradeOnly} onClick={() => setTradeOnly(v => !v)} icon={Icons.swap}>Trade open</FilterChip>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {savedListings.map(l => <MarketCard key={l.id} id={l.id} listing={l}/>)}
            </div>
          )}
        </div>
      ) : isEmpty ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--paper-soft)', border: '1px solid var(--border)', color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>
              {list.length} {list.length === 1 ? 'LISTING' : 'LISTINGS'}
            </span>
            {activeCount > 0 && (
              <button onClick={resetAll} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5 }}>
                Clear filters
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px 28px' }}>
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
