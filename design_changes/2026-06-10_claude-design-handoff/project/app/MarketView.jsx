// ─────────────────────────────────────────────────────────────
// Marketplace (Browse) — BRD §9.8
// Grid of listings, search entry, category + filters, sort.
// ─────────────────────────────────────────────────────────────

function MarketView() {
  const { setOverlay } = useNav();
  const [cat, setCat] = React.useState('all');
  const [sort, setSort] = React.useState('new');
  const [tradeOnly, setTradeOnly] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);

  const list = React.useMemo(() => {
    let l = LISTINGS.filter(x => x.status !== 'sold');
    if (cat !== 'all') l = l.filter(x => catOf(x.sku).cat === cat);
    if (tradeOnly) l = l.filter(x => x.trade);
    if (sort === 'low') l = [...l].sort((a, b) => a.price - b.price);
    if (sort === 'high') l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [cat, sort, tradeOnly]);

  return (
    <Screen header={<AppBar title="Market"/>}>
      {/* search field + filter toggle */}
      <div style={{ position: 'sticky', top: 0, zIndex: 4, background: 'var(--paper)', borderBottom: '1px solid var(--border)', padding: '10px 16px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setOverlay({ name: 'search' })} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 9, height: 40, padding: '0 14px',
            borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)',
            color: 'var(--ink-faint)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14,
          }}>
            <Ico d={Icons.search} size={18}/>Search items, brands, sellers…
          </button>
          <IconButton icon={<Ico d={Icons.filter} size={18}/>} active={showFilters || tradeOnly} onClick={() => setShowFilters(v => !v)}/>
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 10, overflowX: 'auto' }}>
          <CategoryChip active={cat === 'all'} onClick={() => setCat('all')}>All</CategoryChip>
          {CATEGORIES.map(c => <CategoryChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.short}</CategoryChip>)}
        </div>
        {showFilters && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <Segmented style={{ flex: 1 }}
              options={[{ id: 'new', label: 'Newest' }, { id: 'low', label: 'Price ↑' }, { id: 'high', label: 'Price ↓' }]}
              value={sort} onChange={setSort}/>
            <button onClick={() => setTradeOnly(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 9,
              border: `1px solid ${tradeOnly ? 'var(--ink)' : 'var(--border-strong)'}`,
              background: tradeOnly ? 'var(--ink)' : 'var(--paper-soft)', color: tradeOnly ? 'var(--paper)' : 'var(--ink)',
              fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
            }}><Ico d={Icons.swap} size={15}/>Trade</button>
          </div>
        )}
      </div>

      {/* wishlist-match banner — BRD §8.10 NT-02 */}
      <button onClick={() => { setCat('diecast'); }} style={{
        display: 'flex', alignItems: 'center', gap: 10, width: 'calc(100% - 32px)', margin: '12px 16px 0',
        background: 'var(--verified-teal-soft)', border: '1px solid var(--verified-teal)', borderRadius: 12,
        padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--verified-teal)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ico d={Icons.bell} size={16}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--verified-teal)' }}>2 wishlist matches just listed</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>A Skullpanda case & a Mini GT R35 you want are live now.</div>
        </div>
        <Ico d={Icons.back} size={16} stroke={2} style={{ transform: 'rotate(180deg)', color: 'var(--verified-teal)' }}/>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 8px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>{list.length} LISTINGS</span>
        <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>tuned to your interests</span>
      </div>

      {/* grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px 28px' }}>
        {list.map(l => <MarketCard key={l.id} id={l.id}/>)}
        {list.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--ink-faint)' }}>
            No results — try broadening your filters.
          </div>
        )}
      </div>
    </Screen>
  );
}

Object.assign(window, { MarketView });
