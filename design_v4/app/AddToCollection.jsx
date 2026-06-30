// ─────────────────────────────────────────────────────────────
// Add to collection (catalogue search / scan) — BRD §9.4
// + Sell / Trade (create listing from item) — BRD §8.6 / §9.5
// ─────────────────────────────────────────────────────────────

// Defined brand list for the add form (+ 'Others') — BRD v1.2 §9.4
const BRAND_OPTIONS = ['Hot Toys', 'Bandai', 'LEGO', 'Pop Mart', 'Sideshow', 'Tomica', 'Mini GT', 'McFarlane'];

// Shared input styles for the pre-order tracking fields
const poFieldStyle = { width: '100%', boxSizing: 'border-box', height: 42, padding: '0 12px', borderRadius: 10,
  border: '1px solid var(--border-strong)', background: 'var(--paper)', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', outline: 'none' };
const poMoneyWrap = { display: 'flex', alignItems: 'center', gap: 6, height: 42, padding: '0 12px', borderRadius: 10,
  border: '1px solid var(--border-strong)', background: 'var(--paper)' };
const poMoneySym = { fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--ink-faint)' };
const poMoneyInput = { flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none',
  fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' };

function AddItemView({ route }) {
  const { flashToast } = useNav();
  const [q, setQ] = React.useState('');
  const [picked, setPicked] = React.useState(route.sku ? catOf(route.sku) : null);
  const results = q.trim()
    ? CATALOGUE.filter(c => (c.title + c.brand + c.sku).toLowerCase().includes(q.toLowerCase()))
    : CATALOGUE.slice(0, 5);

  if (picked) return <PickedForm key={picked.sku} picked={picked}/>;

  return (
    <Screen nav={false} header={<DetailHeader title="Add to collection"/>}>
      <div style={{ padding: '14px 16px' }}>
        {/* search + scan */}
        <div style={{ display: 'flex', gap: 9 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, height: 44, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)' }}>
            <Ico d={Icons.search} size={18} style={{ color: 'var(--ink-faint)' }}/>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search catalogue by name or SKU…"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink)' }}/>
          </div>
          <IconButton icon={<Ico d={Icons.scan} size={20}/>} onClick={() => flashToast('Point camera at a barcode to auto-fill')}/>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '12px 2px 8px' }}>{q.trim() ? `${results.length} catalogue matches` : 'Popular in your interests'}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.map(c => (
            <button key={c.sku} onClick={() => setPicked(c)} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', cursor: 'pointer',
              background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 12, padding: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}><ProductPhoto tone={c.tone} ratio="1/1" rounded={8}/></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{c.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{c.sku} · {c.brand}</div>
              </div>
              <Ico d={Icons.plusCircle} size={22} style={{ color: 'var(--stamp-red)' }}/>
            </button>
          ))}
        </div>

        <button onClick={() => flashToast('Free-text item submitted to grow the catalogue')} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 46, marginTop: 14,
          borderRadius: 12, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--ink-mute)',
          cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14 }}>
          Can’t find it? Add free-text item
        </button>
      </div>
    </Screen>
  );
}

// Mandatory-field add form (BRD v1.2 §9.4) — Title*, Brand*, Scale*, ≥1 image*
function PickedForm({ picked }) {
  const { pop, flashToast } = useNav();
  const [title, setTitle] = React.useState(picked.title);
  const [cat, setCat] = React.useState(picked.cat);
  const [brand, setBrand] = React.useState(BRAND_OPTIONS.includes(picked.brand) ? picked.brand : 'Others');
  const [brandOther, setBrandOther] = React.useState(BRAND_OPTIONS.includes(picked.brand) ? '' : picked.brand);
  const [scale, setScale] = React.useState(SCALES.includes(picked.scale) ? picked.scale : 'Others');
  const [scaleOther, setScaleOther] = React.useState(SCALES.includes(picked.scale) ? '' : (picked.scale === '—' ? '' : picked.scale));
  const [desc, setDesc] = React.useState('');
  const [est, setEst] = React.useState(String(picked.est));
  const [hasImage, setHasImage] = React.useState(false);
  const [status, setStatus] = React.useState('owned');
  const [tried, setTried] = React.useState(false);

  // pre-order tracking fields (BRD §9.4 — order timeline + payment)
  const [poOrderDate, setPoOrderDate] = React.useState('');
  const [poEta, setPoEta] = React.useState('');
  const [poSeller, setPoSeller] = React.useState('');
  const [poTotal, setPoTotal] = React.useState(String(picked.est));
  const [poDeposit, setPoDeposit] = React.useState('');
  const poBalance = Math.max(0, (parseInt(poTotal, 10) || 0) - (parseInt(poDeposit, 10) || 0));
  // release window — exact date is rare; usually a month / quarter / year
  const [poEtaPrec, setPoEtaPrec] = React.useState('month'); // date | month | quarter | year | tbd
  const [poEtaMonth, setPoEtaMonth] = React.useState('');
  const [poEtaQuarter, setPoEtaQuarter] = React.useState('');
  const [poEtaYear, setPoEtaYear] = React.useState('2026');

  const missTitle = !title.trim();
  const missBrand = brand === 'Others' && !brandOther.trim();
  const missScale = scale === 'Others' && !scaleOther.trim();
  const missImage = !hasImage;
  const invalid = missTitle || missBrand || missScale || missImage;

  const submit = () => {
    if (invalid) { setTried(true); flashToast('Fill the required fields marked *'); return; }
    pop();
    flashToast(`Added to your ${status} · ${status === 'owned' ? 'verify it to list' : 'saved'}`);
  };

  const Req = ({ children, missing }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
      <SectionLabel>{children}</SectionLabel>
      <span style={{ color: missing && tried ? 'var(--stamp-red)' : 'var(--ink-ghost)', fontSize: 13, fontWeight: 700 }}>*</span>
      {missing && tried && <span style={{ fontSize: 11, color: 'var(--stamp-red)', marginLeft: 'auto' }}>Required</span>}
    </div>
  );
  const fieldBorder = (bad) => `1px solid ${bad && tried ? 'var(--stamp-red)' : 'var(--border-strong)'}`;

  return (
    <Screen nav={false} header={<DetailHeader title="Add to collection"/>}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px' }}>
          <Button variant="primary" size="block" onClick={submit} style={invalid ? { opacity: 0.55 } : null}>
            Add to {statusLabel(status)}
          </Button>
        </div>
      }>
      <div style={{ padding: '16px' }}>
        <ProductPhoto tone={picked.tone} ratio="3/2" label={picked.sku}/>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '12px 2px 4px' }}>Catalogue pre-fills what it can. Fields marked <b style={{ color: 'var(--stamp-red)' }}>*</b> are required.</div>

        {/* Title* */}
        <div style={{ marginTop: 16 }}><Req missing={missTitle}>Title</Req></div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Item title"
          style={{ width: '100%', boxSizing: 'border-box', height: 46, padding: '0 13px', borderRadius: 11, border: fieldBorder(missTitle), background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink)', outline: 'none' }}/>

        {/* Category */}
        <div style={{ marginTop: 18 }}><SectionLabel>Category</SectionLabel></div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
          {CATEGORIES.map(c => <CategoryChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.chipLabel}</CategoryChip>)}
        </div>

        {/* Brand* */}
        <div style={{ marginTop: 18 }}><Req missing={missBrand}>Brand</Req></div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {BRAND_OPTIONS.map(b => <CategoryChip key={b} active={brand === b} onClick={() => setBrand(b)}>{b}</CategoryChip>)}
          <CategoryChip active={brand === 'Others'} onClick={() => setBrand('Others')}>+ Others</CategoryChip>
        </div>
        {brand === 'Others' && (
          <input value={brandOther} onChange={e => setBrandOther(e.target.value)} placeholder="Type the brand name"
            style={{ width: '100%', boxSizing: 'border-box', height: 42, padding: '0 13px', borderRadius: 11, border: fieldBorder(missBrand), background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink)', outline: 'none', marginTop: 9 }}/>
        )}

        {/* Scale* */}
        <div style={{ marginTop: 18 }}><Req missing={missScale}>Scale</Req></div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {SCALES.map(s => <CategoryChip key={s} active={scale === s} onClick={() => setScale(s)}>{s}</CategoryChip>)}
          <CategoryChip active={scale === 'Others'} onClick={() => setScale('Others')}>+ Others</CategoryChip>
        </div>
        {scale === 'Others' && (
          <input value={scaleOther} onChange={e => setScaleOther(e.target.value)} placeholder="e.g. 1/18, N/A"
            style={{ width: '100%', boxSizing: 'border-box', height: 42, padding: '0 13px', borderRadius: 11, border: fieldBorder(missScale), background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink)', outline: 'none', marginTop: 9 }}/>
        )}

        {/* Description / Fun fact */}
        <div style={{ marginTop: 18 }}><SectionLabel>Description / Fun fact</SectionLabel></div>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Optional — what makes this one special?"
          style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink)', outline: 'none', resize: 'none', marginTop: 9 }}/>

        {/* Estimated value */}
        <div style={{ marginTop: 18 }}><SectionLabel>Estimated value (INR)</SectionLabel></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 46, padding: '0 13px', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', marginTop: 9 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 17, color: 'var(--ink-faint)' }}>₹</span>
          <input value={est} onChange={e => setEst(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}/>
        </div>

        {/* Image* */}
        <div style={{ marginTop: 18 }}><Req missing={missImage}>Photo</Req></div>
        <button onClick={() => { setHasImage(true); flashToast('In-app camera capture — proves you own it (no gallery upload)'); }} style={{
          display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', cursor: 'pointer',
          background: hasImage ? 'var(--verified-teal-soft)' : 'var(--paper-soft)',
          border: hasImage ? '1px solid var(--verified-teal)' : `1px dashed ${missImage && tried ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
          borderRadius: 13, padding: 13 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--verified-teal)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ico d={hasImage ? Icons.check : Icons.camera} size={19} stroke={hasImage ? 2.6 : 1.75}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{hasImage ? 'Photo captured' : 'Capture a photo'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{hasImage ? 'Added to this item' : 'At least one photo recommended'}</div>
          </div>
        </button>

        {/* Status */}
        <div style={{ margin: '20px 0 9px' }}><SectionLabel>Status</SectionLabel></div>
        <Segmented value={status} onChange={setStatus}
          options={[{ id: 'owned', label: 'Owned' }, { id: 'wishlist', label: 'Wishlist' }, { id: 'preorder', label: 'Pre-order' }]}/>
        {status === 'preorder' && (
          <div style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, padding: 14, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 6 }}>Order date</div>
              <input type="date" value={poOrderDate} onChange={e => setPoOrderDate(e.target.value)} style={{ ...poFieldStyle, fontFamily: 'var(--font-mono)', fontSize: 13 }}/>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 6 }}>Release window</div>
              <Segmented value={poEtaPrec} onChange={setPoEtaPrec}
                options={[{ id: 'date', label: 'Date' }, { id: 'month', label: 'Month' }, { id: 'quarter', label: 'Qtr' }, { id: 'year', label: 'Year' }, { id: 'tbd', label: 'TBD' }]}/>
              <div style={{ marginTop: 10 }}>
                {poEtaPrec === 'date' && (
                  <input type="date" value={poEta} onChange={e => setPoEta(e.target.value)} style={{ ...poFieldStyle, fontFamily: 'var(--font-mono)', fontSize: 13 }}/>
                )}
                {poEtaPrec === 'month' && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <select value={poEtaMonth} onChange={e => setPoEtaMonth(e.target.value)} style={{ ...poFieldStyle, cursor: 'pointer' }}>
                      <option value="">Month</option>
                      {PO_MONTHS.map((m, i) => <option key={m} value={String(i)}>{m}</option>)}
                    </select>
                    <select value={poEtaYear} onChange={e => setPoEtaYear(e.target.value)} style={{ ...poFieldStyle, cursor: 'pointer' }}>
                      {PO_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}
                {poEtaPrec === 'quarter' && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                      {['1', '2', '3', '4'].map(q => {
                        const on = poEtaQuarter === q;
                        return (
                          <button key={q} onClick={() => setPoEtaQuarter(q)} style={{
                            flex: 1, height: 42, borderRadius: 10, cursor: 'pointer',
                            border: `1px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
                            background: on ? 'var(--ink)' : 'var(--paper)', color: on ? 'var(--paper)' : 'var(--ink)',
                            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5 }}>Q{q}</button>
                        );
                      })}
                    </div>
                    <select value={poEtaYear} onChange={e => setPoEtaYear(e.target.value)} style={{ ...poFieldStyle, cursor: 'pointer', flex: 'none', width: 92 }}>
                      {PO_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}
                {poEtaPrec === 'year' && (
                  <select value={poEtaYear} onChange={e => setPoEtaYear(e.target.value)} style={{ ...poFieldStyle, cursor: 'pointer' }}>
                    {PO_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}
                {poEtaPrec === 'tbd' && (
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', lineHeight: 1.45 }}>No date yet — shows under “Date to be announced” on your PO Calendar.</div>
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 6 }}>Seller / Store</div>
              <input value={poSeller} onChange={e => setPoSeller(e.target.value)} placeholder="e.g. BBToyStore, Bangalore" style={poFieldStyle}/>
            </div>
            <div style={{ display: 'flex', gap: 11 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 6 }}>Total price</div>
                <div style={poMoneyWrap}><span style={poMoneySym}>₹</span>
                  <input value={poTotal} onChange={e => setPoTotal(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" style={poMoneyInput}/></div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 6 }}>Deposit paid</div>
                <div style={poMoneyWrap}><span style={poMoneySym}>₹</span>
                  <input value={poDeposit} onChange={e => setPoDeposit(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" style={poMoneyInput}/></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 11, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Balance due</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 17, color: 'var(--stamp-red)' }}>₹{poBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>
    </Screen>
  );
}

// Sell / Trade — create a listing from an owned, verified item
function SellView({ route }) {
  const { pop, flashToast } = useNav();
  const c = catOf(route.sku);
  const item = MY_ITEMS.find(i => i.sku === route.sku);
  const [price, setPrice] = React.useState(String(Math.round((item ? item.value : c.est) * 0.88)));
  const [cond, setCond] = React.useState('MISB');

  return (
    <Screen nav={false} header={<DetailHeader title="Sell"/>}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px' }}>
          <Button variant="primary" size="block"
            onClick={() => { pop(); flashToast('Listing published to the marketplace'); }}>
            Publish listing
          </Button>
        </div>
      }>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}><ProductPhoto tone={c.tone} ratio="1/1" rounded={10}/></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{c.title}</div>
          </div>
        </div>

        <SectionLabel>Price</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 52, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', margin: '10px 0 18px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--ink-faint)' }}>₹</span>
          <input value={price} onChange={e => setPrice(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric"
            style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 22, color: 'var(--ink)' }}/>
          <span style={{ fontSize: 12, color: 'var(--ink-faint)', flexShrink: 0, whiteSpace: 'nowrap' }}>MRP ~₹{c.est.toLocaleString('en-IN')}</span>
        </div>

        <SectionLabel>Condition</SectionLabel>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '10px 0 18px' }}>
          {['MISB', 'BNIB', 'Opened · mint', 'Displayed', 'Loose'].map(x => <CategoryChip key={x} active={cond === x} onClick={() => setCond(x)}>{x}</CategoryChip>)}
        </div>

      </div>
    </Screen>
  );
}

function Field({ label, value, placeholder }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13.5, color: 'var(--ink-faint)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: placeholder ? 'var(--ink-ghost)' : 'var(--ink)' }}>{value}</span>
    </div>
  );
}

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 46, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative',
      background: on ? 'var(--forest)' : 'var(--bone-deep)', transition: 'background 160ms',
    }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: '50%', background: 'var(--paper)', transition: 'left 160ms', boxShadow: 'var(--shadow-1)' }}/>
    </button>
  );
}

Object.assign(window, { AddItemView, PickedForm, SellView, Field, Toggle });
