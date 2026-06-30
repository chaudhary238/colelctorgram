// ─────────────────────────────────────────────────────────────
// Item detail (in collection) — BRD §9.5
// Entry point for Sell/Trade; verification upgrade; wishlist alert.
// ─────────────────────────────────────────────────────────────

function ItemDetail({ route }) {
  const { push, pop, flashToast } = useNav();
  const { wishAlerts, toggleWish, userListings, removeItem, removedSkus } = useAppState();
  const [showRemoveSheet, setShowRemoveSheet] = React.useState(false);
  const [removeReason, setRemoveReason] = React.useState('');
  const c = catOf(route.sku);
  const mine = MY_ITEMS.find(i => i.sku === route.sku);
  const allListings = [...(userListings || []), ...LISTINGS];
  const market    = allListings.find(l => (l.sku === route.sku || l.sku === route.sku) && (l.seller === 'you' || l.mine));
  const marketAny = allListings.find(l => l.sku === route.sku);
  // hasActiveListing: either seed data says listed, OR user created one via the app
  const hasActiveListing = (mine && mine.listed) || !!(userListings || []).find(l => l.sku === route.sku);
  const verify = mine ? mine.verify : 'claimed';
  const owned  = mine && mine.status === 'owned';
  const isWish = mine && mine.status === 'wishlist';
  const alerted = mine && wishAlerts[mine.id];
  const [photo, setPhoto]     = React.useState(0);
  const [showMenu, setShowMenu] = React.useState(false);
  const nPhotos = mine ? Math.max(mine.photos, 1) : 1;

  return (
    <Screen nav={false} header={null}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px' }}>
          {owned ? (
            <Button variant="primary" size="block" icon={<Ico d={Icons.edit} size={18}/>}
              onClick={() => push({ name: 'add-listing', editId: market?.id, sku: route.sku })}>Modify / Sell item</Button>
          ) : mine && mine.status === 'preorder' ? (
            <Button variant="secondary" size="block" icon={<Ico d={Icons.edit} size={18}/>}
              onClick={() => push({ name: 'add-listing', editId: market?.id, sku: route.sku })}>Edit preorder details</Button>
          ) : isWish ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant={alerted ? 'secondary' : 'teal'} size="lg" style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.bell} size={17}/>}
                onClick={() => { toggleWish(mine.id); flashToast(alerted ? 'Wishlist alert off' : 'We\u2019ll notify you when it lists'); }}>
                {alerted ? 'Alert on' : 'Notify when listed'}
              </Button>
              {marketAny && <Button variant="primary" size="lg" onClick={() => push({ name: 'listing', id: marketAny.id })}>View listing</Button>}
            </div>
          ) : (
            <Button variant="dark" size="block" icon={<Ico d={Icons.plusCircle} size={18}/>}
              onClick={() => push({ name: 'add-item', sku: route.sku })}>Add to my collection</Button>
          )}
        </div>
      }>

      {/* ⋯ overflow menu — at screen level so it is never clipped */}
      {showMenu && (
        <div onClick={() => setShowMenu(false)}
          style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'absolute', top: 58, right: 14, zIndex: 51,
            background: 'var(--card-surface)', border: '1px solid var(--slate-200)',
            borderRadius: 14, boxShadow: 'var(--card-shadow-lifted)',
            minWidth: 200, overflow: 'hidden',
          }}>
            {owned && hasActiveListing && market && (
              <button onClick={() => { setShowMenu(false); push({ name: 'add-listing', editId: market.id }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '13px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', textAlign: 'left' }}>
                <Ico d={Icons.edit} size={16} stroke={2}/> Edit listing
              </button>
            )}
            {owned && !hasActiveListing && (
              <button onClick={() => { setShowMenu(false); push({ name: 'sell', sku: route.sku }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '13px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', textAlign: 'left' }}>
                <Ico d={Icons.tag} size={16} stroke={2}/> List for sale
              </button>
            )}
            <button onClick={() => { setShowMenu(false); flashToast('Privacy settings coming soon'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '13px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', textAlign: 'left' }}>
              <Ico d={Icons.eye} size={16} stroke={2}/> Privacy settings
            </button>
            <button onClick={() => { setShowMenu(false); setShowRemoveSheet(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--stamp-red)', textAlign: 'left' }}>
              <Ico d={Icons.trash} size={16} stroke={2}/> Remove from collection
            </button>
          </div>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
          <DetailHeader transparent trailing={mine && (
            <IconButton icon={<Ico d={Icons.more} size={18}/>} onClick={() => setShowMenu(v => !v)}/>
          )}/>
        </div>
        <ProductPhoto tone={c.tone} ratio="1/1" rounded={0} label={mine && mine.photos ? `your photo · ${photo + 1} of ${nPhotos}` : 'catalogue reference'}/>
      </div>

      <div style={{ padding: '14px 16px 20px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          {mine && <Tag kind={mine.status === 'preorder' ? 'po' : mine.status === 'wishlist' ? 'reserved' : 'default'}>{statusLabel(mine.status)}</Tag>}
          {mine && mine.listed && <Tag kind="sale">Listed</Tag>}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 4px' }}>{c.title}</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 14 }}>{c.brand} · {c.scale} · {c.year} · SKU {c.sku}</div>

        {/* value */}
        <div style={{ marginBottom: 16 }}>
          <ValueCard label={isWish ? 'Est. market value' : 'Est. value'} value={mine ? mine.value : c.est} accent="var(--ink)"/>
        </div>

        {/* pre-order timeline */}
        {mine && mine.status === 'preorder' && (
          <div style={{ background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)', borderRadius: 13, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--grail-gold-deep)', fontWeight: 600, fontSize: 13.5 }}>
              <Ico d={Icons.clock} size={16}/>Pre-order timeline
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6 }}>{mine.order} · {mine.eta}{mine.seller ? ` · ${mine.seller}` : ''}</div>
            {(mine.total != null || mine.deposit != null) && (() => {
              const total = mine.total != null ? mine.total : mine.value;
              const deposit = mine.deposit || 0;
              const balance = Math.max(0, total - deposit);
              const Row = ({ label, value, accent }) => (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--ink-mute)' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: accent ? 700 : 600, color: accent ? 'var(--stamp-red)' : 'var(--ink)' }}>₹{value.toLocaleString('en-IN')}</span>
                </div>
              );
              return (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--grail-gold)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Row label="Total price" value={total}/>
                  <Row label="Deposit paid" value={deposit}/>
                  <Row label="Balance due" value={balance} accent/>
                </div>
              );
            })()}
          </div>
        )}

        <SectionLabel>About this item</SectionLabel>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-soft)', marginTop: 10 }}>
          {c.brand} {c.title.split('\u00b7').slice(1).join('\u00b7').trim() || c.title}. Catalogue entry from the CollectorHub database, {c.year}. {marketAny ? 'Currently available on the marketplace.' : 'No active listings right now \u2014 add a wishlist alert to get notified.'}
        </div>
      </div>
    
      {/* ── Remove from collection sheet ── */}
      {showRemoveSheet && (
        <div onClick={() => setShowRemoveSheet(false)} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 0 36px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 18px' }}/>
            <div style={{ padding: '0 20px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>Remove from collection?</div>
              <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4 }}>Tell us why — this helps keep your collection accurate.</div>
            </div>
            {[
              { id: 'sold-offline', label: 'Sold offline', icon: Icons.tag },
              { id: 'traded',       label: 'Traded offline', icon: Icons.swap },
              { id: 'lost',         label: 'Lost', icon: Icons.search },
              { id: 'broken',       label: 'Broken or damaged', icon: Icons.close },
              { id: 'gifted',       label: 'Gifted to someone', icon: Icons.gift },
              { id: 'other',        label: 'Other reason', icon: Icons.more },
            ].map(r => (
              <button key={r.id} onClick={() => setRemoveReason(r.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px',
                background: removeReason === r.id ? 'var(--bone)' : 'none', border: 'none',
                borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: removeReason === r.id ? 'var(--stamp-red)' : 'var(--paper-soft)',
                  color: removeReason === r.id ? 'var(--paper)' : 'var(--ink-mute)',
                }}>
                  <Ico d={r.icon} size={16}/>
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, fontWeight: removeReason === r.id ? 600 : 400, color: 'var(--ink)' }}>{r.label}</span>
                {removeReason === r.id && <Ico d={Icons.check} size={16} style={{ marginLeft: 'auto', color: 'var(--stamp-red)' }}/>}
              </button>
            ))}
            <div style={{ padding: '16px 20px 0' }}>
              <Button variant="primary" style={{ width: '100%', justifyContent: 'center', opacity: removeReason ? 1 : 0.45,
                background: 'var(--stamp-red)', borderColor: 'var(--stamp-red)' }}
                onClick={() => {
                  if (!removeReason) return;
                  removeItem(route.sku);
                  setShowRemoveSheet(false);
                  flashToast('Removed from your collection');
                  setTimeout(() => pop(), 50);
                }}>
                Remove item
              </Button>
              <Button variant="secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                onClick={() => setShowRemoveSheet(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}

Object.assign(window, { ItemDetail });
