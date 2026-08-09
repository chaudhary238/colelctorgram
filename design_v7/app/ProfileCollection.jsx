// ─────────────────────────────────────────────────────────────
// ProfileCollection — CollectionTab, charts, calendar, collage, ItemTile
// ─────────────────────────────────────────────────────────────

// Collection portfolio tab — grid + chart / calendar / collage views (BRD v1.2 §9.5)
function CollectionTab({ items, u, isMe }) {
  const [seg, setSeg] = React.useState('owned');
  const [ownedFilter, setOwnedFilter] = React.useState({ preorder: false, listed: false });
  const [ownedFilterOpen, setOwnedFilterOpen] = React.useState(false);
  const [view, setView] = React.useState('grid');
  // per-view visibility (BRD v1.2 §9.5) — owner sets each view public/private
  const [vis, setVis] = React.useState({ grid: 'public', chart: 'public', calendar: 'public', collage: 'private' });
  const { flashToast, push } = useNav();
  const { dbWishlist } = useAppState();

  const owned = items.filter(i => i.status !== 'wishlist' && i.status !== 'intel');
  const ownedValue = items.filter(i => i.status === 'owned').reduce((s, i) => s + i.value, 0);

  // DB Contributions: items added to Scorred DB
  const intelItems = items.filter(i => i.status === 'intel');
  // Wishlist: items explicitly marked wishlist + anything bookmarked from Explore Database (own profile only)
  const wishlistItems = items.filter(i => i.status === 'wishlist')
    .concat(isMe ? Object.keys(dbWishlist || {}).filter(sku => dbWishlist[sku]).map(sku => ({ id: 'wish-' + sku, sku, status: 'wishlist' })) : []);
  // "Owned" segment folds in pre-orders too — they show inline with a PO tag rather than a separate tab
  const anyOwnedFilter = ownedFilter.preorder || ownedFilter.listed;
  const filteredOwned = !anyOwnedFilter ? owned
    : owned.filter(i => (ownedFilter.preorder && i.status === 'preorder') || (ownedFilter.listed && i.listed));
  const filtered = seg === 'intel' ? intelItems : seg === 'wishlist' ? wishlistItems : filteredOwned;

  const views = [
    { id: 'grid', icon: Icons.grid, label: 'Grid' },
    { id: 'chart', icon: Icons.chart, label: 'Chart' },
    { id: 'calendar', icon: Icons.calendar, label: 'PO Calendar', short: 'PO Cal.' },
  ];
  const isPrivate = vis[view] === 'private';
  const hiddenFromViewer = !isMe && isPrivate;

  return (
    <div>
      {/* portfolio value + items owned — two pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1.3, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 999, padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>Portfolio Value</span>
          <span style={{ whiteSpace: 'nowrap' }}><Money value={ownedValue} size={15}/></span>
        </div>
        <div style={{ flex: 1, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 999, padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Items</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', fontFeatureSettings: '"tnum" 1' }}>{owned.length}</span>
        </div>
      </div>

      {/* view switcher + per-view visibility */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {views.map(v => {
            const on = view === v.id;
            return (
              <button key={v.id} onClick={() => setView(v.id)} aria-label={v.label} title={v.label} style={{
                width: 40, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
                background: on ? 'var(--ink)' : 'var(--paper-soft)', color: on ? 'var(--paper)' : 'var(--ink)',
              }}>
                <Ico d={v.icon} size={17} stroke={on ? 2 : 1.75}/>
              </button>
            );
          })}
          {isMe && (
            <button onClick={() => push({ name: 'explore' })} aria-label="Add item" style={{
              height: 36, display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', borderRadius: 10, cursor: 'pointer',
              border: '1px solid var(--stamp-red)', background: 'var(--stamp-red-soft)', color: 'var(--stamp-red)',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, whiteSpace: 'nowrap',
            }}>
              <Ico d={Icons.plusCircle} size={16} stroke={1.9}/>Add item
            </button>
          )}
        </div>
        {isMe && (
          <button onClick={() => { setVis(s => ({ ...s, [view]: isPrivate ? 'public' : 'private' })); flashToast(`${views.find(v => v.id === view).label} view ${isPrivate ? 'now public' : 'now private'}`); }}
            title="Toggle who can see this view" style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
              border: '1px solid var(--border-strong)', background: isPrivate ? 'var(--bone)' : 'var(--paper-soft)',
              color: isPrivate ? 'var(--ink-faint)' : 'var(--verified-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Ico d={isPrivate ? Icons.eyeOff : Icons.eye} size={18}/>
          </button>
        )}
      </div>

      {hiddenFromViewer ? (
        <div style={{ textAlign: 'center', padding: '34px 0', color: 'var(--ink-faint)' }}>
          <Ico d={Icons.eyeOff} size={26} style={{ color: 'var(--ink-ghost)' }}/>
          <div style={{ fontSize: 13.5, marginTop: 8 }}>This view is private.</div>
        </div>
      ) : <>
        {isMe && isPrivate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 12 }}>
            <Ico d={Icons.eyeOff} size={14}/> Only you can see this view.
          </div>
        )}

        {view === 'grid' && <>
          <div style={{ position: 'relative' }}>
            <Segmented value={seg}
              onChange={v => {
                if (v === 'owned' && seg === 'owned') { setOwnedFilterOpen(o => !o); return; }
                setSeg(v); setOwnedFilterOpen(false);
              }}
              options={[{ id: 'owned', label: 'Owned', icon: Icons.sliders }, { id: 'wishlist', label: 'Wishlist' }, { id: 'intel', label: 'DB Contributions' }]}/>
            {ownedFilterOpen && seg === 'owned' && (
              <>
                <div onClick={() => setOwnedFilterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }}/>
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 31, width: 'min(300px, 100%)',
                  background: 'var(--paper)', border: '1px solid var(--slate-200)', borderRadius: 20,
                  boxShadow: 'var(--shadow-4)', padding: '18px 18px 14px', animation: 'fadeIn 140ms ease' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16.5, letterSpacing: '-0.01em', color: 'var(--ink)' }}>Filter items</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 2, marginBottom: 12 }}>Leave both off to see everything you own.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[{ id: 'preorder', label: 'Pre-order', n: owned.filter(i => i.status === 'preorder').length },
                      { id: 'listed', label: 'Listed', n: owned.filter(i => i.listed).length }].map(f => {
                      const on = ownedFilter[f.id];
                      return (
                        <button key={f.id} onClick={() => setOwnedFilter(s => ({ ...s, [f.id]: !s[f.id] }))} style={{
                          display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left',
                          border: 'none', background: 'none', cursor: 'pointer', padding: '9px 4px', borderRadius: 9 }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                            border: `1.5px solid ${on ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
                            background: on ? 'var(--stamp-red)' : 'transparent', color: 'var(--paper)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}>
                            {on && <Ico d={Icons.check} size={15} stroke={3}/>}
                          </span>
                          <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{f.label}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-faint)' }}>{f.n}</span>
                        </button>
                      );
                    })}
                  </div>
                  {anyOwnedFilter && (
                    <button onClick={() => setOwnedFilter({ preorder: false, listed: false })} style={{
                      marginTop: 10, width: '100%', padding: '9px 0', borderRadius: 10, cursor: 'pointer',
                      border: '1px solid var(--border-strong)', background: 'var(--paper-soft)',
                      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>Clear filters</button>
                  )}
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginTop: 14 }}>
            {filtered.map(it => <ItemTile key={it.id} item={it} isMe={isMe} owner={isMe ? 'you' : u.handle}/>)}
          </div>
          {filtered.length === 0 && <EmptyNote>{isMe ? (seg === 'owned' && anyOwnedFilter ? 'Nothing matches this filter.' : 'Nothing here yet — add from the Scorred database.') : 'Private or empty.'}</EmptyNote>}
        </>}

        {view === 'chart' && <PortfolioChart items={owned}/>}
        {view === 'calendar' && <PortfolioCalendar items={items}/>}
      </>}
    </div>
  );
}

// Chart view — SVG donut/pie by value (BRD v1.2 §9.5)
function PortfolioChart({ items }) {
  const byCat = {};
  items.forEach(i => {
    const c = catOf(i.sku); const k = c ? c.cat : 'other';
    if (!byCat[k]) byCat[k] = { count: 0, value: 0 };
    byCat[k].count++; byCat[k].value += i.value;
  });
  const rows = Object.entries(byCat).sort((a, b) => b[1].value - a[1].value);
  if (rows.length === 0) return <EmptyNote>No items to chart yet.</EmptyNote>;

  const inHandCount = items.filter(i => i.status === 'owned').length;
  const poCount = items.filter(i => i.status === 'preorder').length;

  const total = rows.reduce((s, [, v]) => s + v.value, 0) || 1;
  const totalCount = rows.reduce((s, [, v]) => s + v.count, 0);
  const tones = { figures: 'var(--stamp-red)', designer: 'var(--plum)', kits: 'var(--forest)', diecast: 'var(--verified-teal)', other: 'var(--ink-mute)' };
  const labels = { figures: 'Action Figures', designer: 'Designer & Blind Boxes', kits: 'Kits & Lego', diecast: 'Diecast', other: 'Other' };

  const cx = 100, cy = 100, R = 76, ir = 44;
  let angle = -Math.PI / 2;
  const slices = rows.map(([k, v]) => {
    const pct = v.value / total;
    const sweep = pct * 2 * Math.PI;
    const sa = angle, ea = angle + sweep;
    angle = ea;
    if (pct > 0.9999) {
      const pathD = `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx} ${cy + R} A ${R} ${R} 0 1 1 ${cx} ${cy - R} M ${cx} ${cy - ir} A ${ir} ${ir} 0 1 0 ${cx} ${cy + ir} A ${ir} ${ir} 0 1 0 ${cx} ${cy - ir} Z`;
      return { k, v, pct, pathD };
    }
    const lg = sweep > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.cos(sa), y1 = cy + R * Math.sin(sa);
    const x2 = cx + R * Math.cos(ea), y2 = cy + R * Math.sin(ea);
    const xi1 = cx + ir * Math.cos(sa), yi1 = cy + ir * Math.sin(sa);
    const xi2 = cx + ir * Math.cos(ea), yi2 = cy + ir * Math.sin(ea);
    const pathD = `M ${xi1} ${yi1} L ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ir} ${ir} 0 ${lg} 0 ${xi1} ${yi1} Z`;
    return { k, v, pct, pathD };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* In hand vs Pre-order breakdown */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: 'var(--bone)', borderRadius: 13, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <Ico d={Icons.check} size={16} style={{ color: 'var(--forest)' }}/>
          <div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>{inHandCount}</div><div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>in hand</div></div>
        </div>
        <div style={{ flex: 1, background: 'var(--grail-gold-soft)', borderRadius: 13, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <Ico d={Icons.clock} size={16} style={{ color: 'var(--grail-gold-deep)' }}/>
          <div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>{poCount}</div><div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>pre-order</div></div>
        </div>
      </div>
      {/* Donut */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={200} height={200} viewBox="0 0 200 200">
          <circle cx={cx} cy={cy} r={(R + ir) / 2} fill="none" stroke="var(--bone)" strokeWidth={R - ir + 1}/>
          {slices.map(({ k, pathD }) => (
            <path key={k} d={pathD} style={{ fill: tones[k] || 'var(--ink-mute)' }} stroke="var(--paper)" strokeWidth={2.5}/>
          ))}
          <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, fill: 'var(--ink)' }}>
            {totalCount}
          </text>
          <text x={cx} y={cy + 13} textAnchor="middle" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fill: 'var(--ink-faint)' }}>
            items
          </text>
        </svg>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, padding: '0 2px' }}>
        {slices.map(({ k, v, pct }) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: tones[k] || 'var(--ink-mute)', flexShrink: 0 }}/>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{labels[k] || k}</span>
            <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
              {v.count} · {Math.round(pct * 100)}%
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)', minWidth: 76, textAlign: 'right' }}>
              <Money value={v.value}/>
            </span>
          </div>
        ))}
      </div>
      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>Portfolio value</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--stamp-red)' }}><Money value={total}/></span>
      </div>
    </div>
  );
}

// Calendar view — upcoming pre-orders grouped by month (BRD v1.2 §9.5)
function PortfolioCalendar({ items }) {
  const pos = items.filter(i => i.status === 'preorder');
  const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  // Resolve a pre-order's release window — supports exact day, month, quarter, year, or TBD.
  // Most pre-orders ship "Q3 2026" or "mid-2026", not a fixed day — so we bucket by whatever the user knows.
  const poWindow = (it) => {
    const y = it.etaYear || 2026;
    const prec = it.etaPrecision || (it.etaDay != null ? 'day' : it.etaMonth != null ? 'month' : 'tbd');
    if (prec === 'tbd') return { bucketKey: 'zzzz', bucketLabel: 'Date to be announced', sort: 99999999, tileTop: 'TBD', tileBottom: '·', eta: 'Release date not announced yet' };
    if (prec === 'year') return { bucketKey: `${y}-13`, bucketLabel: `${y} · window TBD`, sort: y * 10000 + 1300, tileTop: 'YEAR', tileBottom: String(y).slice(2), eta: `Expected sometime in ${y}` };
    if (prec === 'quarter') {
      const q = it.etaQuarter || 1; const am = (q - 1) * 3;
      return { bucketKey: `${y}-Q${q}`, bucketLabel: `Q${q} ${y}`, sort: y * 10000 + am * 100 + 50, tileTop: `Q${q}`, tileBottom: `'${String(y).slice(2)}`, eta: `Expected Q${q} ${y}` };
    }
    const m = it.etaMonth != null ? it.etaMonth : 0;
    const day = prec === 'day' ? (it.etaDay || null) : null;
    return {
      bucketKey: `${y}-${String(m).padStart(2, '0')}`, bucketLabel: `${MONTH_FULL[m]} ${y}`,
      sort: y * 10000 + m * 100 + (day || 0), tileTop: MONTH_SHORT[m], tileBottom: day ? String(day) : '~',
      eta: day ? `Ships ~ ${day} ${MONTH_SHORT[m]} ${y}` : `Expected ${MONTH_FULL[m]} ${y}`,
    };
  };

  // Group items into release-window buckets, then sort buckets chronologically (TBD last).
  const grouped = {};
  pos.forEach(it => {
    const w = poWindow(it);
    if (!grouped[w.bucketKey]) grouped[w.bucketKey] = { label: w.bucketLabel, sort: w.sort, items: [] };
    grouped[w.bucketKey].items.push({ it, w });
  });
  const buckets = Object.values(grouped).sort((a, b) => a.sort - b.sort);
  if (buckets.length === 0) return <EmptyNote>No pre-orders on the calendar.</EmptyNote>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {buckets.map(g => (
        <div key={g.label}>
          {/* Window header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              background: 'var(--grail-gold)', color: 'var(--ink)',
              borderRadius: 7, padding: '4px 11px',
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12,
              letterSpacing: '0.04em', whiteSpace: 'nowrap',
            }}>
              {g.label}
            </div>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              {g.items.length} item{g.items.length !== 1 ? 's' : ''}
            </span>
          </div>
          {/* Items in window */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {g.items.map(({ it, w }) => {
              const c = catOf(it.sku);
              const balance = Math.max(0, (it.total != null ? it.total : it.value) - (it.deposit || 0));
              const bigDay = /^\d+$/.test(w.tileBottom);
              return (
                <div key={it.id} style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  background: 'var(--paper-soft)', border: '1px solid var(--border)',
                  borderRadius: 13, padding: 12,
                }}>
                  {/* Mini window tile */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                    border: '1px solid var(--grail-gold)', display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{
                      background: 'var(--grail-gold)', textAlign: 'center',
                      fontSize: w.tileTop.length > 3 ? 7 : 8, fontWeight: 700, color: 'var(--ink)',
                      letterSpacing: '0.06em', padding: '3px 0', lineHeight: 1,
                    }}>{w.tileTop}</div>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--grail-gold-soft)',
                      fontFamily: 'var(--font-mono)', fontWeight: 700,
                      fontSize: bigDay ? 17 : 13, color: 'var(--grail-gold-deep)', lineHeight: 1,
                    }}>{w.tileBottom}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 3 }}>
                      {it.order || 'On order'}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--grail-gold-deep)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      {w.eta}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 3 }}>
                      Balance due <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--stamp-red)' }}>₹{balance.toLocaleString('en-IN')}</b>
                    </div>
                  </div>
                  <Tag kind="po">PO</Tag>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Collage view — showcase wall (BRD v1.2 §9.5)
function PortfolioCollage({ items, owner }) {
  const { push } = useNav();
  if (items.length === 0) return <EmptyNote>Nothing to show off yet.</EmptyNote>;
  return (
    <div style={{ columnCount: 2, columnGap: 8 }}>
      {items.map((it, i) => {
        const c = catOf(it.sku);
        const ratio = ['3/4', '1/1', '4/5', '1/1'][i % 4];
        return (
          <button key={it.id} onClick={() => push({ name: 'item', sku: it.sku, owner: owner || 'you' })} style={{
            width: '100%', marginBottom: 8, padding: 0, border: 'none', borderRadius: 12, overflow: 'hidden',
            cursor: 'pointer', display: 'inline-block', breakInside: 'avoid', position: 'relative',
          }}>
            <ProductPhoto tone={c.tone} ratio={ratio} rounded={12} label={c.brand}/>
          </button>
        );
      })}
    </div>
  );
}

function ValueCard({ label, value, accent, plain }) {
  return (
    <div style={{ flex: 1, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, padding: '12px 14px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 19, color: accent, fontFeatureSettings: '"tnum" 1' }}>
        {plain ? value : <Money value={value}/>}
      </div>
    </div>
  );
}

function ItemTile({ item, isMe, owner }) {
  const { push, flashToast } = useNav();
  const { } = useAppState();
  const c = item.sku ? catOf(item.sku) : null;
  const displayTitle = (c && c.title) || item.title || 'Unknown item';
  const displayTone  = (c && c.tone)  || item.tone  || 'ink';
  return (
    <div onClick={() => {
        if (!item.sku) return; // DB Contribution item — no catalogue detail page yet
        if (isMe && item.listed) {
          const match = Object.entries(LISTINGS).find(([, l]) => l.sku === item.sku && l.seller === 'you');
          push(match ? { name: 'listing', id: match[0] } : { name: 'item', sku: item.sku, owner: owner || 'you' });
        } else {
          push({ name: 'item', sku: item.sku, owner: owner || 'you' });
        }
      }} role="button" tabIndex={0}
      style={{
        background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, overflow: 'hidden',
        cursor: 'pointer', textAlign: 'left', padding: 0, display: 'flex', flexDirection: 'column',
      }}>
      <div style={{ position: 'relative' }}>
        <ProductPhoto tone={displayTone} ratio="1/1" rounded={0}/>
        {item.status === 'intel' && item.isNewToDb && (
          <div style={{ position: 'absolute', top: 7, left: 7, fontSize: 10, fontWeight: 700, color: 'var(--paper)', background: 'var(--verified-teal)', padding: '2px 6px', borderRadius: 5 }}>NEW DB</div>
        )}
        {item.listed && <div style={{ position: 'absolute', top: 7, right: 7 }}><Tag kind="sale">Listed</Tag></div>}
        {item.status === 'preorder' && <div style={{ position: 'absolute', bottom: 7, left: 7 }}><Tag kind="po">PO</Tag></div>}
        {/* Wishlist-for-others button — bottom-right, always visible on others' profiles */}
        {false && (
          <button
            onClick={e => {}}
            style={{
              position: 'absolute', bottom: 7, right: 7,
              width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
              background: isWishlisted ? 'var(--stamp-red)' : 'rgba(20,17,15,0.52)',
              color: 'var(--paper)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Ico d={Icons.bookmark} size={14} stroke={isWishlisted ? 0 : 1.75} fill={isWishlisted ? 'currentColor' : 'none'}/>
          </button>
        )}
      </div>
      <div style={{ padding: '8px 9px 10px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25, color: 'var(--ink)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 31 }}>{displayTitle}</div>
        {item.status !== 'intel' && item.status !== 'wishlist' && <div style={{ fontSize: 12.5, marginTop: 5, color: 'var(--ink-mute)' }}><Money value={item.value}/></div>}
      </div>
    </div>
  );
}

function TradesTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {TRADE_HISTORY.map((d, i) => {
        const u = userOf(d.with);
        return (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < TRADE_HISTORY.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <Avatar name={u.name} color={u.color} size={40}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{d.dir} · {d.item}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>with @{u.handle} · {d.when}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
              <Tag kind="vouch" style={{ fontSize: 9 }}>Vouched</Tag>
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { CollectionTab, PortfolioChart, PortfolioCalendar, PortfolioCollage, ValueCard, ItemTile, TradesTab });
