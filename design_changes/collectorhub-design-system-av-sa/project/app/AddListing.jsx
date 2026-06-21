// ─────────────────────────────────────────────────────────────
// Add an item / Create a listing — category-aware (Phase 1: Action Figures)
// Reached from  +  →  Create  →  "Create a Listing".
// One flow: add the item to your shelf, optionally flip "For sale"
// to list it live in the Market. — BRD §9.4 / §8.6 / §9.5
// ─────────────────────────────────────────────────────────────

// Currencies — INR default, common collector markets after.
const CURRENCIES = [
  { code: 'INR', sym: '₹' },
  { code: 'USD', sym: '$' },
  { code: 'EUR', sym: '€' },
  { code: 'GBP', sym: '£' },
  { code: 'JPY', sym: '¥' },
  { code: 'AED', sym: 'د.إ' },
  { code: 'SGD', sym: 'S$' },
];
const symOf = (code) => (CURRENCIES.find(c => c.code === code) || CURRENCIES[0]).sym;

// Category chips for this form — app's 4 categories, figure-first ordering + display labels.
const ADD_CATEGORIES = [
  { id: 'figures',  label: 'Action Figure' },
  { id: 'diecast',  label: 'Diecast' },
  { id: 'kits',     label: 'Model Kits & Lego' },
  { id: 'designer', label: 'Designer Toys & Blind Boxes' },
];

// Action-figure specifics
const FIGURE_SCALES = ['1/1', '1/2', '1/3', '1/4', '1/6', '1/10', '1/12'];

// Per-category scale options (Blind Boxes use a free-text size instead).
const CAT_SCALES = {
  figures:  ['1/1', '1/2', '1/3', '1/4', '1/6', '1/10', '1/12'],
  diecast:  ['1/64', '1/43', '1/24', '1/18', '1/12'],
  kits:     ['1/144', '1/100', '1/72', '1/60', '1/48', '1/35', '1/24', 'Non-scale'],
  designer: null,   // no scale — uses size text input
};

// Per-category condition ladders.
const FIGURE_CONDITIONS = [
  { id: 'Sealed', label: 'Sealed', sub: 'Factory sealed, never opened' },
  { id: 'MIB',    label: 'MIB',    sub: 'Mint in box' },
  { id: 'BIB',    label: 'BIB',    sub: 'Box in box / outer shipper kept' },
  { id: 'Loose',  label: 'Loose',  sub: 'Out of box / displayed' },
];

// Per-category brand suggestions (type-ahead).
const CAT_BRANDS = {
  figures: [
    'Hot Toys', 'Sideshow', 'Bandai', 'S.H.Figuarts', 'McFarlane Toys', 'NECA',
    'Mezco', 'Good Smile Company', 'Kotobukiya', 'Threezero', 'Iron Studios',
    'Prime 1 Studio', 'Hasbro', 'Mattel', 'Funko', 'Medicom', 'XM Studios',
    'Queen Studios', 'Storm Collectibles', 'Sentinel',
  ],
  diecast: [
    'Mini GT', 'Hot Wheels', 'Tomica', 'Inno64', 'Tarmac Works', 'AUTOart',
    'Kyosho', 'Maisto', 'Bburago', 'Greenlight', 'Matchbox', 'GT Spirit',
    'Solido', 'Schuco', 'Norev', 'Spark',
  ],
  kits: [
    'LEGO', 'Bandai', 'Tamiya', 'Revell', 'Kotobukiya', 'Hasegawa',
    'Aoshima', 'Meng', 'Academy', 'Trumpeter', 'Good Smile Company',
  ],
  designer: [
    'Pop Mart', 'Medicom (Bearbrick)', 'KAWS', 'Funko', 'Jellycat',
    'Sonny Angel', 'Kidrobot', 'Superplastic', 'Unbox Industries', '52Toys', 'How2Work',
  ],
};
const FIGURE_BRANDS = CAT_BRANDS.figures;

// Per-category copy (header subtitle + placeholders).
const CAT_META = {
  figures:  { label: 'Action figure',          titleEg: 'e.g. Iron Man Mark 85 — Endgame',          brandEg: 'Hot Toys, Bandai, Sideshow…' },
  diecast:  { label: 'Diecast',                 titleEg: 'e.g. Nissan Skyline GT-R R34 — Bayside Blue', brandEg: 'Mini GT, Tomica, Hot Wheels…' },
  kits:     { label: 'Model kit / Lego',        titleEg: 'e.g. RG 1/144 Nu Gundam',                  brandEg: 'LEGO, Bandai, Tamiya…' },
  designer: { label: 'Designer toy / blind box',    titleEg: 'e.g. Skullpanda — Tell Me What You Want',  brandEg: 'Pop Mart, Bearbrick, KAWS…' },
};
// cover-photo placeholder tones to cycle through (no real uploads in proto)
const PHOTO_TONES = ['ink', 'red', 'teal', 'gold', 'plum', 'forest'];

// ── small shared bits ─────────────────────────────────────────
function fieldStyle(bad) {
  return {
    width: '100%', boxSizing: 'border-box', height: 46, padding: '0 13px', borderRadius: 11,
    border: `1px solid ${bad ? 'var(--stamp-red)' : 'var(--border-strong)'}`, background: 'var(--paper-soft)',
    fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink)', outline: 'none',
  };
}

function Lbl({ children, required, missing, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
      <SectionLabel>{children}</SectionLabel>
      {required && <span style={{ color: missing ? 'var(--stamp-red)' : 'var(--ink-ghost)', fontSize: 13, fontWeight: 700 }}>*</span>}
      {hint && !missing && <span style={{ fontSize: 11, color: 'var(--ink-ghost)', marginLeft: 'auto' }}>{hint}</span>}
      {missing && <span style={{ fontSize: 11, color: 'var(--stamp-red)', marginLeft: 'auto', fontWeight: 600 }}>Required</span>}
    </div>
  );
}

// money input with leading currency selector — default INR
function MoneyField({ value, onChange, cur, onCur, bad, placeholder = '0', big = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', height: big ? 54 : 46, borderRadius: 12,
      border: `1px solid ${bad ? 'var(--stamp-red)' : 'var(--border-strong)'}`, background: 'var(--paper-soft)', overflow: 'hidden',
    }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 11px', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)', pointerEvents: 'none' }}>
          {symOf(cur)} {cur}
          <Ico d={Icons.chevR} size={13} stroke={2.2} style={{ transform: 'rotate(90deg)', color: 'var(--ink-faint)' }}/>
        </span>
        <select value={cur} onChange={e => onCur(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', fontSize: 16 }}>
          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.sym} {c.code}</option>)}
        </select>
      </div>
      <input value={value} onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', padding: '0 13px',
          fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: big ? 21 : 16, color: 'var(--ink)' }}/>
    </div>
  );
}

// toggle row inside a card
function ToggleRow({ title, sub, on, onToggle, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
      </div>
      <Toggle on={on} onClick={onToggle}/>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────
function AddListingView({ route }) {
  const { pop, push, flashToast } = useNav();
  const { addListing } = useAppState();

  const [cat, setCat] = React.useState('figures');

  // core
  const [photos, setPhotos] = React.useState([]); // each entry: { url: dataURL, tone: string }
  const fileInputRef = React.useRef();
  const [title, setTitle] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [brandFocus, setBrandFocus] = React.useState(false);
  const [scale, setScale] = React.useState('');
  const [scaleOther, setScaleOther] = React.useState('');
  const [size, setSize] = React.useState('');            // blind boxes — free text size
  const [year, setYear] = React.useState('');
  const [desc, setDesc] = React.useState('');

  // acquisition
  const [acq, setAcq] = React.useState('inhand');        // inhand | preorder
  const [cond, setCond] = React.useState('');
  const [paid, setPaid] = React.useState('');
  const [paidCur, setPaidCur] = React.useState('INR');
  const [poDate, setPoDate] = React.useState('');
  const [poSeller, setPoSeller] = React.useState('');

  // for sale
  const [forSale, setForSale] = React.useState(false);
  const [price, setPrice] = React.useState('');
  const [priceCur, setPriceCur] = React.useState('INR');
  const [condNote, setCondNote] = React.useState('');
  const [shipIncl, setShipIncl] = React.useState(false);
  const [returns, setReturns] = React.useState(false);
  const [trade, setTrade] = React.useState(false);

  const [tried, setTried] = React.useState(false);

  // brand suggestions (category-aware)
  const brandList = CAT_BRANDS[cat] || FIGURE_BRANDS;
  const brandMatches = React.useMemo(() => {
    const q = brand.trim().toLowerCase();
    if (!q) return brandList.slice(0, 6);
    return brandList.filter(b => b.toLowerCase().includes(q)).slice(0, 6);
  }, [brand, cat]);
  const exactBrand = brandList.some(b => b.toLowerCase() === brand.trim().toLowerCase());

  const scales = CAT_SCALES[cat];           // null for designer
  const usesScale = !!scales;
  const meta = CAT_META[cat] || CAT_META.figures;

  // switching category resets the scale/size picks (options differ)
  const changeCat = (id) => { setCat(id); setScale(''); setScaleOther(''); setSize(''); };

  // switching to pre-order disables the for-sale path
  const changeAcq = (mode) => { setAcq(mode); if (mode === 'preorder') setForSale(false); };

  // validation
  const missPhoto = photos.length === 0;
  const missTitle = !title.trim();
  const missBrand = !brand.trim();
  const missScale = usesScale && (scale === 'Other' ? !scaleOther.trim() : !scale);
  const missCond  = acq === 'inhand' && !cond;
  const canSell   = acq === 'inhand';      // pre-orders can't be listed for sale
  const missPrice = canSell && forSale && !price.trim();
  const invalid = missPhoto || missTitle || missBrand || missScale || missCond || missPrice;

  const condLabel = cond || (acq === 'preorder' ? 'Pre-order' : '');

  const addPhoto = () => { if (photos.length >= 8) return; fileInputRef.current && fileInputRef.current.click(); };
  const rmPhoto  = (i) => setPhotos(p => p.filter((_, idx) => idx !== i));
  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, 8 - photos.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setPhotos(p => p.length < 8 ? [...p, { url: ev.target.result, tone: PHOTO_TONES[p.length % PHOTO_TONES.length] }] : p);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const submit = () => {
    if (invalid) { setTried(true); flashToast('Fill the required fields marked *'); return; }
    if (forSale) {
      addListing({
        id: 'u' + Date.now(),
        title: title.trim(), brand: brand.trim(), cat, tone: photos[0] || 'ink',
        photos: photos.slice(), photoCount: photos.length,
        scale: usesScale ? (scale === 'Other' ? scaleOther.trim() : scale) : size.trim(), year: year.trim(), desc: desc.trim(),
        price: Number(price) || 0, sym: symOf(priceCur), currency: priceCur,
        condition: condLabel, condNote: condNote.trim(),
        acq, poDate, poSeller: poSeller.trim(),
        trade, shipIncl, returns, status: 'available', verify: 'claimed',
        seller: 'you', mine: true,
      });
      pop();
      flashToast('Listed in the Market — buyers can find it now');
    } else {
      pop();
      flashToast(acq === 'preorder' ? 'Pre-order saved to your collection' : 'Added to your collection');
    }
  };

  return (
    <Screen nav={false} header={<DetailHeader title="Add an item" subtitle={meta.label}/>}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '11px 16px 30px' }}>
          <Button variant={forSale ? 'primary' : 'dark'} size="block" onClick={submit} style={invalid ? { opacity: 0.5 } : null}
            icon={<Ico d={forSale ? Icons.tag : Icons.plusCircle} size={18}/>}>
            {forSale ? 'List in the Market' : 'Add to my collection'}
          </Button>
        </div>
      }>
      <div style={{ padding: '14px 16px 22px' }}>

        {/* ── Category ───────────────────────────── */}
        <Lbl>Category</Lbl>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {ADD_CATEGORIES.map(c => {
            const active = cat === c.id;
            return (
              <button key={c.id} onClick={() => changeCat(c.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999,
                  background: active ? 'var(--ink)' : 'var(--paper-soft)', color: active ? 'var(--paper)' : 'var(--ink)',
                  border: `1px solid ${active ? 'var(--ink)' : 'var(--border-strong)'}`,
                  fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1,
                }}>
                {c.label}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '9px 2px 0', lineHeight: 1.5 }}>
          The form adapts to the category — scale, brands and condition are tuned for {meta.label.toLowerCase()}s.
        </div>

        {/* ── Photos ─────────────────────────────── */}
        <div style={{ marginTop: 22 }}><Lbl required missing={tried && missPhoto} hint={photos.length ? `${photos.length} added` : 'first = cover'}>Photos</Lbl></div>
        {/* hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles}/>
        <div style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 2 }}>
          <button onClick={addPhoto} style={{
            width: 88, height: 88, flexShrink: 0, borderRadius: 13, cursor: 'pointer',
            border: `1px dashed ${tried && missPhoto ? 'var(--stamp-red)' : 'var(--border-strong)'}`, background: 'var(--paper-soft)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: 'var(--ink-mute)',
          }}>
            <Ico d={Icons.camera} size={22}/>
            <span style={{ fontSize: 11, fontWeight: 600 }}>Add photo</span>
          </button>
          {photos.map((photo, i) => (
            <div key={i} style={{ position: 'relative', width: 88, height: 88, flexShrink: 0, borderRadius: 13, overflow: 'visible' }}>
              {photo.url
                ? <img src={photo.url} style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 13, display: 'block' }}/>
                : <ProductPhoto tone={photo.tone || photo} ratio="1/1" rounded={13}/>}
              {i === 0 && (
                <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'var(--ink)', color: 'var(--paper)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 5px', borderRadius: 4 }}>Cover</span>
              )}
              <button onClick={() => rmPhoto(i)} aria-label="Remove" style={{
                position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
                background: 'var(--ink)', color: 'var(--paper)', border: '2px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Ico d={Icons.close} size={11} stroke={3}/></button>
            </div>
          ))}
        </div>

        {/* ── Title ──────────────────────────────── */}
        <div style={{ marginTop: 22 }}><Lbl required missing={tried && missTitle}>Title</Lbl></div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder={meta.titleEg}
          style={fieldStyle(tried && missTitle)}/>

        {/* ── Brand (autocomplete) ───────────────── */}
        <div style={{ marginTop: 22 }}><Lbl required missing={tried && missBrand}>Brand</Lbl></div>
        <div style={{ position: 'relative' }}>
          <input value={brand} onChange={e => { setBrand(e.target.value); setBrandFocus(true); }}
            onFocus={() => setBrandFocus(true)} onBlur={() => setTimeout(() => setBrandFocus(false), 120)}
            placeholder={`Start typing — ${meta.brandEg}`} style={fieldStyle(tried && missBrand)}/>
          {brandFocus && (brandMatches.length > 0 || (brand.trim() && !exactBrand)) && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20,
              background: 'var(--paper)', border: '1px solid var(--border-strong)', borderRadius: 12, overflow: 'hidden',
              boxShadow: 'var(--shadow-3)',
            }}>
              {brand.trim() && !exactBrand && (
                <button onMouseDown={(e) => { e.preventDefault(); setBrand(brand.trim()); setBrandFocus(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', cursor: 'pointer',
                  padding: '11px 13px', background: 'transparent', border: 'none', borderBottom: brandMatches.length ? '1px solid var(--border)' : 'none',
                }}>
                  <Ico d={Icons.plus} size={15} stroke={2.4} style={{ color: 'var(--stamp-red)' }}/>
                  <span style={{ fontSize: 14, color: 'var(--ink)' }}>Use “<b>{brand.trim()}</b>”</span>
                </button>
              )}
              {brandMatches.map((b, i) => (
                <button key={b} onMouseDown={(e) => { e.preventDefault(); setBrand(b); setBrandFocus(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', cursor: 'pointer',
                  padding: '11px 13px', background: brand.trim().toLowerCase() === b.toLowerCase() ? 'var(--bone)' : 'transparent',
                  border: 'none', borderBottom: i < brandMatches.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <Ico d={Icons.tag} size={14} style={{ color: 'var(--ink-faint)' }}/>
                  <span style={{ fontSize: 14, color: 'var(--ink)' }}>{b}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {!brandFocus && !brand && (
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '8px 2px 0' }}>We suggest brands as you type — pick one to keep the catalogue clean.</div>
        )}

        {/* ── Scale (or Size for designer) + Year ── */}
        {usesScale ? (
          <>
            <div style={{ marginTop: 22 }}><Lbl required missing={tried && missScale}>Scale</Lbl></div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {scales.map(s => <CategoryChip key={s} active={scale === s} onClick={() => setScale(s)}>{s}</CategoryChip>)}
              <CategoryChip active={scale === 'Other'} onClick={() => setScale('Other')}>+ Other</CategoryChip>
            </div>
            {scale === 'Other' && (
              <input value={scaleOther} onChange={e => setScaleOther(e.target.value)} placeholder="e.g. 1/20, non-scale"
                style={{ ...fieldStyle(tried && missScale), height: 42, fontSize: 14.5, marginTop: 9 }}/>
            )}
          </>
        ) : (
          <>
            <div style={{ marginTop: 22 }}><Lbl hint="optional">Size</Lbl></div>
            <input value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. 400% · 28 cm · 7 inch"
              style={{ ...fieldStyle(false), fontSize: 14.5 }}/>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '7px 2px 0' }}>Blind boxes don’t use scale — note the height or % size instead.</div>
          </>
        )}

        <div style={{ marginTop: 18 }}><Lbl hint="optional">Release year</Lbl></div>
        <input value={year} onChange={e => setYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} inputMode="numeric" placeholder="e.g. 2022"
          style={{ ...fieldStyle(false), height: 42, fontSize: 14.5, fontFamily: 'var(--font-mono)' }}/>

        {/* ── Description ────────────────────────── */}
        <div style={{ marginTop: 18 }}><Lbl hint="optional">Description</Lbl></div>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="What makes this one special? Accessories, edition, where you got it…"
          style={{ ...fieldStyle(false), height: 'auto', padding: '11px 13px', lineHeight: 1.5, resize: 'none', fontSize: 14.5 }}/>

        {/* ── Acquisition ────────────────────────── */}
        <div style={{ marginTop: 24 }}><SectionLabel>How did you get it?</SectionLabel></div>
        <div style={{ marginTop: 9 }}>
          <Segmented value={acq} onChange={changeAcq}
            options={[{ id: 'inhand', label: 'In hand' }, { id: 'preorder', label: 'Pre-order' }]}/>
        </div>

        {acq === 'inhand' ? (
          <div style={{ marginTop: 16 }}>
            <Lbl required missing={tried && missCond}>Condition</Lbl>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {FIGURE_CONDITIONS.map(c => {
                const on = cond === c.id;
                return (
                  <button key={c.id} onClick={() => setCond(c.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', cursor: 'pointer',
                    padding: '11px 13px', borderRadius: 11, background: on ? 'var(--ink)' : 'var(--paper-soft)',
                    border: `1px solid ${on ? 'var(--ink)' : (tried && missCond ? 'var(--stamp-red)' : 'var(--border-strong)')}`,
                  }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `2px solid ${on ? 'var(--paper)' : 'var(--border-strong)'}`, background: on ? 'var(--paper)' : 'transparent' }}>
                      {on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ink)' }}/>}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: on ? 'var(--paper)' : 'var(--ink)' }}>{c.label}</span>
                      <span style={{ fontSize: 11.5, color: on ? 'rgba(244,239,230,0.7)' : 'var(--ink-faint)', marginTop: 1 }}>{c.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 18 }}><Lbl hint="optional · private">What you paid</Lbl></div>
            <MoneyField value={paid} onChange={setPaid} cur={paidCur} onCur={setPaidCur} placeholder="Purchase price"/>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '7px 2px 0' }}>Only you see this — it helps track your collection’s value.</div>
          </div>
        ) : (
          <div style={{ marginTop: 16, background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)', borderRadius: 14, padding: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13 }}>
              <Ico d={Icons.clock} size={16} style={{ color: 'var(--grail-gold-deep)' }}/>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--grail-gold-deep)' }}>Pre-order details</span>
            </div>
            <Lbl hint="optional">Release / launch date</Lbl>
            <input type="date" value={poDate} onChange={e => setPoDate(e.target.value)}
              style={{ ...fieldStyle(false), background: 'var(--paper)', fontFamily: 'var(--font-mono)', fontSize: 14 }}/>
            <div style={{ marginTop: 14 }}><Lbl hint="optional">Ordered from (seller)</Lbl></div>
            <input value={poSeller} onChange={e => setPoSeller(e.target.value)} placeholder="Store, distributor or seller name"
              style={{ ...fieldStyle(false), background: 'var(--paper)', fontSize: 14.5 }}/>
          </div>
        )}

        {/* ── For sale — in-hand items only ─────── */}
        {canSell ? (
        <div style={{ marginTop: 24, borderRadius: 16, border: `1px solid ${forSale ? 'var(--stamp-red)' : 'var(--border)'}`, background: forSale ? 'var(--stamp-red-soft)' : 'var(--paper-soft)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: forSale ? 'var(--stamp-red)' : 'var(--bone-deep)', color: forSale ? 'var(--paper)' : 'var(--ink-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={Icons.tag} size={20}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>List for sale</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, lineHeight: 1.4 }}>Show it in the Market — goes live instantly.</div>
            </div>
            <Toggle on={forSale} onClick={() => setForSale(v => !v)}/>
          </div>

          {forSale && (
            <div style={{ padding: '2px 15px 16px', borderTop: '1px solid var(--stamp-red)' }}>
              <div style={{ marginTop: 15 }}><Lbl required missing={tried && missPrice}>Asking price</Lbl></div>
              <MoneyField value={price} onChange={setPrice} cur={priceCur} onCur={setPriceCur} bad={tried && missPrice} placeholder="Your price" big/>

              <div style={{ marginTop: 16 }}><Lbl hint="optional">Condition notes</Lbl></div>
              <textarea value={condNote} onChange={e => setCondNote(e.target.value)} rows={2} placeholder="Box wear, paint, joints, what’s included…"
                style={{ ...fieldStyle(false), height: 'auto', padding: '11px 13px', lineHeight: 1.5, resize: 'none', fontSize: 14.5, background: 'var(--paper)' }}/>

              <div style={{ marginTop: 8, padding: '0 1px' }}>
                <ToggleRow title="Shipping included" sub="Price covers delivery — no extra at checkout" on={shipIncl} onToggle={() => setShipIncl(v => !v)}/>
                <ToggleRow title="Returns accepted" sub="Buyer can return within a short window" on={returns} onToggle={() => setReturns(v => !v)}/>
                <ToggleRow title="Open to trades" sub="Buyers can propose an item swap" on={trade} onToggle={() => setTrade(v => !v)} last/>
              </div>

              {/* live market preview */}
              <div style={{ marginTop: 14 }}><SectionLabel>Market preview</SectionLabel></div>
              <div style={{ display: 'flex', gap: 11, alignItems: 'center', marginTop: 10, padding: 10, borderRadius: 13, background: 'var(--paper)', border: '1px solid var(--border)' }}>
                <div style={{ width: 56, height: 56, borderRadius: 9, overflow: 'hidden', flexShrink: 0 }}>
                  {photos[0] && photos[0].url
                    ? <img src={photos[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : <ProductPhoto tone={(photos[0] && photos[0].tone) || 'ink'} ratio="1/1" rounded={9}/>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title.trim() || 'Your item title'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{symOf(priceCur)} {price ? Number(price).toLocaleString('en-IN') : '—'}</span>
                    {condLabel && <Tag kind="default" style={{ background: 'var(--bone)' }}>{condLabel}</Tag>}
                  </div>
                </div>
                {trade && <Stamp color="var(--ink)" rotate={-3} style={{ fontSize: 9 }}>Trade OK</Stamp>}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 13, fontSize: 12, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
                <Ico d={Icons.shield} size={15} style={{ color: 'var(--verified-teal)', flexShrink: 0, marginTop: 1 }}/>
                <span>Listing goes live now. Add a <b style={{ color: 'var(--verified-teal)' }}>verified in-app photo</b> later to earn the Verified badge and rank higher in search.</span>
              </div>
            </div>
          )}
        </div>
        ) : (
          <div style={{ marginTop: 24, display: 'flex', gap: 11, alignItems: 'flex-start', padding: 15, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--paper-soft)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: 'var(--bone-deep)', color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={Icons.tag} size={20}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Selling is off for pre-orders</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 3, lineHeight: 1.45 }}>List it on the Market once it’s in hand and you can add a verified photo. For now it’s saved to your collection as a pre-order.</div>
            </div>
          </div>
        )}

      </div>
    </Screen>
  );
}

// ISOFormView now redirects to compose overlay
function ISOFormView() {
  const { pop, setOverlay } = useNav();
  React.useEffect(() => { pop(); setTimeout(() => setOverlay({ name: 'compose' }), 50); }, []);
  return null;
}

Object.assign(window, { AddListingView, ISOFormView, MoneyField, ToggleRow, CURRENCIES, CAT_BRANDS, CAT_SCALES, FIGURE_BRANDS, FIGURE_SCALES });
