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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                  <ReviewIcon reviewed={c.scorredReviewed || !c.intelBy} size={14}/>
                </div>
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

// Mandatory-field add form (BRD v1.2 §9.4) — item identity comes from the catalogue;
// this form only asks what's specific to YOUR copy: photo, status, price paid, condition.
function PickedForm({ picked }) {
  const { pop, flashToast } = useNav();
  const [est, setEst] = React.useState(String(picked.est));
  const [photoCount, setPhotoCount] = React.useState(0);
  const [status, setStatus] = React.useState('owned');
  const [cond, setCond] = React.useState('Sealed');

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

  const submit = () => {
    pop();
    flashToast(`Added to your ${status} · ${status === 'owned' ? 'verify it to list' : 'saved'}`);
  };

  return (
    <Screen nav={false} header={<DetailHeader title="Add to collection"/>}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px' }}>
          <Button variant="primary" size="block" onClick={submit}>
            Add to {statusLabel(status)}
          </Button>
        </div>
      }>
      <div style={{ padding: '16px' }}>
        {/* catalogue identity — fixed, not editable here */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bone)', border: '1px solid var(--border)', borderRadius: 14, padding: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}><ProductPhoto tone={picked.tone} ratio="1/1" rounded={10}/></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25 }}>{picked.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{picked.brand} · {picked.scale} · {picked.sku}</div>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '9px 2px 0' }}>From the Scorred database — details below are about your copy.</div>

        {/* Photo — optional, add more of your own if you'd like */}
        <div style={{ marginTop: 20 }}><SectionLabel>Your photos <span style={{ color: 'var(--ink-ghost)', fontWeight: 400 }}>(optional)</span></SectionLabel></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
          {Array.from({ length: photoCount }).map((_, i) => (
            <div key={i} style={{ width: 64, height: 64, borderRadius: 11, background: 'var(--verified-teal-soft)', border: '1px solid var(--verified-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={Icons.check} size={18} style={{ color: 'var(--verified-teal)' }}/>
            </div>
          ))}
          {photoCount < 6 && (
            <button onClick={() => { setPhotoCount(p => p + 1); flashToast('In-app camera capture — proves you own it (no gallery upload)'); }} style={{
              width: 64, height: 64, borderRadius: 11, border: '1px dashed var(--border-strong)',
              background: 'var(--paper-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)' }}>
              <Ico d={Icons.camera} size={20}/>
            </button>
          )}
        </div>

        {/* Status */}
        <div style={{ margin: '20px 0 9px' }}><SectionLabel>Status</SectionLabel></div>
        <Segmented value={status} onChange={setStatus}
          options={[{ id: 'owned', label: 'Owned' }, { id: 'preorder', label: 'Pre-order' }]}/>

        {/* Condition + price paid — only meaningful once owned */}
        {status === 'owned' && (
          <>
            <div style={{ marginTop: 18 }}><SectionLabel>Condition</SectionLabel></div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
              {['Sealed', 'MIB', 'BIB', 'Loose'].map(x => <CategoryChip key={x} active={cond === x} onClick={() => setCond(x)}>{x}</CategoryChip>)}
            </div>
            <div style={{ marginTop: 18 }}><SectionLabel>What you paid (INR)</SectionLabel></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 46, padding: '0 13px', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', marginTop: 9 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 17, color: 'var(--ink-faint)' }}>₹</span>
              <input value={est} onChange={e => setEst(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric"
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}/>
            </div>
          </>
        )}

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
  const [cond, setCond] = React.useState('Sealed');

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
          {['Sealed', 'MIB', 'BIB', 'Loose'].map(x => <CategoryChip key={x} active={cond === x} onClick={() => setCond(x)}>{x}</CategoryChip>)}
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
