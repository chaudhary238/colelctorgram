// ─────────────────────────────────────────────────────────────
// Listing detail — BRD §9.9
// Gallery + item info + verification + seller trust + DM to transact.
// ─────────────────────────────────────────────────────────────

function ListingView({ route }) {
  const { push, pop, flashToast, setOverlay } = useNav();
  const { saved, toggleSave, listingStatus, userListings, wishlistedSkus, toggleWishlistSku } = useAppState();

  // User-created listings (from Add an item → For sale) AND seed listings
  // both use the add-item shape and render from their own captured data —
  // never the seed catalogue lookup.
  const ul = (userListings || []).find(x => x.id === route.id) || MARKET_SEED.find(x => x.id === route.id);
  if (ul) return <UserListingView listing={ul}/>;

  const l = listingOf(route.id);
  const c = catOf(l.sku);
  const seller = userOf(l.seller);
  const status = listingStatus[l.id] || l.status;
  const isSaved = saved[l.id];
  const isWishlisted = !!(wishlistedSkus || {})[l.sku];
  const [photo, setPhoto] = React.useState(0);
  const [tab, setTab] = React.useState('details'); // details | terms (v1.2 §9.9)
  const [qty, setQty] = React.useState(1);          // purchase field (v1.2 §9.9)
  const [fulfil, setFulfil] = React.useState(l.trade ? 'ship' : 'ship'); // ship | pickup
  const [priceVote, setPriceVote] = React.useState(null); // anon feedback (v1.2 §9.9)
  const sold = status === 'sold';
  const terms = termsOf(l.id);

  return (
    <Screen nav={false} header={null}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px' }}>
          {sold ? (
            <Button variant="secondary" size="block" disabled>This listing is sold</Button>
          ) : status === 'reserved' ? (
            <Button variant="secondary" size="block" disabled>Reserved — ask to join the queue</Button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              {l.trade && (
                <Button variant="secondary" size="lg" icon={<Ico d={Icons.swap} size={18}/>}
                  onClick={() => push({ name: 'chat', user: l.seller, listing: l.id, intent: 'trade' })}>Trade</Button>
              )}
              <Button variant="primary" size="lg" style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.message} size={18}/>}
                onClick={() => push({ name: 'chat', user: l.seller, listing: l.id, intent: 'buy' })}>Message seller</Button>
            </div>
          )}
        </div>
      }>
      {/* gallery */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
          <DetailHeader transparent
            trailing={<>
              <IconButton icon={<Ico d={Icons.bookmark} size={17} fill={isWishlisted ? 'currentColor' : 'none'}/>}
                onClick={() => { toggleWishlistSku(l.sku); flashToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist'); }}/>
              <IconButton icon={<Ico d={Icons.heart} size={18} fill={isSaved ? 'var(--stamp-red)' : 'none'}/>}
                onClick={() => { toggleSave(l.id); flashToast(isSaved ? 'Removed from watchlist' : 'Saved to watchlist'); }}/>
              <IconButton icon={<Ico d={Icons.share} size={17}/>} onClick={() => setOverlay({ name: 'share', label: 'this listing' })}/>
            </>}/>
        </div>
        <ProductPhoto tone={c.tone} ratio="1/1" rounded={0} label={`${l.sku} · ${photo + 1} of ${l.photos}`}>
          {status !== 'available' && (
            <div style={{ position: 'absolute', top: 60, left: 16 }}><Tag kind={sold ? 'sold' : 'reserved'} style={{ fontSize: 12, padding: '5px 10px' }}>{statusLabel(status)}</Tag></div>
          )}
        </ProductPhoto>
      </div>
        {/* photo dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '12px 0 4px' }}>
          {Array.from({ length: Math.min(l.photos, 6) }).map((_, i) => (
            <button key={i} onClick={() => setPhoto(i)} style={{
              width: i === photo ? 18 : 7, height: 7, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: i === photo ? 'var(--ink)' : 'var(--bone-deep)', transition: 'all 160ms',
            }}/>
          ))}
        </div>

      <div style={{ padding: '6px 16px 20px' }}>
        {/* title + price */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <VerifyBadge tier={l.verify} size="lg"/>
          {l.trade && <Tag kind="default"><Ico d={Icons.swap} size={11}/> Trade considered</Tag>}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 4px' }}>{c.title}</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 12 }}>{c.brand} · {c.scale} · {c.year} · SKU {c.sku}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28, color: 'var(--stamp-red)' }}><Money value={l.price}/></span>
          {l.retail > l.price && <span style={{ fontSize: 15 }}><Money value={l.retail} strike/></span>}
          {l.retail > l.price && <span style={{ fontSize: 12, color: 'var(--forest)', fontWeight: 600 }}>{Math.round((1 - l.price / l.retail) * 100)}% off MRP</span>}
        </div>

        {/* details / terms tabs — BRD v1.2 §9.9 */}
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          {[{ id: 'details', label: 'Details' }, { id: 'terms', label: 'Seller terms' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'none', border: 'none', padding: '0 0 10px', cursor: 'pointer', position: 'relative',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
              color: tab === t.id ? 'var(--ink)' : 'var(--ink-faint)',
            }}>
              {t.label}
              {tab === t.id && <span style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: 'var(--stamp-red)', borderRadius: 2 }}/>}
            </button>
          ))}
        </div>

        {tab === 'details' ? <>
          {/* spec rows — condition shown against the standard ladder */}
          <div style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, overflow: 'hidden', marginBottom: 14 }}>
            <SpecRow label="Condition" value={l.condition}/>
            <SpecRow label="Quantity" value={`${l.qty} available`}/>
            <SpecRow label="Ships from" value={l.ships}/>
            <SpecRow label="Watching" value={`${l.watching} people`} last/>
          </div>

          {/* condition ladder (defined list, not free text) */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
            {CONDITION_LADDER.map(cd => {
              const on = cd === gradeOf(l.condition);
              return <span key={cd} style={{
                fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.04em', padding: '4px 8px', borderRadius: 6,
                background: on ? 'var(--ink)' : 'var(--bone)', color: on ? 'var(--paper)' : 'var(--ink-faint)',
                border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`, fontWeight: on ? 700 : 500,
              }}>{cd}</span>;
            })}
          </div>

          {/* description */}
          <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-soft)', marginBottom: 18 }}>{l.notes}</div>

          {/* purchase fields — BRD v1.2 §9.9 */}
          {!sold && status === 'available' && (
            <div style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 18 }}>
              <SectionLabel>Your order</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Stepper sign="−" disabled={qty <= 1} onClick={() => setQty(q => Math.max(1, q - 1))}/>
                  <span style={{ width: 34, textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 16 }}>{qty}</span>
                  <Stepper sign="+" disabled={qty >= l.qty} onClick={() => setQty(q => Math.min(l.qty, q + 1))}/>
                </div>
              </div>
              <div style={{ marginTop: 14 }}><span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Fulfilment</span></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
                {[{ id: 'ship', label: 'Shipping' }, { id: 'pickup', label: 'Local pickup' }].map(o => (
                  <button key={o.id} onClick={() => setFulfil(o.id)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 11, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5,
                    border: `1px solid ${fulfil === o.id ? 'var(--ink)' : 'var(--border-strong)'}`,
                    background: fulfil === o.id ? 'var(--ink)' : 'transparent', color: fulfil === o.id ? 'var(--paper)' : 'var(--ink)',
                  }}>{o.label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>Est. total {fulfil === 'ship' ? '(+ shipping)' : '(pickup)'}</span>
                <span style={{ fontSize: 18, color: 'var(--stamp-red)' }}><Money value={l.price * qty}/></span>
              </div>
            </div>
          )}

          {/* anonymous price feedback — BRD v1.2 §9.9 */}
          <div style={{ background: 'var(--bone)', borderRadius: 14, padding: 14, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Ico d={Icons.info} size={15} style={{ color: 'var(--ink-mute)' }}/>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>Is this price fair?</span>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)', marginLeft: 'auto' }}>Anonymous</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
              {[{ id: 'low', label: 'Too low' }, { id: 'fair', label: 'Fair' }, { id: 'high', label: 'Too high' }].map(o => {
                const on = priceVote === o.id;
                return (
                  <button key={o.id} onClick={() => { setPriceVote(o.id); flashToast('Thanks — feedback sent anonymously'); }} style={{
                    flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
                    border: `1px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
                    background: on ? 'var(--ink)' : 'var(--paper)', color: on ? 'var(--paper)' : 'var(--ink-soft)',
                  }}>{o.label}</button>
                );
              })}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 9 }}>
              {priceVote ? 'Your vote is private. The seller only sees the overall split.' : `${l.priceVotes || 28} collectors weighed in · mostly “Fair”.`}
            </div>
          </div>
        </> : (
          /* ── Seller terms tab ── */
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 12 }}>Set by {seller.name}. Read before you message.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, overflow: 'hidden' }}>
              {terms.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '13px 14px', borderBottom: i < terms.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <Ico d={Icons.check} size={16} stroke={2.4} style={{ color: 'var(--forest)', flexShrink: 0, marginTop: 1 }}/>
                  <span style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.45 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Q&A */}
        <ListingQA seller={l.seller}/>

        {/* seller trust card — BRD §9.9 / §8.2 */}
        <SectionLabel>Seller</SectionLabel>
        <button onClick={() => push({ name: 'profile', user: l.seller })} style={{
          display: 'block', width: '100%', textAlign: 'left', marginTop: 10, padding: 14, cursor: 'pointer',
          background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={seller.name} color={seller.color} size={46} verified={seller.tier !== 'Verified'}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                <span style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{seller.name}</span><TierChip tier={seller.tier}/>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{seller.handle} · {seller.city}</div>
            </div>
            <Ico d={Icons.back} size={18} stroke={2} style={{ transform: 'rotate(180deg)', color: 'var(--ink-faint)' }}/>
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <TrustSignals u={seller}/>
          </div>
        </button>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)', borderRadius: 13, padding: '12px 14px', marginTop: 16 }}>
          <Ico d={Icons.shield} size={17} style={{ color: 'var(--grail-gold-deep)', flexShrink: 0, marginTop: 1 }}/>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            <b>Safe trading:</b> deals complete off-platform. CollectorHub doesn’t hold payments. Always check trust signals, ask for an in-hand video, and never pay before you’ve verified the seller.
          </div>
        </div>
      </div>
    </Screen>
  );
}

// ── Detail for a user-created listing — renders ONLY what the seller
//    entered in Add an item. No catalogue lookup, no invented data. ──
function UserListingView({ listing: l }) {
  const { push, pop, flashToast, setOverlay } = useNav();
  const { saved, toggleSave, wishlistedSkus, toggleWishlistSku } = useAppState();
  const isSaved = saved[l.id];
  const isWishlisted = !!(wishlistedSkus || {})[l.id];
  const [photo, setPhoto] = React.useState(0);
  const photos = (l.photos && l.photos.length) ? l.photos : [l.tone || 'ink'];
  const sym = l.sym || '₹';
  const mine = l.mine;
  const seller = mine ? null : userOf(l.seller);
  const SCALE_LABEL = { figures: 'Action Figure', diecast: 'Diecast', kits: 'Model Kits & Lego', designer: 'Designer Toys & Blind Boxes' };

  const terms = [];
  terms.push(l.shipIncl ? 'Shipping included in the price' : 'Buyer pays shipping');
  terms.push(l.returns ? 'Returns accepted within a short window' : 'No returns — sold as described');
  if (l.trade) terms.push('Open to trade offers');

  return (
    <Screen nav={false} header={null}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px' }}>
          {mine ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>YOUR LISTING · LIVE</div>
                <div style={{ fontSize: 18, color: 'var(--stamp-red)' }}><Money value={l.price} currency={sym}/></div>
              </div>
              <Button variant="secondary" icon={<Ico d={Icons.edit} size={17}/>} onClick={() => { pop(); setTimeout(() => push({ name: 'add-listing' }), 10); }}>Edit</Button>
              <Button variant="dark" icon={<Ico d={Icons.share} size={17}/>} onClick={() => setOverlay({ name: 'share', label: l.title })}>Share</Button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              {l.trade && (
                <Button variant="secondary" size="lg" icon={<Ico d={Icons.swap} size={18}/>}
                  onClick={() => push({ name: 'chat', user: l.seller, listing: l.id, intent: 'trade' })}>Trade</Button>
              )}
              <Button variant="primary" size="lg" style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.message} size={18}/>}
                onClick={() => push({ name: 'chat', user: l.seller, listing: l.id, intent: 'buy' })}>Message seller</Button>
            </div>
          )}
        </div>
      }>
      {/* gallery */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
          <DetailHeader transparent
            trailing={<>
              <IconButton icon={<Ico d={Icons.bookmark} size={17} fill={isWishlisted ? 'currentColor' : 'none'}/>}
                onClick={() => { toggleWishlistSku(l.id); flashToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist'); }}/>
              <IconButton icon={<Ico d={Icons.heart} size={18} fill={isSaved ? 'var(--stamp-red)' : 'none'}/>}
                onClick={() => { toggleSave(l.id); flashToast(isSaved ? 'Removed from watchlist' : 'Saved to watchlist'); }}/>
              <IconButton icon={<Ico d={Icons.share} size={17}/>} onClick={() => setOverlay({ name: 'share', label: l.title })}/>
            </>}/>
        </div>
        <ProductPhoto tone={photos[photo]} ratio="1/1" rounded={0} label={`${photo + 1} of ${photos.length}`}/>
      </div>
      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '12px 0 4px' }}>
          {photos.map((_, i) => (
            <button key={i} onClick={() => setPhoto(i)} style={{
              width: i === photo ? 18 : 7, height: 7, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: i === photo ? 'var(--ink)' : 'var(--bone-deep)', transition: 'all 160ms',
            }}/>
          ))}
        </div>
      )}

      <div style={{ padding: '10px 16px 20px' }}>
        {/* badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <VerifyBadge tier={l.verify} size="lg"/>
          {l.acq === 'preorder' && <Tag kind="default"><Ico d={Icons.clock} size={11}/> Pre-order</Tag>}
          {l.trade && <Tag kind="default"><Ico d={Icons.swap} size={11}/> Trade considered</Tag>}
        </div>

        {/* title + meta */}
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 23, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 4px' }}>{l.title}</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 12 }}>
          {[l.brand, l.scale, l.year].filter(Boolean).join(' · ')}
        </div>
        <div style={{ fontSize: 28, color: 'var(--stamp-red)', marginBottom: 16 }}><Money value={l.price} currency={sym}/></div>

        {/* spec rows — only captured fields */}
        <div style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, overflow: 'hidden', marginBottom: 14 }}>
          <SpecRow label="Category" value={SCALE_LABEL[l.cat] || l.cat}/>
          <SpecRow label="Brand" value={l.brand}/>
          {l.scale && <SpecRow label="Scale" value={l.scale}/>}
          <SpecRow label="Condition" value={l.condition}/>
          {l.year && <SpecRow label="Release year" value={l.year}/>}
          {l.acq === 'preorder' && l.poDate && <SpecRow label="Launch date" value={l.poDate}/>}
          {l.acq === 'preorder' && l.poSeller && <SpecRow label="Pre-order from" value={l.poSeller}/>}
          <SpecRow label="Shipping" value={l.shipIncl ? 'Included' : 'Extra'} last={!l.condNote && !l.desc}/>
        </div>

        {/* description (only if entered) */}
        {l.desc && (
          <>
            <SectionLabel>About this item</SectionLabel>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-soft)', margin: '10px 0 18px' }}>{l.desc}</div>
          </>
        )}

        {/* condition notes (only if entered) */}
        {l.condNote && (
          <>
            <SectionLabel>Condition notes</SectionLabel>
            <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-soft)', margin: '10px 0 18px', padding: 13, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 12 }}>{l.condNote}</div>
          </>
        )}

        {/* seller terms — derived from the toggles */}
        <SectionLabel>Seller terms</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, overflow: 'hidden', margin: '10px 0 18px' }}>
          {terms.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '13px 14px', borderBottom: i < terms.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <Ico d={Icons.check} size={16} stroke={2.4} style={{ color: 'var(--forest)', flexShrink: 0, marginTop: 1 }}/>
              <span style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.45 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Q&A — only shown for others' listings */}
        {!mine && <ListingQA seller={l.seller}/>}

        {/* verify nudge (your listing) / seller trust card (others') */}
        {mine ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)', borderRadius: 13, padding: '12px 14px' }}>
            <Ico d={Icons.shield} size={17} style={{ color: 'var(--grail-gold-deep)', flexShrink: 0, marginTop: 1 }}/>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              <b>Boost trust:</b> add a verified in-app photo to earn the Verified badge — verified listings rank higher and sell faster.
            </div>
          </div>
        ) : (
          <>
            <SectionLabel>Seller</SectionLabel>
            <button onClick={() => push({ name: 'profile', user: l.seller })} style={{
              display: 'block', width: '100%', textAlign: 'left', marginTop: 10, padding: 14, cursor: 'pointer',
              background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={seller.name} color={seller.color} size={46} verified={seller.tier !== 'Verified'}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                    <span style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{seller.name}</span><TierChip tier={seller.tier}/>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{seller.handle} · {seller.city}</div>
                </div>
                <Ico d={Icons.back} size={18} stroke={2} style={{ transform: 'rotate(180deg)', color: 'var(--ink-faint)' }}/>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <TrustSignals u={seller}/>
              </div>
            </button>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)', borderRadius: 13, padding: '12px 14px', marginTop: 16 }}>
              <Ico d={Icons.shield} size={17} style={{ color: 'var(--grail-gold-deep)', flexShrink: 0, marginTop: 1 }}/>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                <b>Safe trading:</b> deals complete off-platform. CollectorHub doesn’t hold payments. Always check trust signals, ask for an in-hand video, and never pay before you’ve verified the seller.
              </div>
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}

// ── Public Q&A block for listing pages ──
const SEED_QA = [
  { q: 'Is this sealed or previously opened?', a: 'Completely sealed — never opened, box is in mint condition.', user: 'aman_toys', time: '2d' },
  { q: 'Can you do local pickup in Mumbai?', a: 'Yes, Andheri West. DM me to arrange.', user: 'meera', time: '5d' },
];

function ListingQA({ seller }) {
  const { flashToast } = useNav();
  const [questions, setQuestions] = React.useState(SEED_QA);
  const [draft, setDraft] = React.useState('');
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? questions : questions.slice(0, 2);

  const ask = () => {
    if (!draft.trim()) return;
    setQuestions(qs => [{ q: draft.trim(), a: null, user: 'you', time: 'just now' }, ...qs]);
    setDraft('');
    flashToast('Question posted — seller will be notified');
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <SectionLabel>Q&amp;A</SectionLabel>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 12, marginTop: 4 }}>Questions are public — don't share personal info here.</div>

      {/* Ask input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()}
          placeholder="Ask the seller a question…"
          style={{ flex: 1, height: 40, padding: '0 13px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', outline: 'none' }}
        />
        <button onClick={ask} style={{ height: 40, padding: '0 14px', borderRadius: 10, border: 'none', background: draft.trim() ? 'var(--ink)' : 'var(--bone-deep)', color: draft.trim() ? 'var(--paper)' : 'var(--ink-faint)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: draft.trim() ? 'pointer' : 'default', transition: 'all 120ms' }}>Ask</button>
      </div>

      {/* Q&A list */}
      {questions.length === 0 ? (
        <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', padding: '12px 0' }}>No questions yet — be the first to ask.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map((item, i) => {
            const qu = item.user === 'you' ? { name: 'You', color: 'var(--ink)' } : userOf(item.user);
            return (
              <div key={i} style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, overflow: 'hidden' }}>
                <div style={{ padding: '11px 13px', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <Avatar name={qu.name} color={qu.color} size={26}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 3 }}>{qu.name} · {item.time}</div>
                    <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.45 }}>{item.q}</div>
                  </div>
                </div>
                {item.a ? (
                  <div style={{ padding: '10px 13px 12px', borderTop: '1px solid var(--border)', background: 'var(--bone)', display: 'flex', gap: 9 }}>
                    <Avatar name={userOf(seller).name} color={userOf(seller).color} size={26}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 3 }}>Seller · verified answer</div>
                      <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.45 }}>{item.a}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '9px 13px', borderTop: '1px solid var(--border)', background: 'var(--bone)' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontStyle: 'italic' }}>Awaiting seller response…</span>
                  </div>
                )}
              </div>
            );
          })}
          {questions.length > 2 && (
            <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, textAlign: 'left' }}>
              {expanded ? 'Show less' : `View all ${questions.length} questions`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SpecRow({ label, value, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--ink-faint)', width: 92, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500, textAlign: 'right', flex: 1 }}>{value}</span>
    </div>
  );
}

function Stepper({ sign, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 34, height: 34, borderRadius: 9, cursor: disabled ? 'default' : 'pointer',
      border: '1px solid var(--border-strong)', background: 'var(--paper)',
      color: disabled ? 'var(--ink-ghost)' : 'var(--ink)', fontSize: 18, lineHeight: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)',
    }}>{sign}</button>
  );
}

Object.assign(window, { ListingView, UserListingView, SpecRow, Stepper });
