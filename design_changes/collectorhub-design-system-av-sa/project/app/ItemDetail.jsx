// ─────────────────────────────────────────────────────────────
// Item detail (in collection) — BRD §9.5
// Entry point for Sell/Trade; verification upgrade; wishlist alert.
// ─────────────────────────────────────────────────────────────

function ItemDetail({ route }) {
  const { push, flashToast } = useNav();
  const { wishAlerts, toggleWish } = useAppState();
  const c = catOf(route.sku);
  // is this in my collection?
  const mine = MY_ITEMS.find(i => i.sku === route.sku);
  // is it listed on the market?
  const market = LISTINGS.find(l => l.sku === route.sku);
  const verify = mine ? mine.verify : 'claimed';
  const owned = mine && mine.status === 'owned';
  const isWish = mine && mine.status === 'wishlist';
  const alerted = mine && wishAlerts[mine.id];
  const [photo, setPhoto] = React.useState(0);
  const nPhotos = mine ? Math.max(mine.photos, 1) : 1;

  return (
    <Screen nav={false} header={null}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px' }}>
          {owned ? (
            mine.listed
              ? <Button variant="secondary" size="block" onClick={() => market && push({ name: 'listing', id: market.id })}>Manage listing</Button>
              : <Button variant="primary" size="block" icon={<Ico d={Icons.tag} size={18}/>}
                  onClick={() => push({ name: 'sell', sku: route.sku })}>Sell / Trade this item</Button>
          ) : isWish ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant={alerted ? 'secondary' : 'teal'} size="lg" style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.bell} size={17}/>}
                onClick={() => { toggleWish(mine.id); flashToast(alerted ? 'Wishlist alert off' : 'We’ll notify you when it lists'); }}>
                {alerted ? 'Alert on' : 'Notify when listed'}
              </Button>
              {market && <Button variant="primary" size="lg" onClick={() => push({ name: 'listing', id: market.id })}>View listing</Button>}
            </div>
          ) : (
            <Button variant="dark" size="block" icon={<Ico d={Icons.plusCircle} size={18}/>}
              onClick={() => push({ name: 'add-item', sku: route.sku })}>Add to my collection</Button>
          )}
        </div>
      }>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
          <DetailHeader transparent trailing={mine && <IconButton icon={<Ico d={Icons.more} size={18}/>} onClick={() => flashToast('Edit · privacy · remove')}/>}/>
        </div>
        <ProductPhoto tone={c.tone} ratio="1/1" rounded={0} label={mine && mine.photos ? `your photo · ${photo + 1} of ${nPhotos}` : 'catalogue reference'}/>
      </div>

      <div style={{ padding: '14px 16px 20px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          <VerifyBadge tier={verify} size="lg"/>
          {mine && <Tag kind={mine.status === 'preorder' ? 'po' : mine.status === 'wishlist' ? 'reserved' : 'default'}>{statusLabel(mine.status)}</Tag>}
          {mine && mine.listed && <Tag kind="sale">Listed</Tag>}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 4px' }}>{c.title}</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 14 }}>{c.brand} · {c.scale} · {c.year} · SKU {c.sku}</div>

        {/* value + verification */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <ValueCard label={isWish ? 'Est. market value' : 'Est. value'} value={mine ? mine.value : c.est} accent="var(--ink)"/>
          <div style={{ flex: 1, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, padding: '12px 14px' }}>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 6 }}>Ownership</div>
            <VerifyBadge tier={verify} size="lg"/>
          </div>
        </div>

        {/* pre-order timeline */}
        {mine && mine.status === 'preorder' && (
          <div style={{ background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)', borderRadius: 13, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--grail-gold-deep)', fontWeight: 600, fontSize: 13.5 }}>
              <Ico d={Icons.clock} size={16}/>Pre-order timeline
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6 }}>{mine.order} · {mine.eta}</div>
          </div>
        )}

        {/* verification nudge */}
        {owned && verify !== 'verified' && (
          <button onClick={() => flashToast('Open camera to capture an ownership photo')} style={{
            display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', cursor: 'pointer',
            background: 'var(--paper-soft)', border: '1px dashed var(--border-strong)', borderRadius: 13, padding: 13, marginBottom: 16,
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--verified-teal)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico d={Icons.camera} size={19}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Verify ownership to list it</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Capture an in-app photo + challenge shot. Listings need Verified.</div>
            </div>
          </button>
        )}

        <SectionLabel>About this item</SectionLabel>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-soft)', marginTop: 10 }}>
          {c.brand} {c.title.split('·').slice(1).join('·').trim() || c.title}. Catalogue entry from the CollectorHub database, {c.year}. {market ? 'Currently available on the marketplace from a verified seller.' : 'No active listings right now — add a wishlist alert to get notified.'}
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { ItemDetail });
