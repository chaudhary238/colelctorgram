// ─────────────────────────────────────────────────────────────
// Item detail (in collection) — BRD §9.5
// Entry point for Sell/Trade; verification upgrade; DB Contribution.
// ─────────────────────────────────────────────────────────────

function ItemDetail({ route }) {
  const { push, pop, flashToast, setOverlay } = useNav();
  const appState = useAppState();
  const { userListings, removeItem, removedSkus, unlistListing, relistListing, archivedListings, setListing, setItemSold, quickAddItem, addAnotherCopy, setItemStatus } = appState;
  const RESOLVED = resolveMyItems(appState);
  const [showRemoveSheet, setShowRemoveSheet] = React.useState(false);
  const [showSoldSheet, setShowSoldSheet] = React.useState(false);
  const [removeReason, setRemoveReason] = React.useState('');
  const c = catOf(route.sku);
  if (!c) return null; // catalogue row missing — nothing to render a page from
  const viewingOwn = !route.owner || route.owner === 'you';
  const ownerHandle = viewingOwn ? 'you' : route.owner;
  const findCopy = (list) => route.itemId ? list.find(i => i.id === route.itemId)
    // Prefer a real copy over a wishlist row for the same sku, so the page shows ownership
    // rather than the wish when both exist.
    : (list.find(i => i.sku === route.sku && (i.status === 'owned' || i.status === 'preorder'))
       || list.find(i => i.sku === route.sku));
  const mine = viewingOwn ? findCopy(RESOLVED) : null;
  // when visiting someone else's collection we still show their copy's public details
  const theirs = viewingOwn ? null : findCopy(RESOLVED);
  const copy = mine || theirs;
  const allListings = [...(userListings || []), ...LISTINGS];
  const market       = allListings.find(l => (l.sku === route.sku) && (l.seller === 'you' || l.mine));
  const skuListings  = allListings.filter(l => l.sku === route.sku && l.status !== 'sold');
  const marketAny    = skuListings[0];
  const cheapest     = skuListings.sort((a, b) => (a.price || 0) - (b.price || 0))[0];
  const listingCount = skuListings.length;
  // Resolved against the real listings pool for THIS owner — never the shared seed `listed` flag,
  // which used to show a "Listed" tag on another collector's copy that had no listing behind it.
  const ownerListing = activeListingFor(route.sku, ownerHandle, userListings, copy ? copy.status : 'owned', appState);
  const hasActiveListing = !!ownerListing;
  // Sold stays in the collection, greyed, with its record intact — it is not a removal.
  const sold = !!(mine && mine.sold);
  // Unlisting archives the terms, so relisting is one tap rather than a re-typed form.
  const archived = viewingOwn && mine ? Object.keys(archivedListings || {})
    .map(k => archivedListings[k]).find(l => l.sku === route.sku) : null;
  const canRelist = !!(archived && !hasActiveListing && !sold && mine && mine.status === 'owned');
  const verify = mine ? mine.verify : 'claimed';
  const owned  = mine && mine.status === 'owned';
  const isWish = mine && mine.status === 'intel';
  const [photo, setPhoto]     = React.useState(0);
  const [showMenu, setShowMenu] = React.useState(false);
  // Every ownership card opens collapsed for consistency; only an incomplete copy opens expanded,
  // because there the rows are the call to action.
  const [copyOpen, setCopyOpen] = React.useState(!!(mine && (mine.status === 'preorder' || itemGaps(mine).length)));
  const { dbWishlist, toggleDbWishlist, dbRatings, rateDbItem } = useAppState();
  const myRating = (dbRatings || {})[route.sku] || 0;
  const avg = c.rating ? c.rating.avg : 0;
  const ratingCount = (c.rating ? c.rating.count : 0) + (myRating ? 1 : 0);
  const itemComments = (typeof COMMENTS !== 'undefined' && COMMENTS['item-' + route.sku]) || [];
  const nPhotos = mine ? Math.max(mine.photos, 1) : 1;

  return (
    <Screen nav={false} header={null}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px', display: 'flex', gap: 10 }}>
          {/* One page serves the database entry and an owned copy alike — only the CTA differs. */}
          {!copy ? (
            <Button variant="dark" size="block" icon={<Ico d={Icons.plusCircle} size={18}/>} style={{ flex: 1 }}
              onClick={() => { quickAddItem(route.sku); flashToast('+5 XP · Added to collection', '+20 XP when you add condition & price'); }}>
              Add to collection
            </Button>
          ) : !viewingOwn ? (() => {
            // A visitor may already own this item themselves — don't offer to add it twice.
            const iOwnIt = RESOLVED.find(i => i.sku === route.sku && (i.status === 'owned' || i.status === 'preorder'));
            return iOwnIt ? (
              <Button variant="secondary" size="block" icon={<Ico d={Icons.check} size={18}/>} style={{ flex: 1 }}
                onClick={() => push({ name: 'item', sku: route.sku, itemId: iOwnIt.id })}>In your collection</Button>
            ) : (
              <Button variant="dark" size="block" icon={<Ico d={Icons.plusCircle} size={18}/>} style={{ flex: 1 }}
                onClick={() => { quickAddItem(route.sku); flashToast('+5 XP · Added to collection', '+20 XP when you add condition & price'); }}>
                I own this too
              </Button>
            );
          })() : mine && (owned || mine.status === 'preorder') ? (
            <Button variant={sold ? 'secondary' : 'primary'} size="block" icon={<Ico d={Icons.sliders} size={18}/>} style={{ flex: 1 }}
              onClick={() => setShowMenu(true)}>
              {sold ? 'Manage — sold' : mine.status === 'preorder' ? 'Manage pre-order' : hasActiveListing ? 'Manage — listed' : 'Manage this item'}
            </Button>
          ) : (
            <Button variant="dark" size="block" icon={<Ico d={Icons.plusCircle} size={18}/>} style={{ flex: 1 }}
              onClick={() => { quickAddItem(route.sku); flashToast('+5 XP · Moved to your collection', '+20 XP when you add condition & price'); }}>
              I own this now
            </Button>
          )}
          {/* Wishlist only makes sense before you own it — once it's yours, Manage replaces it. */}
          {!mine && (
            <button onClick={() => { toggleDbWishlist(route.sku); flashToast(dbWishlist[route.sku] ? 'Removed from wishlist' : 'Added to wishlist'); }} style={{
              width: 52, flexShrink: 0, borderRadius: 12, border: '1px solid var(--border-strong)',
              background: dbWishlist[route.sku] ? 'var(--stamp-red-soft)' : 'var(--paper)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={Icons.star} size={21} fill={dbWishlist[route.sku] ? 'var(--stamp-red)' : 'none'} style={{ color: dbWishlist[route.sku] ? 'var(--stamp-red)' : 'var(--ink-faint)' }}/>
            </button>
          )}
        </div>
      }>

      {/* ── Manage this item ── every action that applies to this copy, in one sheet.
          A dropdown couldn't carry the "what does this do" line each situation needs. */}
      {showMenu && mine && (() => {
        const isPo = mine.status === 'preorder';
        const money = v => `₹${(v || 0).toLocaleString('en-IN')}`;
        const close = () => setShowMenu(false);
        const rows = [
          sold && { icon: Icons.swap, label: 'Still have it — undo sold', desc: 'Back to a normal owned item, counting toward your value',
            onClick: () => { close(); setItemSold(mine.id, false); flashToast('Back in your collection'); } },
          isPo && !sold && { icon: Icons.check, label: 'It arrived — mark as owned', desc: 'Moves it out of your pre-order calendar',
            onClick: () => { close(); setItemStatus(mine.id, 'owned'); flashToast('It’s yours — moved to Owned', 'Check the condition and what you paid'); } },
          canRelist && { icon: Icons.tag, label: 'Relist for sale', desc: `Back on the market at ${money(archived.price)}`,
            onClick: () => { close(); relistListing(archived.id); flashToast('Relisted at your previous terms'); } },
          owned && !hasActiveListing && !sold && !canRelist && { icon: Icons.tag, label: 'List for sale', desc: 'Set a price and put it on the market',
            onClick: () => { close(); push({ name: 'add-listing', sku: route.sku, itemId: mine.id, forSale: true }); } },
          !sold && { icon: Icons.edit, label: isPo ? 'Edit pre-order details' : 'Edit item',
            desc: isPo ? 'ETA, total, deposit and where you ordered from' : hasActiveListing ? 'Condition, price, photos and listing terms' : 'Condition, price paid and photos',
            onClick: () => { close(); isPo ? push({ name: 'complete-items', itemId: mine.id }) : push({ name: 'add-listing', sku: route.sku, itemId: mine.id, editId: market ? market.id : undefined }); } },
          !sold && { icon: Icons.plusCircle, label: 'Add another copy', desc: 'A second one you own — different condition, a resale copy, a gift',
            onClick: () => { close(); const id = addAnotherCopy(route.sku, isPo ? 'preorder' : 'owned'); flashToast('+5 XP · Added a second copy', 'Give it its own condition & price'); push({ name: 'item', sku: route.sku, itemId: id }); } },
          owned && hasActiveListing && market && !sold && { icon: Icons.check, label: 'Mark as sold', desc: 'Closes the listing; the item stays here with a Sold tag',
            onClick: () => { close(); setShowSoldSheet(true); } },
          owned && hasActiveListing && market && !sold && { icon: Icons.send, label: 'Share to Feed', desc: 'Post this listing to your feed with a caption',
            onClick: () => { close(); setOverlay({ name: 'share-to-feed', listingId: market.id }); } },
          owned && hasActiveListing && market && !sold && { icon: Icons.close, label: 'Unlist from market', desc: 'Stop selling it — Relist later at these same terms',
            onClick: () => { close(); unlistListing(market.id, ownerListing); flashToast('Unlisted — stays in your collection', 'Relist puts it back at these terms'); } },
          !sold && !isPo && { icon: Icons.clock, label: 'Change to pre-order', desc: 'You don’t have it in hand yet',
            onClick: () => { close(); setItemStatus(mine.id, 'preorder'); flashToast('Moved to pre-orders'); } },
          { icon: Icons.trash, label: isPo ? 'Cancel pre-order' : 'Remove from collection', danger: true,
            desc: isPo ? 'Cancelled, refunded or slot transferred' : 'Sold offline, traded, lost or gifted',
            onClick: () => { close(); setShowRemoveSheet(true); } },
        ].filter(Boolean);
        const state = sold ? 'Sold' : isPo ? 'On pre-order' : hasActiveListing ? 'Owned · listed for sale' : 'Owned';
        return (
          <div onClick={close} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'flex-end' }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxHeight: '86%', overflowY: 'auto', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 0 34px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 16px' }}/>
              <div style={{ padding: '0 20px 12px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Manage this item</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 3 }}>{state} · {c.title}</div>
              </div>
              {rows.map(row => (
                <button key={row.label} onClick={row.onClick} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '13px 20px', textAlign: 'left',
                  background: 'none', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: row.danger ? 'var(--stamp-red-soft)' : 'var(--paper-soft)', color: row.danger ? 'var(--stamp-red)' : 'var(--ink-mute)' }}>
                    <Ico d={row.icon} size={16}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, fontWeight: 600, color: row.danger ? 'var(--stamp-red)' : 'var(--ink)' }}>{row.label}</div>
                    {row.desc && <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>{row.desc}</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })()}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
          <DetailHeader transparent/>
        </div>
        <ProductPhoto tone={c.tone} ratio="1/1" rounded={0} label={mine && mine.photos ? `your photo · ${photo + 1} of ${nPhotos}` : 'catalogue reference'}/>
      </div>

      <div style={{ padding: '14px 16px 20px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          {mine && <Tag kind={mine.status === 'preorder' ? 'po' : mine.status === 'intel' ? 'teal' : 'default'}>{statusLabel(mine.status)}</Tag>}
          {mine && sold && <Tag kind="sold">Sold</Tag>}
          {mine && hasActiveListing && !sold && <Tag kind="sale">Listed</Tag>}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 4px' }}>{c.title}</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>{[c.brand, c.scale !== '—' ? c.scale : null, c.year].filter(Boolean).join(' · ')}</div>
        {/* Provenance row — review state and contributor on ONE line. These were two stacked
            pills; the page reads the same and saves ~40px above the fold. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {(c.scorredReviewed || !c.intelBy) ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'oklch(97% 0.01 30)', border: '1px solid oklch(85% 0.04 30)' }}>
              <SealMark size={14} style={{ flexShrink: 0 }}/>
              <span style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 600 }}>Scorred Reviewed</span>
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'var(--bone)', border: '1px solid var(--border-strong)' }}>
              <Ico d={Icons.clock} size={12} style={{ color: 'var(--ink-faint)', flexShrink: 0 }}/>
              <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 600 }}>Pending Review</span>
            </span>
          )}
          <span onClick={() => c.intelBy && c.intelBy !== 'you' && push({ name: 'profile', user: c.intelBy })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--verified-teal)',
              cursor: (c.intelBy && c.intelBy !== 'you') ? 'pointer' : 'default' }}>
            <Ico d={Icons.eye} size={12} style={{ flexShrink: 0 }}/>
            Added by <span style={{ fontWeight: 700 }}>{c.intelBy ? (c.intelBy === 'you' ? '@you' : `@${c.intelBy.replace('_','.')}`) : 'Scorred'}</span>
          </span>
        </div>

        {/* Est. value — suppressed only when the ownership card below already carries a private price */}
        {!isWish && !(viewingOwn && copy && copy.value) && (
          <div style={{ marginBottom: 14 }}><ValueCard label="Est. value" value={c.est} accent="var(--ink)"/></div>
        )}

        {/* ── Ownership slot — the only variable region of the page ──
            DB Contributions get no card (nobody owns them; the teal attribution pill above covers it).
            Pre-orders reuse the same card with a gold tint and the order timeline as its body. */}
        {copy && copy.status !== 'intel' && (() => {
          const isPo = copy.status === 'preorder';
          const poTotal = copy.total != null ? copy.total : copy.value;
          const poDeposit = copy.deposit || 0;
          const poBalance = Math.max(0, (poTotal || 0) - poDeposit);
          const hasTotal = poTotal != null && poTotal > 0;
          const money = v => `₹${(v || 0).toLocaleString('en-IN')}`;
          // Gaps only matter on your own copy — a visitor shouldn't be told what you haven't filled in.
          const gaps = viewingOwn ? itemGaps(copy) : [];
          const header = sold ? 'Your copy — sold' : isPo
            ? (viewingOwn ? 'Your pre-order' : `@${ownerHandle.replace('_', '.')} has this on pre-order`)
            : (viewingOwn ? 'About your copy' : `In @${ownerHandle.replace('_', '.')}’s collection`);
          const sub = gaps.length ? gapSentence(gaps) : isPo
            // Collapsed, a pre-order still has to show the two things you'd open it for.
            ? [etaLabel(copy) ? etaLabel(copy) : (copy.etaPrecision === 'tbd' ? 'Date not announced' : null),
               viewingOwn && hasTotal && poBalance > 0 ? `${money(poBalance)} due` : null].filter(Boolean).join(' · ')
            : [sold ? 'Sold' : statusLabel(copy.status), copy.cond, viewingOwn && copy.value ? money(copy.value) : null].filter(Boolean).join(' · ');
          const rows = isPo
            ? [
                // The order date is optional and isn't collected by the finish flow, so it only
                // appears once it exists — an "Add →" that leads nowhere is worse than no row.
                copy.order ? { label: 'Ordered', value: copy.order } : null,
                { label: 'Expected', value: copy.etaPrecision === 'tbd' ? 'Not announced' : (etaLabel(copy) || 'TBD') },
                viewingOwn && copy.seller ? { label: 'Ordered from', value: copy.seller } : null,
                viewingOwn ? { label: 'Total price', value: hasTotal ? money(poTotal) : '—' } : null,
                // Deposit and balance only mean something once there's a total to measure against.
                viewingOwn && hasTotal ? { label: 'Deposit paid', value: money(poDeposit) } : null,
                viewingOwn && hasTotal ? { label: 'Balance due', value: money(poBalance), accent: true } : null,
              ].filter(Boolean)
            : [
                { label: 'Status', value: sold ? 'Sold' : statusLabel(copy.status) },
                { label: 'Condition', value: copy.cond || '—' },
                viewingOwn ? { label: 'What you paid', value: copy.value ? money(copy.value) : '—' } : null,
                { label: viewingOwn ? 'Your photos' : 'Owner photos', value: copy.photos ? `${copy.photos}` : 'None yet' },
                { label: 'Listed for sale', value: sold ? 'Closed' : hasActiveListing ? 'Yes' : 'No' },
              ].filter(Boolean);
          return (
            <div style={{ border: `1px solid ${sold ? 'var(--border)' : isPo ? 'var(--grail-gold)' : 'var(--border-strong)'}`, borderRadius: 14,
              background: sold ? 'var(--bone)' : isPo ? 'var(--grail-gold-soft)' : 'var(--paper-soft)',
              filter: sold ? 'grayscale(1)' : 'none', marginBottom: 14, overflow: 'hidden' }}>
              <button onClick={() => setCopyOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', textAlign: 'left',
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {isPo && <Ico d={Icons.clock} size={15} style={{ color: 'var(--grail-gold-deep)', flexShrink: 0 }}/>}
                    <span style={{ fontSize: 14, fontWeight: 700, color: isPo ? 'var(--grail-gold-deep)' : 'var(--ink)' }}>{header}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: gaps.length ? 'var(--grail-gold-deep)' : 'var(--ink-faint)', marginTop: 2, fontWeight: gaps.length ? 700 : 400 }}>{sub}</div>
                </div>
                <Ico d={Icons.chevR} size={16}
                  style={{ color: 'var(--ink-faint)', flexShrink: 0, transform: copyOpen ? 'rotate(90deg)' : 'none', transition: 'transform 130ms' }}/>
              </button>
              {copyOpen && (
                <div style={{ padding: '2px 14px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {rows.map(r => {
                    const isGap = r.value === '—' || r.value === 'TBD';
                    return (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
                        <span style={{ color: 'var(--ink-faint)' }}>{r.label}</span>
                        {viewingOwn && isGap ? (
                          <button onClick={() => push({ name: 'complete-items', itemId: copy.id })} style={{
                            padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                            fontWeight: 700, fontSize: 12.5, color: 'var(--grail-gold-deep)' }}>Add →</button>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: r.accent ? 700 : 600, color: r.accent ? 'var(--stamp-red)' : 'var(--ink)' }}>{r.value}</span>
                        )}
                      </div>
                    );
                  })}
                  {viewingOwn && isPo && (
                    <button onClick={() => push({ name: 'complete-items', itemId: copy.id })} style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, padding: '10px 12px', borderRadius: 10,
                      border: '1px solid var(--grail-gold)', background: 'var(--paper)', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>
                      <Ico d={Icons.edit} size={14} style={{ color: 'var(--grail-gold-deep)' }}/>
                      Edit pre-order details
                      <Ico d={Icons.chevR} size={14} style={{ marginLeft: 'auto', color: 'var(--ink-faint)' }}/>
                    </button>
                  )}
                  {gaps.length > 0 && (
                    <button onClick={() => push({ name: 'complete-items', itemId: copy.id })} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 3, height: 40, borderRadius: 10,
                      border: '1px solid var(--grail-gold)', background: 'var(--grail-gold-soft)', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--grail-gold-deep)' }}>
                      Finish this item · +20 XP
                    </button>
                  )}
                  {/* a live listing is a row inside this card, never a competing price block */}
                  {hasActiveListing && ownerListing && (
                    <button onClick={() => push({ name: 'listing', id: ownerListing.id })} style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, padding: '10px 12px', borderRadius: 10,
                      border: '1px solid var(--border-strong)', background: 'var(--paper)', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'var(--font-body)' }}>
                      <Tag kind="sale">{statusLabel(ownerListing.status)}</Tag>
                      <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{money(ownerListing.price)}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-mute)' }}>View listing</span>
                      <Ico d={Icons.chevR} size={14} style={{ color: 'var(--ink-faint)' }}/>
                    </button>
                  )}
                  {!viewingOwn && (
                    <button onClick={() => push({ name: 'chat', user: ownerHandle })} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 3, height: 38, borderRadius: 10,
                      border: '1px solid var(--border-strong)', background: 'var(--paper)', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>
                      <Ico d={Icons.message} size={14}/>Ask @{ownerHandle.replace('_', '.')} about it
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* community stats — one compact row; the big numeric tiles cost 80px for two numbers */}
        <div style={{ display: 'flex', alignItems: 'stretch', background: 'var(--bone)', borderRadius: 12, marginBottom: 4, overflow: 'hidden' }}>
          <button onClick={() => push({ name: 'db-people', sku: c.sku, mode: 'owners' })} style={{
            flex: 1, cursor: 'pointer', border: 'none', background: 'none', padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-body)' }}>
            <Ico d={Icons.user} size={14} style={{ color: 'var(--ink-mute)', flexShrink: 0 }}/>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{c.ownersCount || 0}</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>own this</span>
            <Ico d={Icons.chevR} size={14} style={{ marginLeft: 'auto', color: 'var(--ink-faint)', flexShrink: 0 }}/>
          </button>
          <div style={{ width: 1, background: 'var(--border)' }}/>
          <button onClick={() => push({ name: 'db-people', sku: c.sku, mode: 'wishlist' })} style={{
            flex: 1, cursor: 'pointer', border: 'none', background: 'none', padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-body)' }}>
            <Ico d={Icons.star} size={14} style={{ color: 'var(--ink-mute)', flexShrink: 0 }}/>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{(c.wishCount || 0) + ((dbWishlist || {})[c.sku] ? 1 : 0)}</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>wishlisted</span>
            <Ico d={Icons.chevR} size={14} style={{ marginLeft: 'auto', color: 'var(--ink-faint)', flexShrink: 0 }}/>
          </button>
        </div>

        {/* ── Collapsible tail ── every long section uses the same Disclosure, so the page ends
            just below the fold regardless of how much catalogue copy or discussion exists. */}
        {/* Brand/scale/year already sit under the title — this is the description only,
            not a second spec sheet. */}
        <Disclosure title="About this item" defaultOpen style={{ borderBottom: '1px solid var(--border)' }}>
          <ClampText lines={4} size={15}>
            {c.desc || `${c.brand} ${c.title.split('·').slice(1).join('·').trim() || c.title}. Catalogue entry from the Scorred database, ${c.year}.`}
          </ClampText>
        </Disclosure>

        {/* Rating sits last and stays open. The community average gets its own visible score block
            (the old version stated "4.5 avg" in tiny grey type and showed nothing), and your own
            stars sit beside it in the same row so the section costs no extra height. */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 14, paddingTop: 16 }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 26, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--ink)' }}>{avg.toFixed(1)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-faint)' }}>/5</span>
            </div>
            <div style={{ marginTop: 5 }}><StarMeter value={avg} size={13}/></div>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>{ratingCount} ratings</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }}/>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-mute)', marginBottom: 6 }}>{myRating ? 'Your rating' : 'Rate this item'}</div>
            <StarRow value={myRating} size={24} onRate={(n) => { rateDbItem(c.sku, n); flashToast('Thanks for rating!'); }}/>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0 16px 2px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.015em' }}>Comments</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)' }}>{itemComments.length}</span>
        </div>
        <CommentThread post={{ id: 'item-' + c.sku }}/>
      </div>
      {/* ── Mark as sold sheet — one tap, but it says what changes ── */}
      {showSoldSheet && mine && (
        <div onClick={() => setShowSoldSheet(false)} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 0 36px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 18px' }}/>
            <div style={{ padding: '0 22px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', textAlign: 'center' }}>Mark as sold?</div>
              <div style={{ fontSize: 13, color: 'var(--ink-faint)', textAlign: 'center', marginTop: 5, lineHeight: 1.5 }}>
                For a sale you settled in chat or offline — no buyer details needed.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, margin: '18px 0 2px' }}>
                {[['Your listing closes and leaves the market', Icons.close],
                  ['The item stays in your collection with a Sold tag', Icons.check],
                  ['It stops counting toward your portfolio value', Icons.lock]].map(([t, i]) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-soft)' }}>
                    <Ico d={i} size={15} style={{ color: 'var(--ink-faint)', flexShrink: 0 }}/>{t}
                  </div>
                ))}
              </div>
              <Button variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}
                onClick={() => {
                  setItemSold(mine.id, true);
                  if (market) setListing(market.id, 'sold');
                  setShowSoldSheet(false);
                  flashToast('Marked as sold', 'Greyed out in your collection — undo any time');
                }}>Mark as sold</Button>
              <Button variant="secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                onClick={() => setShowSoldSheet(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      {/* ── Remove from collection sheet ── */}
      {showRemoveSheet && (
        <div onClick={() => setShowRemoveSheet(false)} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 0 36px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 18px' }}/>
            <div style={{ padding: '0 20px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>{mine && mine.status === 'preorder' ? 'Cancel this pre-order?' : 'Remove from collection?'}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4 }}>{mine && mine.status === 'preorder' ? 'What happened? It leaves your pre-order calendar either way.' : 'Tell us why — this helps keep your collection accurate.'}</div>
            </div>
            {(mine && mine.status === 'preorder' ? [
              { id: 'po-cancelled', label: 'Pre-order cancelled', icon: Icons.close },
              { id: 'po-refunded',  label: 'Refunded by the seller', icon: Icons.swap },
              { id: 'po-transfer',  label: 'Slot transferred to someone', icon: Icons.tag },
              { id: 'other',        label: 'Other reason', icon: Icons.more },
            ] : [
              { id: 'sold-offline', label: 'Sold offline', icon: Icons.tag },
              { id: 'traded',       label: 'Traded offline', icon: Icons.swap },
              { id: 'lost',         label: 'Lost', icon: Icons.search },
              { id: 'broken',       label: 'Broken or damaged', icon: Icons.close },
              { id: 'gifted',       label: 'Gifted to someone', icon: Icons.gift },
              { id: 'other',        label: 'Other reason', icon: Icons.more },
            ]).map(r => (
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
                  removeItem(mine ? mine.id : route.sku);
                  setShowRemoveSheet(false);
                  flashToast(mine && mine.status === 'preorder' ? 'Pre-order cancelled' : 'Removed from your collection');
                  setTimeout(() => pop(), 50);
                }}>
                {mine && mine.status === 'preorder' ? 'Cancel pre-order' : 'Remove item'}
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
