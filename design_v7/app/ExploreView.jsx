// ─────────────────────────────────────────────────────────────
// Explore Database — browse the full catalogue, filter by category
// + brand/scale, add to collection or wishlist, rate items, and
// contribute new items that aren't in the DB yet.
// ─────────────────────────────────────────────────────────────

const CAT_FILTER_FIELDS = {
  figures:  ['scale'],
  diecast:  ['scale'],
  kits:     ['scale'],
  designer: [],
  tcg:      [],
};

function ExploreView() {
  const { push, flashToast, tab, stacks } = useNav();
  const { dbWishlist, toggleDbWishlist, catalogueVersion } = useAppState();
  const isRoot = tab === 'database' && stacks.database && stacks.database.length === 1;
  const [q, setQ] = React.useState('');
  const [cats, setCats] = React.useState(() => CATEGORIES.filter(c => ME.interests.includes(c.id)).map(c => c.id));
  const [scale, setScale] = React.useState('all');
  const [sort, setSort] = React.useState('owned'); // owned | wishlisted | newest
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [draftCats, setDraftCats] = React.useState(() => CATEGORIES.filter(c => ME.interests.includes(c.id)).map(c => c.id));
  const [draftScale, setDraftScale] = React.useState('all');
  const [draftSort, setDraftSort] = React.useState('owned');

  const items = React.useMemo(() => {
    let l = CATALOGUE.slice();
    if (cats.length) l = l.filter(c => cats.includes(c.cat));
    if (scale !== 'all') l = l.filter(c => c.scale === scale);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter(c => (c.title + c.brand + c.sku).toLowerCase().includes(s));
    }
    if (sort === 'owned') l = l.slice().sort((a, b) => (b.ownersCount || 0) - (a.ownersCount || 0));
    else if (sort === 'wishlisted') l = l.slice().sort((a, b) => ((b.wishCount || 0) + (dbWishlist[b.sku] ? 1 : 0)) - ((a.wishCount || 0) + (dbWishlist[a.sku] ? 1 : 0)));
    else if (sort === 'newest') l = l.slice().sort((a, b) => (b.year || 0) - (a.year || 0));
    return l;
  }, [q, cats, scale, sort, dbWishlist, catalogueVersion]);

  const toggleDraftCat = id => setDraftCats(prev => { const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]; setDraftScale('all'); return next; });
  const catAllows = id => !draftCats.length || draftCats.includes(id);
  const draftFields = draftCats.length === 1 ? (CAT_FILTER_FIELDS[draftCats[0]] || []) : ['scale'];
  const scaleOptions = Array.from(new Set(CATALOGUE.filter(c => catAllows(c.cat) && c.scale !== '—').map(c => c.scale)));
  const activeFilterCount = cats.length + (scale !== 'all' ? 1 : 0) + (sort !== 'owned' ? 1 : 0);

  const ql = q.trim().toLowerCase();
  const searching = ql.length > 0;

  const PAGE = 8;
  const [shownCount, setShownCount] = React.useState(PAGE);
  React.useEffect(() => { setShownCount(PAGE); }, [ql, cats, scale, sort]);
  const visible = items.slice(0, shownCount);
  const remaining = items.length - visible.length;

  const openSheet = () => { setDraftCats(cats); setDraftScale(scale); setDraftSort(sort); setSheetOpen(true); };
  const applySheet = () => { setCats(draftCats); setScale(draftScale); setSort(draftSort); setSheetOpen(false); };
  const clearSheet = () => { setDraftCats([]); setDraftScale('all'); setDraftSort('owned'); };

  return (
    <Screen nav={isRoot} header={isRoot ? <AppBar title="Database"/> : <DetailHeader title="Database"/>}>
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 9, height: 44, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)' }}>
            <Ico d={Icons.search} size={18} style={{ color: 'var(--ink-faint)' }}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search items…"
              style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink)' }}/>
            <button onClick={openSheet} aria-label={`Filters${activeFilterCount ? ` · ${activeFilterCount} active` : ''}`} style={{
              display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, padding: 0, marginRight: -2,
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeFilterCount ? 'var(--stamp-red)' : 'var(--ink-faint)' }}>
              <Ico d={Icons.filter} size={18} stroke={2}/>
              {activeFilterCount > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{activeFilterCount}</span>}
            </button>
          </div>
          <button onClick={() => push({ name: 'add-to-db' })} style={{
            display: 'flex', alignItems: 'center', gap: 5, height: 44, padding: '0 13px', flexShrink: 0,
            borderRadius: 12, border: 'none', background: 'var(--stamp-red)', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            <Ico d={Icons.plus} size={15} stroke={2.4}/>
            Add item
          </button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '12px 2px 8px' }}>{items.length} items</div>
      </div>

      {searching && items.length === 0 && (
        <div style={{ padding: '28px 24px 32px', textAlign: 'center', fontSize: 13.5, color: 'var(--ink-faint)' }}>No items match that search.</div>
      )}

      <div style={{ padding: '0 16px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {visible.map(c => (
          <div key={c.sku} style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => push({ name: 'explore-item', sku: c.sku })} style={{ display: 'block', width: '100%', border: 'none', background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                <ProductPhoto tone={c.tone} ratio="1/1" rounded={0}/>
              </button>
              <button onClick={() => { toggleDbWishlist(c.sku); flashToast(dbWishlist[c.sku] ? 'Removed from wishlist' : 'Added to wishlist'); }} style={{
                position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 999, flexShrink: 0, border: 'none',
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(2px)', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ico d={Icons.star} size={16} fill={dbWishlist[c.sku] ? 'var(--stamp-red)' : 'none'} style={{ color: dbWishlist[c.sku] ? 'var(--stamp-red)' : 'var(--ink-mute)' }}/>
              </button>
              <button onClick={() => push({ name: 'add-item', sku: c.sku })} style={{
                position: 'absolute', bottom: 8, right: 8, width: 32, height: 32, borderRadius: 999, flexShrink: 0, border: 'none',
                background: 'var(--stamp-red)', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ico d={Icons.plusCircle} size={17}/>
              </button>
            </div>
            <button onClick={() => push({ name: 'explore-item', sku: c.sku })} style={{ display: 'block', width: '100%', border: 'none', background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ padding: '9px 10px 11px', display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.title}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{c.brand}</div>
                </div>
                <ReviewIcon reviewed={c.scorredReviewed || !c.intelBy}/>
              </div>
            </button>
          </div>
        ))}
      </div>

      {remaining > 0 && (
        <div style={{ padding: '4px 16px 8px' }}>
          <button onClick={() => setShownCount(n => n + PAGE)} style={{
            width: '100%', height: 44, borderRadius: 12, cursor: 'pointer',
            border: '1px solid var(--border-strong)', background: 'var(--paper-soft)',
            fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
            Show {Math.min(PAGE, remaining)} more
          </button>
        </div>
      )}

      <div style={{ margin: '10px 16px 24px', padding: '16px 16px 15px', borderRadius: 14, border: '1px dashed var(--border-strong)', background: 'var(--paper-soft)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.01em' }}>Can’t find what you’re looking for?</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 4, lineHeight: 1.45 }}>Add it to the database and earn XP once it’s reviewed.</div>
        <button onClick={() => push({ name: 'add-to-db' })} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', marginTop: 12,
          borderRadius: 10, border: 'none', background: 'var(--stamp-red)', cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
          <Ico d={Icons.plus} size={15} stroke={2.4}/>
          Add an item
        </button>
      </div>

      {sheetOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={() => setSheetOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}/>
          <div style={{ position: 'relative', width: '100%', maxHeight: '78%', overflowY: 'auto', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '10px 18px 20px', boxShadow: 'var(--shadow-4)', animation: 'fadeIn 140ms ease' }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--border-strong)', margin: '4px auto 14px' }}/>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Filters</div>
              <button onClick={clearSheet} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }}>Clear</button>
            </div>

            <SectionLabel>Sort by</SectionLabel>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
              <FilterChip active={draftSort === 'owned'} onClick={() => setDraftSort('owned')}>Most owned</FilterChip>
              <FilterChip active={draftSort === 'wishlisted'} onClick={() => setDraftSort('wishlisted')}>Most wishlisted</FilterChip>
              <FilterChip active={draftSort === 'newest'} onClick={() => setDraftSort('newest')}>Newest</FilterChip>
            </div>

            <div style={{ marginTop: 20 }}><SectionLabel>Category</SectionLabel></div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
              {CATEGORIES.map(c => {
                const on = draftCats.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggleDraftCat(c.id)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', cursor: 'pointer',
                    borderRadius: 9, whiteSpace: 'nowrap', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600,
                    border: `1px solid ${on ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
                    background: on ? 'var(--stamp-red-soft)' : 'var(--paper-soft)',
                    color: on ? 'var(--stamp-red)' : 'var(--ink-mute)' }}>
                    {on && <Ico d={Icons.check} size={12} stroke={3.4}/>}
                    {c.label}
                  </button>
                );
              })}
            </div>

            {draftFields.includes('scale') && scaleOptions.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <SectionLabel>Scale</SectionLabel>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
                  <FilterChip active={draftScale === 'all'} onClick={() => setDraftScale('all')}>All scales</FilterChip>
                  {scaleOptions.map(s => <FilterChip key={s} active={draftScale === s} onClick={() => setDraftScale(s)}>{s}</FilterChip>)}
                </div>
              </div>
            )}

            <Button variant="dark" size="block" style={{ marginTop: 22 }} onClick={applySheet}>Show {(() => {
              let l = CATALOGUE.slice();
              if (draftCats.length) l = l.filter(c => draftCats.includes(c.cat));
              if (draftScale !== 'all') l = l.filter(c => c.scale === draftScale);
              return l.length;
            })()} items</Button>
          </div>
        </div>
      )}
    </Screen>
  );
}

function StarRow({ value, size = 18, onRate }) {
  const [hover, setHover] = React.useState(0);
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={onRate ? () => onRate(n) : undefined}
          onMouseEnter={onRate ? () => setHover(n) : undefined} onMouseLeave={onRate ? () => setHover(0) : undefined}
          style={{ background: 'none', border: 'none', padding: 0, cursor: onRate ? 'pointer' : 'default' }}>
          <Ico d={Icons.star} size={size} fill={(hover || value) >= n ? 'var(--grail-gold)' : 'none'} style={{ color: (hover || value) >= n ? 'var(--grail-gold)' : 'var(--slate-300)' }}/>
        </button>
      ))}
    </div>
  );
}

function ExploreItemDetail({ route }) {
  const { push, flashToast } = useNav();
  const { dbWishlist, toggleDbWishlist, dbRatings, rateDbItem } = useAppState();
  const c = catOf(route.sku);
  if (!c) return null;
  const mine = dbRatings[c.sku] || 0;
  const avg = c.rating ? c.rating.avg : 0;
  const count = (c.rating ? c.rating.count : 0) + (mine ? 1 : 0);

  return (
    <Screen nav={false} header={null}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px', display: 'flex', gap: 10 }}>
          <Button variant="dark" size="block" icon={<Ico d={Icons.plusCircle} size={18}/>}
            onClick={() => push({ name: 'add-item', sku: c.sku })} style={{ flex: 1 }}>Add to collection</Button>
          <button onClick={() => { toggleDbWishlist(c.sku); flashToast(dbWishlist[c.sku] ? 'Removed from wishlist' : 'Added to wishlist'); }} style={{
            width: 52, flexShrink: 0, borderRadius: 12, border: '1px solid var(--border-strong)',
            background: dbWishlist[c.sku] ? 'var(--stamp-red-soft)' : 'var(--paper)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico d={Icons.star} size={21} fill={dbWishlist[c.sku] ? 'var(--stamp-red)' : 'none'} style={{ color: dbWishlist[c.sku] ? 'var(--stamp-red)' : 'var(--ink-faint)' }}/>
          </button>
        </div>
      }>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}><DetailHeader transparent/></div>
        <ProductPhoto tone={c.tone} ratio="1/1" rounded={0} label="catalogue reference"/>
      </div>
      <div style={{ padding: '14px 16px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 4px' }}>{c.title}</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 10 }}>{c.brand} · {c.scale} · {c.year} · SKU {c.sku}</div>

        {(c.scorredReviewed || !c.intelBy) ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '4px 10px', borderRadius: 999, background: 'oklch(97% 0.01 30)', border: '1px solid oklch(85% 0.04 30)' }}>
            <SealMark size={16}/>
            <span style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 600 }}>Scorred Reviewed <span style={{ fontWeight: 400 }}>· catalogue entry verified by Scorred</span></span>
          </div>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '4px 10px', borderRadius: 999, background: 'var(--bone)', border: '1px solid var(--border-strong)' }}>
            <Ico d={Icons.clock} size={12} style={{ color: 'var(--ink-faint)' }}/>
            <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 500 }}>Pending Review <span style={{ fontWeight: 400 }}>· community entry</span></span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
          <button onClick={() => push({ name: 'db-people', sku: c.sku, mode: 'owners' })} style={{
            flex: 1, textAlign: 'left', cursor: 'pointer', border: 'none', background: 'var(--bone)', borderRadius: 13, padding: '13px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', lineHeight: 1.1 }}>{c.ownersCount || 0}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <Ico d={Icons.user} size={13} style={{ color: 'var(--ink-mute)' }}/>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-mute)' }}>own this</span>
              </div>
            </div>
            <Ico d={Icons.chevR} size={16} style={{ color: 'var(--ink-faint)', flexShrink: 0 }}/>
          </button>
          <button onClick={() => push({ name: 'db-people', sku: c.sku, mode: 'wishlist' })} style={{
            flex: 1, textAlign: 'left', cursor: 'pointer', border: 'none', background: 'var(--bone)', borderRadius: 13, padding: '13px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', lineHeight: 1.1 }}>{(c.wishCount || 0) + (dbWishlist[c.sku] ? 1 : 0)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <Ico d={Icons.bookmark} size={13} style={{ color: 'var(--ink-mute)' }}/>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-mute)' }}>wishlisted</span>
              </div>
            </div>
            <Ico d={Icons.chevR} size={16} style={{ color: 'var(--ink-faint)', flexShrink: 0 }}/>
          </button>
        </div>

        <SectionLabel>Rate this item</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 16 }}>
          <StarRow value={mine} onRate={(n) => { rateDbItem(c.sku, n); flashToast('Thanks for rating!'); }}/>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{avg.toFixed(1)} avg · {count} ratings</div>
        </div>

        <SectionLabel>About this item</SectionLabel>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-soft)', marginTop: 10 }}>
          {c.brand} {c.title.split('·').slice(1).join('·').trim() || c.title}. Catalogue entry from the Scorred database, {c.year}.
        </div>
      </div>
    </Screen>
  );
}

const CONTRIB_RULES_ALLOWED = ['Hot Toys', 'Bandai', 'LEGO', 'Pop Mart', 'Sideshow', 'Tomica', 'Mini GT', 'McFarlane', 'The Pokémon Company'];

function ContributeGuidelines({ onAccept, onCancel }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxHeight: '86%', overflowY: 'auto', background: 'var(--paper)', borderRadius: 18, padding: '22px 22px 20px', boxShadow: 'var(--shadow-3)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, textAlign: 'center', marginBottom: 6 }}>Add a new item</div>
        <div style={{ fontSize: 13, color: 'var(--ink-faint)', textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>Didn't find what you were looking for? Read the guidelines below before contributing.</div>

        <div style={{ fontSize: 12, color: 'var(--stamp-red-deep)', background: 'var(--stamp-red-soft)', borderRadius: 10, padding: '9px 12px', marginBottom: 16, lineHeight: 1.5 }}>Please make sure the item doesn't already exist in the catalogue before submitting.</div>

        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>General rules</div>
        <ul style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7, margin: '0 0 16px', paddingLeft: 18 }}>
          <li>Use the official product name exactly as it appears on the brand's website.</li>
          <li>Be specific — include the line/series name, not just the character.</li>
          <li>Add at least one clear photo showing the item and its accessories.</li>
          <li>Third-party studios are fine; bootlegs, KOs, or unofficial reproductions are not.</li>
        </ul>

        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>How it works</div>
        <ul style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7, margin: '0 0 20px', paddingLeft: 18 }}>
          <li>Every new entry is reviewed by the Scorred team, and may be edited for accuracy.</li>
          <li>Duplicates are removed — links to your submission redirect to the original entry.</li>
          <li>XP earned from a duplicate is reversed.</li>
          <li>Repeated duplicate submissions may restrict your ability to add new items.</li>
        </ul>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onCancel}>Cancel</Button>
          <Button variant="dark" style={{ flex: 1, justifyContent: 'center' }} onClick={onAccept}>Accept</Button>
        </div>
      </div>
    </div>
  );
}

function ContributeItemForm() {
  const { push, pop, flashToast } = useNav();
  const { contributeToCatalogue } = useAppState();
  const [title, setTitle] = React.useState('');
  const [cat, setCat] = React.useState('figures');
  const [brand, setBrand] = React.useState('');
  const [scale, setScale] = React.useState('');
  const [year, setYear] = React.useState('');
  const [est, setEst] = React.useState('');
  const [photoCount, setPhotoCount] = React.useState(0);
  const [tried, setTried] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [newSku, setNewSku] = React.useState(null);
  const dbXp = (typeof EARN_ACTIONS !== 'undefined' && EARN_ACTIONS.find(a => a.id === 'db_new')?.xp) || 50;

  const missTitle = !title.trim();
  const missBrand = !brand.trim();
  const missPhoto = photoCount < 1;
  const invalid = missTitle || missBrand || missPhoto;

  const submit = () => {
    if (invalid) { setTried(true); flashToast('Fill the required fields marked *'); return; }
    const sku = 'U' + Date.now();
    contributeToCatalogue({
      sku, title: title.trim(), brand: brand.trim(), cat, scale: scale.trim() || '—', year: year.trim() || String(new Date().getFullYear()),
      tone: 'ink', est: parseInt(est, 10) || 0, intelBy: 'you', ownersCount: 0, wishCount: 0, rating: { avg: 0, count: 0 },
    });
    setNewSku(sku);
    setSubmitted(true);
    flashToast(`Submitted for review · +${dbXp} XP`);
  };

  if (submitted) {
    return (
      <Screen nav={false} header={<DetailHeader title="Add to database"/>}
        footer={
          <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="dark" size="block" icon={<Ico d={Icons.plusCircle} size={18}/>}
              onClick={() => push({ name: 'add-item', sku: newSku })}>Add to my collection</Button>
            <Button variant="secondary" size="block" onClick={pop}>Done</Button>
          </div>
        }>
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bone)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Ico d={Icons.clock} size={26} style={{ color: 'var(--ink-faint)' }}/>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, marginBottom: 6 }}>Under review</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', lineHeight: 1.55, marginBottom: 6 }}>
            "{title}" was added to the Scorred database and is pending review. You earned <strong style={{ color: 'var(--ink)' }}>+{dbXp} XP</strong>.
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 18 }}>Own a copy? Add it to your collection below.</div>
        </div>
      </Screen>
    );
  }

  const Req = ({ children, missing }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
      <SectionLabel>{children}</SectionLabel>
      <span style={{ color: missing && tried ? 'var(--stamp-red)' : 'var(--ink-ghost)', fontSize: 13, fontWeight: 700 }}>*</span>
      {missing && tried && <span style={{ fontSize: 11, color: 'var(--stamp-red)', marginLeft: 'auto' }}>Required</span>}
    </div>
  );
  const fieldBorder = (bad) => `1px solid ${bad && tried ? 'var(--stamp-red)' : 'var(--border-strong)'}`;
  const inputStyle = (bad) => ({ width: '100%', boxSizing: 'border-box', height: 46, padding: '0 13px', borderRadius: 11, border: fieldBorder(bad), background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink)', outline: 'none' });

  return (
    <Screen nav={false} header={<DetailHeader title="Add to database"/>}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px' }}>
          <Button variant="primary" size="block" onClick={submit} style={invalid ? { opacity: 0.55 } : null}>Add to Database · +{dbXp} XP</Button>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', textAlign: 'center', marginTop: 8, lineHeight: 1.4 }}>
            Own a copy? You'll get the option to add it to your collection right after adding it to the database.
          </div>
        </div>
      }>
      <div style={{ padding: 16 }}>
        <div style={{ marginTop: 4 }}><Req missing={missTitle}>Title</Req></div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Hot Toys MMS601 · Iron Man Mark 85" style={inputStyle(missTitle)}/>

        <div style={{ marginTop: 18 }}><SectionLabel>Category</SectionLabel></div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
          {CATEGORIES.map(c => <CategoryChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.chipLabel}</CategoryChip>)}
        </div>

        <div style={{ marginTop: 18 }}><Req missing={missBrand}>Brand</Req></div>
        <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Hot Toys" style={inputStyle(missBrand)}/>

        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          <div style={{ flex: 1 }}>
            <SectionLabel>Scale</SectionLabel>
            <input value={scale} onChange={e => setScale(e.target.value)} placeholder="1/6, N/A" style={{ ...inputStyle(false), marginTop: 9 }}/>
          </div>
          <div style={{ flex: 1 }}>
            <SectionLabel>Year</SectionLabel>
            <input value={year} onChange={e => setYear(e.target.value.replace(/[^0-9]/g, ''))} placeholder="2026" style={{ ...inputStyle(false), marginTop: 9 }}/>
          </div>
        </div>

        <div style={{ marginTop: 18 }}><SectionLabel>Estimated value (INR)</SectionLabel></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 46, padding: '0 13px', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', marginTop: 9 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 17, color: 'var(--ink-faint)' }}>₹</span>
          <input value={est} onChange={e => setEst(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}/>
        </div>

        <div style={{ marginTop: 18 }}><Req missing={missPhoto}>Photos</Req></div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 9 }}>At least 1 required · up to 6</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Array.from({ length: Math.min(photoCount, 6) }).map((_, i) => (
            <div key={i} style={{ width: 64, height: 64, borderRadius: 11, background: 'var(--verified-teal-soft)', border: '1px solid var(--verified-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={Icons.check} size={18} style={{ color: 'var(--verified-teal)' }}/>
            </div>
          ))}
          {photoCount < 6 && (
            <button onClick={() => setPhotoCount(p => p + 1)} style={{
              width: 64, height: 64, borderRadius: 11, border: `1px dashed ${missPhoto && tried ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
              background: 'var(--paper-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)' }}>
              <Ico d={Icons.camera} size={20}/>
            </button>
          )}
        </div>

      </div>
    </Screen>
  );
}

function AddToDbView() {
  const { pop } = useNav();
  const [accepted, setAccepted] = React.useState(false);
  if (!accepted) return <ContributeGuidelines onAccept={() => setAccepted(true)} onCancel={pop}/>;
  return <ContributeItemForm/>;
}

// People who own / wishlisted a catalogue item — tappable from ExploreItemDetail's stat row
function DbPeopleList({ route }) {
  const { push, flashToast } = useNav();
  const { followed, toggleFollow, dbWishlist } = useAppState();
  const c = catOf(route.sku);
  if (!c) return null;
  const isOwners = route.mode === 'owners';
  const count = isOwners ? (c.ownersCount || 0) : ((c.wishCount || 0) + (dbWishlist[c.sku] ? 1 : 0));
  const people = Object.values(USERS).filter(u => u.handle !== 'you').slice(0, count);

  return (
    <Screen nav={false} header={<DetailHeader title={isOwners ? 'Own this' : 'Wishlisted'} subtitle={`${c.title} · ${count}`}/>}>
      <div style={{ padding: '8px 0 24px' }}>
        {people.map(u => {
          const isFollowing = followed[u.handle];
          return (
            <div key={u.handle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => push({ name: 'profile', user: u.handle })} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                <Avatar name={u.name} color={u.color} size={44}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>@{u.handle}</div>
                </div>
              </button>
              <Button size="sm" variant={isFollowing ? 'secondary' : 'dark'}
                onClick={() => { toggleFollow(u.handle); flashToast(isFollowing ? `Unfollowed @${u.handle}` : `Following @${u.handle}`); }}>
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          );
        })}
        {people.length === 0 && <EmptyNote>{isOwners ? 'No one owns this yet.' : 'No one has wishlisted this yet.'}</EmptyNote>}
      </div>
    </Screen>
  );
}

Object.assign(window, { ExploreView, ExploreItemDetail, AddToDbView, DbPeopleList });
