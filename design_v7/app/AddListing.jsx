// ─────────────────────────────────────────────────────────────
// Add an item / Create a listing — category-aware (Phase 1: Action Figures) v3
// ─────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'INR', sym: '₹' }, { code: 'USD', sym: '$' }, { code: 'EUR', sym: '€' },
  { code: 'GBP', sym: '£' }, { code: 'JPY', sym: '¥' }, { code: 'AED', sym: 'د.إ' }, { code: 'SGD', sym: 'S$' },
];
const symOf = (code) => (CURRENCIES.find(c => c.code === code) || CURRENCIES[0]).sym;

const ADD_CATEGORIES = [
  { id: 'figures',  label: 'Action Figure' },
  { id: 'diecast',  label: 'Diecast' },
  { id: 'kits',     label: 'Model Kits & Lego' },
  { id: 'designer', label: 'Designer Toys & Blind Boxes' },
  { id: 'tcg',      label: 'Trading Cards (TCG)' },
];

const FIGURE_SCALES = ['1/1', '1/2', '1/3', '1/4', '1/6', '1/10', '1/12'];
const CAT_SCALES = {
  figures:  ['1/1', '1/2', '1/3', '1/4', '1/6', '1/10', '1/12'],
  diecast:  ['1/64', '1/43', '1/24', '1/18', '1/12'],
  kits:     ['1/144', '1/100', '1/72', '1/60', '1/48', '1/35', '1/24', 'Non-scale'],
  designer: null,
  tcg:      null,
};

const FIGURE_CONDITIONS = [
  { id: 'Sealed', label: 'Sealed', sub: 'Factory sealed, never opened' },
  { id: 'MIB',    label: 'MIB',    sub: 'Mint in box' },
  { id: 'BIB',    label: 'BIB',    sub: 'Box in box / outer shipper kept' },
  { id: 'Loose',  label: 'Loose',  sub: 'Out of box / displayed' },
];

const CAT_BRANDS = {
  figures: ['Hot Toys', 'Sideshow', 'Bandai', 'S.H.Figuarts', 'McFarlane Toys', 'NECA', 'Mezco', 'Good Smile Company', 'Kotobukiya', 'Threezero', 'Iron Studios', 'Prime 1 Studio', 'Hasbro', 'Mattel', 'Funko', 'Medicom', 'XM Studios', 'Queen Studios', 'Storm Collectibles', 'Sentinel'],
  diecast: ['Mini GT', 'Hot Wheels', 'Tomica', 'Inno64', 'Tarmac Works', 'AUTOart', 'Kyosho', 'Maisto', 'Bburago', 'Greenlight', 'Matchbox', 'GT Spirit', 'Solido', 'Schuco', 'Norev', 'Spark'],
  kits:    ['LEGO', 'Bandai', 'Tamiya', 'Revell', 'Kotobukiya', 'Hasegawa', 'Aoshima', 'Meng', 'Academy', 'Trumpeter', 'Good Smile Company'],
  designer:['Pop Mart', 'Medicom (Bearbrick)', 'KAWS', 'Funko', 'Jellycat', 'Sonny Angel', 'Kidrobot', 'Superplastic', 'Unbox Industries', '52Toys', 'How2Work'],
  tcg:     ['The Pokemon Company', 'Bandai (One Piece TCG)', 'Wizards of the Coast (MTG)', 'Konami (Yu-Gi-Oh!)', 'Bandai (Digimon TCG)', 'Bandai (Dragon Ball Super TCG)', 'Bushiroad (Weiss Schwarz)', 'Bushiroad (Cardfight Vanguard)'],
};
const FIGURE_BRANDS = CAT_BRANDS.figures;

const CAT_META = {
  figures:  { label: 'Action figure',           titleEg: 'e.g. Iron Man Mark 85',           brandEg: 'Hot Toys, Bandai, Sideshow' },
  diecast:  { label: 'Diecast',                  titleEg: 'e.g. Nissan Skyline GT-R R34',    brandEg: 'Mini GT, Tomica, Hot Wheels' },
  kits:     { label: 'Model kit / Lego',         titleEg: 'e.g. RG 1/144 Nu Gundam',         brandEg: 'LEGO, Bandai, Tamiya' },
  designer: { label: 'Designer toy / blind box', titleEg: 'e.g. Skullpanda',                  brandEg: 'Pop Mart, Bearbrick, KAWS' },
  tcg:      { label: 'Trading card / set',       titleEg: 'e.g. Pokemon SV 151 Booster Box',  brandEg: 'Pokemon, One Piece TCG, MTG' },
};

const PHOTO_TONES = ['ink', 'red', 'teal', 'gold', 'plum', 'forest'];
const PO_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PO_YEARS  = ['2026', '2027', '2028'];
const poSelectStyle = {
  flex: 1, minWidth: 0, boxSizing: 'border-box', height: 46, padding: '0 11px', borderRadius: 11,
  border: '1px solid var(--border-strong)', background: 'var(--paper)',
  fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink)', outline: 'none', cursor: 'pointer',
};

// ── small shared helpers ──────────────────────────────────────
function fieldStyle(bad) {
  return {
    width: '100%', boxSizing: 'border-box', height: 46, padding: '0 13px', borderRadius: 11,
    border: '1px solid ' + (bad ? 'var(--stamp-red)' : 'var(--border-strong)'),
    background: 'var(--paper-soft)',
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

function MoneyField({ value, onChange, cur, onCur, bad, placeholder, big }) {
  placeholder = placeholder || '0';
  big = big || false;
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', height: big ? 54 : 46, borderRadius: 12,
      border: '1px solid ' + (bad ? 'var(--stamp-red)' : 'var(--border-strong)'),
      background: 'var(--paper-soft)', overflow: 'hidden',
    }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 11px', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)', pointerEvents: 'none' }}>
          {symOf(cur)} {cur}
          <Ico d={Icons.chevR} size={13} stroke={2.2} style={{ transform: 'rotate(90deg)', color: 'var(--ink-faint)' }}/>
        </span>
        <select value={cur} onChange={function(e) { onCur(e.target.value); }}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', fontSize: 16 }}>
          {CURRENCIES.map(function(c) { return <option key={c.code} value={c.code}>{c.sym} {c.code}</option>; })}
        </select>
      </div>
      <input value={value} onChange={function(e) { onChange(e.target.value.replace(/[^0-9]/g, '')); }} inputMode="numeric" placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', padding: '0 13px',
          fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: big ? 21 : 16, color: 'var(--ink)' }}/>
    </div>
  );
}

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

// ── Step 0: Mode picker ───────────────────────────────────────
var ACQ_MODES_DATA = [
  { id: 'inhand',   label: 'In Hand',        icon: Icons.check, color: 'var(--stamp-red)',       bg: 'var(--stamp-red-soft)',     border: 'var(--stamp-red)',       desc: 'You own this physically.',          detail: 'Condition grade, photos and purchase price. You can also list it for sale.' },
  { id: 'preorder', label: 'Pre-order',       icon: Icons.clock, color: 'var(--grail-gold-deep)', bg: 'var(--grail-gold-soft)',    border: 'var(--grail-gold)',       desc: 'Ordered, not arrived yet.',         detail: 'Track the release window, deposit paid and expected delivery.' },
  { id: 'intel',    label: 'DB Contribution', icon: Icons.eye,   color: 'var(--verified-teal)',   bg: 'var(--verified-teal-soft)', border: 'var(--verified-teal)',    desc: 'Spotted it? Help the community find it.',  detail: 'Share what you know — brand, scale and title. Other collectors can track, wishlist and discover it. Earns +50 XP if you\'re first to add it to Scorred.' },
];

function AcqModePicker({ onPick, modes }) {
  var filtered = modes ? ACQ_MODES_DATA.filter(function(m) { return modes.includes(m.id); }) : ACQ_MODES_DATA;
  return (
    <Screen nav={false} header={<DetailHeader title="What are you adding?" subtitle="Choose one to continue"/>}>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 13 }}>
        {filtered.map(function(m) {
          return (
            <button key={m.id} onClick={function() { onPick(m.id); }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 14px',
                background: m.bg, border: '1.5px solid ' + m.border, borderRadius: 16,
                cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center', background: m.color }}>
                <Ico d={m.icon} size={20} style={{ color: 'var(--paper)' }}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: m.color, marginBottom: 5 }}>{m.desc}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{m.detail}</div>
              </div>
              <Ico d={Icons.chevronRight} size={18} style={{ color: m.color, flexShrink: 0, marginTop: 4 }}/>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

// ── Main form ─────────────────────────────────────────────────
function AddListingView({ route }) {
  var nav = useNav();
  var pop = nav.pop; var push = nav.push; var flashToast = nav.flashToast;
  var appState = useAppState();
  var addListing = appState.addListing; var userListings = appState.userListings;

  var allListings = [].concat(userListings || [], LISTINGS);
  var editListing = route.editId ? (allListings.find(function(x) { return x.id === route.editId; }) || MARKET_SEED.find(function(x) { return x.id === route.editId; })) : null;
  var catalogueItem = (route.sku && !editListing) ? catOf(route.sku) : null;
  var prefill = editListing || catalogueItem;

  var stepInit = (route.intelToInhand || route.editId || (route.sku && !route.forcePicker)) ? 'form' : 'pick';
  var stepState = React.useState(stepInit);
  var step = stepState[0]; var setStep = stepState[1];

  var catState = React.useState(prefill && prefill.cat ? prefill.cat : 'figures');
  var cat = catState[0]; var setCat = catState[1];

  var photosState = React.useState([]);
  var photos = photosState[0]; var setPhotos = photosState[1];
  var fileInputRef = React.useRef();

  var titleState = React.useState(prefill && prefill.title ? prefill.title : '');
  var title = titleState[0]; var setTitle = titleState[1];

  var brandState = React.useState(prefill && prefill.brand ? prefill.brand : '');
  var brand = brandState[0]; var setBrand = brandState[1];

  var brandFocusState = React.useState(false);
  var brandFocus = brandFocusState[0]; var setBrandFocus = brandFocusState[1];

  var scaleState = React.useState(prefill && prefill.scale ? prefill.scale : '');
  var scale = scaleState[0]; var setScale = scaleState[1];

  var scaleOtherState = React.useState('');
  var scaleOther = scaleOtherState[0]; var setScaleOther = scaleOtherState[1];

  var sizeState = React.useState(prefill && prefill.size ? prefill.size : '');
  var size = sizeState[0]; var setSize = sizeState[1];

  var tcgLangState = React.useState('');
  var tcgLang = tcgLangState[0]; var setTcgLang = tcgLangState[1];

  var tcgFormatState = React.useState('');
  var tcgFormat = tcgFormatState[0]; var setTcgFormat = tcgFormatState[1];

  var tcgGradedState = React.useState(false);
  var tcgGraded = tcgGradedState[0]; var setTcgGraded = tcgGradedState[1];

  var tcgGraderState = React.useState('PSA');
  var tcgGrader = tcgGraderState[0]; var setTcgGrader = tcgGraderState[1];

  var tcgGradeState = React.useState('');
  var tcgGrade = tcgGradeState[0]; var setTcgGrade = tcgGradeState[1];

  var yearState = React.useState(prefill && prefill.year ? String(prefill.year) : '');
  var year = yearState[0]; var setYear = yearState[1];

  var descState = React.useState(prefill && (prefill.desc || prefill.notes) ? (prefill.desc || prefill.notes) : '');
  var desc = descState[0]; var setDesc = descState[1];

  var acqInit = route.intelToInhand ? 'inhand' : (prefill && prefill.acq ? prefill.acq : 'inhand');
  var acqState = React.useState(acqInit);
  var acq = acqState[0]; var setAcq = acqState[1];

  var condState = React.useState(editListing && editListing.condition ? editListing.condition.split(' \u00b7')[0] : '');
  var cond = condState[0]; var setCond = condState[1];

  var paidState = React.useState('');
  var paid = paidState[0]; var setPaid = paidState[1];

  var paidCurState = React.useState('INR');
  var paidCur = paidCurState[0]; var setPaidCur = paidCurState[1];

  var poDateState = React.useState('');
  var poDate = poDateState[0]; var setPoDate = poDateState[1];

  var poSellerState = React.useState('');
  var poSeller = poSellerState[0]; var setPoSeller = poSellerState[1];

  var poOrderDateState = React.useState('');
  var poOrderDate = poOrderDateState[0]; var setPoOrderDate = poOrderDateState[1];

  var poTotalState = React.useState('');
  var poTotal = poTotalState[0]; var setPoTotal = poTotalState[1];

  var poDepositState = React.useState('');
  var poDeposit = poDepositState[0]; var setPoDeposit = poDepositState[1];

  var poBalance = Math.max(0, (parseInt(poTotal, 10) || 0) - (parseInt(poDeposit, 10) || 0));

  var poPrecState = React.useState('month');
  var poPrec = poPrecState[0]; var setPoPrec = poPrecState[1];

  var poMonthState = React.useState('');
  var poMonth = poMonthState[0]; var setPoMonth = poMonthState[1];

  var poQuarterState = React.useState('');
  var poQuarter = poQuarterState[0]; var setPoQuarter = poQuarterState[1];

  var poYearState = React.useState('2026');
  var poYear = poYearState[0]; var setPoYear = poYearState[1];

  var forSaleState = React.useState(!!editListing);
  var forSale = forSaleState[0]; var setForSale = forSaleState[1];

  var priceState = React.useState(editListing && editListing.price ? String(editListing.price) : '');
  var price = priceState[0]; var setPrice = priceState[1];

  var priceCurInit = editListing && editListing.sym === '$' ? 'USD' : editListing && editListing.sym === '\u20ac' ? 'EUR' : editListing && editListing.sym === '\u00a3' ? 'GBP' : 'INR';
  var priceCurState = React.useState(priceCurInit);
  var priceCur = priceCurState[0]; var setPriceCur = priceCurState[1];

  var condNoteState = React.useState(editListing && editListing.condNote ? editListing.condNote : '');
  var condNote = condNoteState[0]; var setCondNote = condNoteState[1];

  var shipInclState = React.useState(editListing && editListing.shipping === 'incl' ? true : false);
  var shipIncl = shipInclState[0]; var setShipIncl = shipInclState[1];

  var returnsState = React.useState(editListing && editListing.returns ? editListing.returns : false);
  var returns = returnsState[0]; var setReturns = returnsState[1];

  var triedState = React.useState(false);
  var tried = triedState[0]; var setTried = triedState[1];

  var intelTargetState = React.useState('');
  var intelTarget = intelTargetState[0]; var setIntelTarget = intelTargetState[1];

  var intelTargetCurState = React.useState('INR');
  var intelTargetCur = intelTargetCurState[0]; var setIntelTargetCur = intelTargetCurState[1];

  var catalogueLinkedState = React.useState(null);
  var catalogueLinked = catalogueLinkedState[0]; var setCatalogueLinked = catalogueLinkedState[1];

  var brandIsOtherState = React.useState(false);
  var brandIsOther = brandIsOtherState[0]; var setBrandIsOther = brandIsOtherState[1];

  // brand suggestions
  var brandList = CAT_BRANDS[cat] || FIGURE_BRANDS;
  var brandMatches = React.useMemo(function() {
    var q = brand.trim().toLowerCase();
    if (!q) return brandList.slice(0, 6);
    return brandList.filter(function(b) { return b.toLowerCase().includes(q); }).slice(0, 6);
  }, [brand, cat]);
  var exactBrand = brandList.some(function(b) { return b.toLowerCase() === brand.trim().toLowerCase(); });

  var scales = CAT_SCALES[cat];
  var usesScale = !!scales;
  var meta = CAT_META[cat] || CAT_META.figures;

  // catalogue dedup
  var wordOverlap = function(a, b) {
    var wa = new Set(a.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 2; }));
    var wb = new Set(b.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 2; }));
    if (!wa.size) return 0;
    return [...wa].filter(function(w) { return wb.has(w); }).length / Math.max(wa.size, wb.size);
  };
  var catTitleMatches = React.useMemo(function() {
    if (!title.trim() || title.trim().length < 3) return [];
    return CATALOGUE
      .filter(function(c) { return c.cat === cat; })
      .map(function(c) { return Object.assign({}, c, { score: wordOverlap(title, c.title) }); })
      .filter(function(c) { return c.score > 0.25; })
      .sort(function(a, b) { return b.score - a.score; })
      .slice(0, 3);
  }, [title, cat]);
  var strongMatch = catTitleMatches.length > 0 && catTitleMatches[0].score > 0.6;
  var isNewToDb = title.trim().length >= 5 && catTitleMatches.length === 0 && !!brand.trim();

  // validation
  var photoMax = acq === 'intel' ? 6 : 8;
  var missPhoto = photos.length === 0;
  var missTitle = !title.trim();
  var missBrand = !brand.trim();
  var missScale = acq !== 'intel' && usesScale && (scale === 'Other' ? !scaleOther.trim() : !scale);
  var missCond  = acq === 'inhand' && !cond;
  var canSell   = acq === 'inhand';
  var missPrice = canSell && forSale && !price.trim();
  var invalid = missPhoto || missTitle || missBrand || missScale || missCond || missPrice;

  // condition display label
  var condLabel = (function() {
    if (!cond) return '';
    return cond;
  })();

  var changeCat = function(id) { setCat(id); setScale(''); setScaleOther(''); setSize(''); setBrand(''); setBrandIsOther(false); setTcgLang(''); setTcgFormat(''); setTcgGraded(false); setTcgGrade(''); };
  var changeAcq = function(mode) { setAcq(mode); if (mode === 'preorder' || mode === 'intel') setForSale(false); };

  // photos
  var handleFiles = function(e) {
    var files = Array.from(e.target.files || []);
    files.slice(0, photoMax - photos.length).forEach(function(f) {
      var reader = new FileReader();
      reader.onload = function(ev) {
        setPhotos(function(prev) {
          if (prev.length >= photoMax) return prev;
          return prev.concat([{ url: ev.target.result, tone: PHOTO_TONES[prev.length % PHOTO_TONES.length] }]);
        });
      };
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };
  var addPhoto = function() {
    if (photos.length >= photoMax) return;
    fileInputRef.current && fileInputRef.current.click();
  };
  var rmPhoto = function(i) { setPhotos(function(prev) { return prev.filter(function(_, j) { return j !== i; }); }); };

  var submit = function() {
    if (invalid) { setTried(true); flashToast('Fill the required fields marked *'); return; }
    if (acq === 'intel') {
      pop();
      flashToast(isNewToDb ? '+50 XP \u00b7 Added to Scorred DB \u2014 thanks for contributing' : 'Already in Scorred DB \u2014 no duplicate XP');
      return;
    }
    if (forSale) {
      addListing({
        id: 'u' + Date.now(),
        title: title.trim(), brand: brand.trim(), cat: cat, tone: photos[0] ? photos[0].tone : 'ink',
        photos: photos.slice(), photoCount: photos.length,
        scale: usesScale ? (scale === 'Other' ? scaleOther.trim() : scale) : size.trim(),
        year: year.trim(), desc: desc.trim(),
        price: Number(price) || 0, sym: symOf(priceCur), currency: priceCur,
        condition: condLabel, condNote: condNote.trim(),
        acq: acq, value: Number(paid) || 0,
        shipIncl: shipIncl, returns: returns, status: 'available',
        verify: 'unverified', trade: false, qty: 1, seller: 'you', mine: true,
        ships: 'India', listed: true,
        sku: catalogueLinked ? catalogueLinked.sku : null,
      });
    } else {
      addListing({
        id: 'c' + Date.now(),
        title: title.trim(), brand: brand.trim(), cat: cat, tone: photos[0] ? photos[0].tone : 'ink',
        photos: photos.slice(), photoCount: photos.length,
        scale: usesScale ? (scale === 'Other' ? scaleOther.trim() : scale) : size.trim(),
        year: year.trim(), desc: desc.trim(),
        acq: acq, value: Number(paid) || 0, status: acq,
        condition: condLabel,
        poDate: poDate, poSeller: poSeller, poOrderDate: poOrderDate,
        total: Number(poTotal) || 0, deposit: Number(poDeposit) || 0,
        sku: catalogueLinked ? catalogueLinked.sku : null,
        isNewToDb: isNewToDb,
      });
    }
    pop();
    flashToast(acq === 'preorder'
      ? (isNewToDb ? '+50 XP \u00b7 Added to Scorred DB \u00b7 Pre-order saved' : 'Pre-order saved to your collection')
      : (isNewToDb ? '+50 XP \u00b7 Added to Scorred DB \u00b7 Saved to your collection' : 'Added to your collection'));
  };

  if (step === 'pick') {
    return <AcqModePicker
      onPick={function(m) { setAcq(m); setStep('form'); }}
      modes={route.forcePicker ? ['inhand', 'preorder'] : null}
    />;
  }

  return (
    <Screen nav={false} header={<DetailHeader title={editListing ? 'Edit listing' : catalogueItem ? 'Sell item' : 'Add an item'} subtitle={meta.label} onBack={stepInit === 'pick' ? function() { setStep('pick'); } : undefined}/>}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '11px 16px 30px' }}>
          <Button variant={forSale ? 'primary' : 'dark'} size="block" onClick={submit} style={invalid ? { opacity: 0.5 } : null}
            icon={<Ico d={forSale ? Icons.tag : acq === 'intel' ? Icons.eye : Icons.plusCircle} size={18}/>}>
            {acq === 'intel' ? 'Contribute to DB' : forSale ? 'List in the Market' : 'Add to my collection'}
          </Button>
        </div>
      }>
      <div style={{ padding: '14px 16px 22px' }}>

        {/* Category */}
        <Lbl>Category</Lbl>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {ADD_CATEGORIES.map(function(c) {
            var active = cat === c.id;
            return (
              <button key={c.id} onClick={function() { changeCat(c.id); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999,
                  background: active ? 'var(--ink)' : 'var(--paper-soft)',
                  color: active ? 'var(--paper)' : 'var(--ink)',
                  border: '1px solid ' + (active ? 'var(--ink)' : 'var(--border)'),
                  fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1,
                }}>
                {c.label}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '9px 2px 0', lineHeight: 1.5 }}>
          The form adapts to the category.
        </div>

        {/* Brand */}
        <div style={{ marginTop: 22 }}><Lbl required={true} missing={tried && missBrand}>Brand</Lbl></div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {(CAT_BRANDS[cat] || []).slice(0, 6).map(function(b) {
            return <CategoryChip key={b} active={brand === b && !brandIsOther} onClick={function() { setBrand(b); setBrandIsOther(false); setBrandFocus(false); }}>{b}</CategoryChip>;
          })}
        </div>
        <div style={{ position: 'relative', marginTop: 9 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 12px', borderRadius: 11,
            border: '1px solid ' + (tried && missBrand && brandIsOther && !brand.trim() ? 'var(--stamp-red)' : brandIsOther && brand ? 'var(--ink)' : 'var(--border-strong)'),
            background: 'var(--paper-soft)' }}>
            <Ico d={Icons.search} size={15} style={{ color: 'var(--ink-faint)', flexShrink: 0 }}/>
            <input
              value={brandIsOther ? brand : ''}
              onFocus={function() { setBrandIsOther(true); setBrandFocus(true); }}
              onBlur={function() { setTimeout(function() { setBrandFocus(false); }, 150); }}
              onChange={function(e) { setBrand(e.target.value); setBrandIsOther(true); }}
              placeholder="Other brand — search or type..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none',
                fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)' }}/>
            {brandIsOther && brand && (
              <button onMouseDown={function() { setBrand(''); setBrandIsOther(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', display: 'flex', padding: 0 }}>
                <Ico d={Icons.close} size={13} stroke={2}/>
              </button>
            )}
          </div>
          {brandFocus && brandIsOther && (brandMatches.length > 0 || (brand.trim().length > 1 && !exactBrand)) && (
            <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 20,
              background: 'var(--paper)', border: '1px solid var(--border-strong)', borderRadius: 11, overflow: 'hidden',
              boxShadow: 'var(--shadow-3)' }}>
              {brandMatches.map(function(b, i) {
                return (
                  <button key={b} onMouseDown={function() { setBrand(b); setBrandIsOther(true); setBrandFocus(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', cursor: 'pointer',
                      padding: '10px 13px', background: 'transparent', border: 'none',
                      borderBottom: '1px solid var(--border)' }}>
                    <Ico d={Icons.tag} size={14} style={{ color: 'var(--ink-faint)' }}/>
                    <span style={{ fontSize: 14, color: 'var(--ink)' }}>{b}</span>
                  </button>
                );
              })}
              {brand.trim().length > 1 && !exactBrand && !brandMatches.some(function(b) { return b.toLowerCase() === brand.trim().toLowerCase(); }) && (
                <button onMouseDown={function() { setBrand(brand.trim()); setBrandIsOther(true); setBrandFocus(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', cursor: 'pointer',
                    padding: '10px 13px', background: 'var(--verified-teal-soft)', border: 'none' }}>
                  <Ico d={Icons.plusCircle} size={14} style={{ color: 'var(--verified-teal)', flexShrink: 0 }}/>
                  <span style={{ fontSize: 14, color: 'var(--verified-teal)', fontWeight: 600 }}>Add "{brand.trim()}" as new brand</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scale */}
        {usesScale ? (
          <>
            <div style={{ marginTop: 22 }}><Lbl required={acq !== 'intel'} missing={tried && missScale}>Scale</Lbl></div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {scales.map(function(s) { return <CategoryChip key={s} active={scale === s} onClick={function() { setScale(s); }}>{s}</CategoryChip>; })}
              <CategoryChip active={scale === 'Other'} onClick={function() { setScale('Other'); }}>+ Other</CategoryChip>
            </div>
            {scale === 'Other' && (
              <input value={scaleOther} onChange={function(e) { setScaleOther(e.target.value); }} placeholder="e.g. 1/20, non-scale"
                style={Object.assign({}, fieldStyle(tried && missScale), { height: 42, fontSize: 14.5, marginTop: 9 })}/>
            )}
          </>
        ) : cat === 'tcg' ? (
          <>
            <div style={{ marginTop: 22 }}><Lbl>Language / Format</Lbl></div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {['EN', 'JP', 'KR', 'FR', 'DE', 'IT', 'PT', 'ES'].map(function(l) {
                return <CategoryChip key={l} active={tcgLang === l} onClick={function() { setTcgLang(l); }}>{l}</CategoryChip>;
              })}
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
              {['Booster Box', 'Booster Pack', 'Elite Trainer Box', 'Single Card', 'Sealed Set', 'Bundle'].map(function(f) {
                return <CategoryChip key={f} active={tcgFormat === f} onClick={function() { setTcgFormat(f); }}>{f}</CategoryChip>;
              })}
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Toggle on={tcgGraded} onClick={function() { setTcgGraded(function(v) { return !v; }); }}/>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Professionally graded</span>
            </div>
            {tcgGraded && (
              <div style={{ marginTop: 11, display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <Lbl>Grader</Lbl>
                  <div style={{ display: 'flex', gap: 7 }}>
                    {['PSA', 'BGS', 'CGC', 'ACE'].map(function(g) {
                      return <CategoryChip key={g} active={tcgGrader === g} onClick={function() { setTcgGrader(g); }}>{g}</CategoryChip>;
                    })}
                  </div>
                </div>
                <div style={{ width: 90 }}>
                  <Lbl>Grade</Lbl>
                  <input value={tcgGrade} onChange={function(e) { setTcgGrade(e.target.value.replace(/[^0-9.]/g, '').slice(0, 4)); }} inputMode="decimal" placeholder="e.g. 9"
                    style={Object.assign({}, fieldStyle(false), { height: 40, fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'center' })}/>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ marginTop: 22 }}><Lbl hint="optional">Size</Lbl></div>
            <input value={size} onChange={function(e) { setSize(e.target.value); }} placeholder="e.g. 400% / 28 cm / 7 inch"
              style={Object.assign({}, fieldStyle(false), { fontSize: 14.5 })}/>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '7px 2px 0' }}>Blind boxes don't use scale — note the height or % size instead.</div>
          </>
        )}

        {/* Title */}
        <div style={{ marginTop: 22 }}><Lbl required={true} missing={tried && missTitle}>Title</Lbl></div>
        <input value={title} onChange={function(e) { setTitle(e.target.value); setCatalogueLinked(null); }} placeholder={meta.titleEg}
          style={fieldStyle(tried && missTitle)}/>
        {/* Catalogue dedup */}
        {title.trim().length >= 3 && catTitleMatches.length > 0 && !catalogueLinked && (
          <div style={{ marginTop: 7, borderRadius: 11, border: '1px solid ' + (strongMatch ? 'var(--grail-gold)' : 'var(--border-strong)'), overflow: 'hidden', background: 'var(--paper)' }}>
            <div style={{ padding: '7px 11px', background: strongMatch ? 'var(--grail-gold-soft)' : 'var(--bone)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Ico d={strongMatch ? Icons.info : Icons.search} size={12} style={{ color: strongMatch ? 'var(--grail-gold-deep)' : 'var(--ink-faint)', flexShrink: 0 }}/>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: strongMatch ? 'var(--grail-gold-deep)' : 'var(--ink-soft)' }}>
                {strongMatch ? 'Possible duplicate — is this the same item?' : 'Similar items already in catalogue'}
              </span>
            </div>
            {catTitleMatches.map(function(m, i) {
              return (
                <button key={m.sku} onMouseDown={function() { setTitle(m.title); setBrand(m.brand); setCatalogueLinked(m); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', cursor: 'pointer',
                    padding: '9px 11px', background: 'transparent', border: 'none',
                    borderBottom: i < catTitleMatches.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}><ProductPhoto tone={m.tone} ratio="1/1" rounded={7}/></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 1 }}>{m.brand} {m.scale && m.scale !== '\u2014' ? '\u00b7 ' + m.scale : ''}</div>
                  </div>
                  {catalogueLinked && catalogueLinked.sku === m.sku && <Ico d={Icons.check} size={15} style={{ color: 'var(--verified-teal)', flexShrink: 0 }}/>}
                </button>
              );
            })}
            {catalogueLinked && (
              <div style={{ padding: '7px 11px', background: 'var(--verified-teal-soft)', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Ico d={Icons.check} size={12} style={{ color: 'var(--verified-teal)', flexShrink: 0 }}/>
                <span style={{ fontSize: 11.5, color: 'var(--verified-teal)', fontWeight: 600 }}>Linked to catalogue — pre-filled from DB</span>
                <button onMouseDown={function() { setCatalogueLinked(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 0, display: 'flex', marginLeft: 'auto' }}><Ico d={Icons.close} size={14} stroke={2}/></button>
              </div>
            )}
          </div>
        )}
        {isNewToDb && (
          <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', borderRadius: 9, background: 'var(--verified-teal-soft)', border: '1px solid var(--verified-teal)' }}>
            <Ico d={Icons.sparkle} size={13} style={{ color: 'var(--verified-teal)', flexShrink: 0 }}/>
            <span style={{ fontSize: 12, color: 'var(--verified-teal)', fontWeight: 600 }}>New to Scorred DB — you will earn +50 XP as first contributor</span>
          </div>
        )}

        {/* Year */}
        <div style={{ marginTop: 18 }}><Lbl hint="optional">Release year</Lbl></div>
        <input value={year} onChange={function(e) { setYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4)); }} inputMode="numeric" placeholder="e.g. 2022"
          style={Object.assign({}, fieldStyle(false), { height: 42, fontSize: 14.5, fontFamily: 'var(--font-mono)' })}/>

        {/* Photos */}
        <div style={{ marginTop: 22 }}><Lbl required={true} missing={tried && missPhoto} hint={photos.length ? photos.length + ' added' : acq === 'intel' ? 'min 1 · up to 6' : 'first = cover'}>Photos</Lbl></div>
        {acq === 'intel' && photos.length === 0 && (
          <div style={{ display: 'flex', gap: 8, padding: '9px 12px', borderRadius: 10, background: 'var(--verified-teal-soft)', border: '1px solid var(--verified-teal)', marginBottom: 8 }}>
            <Ico d={Icons.info} size={14} style={{ color: 'var(--verified-teal)', flexShrink: 0, marginTop: 1 }}/>
            <span style={{ fontSize: 12, color: 'var(--verified-teal)', lineHeight: 1.45 }}>Add at least 1 photo — official images help verify the item in the Scorred DB.</span>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles}/>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 4 }}>
          {photos.map(function(ph, i) {
            return (
              <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'visible' }}>
                {ph.url
                  ? <img src={ph.url} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', display: 'block' }}/>
                  : <ProductPhoto tone={ph.tone} ratio="1/1" rounded={10}/>}
                {i === 0 && (
                  <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'var(--ink)', color: 'var(--paper)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 5px', borderRadius: 4 }}>Cover</span>
                )}
                <button onClick={function() { rmPhoto(i); }} aria-label="Remove" style={{
                  position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
                  background: 'var(--ink)', color: 'var(--paper)', border: '2px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Ico d={Icons.close} size={11} stroke={3}/></button>
              </div>
            );
          })}
          {photos.length < photoMax && (
            <button onClick={addPhoto} style={{ width: 72, height: 72, borderRadius: 10, border: '2px dashed ' + (tried && missPhoto ? 'var(--stamp-red)' : 'var(--border-strong)'), background: 'var(--paper-soft)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
              <Ico d={Icons.camera} size={20} style={{ color: tried && missPhoto ? 'var(--stamp-red)' : 'var(--ink-faint)' }}/>
              <span style={{ fontSize: 10, color: tried && missPhoto ? 'var(--stamp-red)' : 'var(--ink-ghost)', fontWeight: 600 }}>Add</span>
            </button>
          )}
        </div>

        {/* Description */}
        <div style={{ marginTop: 18 }}><Lbl hint="optional">Description</Lbl></div>
        <textarea value={desc} onChange={function(e) { setDesc(e.target.value); }} rows={3} placeholder="What makes this one special? Accessories, edition, where you got it..."
          style={Object.assign({}, fieldStyle(false), { height: 'auto', padding: '11px 13px', lineHeight: 1.5, resize: 'none', fontSize: 14.5 })}/>

        {/* In-hand: condition */}
        {acq === 'inhand' && (
          <div style={{ marginTop: 16 }}>
            <Lbl required={true} missing={tried && missCond}>Condition</Lbl>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {FIGURE_CONDITIONS.map(function(c) {
                var on = cond === c.id;
                return (
                  <button key={c.id} onClick={function() { setCond(c.id); }} style={{
                    display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', cursor: 'pointer',
                    padding: '11px 13px', borderRadius: 11, background: on ? 'var(--ink)' : 'var(--paper-soft)',
                    border: '1px solid ' + (on ? 'var(--ink)' : (tried && missCond ? 'var(--stamp-red)' : 'var(--border-strong)')),
                  }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: on ? 'rgba(255,255,255,0.15)' : 'var(--bone-deep)', color: on ? 'var(--paper)' : 'var(--ink-faint)' }}>
                      {on && <Ico d={Icons.check} size={11} stroke={3}/>}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: on ? 'var(--paper)' : 'var(--ink)' }}>{c.label}</div>
                      <div style={{ fontSize: 12, color: on ? 'rgba(244,239,230,0.65)' : 'var(--ink-faint)', marginTop: 2 }}>{c.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 18 }}><Lbl hint="optional / private">What you paid</Lbl></div>
            <MoneyField value={paid} onChange={setPaid} cur={paidCur} onCur={setPaidCur} placeholder="Purchase price"/>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '7px 2px 0' }}>Only you see this.</div>
          </div>
        )}

        {/* Pre-order details */}
        {acq === 'preorder' && (
          <div style={{ marginTop: 16, background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)', borderRadius: 14, padding: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13 }}>
              <Ico d={Icons.clock} size={16} style={{ color: 'var(--grail-gold-deep)' }}/>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--grail-gold-deep)' }}>Pre-order details</span>
            </div>
            <Lbl hint="how precise is the date?">Release window</Lbl>
            <Segmented value={poPrec} onChange={setPoPrec}
              options={[{ id: 'date', label: 'Date' }, { id: 'month', label: 'Month' }, { id: 'quarter', label: 'Qtr' }, { id: 'year', label: 'Year' }, { id: 'tbd', label: 'TBD' }]}/>
            <div style={{ marginTop: 11 }}>
              {poPrec === 'date' && (
                <input type="date" value={poDate} onChange={function(e) { setPoDate(e.target.value); }}
                  style={Object.assign({}, fieldStyle(false), { background: 'var(--paper)', fontFamily: 'var(--font-mono)', fontSize: 14 })}/>
              )}
              {poPrec === 'month' && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <select value={poMonth} onChange={function(e) { setPoMonth(e.target.value); }} style={poSelectStyle}>
                    <option value="">Month</option>
                    {PO_MONTHS.map(function(m, i) { return <option key={m} value={String(i)}>{m}</option>; })}
                  </select>
                  <select value={poYear} onChange={function(e) { setPoYear(e.target.value); }} style={poSelectStyle}>
                    {PO_YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
                  </select>
                </div>
              )}
              {poPrec === 'quarter' && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                    {['1', '2', '3', '4'].map(function(q) {
                      var on = poQuarter === q;
                      return (
                        <button key={q} onClick={function() { setPoQuarter(q); }} style={{
                          flex: 1, height: 46, borderRadius: 11, cursor: 'pointer',
                          border: '1px solid ' + (on ? 'var(--ink)' : 'var(--border-strong)'),
                          background: on ? 'var(--ink)' : 'var(--paper)', color: on ? 'var(--paper)' : 'var(--ink)',
                          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14 }}>Q{q}</button>
                      );
                    })}
                  </div>
                  <select value={poYear} onChange={function(e) { setPoYear(e.target.value); }} style={Object.assign({}, poSelectStyle, { flex: 'none', width: 96 })}>
                    {PO_YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
                  </select>
                </div>
              )}
              {poPrec === 'year' && (
                <select value={poYear} onChange={function(e) { setPoYear(e.target.value); }} style={poSelectStyle}>
                  {PO_YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
                </select>
              )}
              {poPrec === 'tbd' && (
                <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '11px 13px', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 11, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                  <Ico d={Icons.info} size={15} style={{ flexShrink: 0, marginTop: 1, color: 'var(--ink-faint)' }}/>
                  No date announced yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* For sale (in-hand only) */}
        {acq !== 'intel' && canSell && (
          <div style={{ marginTop: 24, borderRadius: 16, border: '1px solid ' + (forSale ? 'var(--stamp-red)' : 'var(--border)'), background: forSale ? 'var(--stamp-red-soft)' : 'var(--paper-soft)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: forSale ? 'var(--stamp-red)' : 'var(--bone-deep)', color: forSale ? 'var(--paper)' : 'var(--ink-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ico d={Icons.tag} size={20}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>List for sale</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, lineHeight: 1.4 }}>Show it in the Market — goes live instantly.</div>
              </div>
              <Toggle on={forSale} onClick={function() { setForSale(function(v) { return !v; }); }}/>
            </div>
            {forSale && (
              <div style={{ padding: '2px 15px 16px', borderTop: '1px solid var(--stamp-red)' }}>
                <div style={{ marginTop: 15 }}><Lbl required={true} missing={tried && missPrice}>Asking price</Lbl></div>
                <MoneyField value={price} onChange={setPrice} cur={priceCur} onCur={setPriceCur} bad={tried && missPrice} placeholder="Your price" big={true}/>
                <div style={{ marginTop: 16 }}><Lbl hint="optional">Condition notes</Lbl></div>
                <textarea value={condNote} onChange={function(e) { setCondNote(e.target.value); }} rows={2} placeholder="Box wear, paint, joints, what's included..."
                  style={Object.assign({}, fieldStyle(false), { height: 'auto', padding: '11px 13px', lineHeight: 1.5, resize: 'none', fontSize: 14.5, background: 'var(--paper)' })}/>
                <div style={{ marginTop: 8, padding: '0 1px' }}>
                  <ToggleRow title="Shipping included" sub="Price covers delivery" on={shipIncl} onToggle={function() { setShipIncl(function(v) { return !v; }); }}/>
                  <ToggleRow title="Returns accepted" sub="Buyer can return within a short window" on={returns} onToggle={function() { setReturns(function(v) { return !v; }); }} last={true}/>
                </div>
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
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{symOf(priceCur)} {price ? Number(price).toLocaleString('en-IN') : '\u2014'}</span>
                      {condLabel && <Tag kind="default" style={{ background: 'var(--bone)' }}>{condLabel}</Tag>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 13, fontSize: 12, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
                  <Ico d={Icons.shield} size={15} style={{ color: 'var(--verified-teal)', flexShrink: 0, marginTop: 1 }}/>
                  <span>Listing goes live now. Add clear photos so buyers know exactly what they're getting.</span>
                </div>
              </div>
            )}
          </div>
        )}
        {acq !== 'intel' && !canSell && (
          <div style={{ marginTop: 24, display: 'flex', gap: 11, alignItems: 'flex-start', padding: 15, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--paper-soft)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: 'var(--bone-deep)', color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={Icons.tag} size={20}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Selling is off for pre-orders</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 3, lineHeight: 1.45 }}>List it on the Market once it's in hand.</div>
            </div>
          </div>
        )}

      </div>
    </Screen>
  );
}

function ISOFormView() {
  var nav = useNav();
  var pop = nav.pop; var setOverlay = nav.setOverlay;
  React.useEffect(function() { pop(); setTimeout(function() { setOverlay({ name: 'compose' }); }, 50); }, []);
  return null;
}

Object.assign(window, { AddListingView, ISOFormView, MoneyField, ToggleRow, CURRENCIES, CAT_BRANDS, CAT_SCALES, FIGURE_BRANDS, FIGURE_SCALES });
