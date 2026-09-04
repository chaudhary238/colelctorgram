// ─────────────────────────────────────────────────────────────
// Listing detail — BRD §9.9
// ONE page for every entry point: a market card, "View listing" inside a collection
// item, or your own listing in My Space all render this component from a normalised
// listing shape. There used to be two components (seed listings vs user-created), which
// meant the same listing looked different depending on where you tapped it — and the
// user-created one referenced state it never declared, so your own listings crashed.
// ─────────────────────────────────────────────────────────────

// Normalise any listing source (seed LISTINGS, MARKET_SEED, user-created) into one shape,
// filling gaps from the catalogue row when the listing itself doesn't carry them.
function normalizeListing(raw) {
  if (!raw) return null;
  const cat = raw.sku ? catOf(raw.sku) : null;
  const photoTones = Array.isArray(raw.photos) ? raw.photos
    : Array.from({ length: Math.max(1, Math.min(raw.photos || 1, 6)) }).map(() => (cat && cat.tone) || raw.tone || 'ink');
  return {
    ...raw,
    title: raw.title || (cat ? cat.title : raw.sku),
    brand: raw.brand || (cat ? cat.brand : null),
    scale: raw.scale || (cat && cat.scale !== '—' ? cat.scale : null),
    year: raw.year || (cat ? cat.year : null),
    cat: raw.cat || (cat ? cat.cat : null),
    desc: raw.desc || raw.notes || null,
    photoTones,
    sym: raw.sym || '₹',
    mine: !!(raw.mine || raw.seller === 'you'),
    catalogue: cat,
  };
}

function ListingView({ route }) {
  const raw = (typeof MARKET_SEED !== 'undefined' ? MARKET_SEED.find(x => x.id === route.id) : null)
    || null;
  const { userListings } = useAppState();
  const found = (userListings || []).find(x => x.id === route.id) || raw
    || [...(typeof LISTINGS !== 'undefined' ? LISTINGS : [])].find(x => x.id === route.id)
    || (typeof listingOf === 'function' ? listingOf(route.id) : null);
  const l = normalizeListing(found);
  if (!l) return null;
  return <ListingPage listing={l}/>;
}

function ListingPage({ listing: l }) {
  const { push, pop, flashToast, setOverlay } = useNav();
  const st = useAppState();
  const { saved, toggleSave, listingStatus, setListing, unlistListing, setItemSold, priceVotes, priceTally, castPriceVote } = st;
  // Selling is one half of the story — the copy in the collection has to learn about it too.
  const myCopy = l.sku ? resolveMyItems(st).find(i => i.sku === l.sku && i.status === 'owned') : null;
  const [manageOpen, setManageOpen] = React.useState(false);
  const [confirmUnlist, setConfirmUnlist] = React.useState(false);
  const [photo, setPhoto] = React.useState(0);
  const [tab, setTab] = React.useState('terms');
  const [qaCount, setQaCount] = React.useState(2);
  const status = (listingStatus || {})[l.id] || l.status || 'available';
  const sold = status === 'sold';
  const isSaved = (saved || {})[l.id];
  const mine = l.mine;
  const seller = mine ? null : userOf(l.seller);
  const sym = l.sym;
  const photos = l.photoTones;

  const terms = null; // selling terms now render as spec rows in the first tab

  // Price fairness: a visitor votes, the seller sees the split. Same card, same footprint.
  const myVote = (priceVotes || {})[l.id] || null;
  const tally = (priceTally || {})[l.id] || l.priceTally || null;
  const totalVotes = tally ? (tally.low || 0) + (tally.fair || 0) + (tally.high || 0) : 0;
  const pct = (k) => totalVotes ? Math.round(((tally[k] || 0) / totalVotes) * 100) : 0;
  const VOTE_OPTS = [
    { id: 'low', label: 'Too low', color: 'var(--verified-teal)' },
    { id: 'fair', label: 'Fair', color: 'var(--forest)' },
    { id: 'high', label: 'Too high', color: 'var(--stamp-red)' },
  ];

  return (
    <Screen nav={false} header={null}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px' }}>
          {mine ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>YOUR LISTING · {String(status).toUpperCase()}</div>
                <div style={{ fontSize: 18, color: 'var(--stamp-red)' }}><Money value={l.price} currency={sym}/></div>
              </div>
              <Button variant="dark" size="lg" icon={<Ico d={Icons.sliders} size={17}/>} onClick={() => setManageOpen(true)}>Manage listing</Button>
            </div>
          ) : sold ? (
            <Button variant="secondary" size="block" disabled>This listing is sold</Button>
          ) : (
            <Button variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }} icon={<Ico d={Icons.message} size={18}/>}
              onClick={() => push({ name: 'chat', user: l.seller, listing: l.id, intent: 'buy' })}>Message seller</Button>
          )}
        </div>
      }>

      {mine && manageOpen && (
        <div onClick={() => { setManageOpen(false); setConfirmUnlist(false); }} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 0 34px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 16px' }}/>
            {confirmUnlist ? (
              <div style={{ padding: '0 20px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, textAlign: 'center' }}>Unlist from the market?</div>
                <div style={{ fontSize: 13, color: 'var(--ink-faint)', textAlign: 'center', marginTop: 5, lineHeight: 1.5 }}>
                  Buyers won’t see it any more. The item stays in your collection, and Relist puts it back at these same terms.
                </div>
                <Button variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: 18, background: 'var(--stamp-red)', borderColor: 'var(--stamp-red)' }}
                  onClick={() => { unlistListing(l.id, l); setManageOpen(false); setConfirmUnlist(false); flashToast('Unlisted — back in your collection'); setTimeout(() => pop(), 60); }}>Unlist item</Button>
                <Button variant="secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => setConfirmUnlist(false)}>Keep it listed</Button>
              </div>
            ) : (
              <>
                <div style={{ padding: '0 20px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Manage listing</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 3 }}>Currently {status === 'sold' ? 'sold' : 'live in the market'}.</div>
                </div>
                {[
                  status !== 'sold' && { icon: Icons.edit, label: 'Edit listing', desc: 'Price, condition, photos, shipping and returns',
                    onClick: () => { setManageOpen(false); pop(); setTimeout(() => push({ name: 'add-listing', editId: l.id }), 10); } },
                  status !== 'sold' && { icon: Icons.check, label: 'Mark as sold', desc: 'Closes the listing; the item stays in your collection with a Sold tag',
                    onClick: () => { setListing(l.id, 'sold'); if (myCopy) setItemSold(myCopy.id, true); setManageOpen(false);
                      flashToast('Marked as sold', 'Greyed out in your collection — undo any time'); setTimeout(() => pop(), 60); } },
                  { icon: Icons.share, label: 'Share listing', onClick: () => { setManageOpen(false); setOverlay({ name: 'share', label: l.title }); } },
                  status !== 'sold' && { icon: Icons.send, label: 'Share to Feed', desc: 'Post to your feed with a caption',
                    onClick: () => { setManageOpen(false); setOverlay({ name: 'share-to-feed', listingId: l.id }); } },
                  { icon: Icons.close, label: 'Unlist from market', desc: 'Keep the item, stop selling it', danger: true,
                    onClick: () => setConfirmUnlist(true) },
                ].filter(Boolean).map(row => (
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
              </>
            )}
          </div>
        </div>
      )}

      {/* gallery */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
          <DetailHeader transparent
            trailing={<>
              <IconButton icon={<Ico d={Icons.heart} size={18} fill={isSaved ? 'var(--stamp-red)' : 'none'}/>}
                onClick={() => { toggleSave(l.id); flashToast(isSaved ? 'Removed from watchlist' : 'Saved to watchlist'); }}/>
              <IconButton icon={<Ico d={Icons.share} size={17}/>} onClick={() => setOverlay({ name: 'share', label: l.title })}/>
            </>}/>
        </div>
        <ProductPhoto tone={photos[photo]} ratio="1/1" rounded={0} label={`${photo + 1} of ${photos.length}`}>
          {status !== 'available' && (
            <div style={{ position: 'absolute', top: 60, left: 16 }}><Tag kind="sold" style={{ fontSize: 12, padding: '5px 10px' }}>{statusLabel(status)}</Tag></div>
          )}
        </ProductPhoto>
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

      <div style={{ padding: '8px 16px 20px' }}>
        {l.acq === 'preorder' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <Tag kind="default"><Ico d={Icons.clock} size={11}/> Pre-order</Tag>
          </div>
        )}
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23, letterSpacing: '-0.03em', lineHeight: 1.12, margin: '0 0 4px' }}>{l.title}</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 10 }}>{[l.brand, l.scale, l.year].filter(Boolean).join(' · ')}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--stamp-red)', whiteSpace: 'nowrap' }}><Money value={l.price} currency={sym}/></span>
          {l.retail > l.price && <span style={{ fontSize: 15, whiteSpace: 'nowrap' }}><Money value={l.retail} strike/></span>}
          {l.retail > l.price && <span style={{ fontSize: 12, color: 'var(--forest)', fontWeight: 600, whiteSpace: 'nowrap' }}>{Math.round((1 - l.price / l.retail) * 100)}% off MRP</span>}
        </div>

        {/* Selling terms lead — condition, shipping and returns are what a buyer decides on.
            Catalogue facts (brand, scale, year, category) belong to the item, not the sale, so they
            live in the second tab and read from the same database entry as the item page. */}
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          {[{ id: 'terms', label: 'Selling terms' }, { id: 'about', label: 'About the item' }].map(t => (
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

        {tab === 'terms' ? <>
          <div style={{ background: 'var(--card-surface)', border: '1px solid var(--slate-200)', borderRadius: 13, overflow: 'hidden', marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
            <SpecRow label="Condition" value={l.condition}/>
            {l.qty > 1 && <SpecRow label="Quantity" value={`${l.qty} available`}/>}
            {l.ships && <SpecRow label="Ships from" value={l.ships}/>}
            <SpecRow label="Shipping" value={l.shipIncl ? 'Included in price' : 'Paid by buyer'}/>
            <SpecRow label="Returns" value={l.returns ? 'Accepted within a short window' : 'Not accepted — sold as described'} last={!l.trade}/>
            {l.trade && <SpecRow label="Trades" value="Open to offers" last/>}
          </div>

          {l.condNote && (
            <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-soft)', marginBottom: 16, padding: 13, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 12 }}>{l.condNote}</div>
          )}
          {l.desc && <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-soft)', marginBottom: 16 }}>{l.desc}</div>}

          {/* ── Is this price fair? — the seller reads the split, a visitor casts a vote ── */}
          <div style={{ background: 'var(--bone)', borderRadius: 14, padding: 14, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Ico d={Icons.info} size={15} style={{ color: 'var(--ink-mute)' }}/>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{mine ? 'What collectors think of your price' : 'Is this price fair?'}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)', marginLeft: 'auto' }}>{mine ? `${totalVotes} votes` : 'Anonymous'}</span>
            </div>

            {/* The split is the SELLER'S signal for whether to adjust the price — buyers never see it,
                or the votes would just anchor everyone's expectations. They vote and move on. */}
            {mine ? (totalVotes > 0 ? (
              <>
                <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', marginTop: 12, background: 'var(--border)' }}>
                  {VOTE_OPTS.map(o => pct(o.id) > 0 && (
                    <div key={o.id} style={{ width: `${pct(o.id)}%`, background: o.color }}/>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
                  {VOTE_OPTS.map(o => (
                    <span key={o.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: o.color, flexShrink: 0 }}/>
                      <span style={{ color: 'var(--ink-mute)' }}>{o.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink)' }}>{pct(o.id)}%</span>
                    </span>
                  ))}
                </div>
                {/* Turn the split into an actual recommendation — a bar chart alone isn't a decision. */}
                {(() => {
                  const lead = VOTE_OPTS.map(o => ({ id: o.id, v: pct(o.id) })).sort((a, b) => b.v - a.v)[0];
                  const advice = lead.id === 'high'
                    ? { text: `Most collectors think ₹${(l.price || 0).toLocaleString('en-IN')} is too high — consider trimming it to move faster.`, tone: 'var(--stamp-red)', bg: 'var(--stamp-red-soft)' }
                    : lead.id === 'low'
                    ? { text: 'Most think you’ve priced it under the market — you have room to ask for more.', tone: 'var(--forest)', bg: 'var(--paper-soft)' }
                    : { text: 'Your price reads as fair to most collectors. No change needed.', tone: 'var(--ink-mute)', bg: 'var(--paper-soft)' };
                  return (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 11, padding: '10px 12px', borderRadius: 10, background: advice.bg }}>
                      <Ico d={Icons.tag} size={14} style={{ color: advice.tone, flexShrink: 0, marginTop: 1 }}/>
                      <span style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--ink-soft)' }}>{advice.text}</span>
                    </div>
                  );
                })()}
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 9 }}>Anonymous — you see the split, never who voted. Buyers can’t see these numbers.</div>
                <Button variant="secondary" size="block" style={{ marginTop: 10 }} icon={<Ico d={Icons.edit} size={16}/>}
                  onClick={() => { pop(); setTimeout(() => push({ name: 'add-listing', editId: l.id }), 10); }}>Adjust price</Button>
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 10, lineHeight: 1.5 }}>
                No votes yet. Once collectors weigh in you’ll see the split here — and get a notification each time a vote lands.
              </div>
            )) : myVote ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11 }}>
                <Ico d={Icons.check} size={15} style={{ color: 'var(--forest)', flexShrink: 0 }}/>
                <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', flex: 1 }}>
                  You said <b>{(VOTE_OPTS.find(o => o.id === myVote) || {}).label}</b> — sent anonymously to the seller.
                </span>
                <button onClick={() => castPriceVote(l, null)} style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--ink-mute)' }}>Change</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
                  {VOTE_OPTS.map(o => (
                    <button key={o.id} onClick={() => { castPriceVote(l, o.id); flashToast('Thanks — sent anonymously to the seller'); }} style={{
                      flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
                      border: '1px solid var(--border-strong)', background: 'var(--paper)', color: 'var(--ink-soft)',
                    }}>{o.label}</button>
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 9 }}>
                  Only the seller sees the result — it helps them decide whether to adjust the price.
                </div>
              </>
            )}
          </div>
        </> : (
          /* Catalogue facts, straight from the database entry — same source as the item page */
          <div style={{ marginBottom: 18 }}>
            {l.acq === 'preorder' && l.poDate && (
              <div style={{ background: 'var(--card-surface)', border: '1px solid var(--slate-200)', borderRadius: 13, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <SpecRow label="Launch date" value={l.poDate} last/>
              </div>
            )}
            {l.catalogue && l.catalogue.rating && l.catalogue.rating.count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 14 }}>
                <Ico d={Icons.star} size={15} fill="var(--grail-gold)" style={{ color: 'var(--grail-gold)' }}/>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{l.catalogue.rating.avg.toFixed(1)}</span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>· {l.catalogue.rating.count} ratings · {l.catalogue.ownersCount || 0} own this</span>
              </div>
            )}
            {l.catalogue && (
              <div style={{ marginTop: 14 }}>
                <ClampText lines={3}>{l.catalogue.desc || `${l.catalogue.brand} ${l.catalogue.title.split('·').slice(1).join('·').trim() || l.catalogue.title}. Catalogue entry from the Scorred database, ${l.catalogue.year}.`}</ClampText>
              </div>
            )}
            {l.sku && (
              <button onClick={() => push({ name: 'explore-item', sku: l.sku })} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 14, padding: 0, border: 'none',
                background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--stamp-red)' }}>
                <span>View database entry</span>
                <Ico d={Icons.chevR} size={13}/>
              </button>
            )}
          </div>
        )}

        {!mine && (
          <Disclosure title="Q&amp;A" meta={String(qaCount)} style={{ borderBottom: '1px solid var(--border)', marginBottom: 18 }}>
            <ListingQA seller={l.seller} onCount={setQaCount}/>
          </Disclosure>
        )}

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
                  <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{seller.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{seller.handle} · {placeLabel(seller)}</div>
                </div>
                <Ico d={Icons.chevR} size={18} stroke={2} style={{ color: 'var(--ink-faint)' }}/>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <TrustSignals u={seller}/>
              </div>
            </button>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)', borderRadius: 13, padding: '12px 14px', marginTop: 16 }}>
              <Ico d={Icons.shield} size={17} style={{ color: 'var(--grail-gold-deep)', flexShrink: 0, marginTop: 1 }}/>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                <b>Safe trading:</b> deals complete off-platform. Scorred doesn’t hold payments. Always check trust signals, ask for an in-hand video, and never pay before you’ve verified the seller.
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

function ListingQA({ seller, onCount }) {
  const { flashToast } = useNav();
  const [questions, setQuestions] = React.useState(SEED_QA);
  React.useEffect(() => { if (onCount) onCount(questions.length); }, [questions.length]);
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
    <div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 12 }}>Questions are public — don't share personal info here.</div>

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

// ── All listings for a given SKU ─────────────────────────────
function ItemListingsView({ route }) {
  const { pop } = useNav();
  const { userListings } = useAppState();
  const c = catOf(route.sku);
  const allListings = [...(userListings || []), ...LISTINGS];
  const skuListings = allListings
    .filter(l => l.sku === route.sku && l.status !== 'sold')
    .sort((a, b) => (a.price || 0) - (b.price || 0));

  return (
    <Screen nav={false} header={<DetailHeader
      title={`${skuListings.length} listing${skuListings.length !== 1 ? 's' : ''}`}
      subtitle={c ? c.title : route.sku}/>
    }>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {skuListings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-faint)', fontSize: 14 }}>No active listings right now.</div>
        )}
        {skuListings.map(l => (
          <MarketCard key={l.id || l.sku + l.seller} id={l.id} listing={l}/>
        ))}
      </div>
    </Screen>
  );
}

Object.assign(window, { ListingView, ListingPage, normalizeListing, ItemListingsView, SpecRow, Stepper });
