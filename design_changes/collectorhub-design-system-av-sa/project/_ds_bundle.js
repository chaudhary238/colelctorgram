/* @ds-bundle: {"format":3,"namespace":"CollectorHubDesignSystemRC_293274","components":[],"sourceHashes":{"app/AddListing.jsx":"a07f8e3b2e6f","app/AddToCollection.jsx":"5f826d9b45dd","app/App.jsx":"164213cd0be7","app/Cards.jsx":"476938ffaefd","app/Chat.jsx":"c6eb01042865","app/Chrome.jsx":"52acdc9b1367","app/CommunityDetail.jsx":"837f6ca0230d","app/CommunityManage.jsx":"af41551da507","app/CommunityView.jsx":"a55619e3653b","app/CreateCommunity.jsx":"a4668e9e43f2","app/EventCreate.jsx":"af45682ab9f5","app/EventDetail.jsx":"060a5ffa540d","app/EventManage.jsx":"22bb52df7c83","app/EventsView.jsx":"c3a8bdb57813","app/FeedView.jsx":"3cba6b0bf7aa","app/IOSFrame.jsx":"d67eb3ffe562","app/ItemDetail.jsx":"4c790215962f","app/ListingView.jsx":"4efba19ea771","app/MarketView.jsx":"9339cb43d882","app/Nav.jsx":"6050b8d904b3","app/Onboarding.jsx":"b343ddcad468","app/Overlays.jsx":"a894a3634430","app/PostDetail.jsx":"c0703c689ae1","app/ProfileCollection.jsx":"022bbd672dae","app/ProfileEdit.jsx":"822b9f00f3eb","app/ProfileSettings.jsx":"d01e5fd3f2db","app/ProfileView.jsx":"1def171f7839","app/Rewards.jsx":"0279e0ad4ec8","app/data.jsx":"1f523e4f3b43","app/shared.jsx":"2f79b56ec75f","app/tweaks-panel.jsx":"6591467622ed","web/Web.jsx":"29b43f13fe83"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CollectorHubDesignSystemRC_293274 = window.CollectorHubDesignSystemRC_293274 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// app/AddListing.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Add an item / Create a listing — category-aware (Phase 1: Action Figures)
// Reached from  +  →  Create  →  "Create a Listing".
// One flow: add the item to your shelf, optionally flip "For sale"
// to list it live in the Market. — BRD §9.4 / §8.6 / §9.5
// ─────────────────────────────────────────────────────────────

// Currencies — INR default, common collector markets after.
const CURRENCIES = [{
  code: 'INR',
  sym: '₹'
}, {
  code: 'USD',
  sym: '$'
}, {
  code: 'EUR',
  sym: '€'
}, {
  code: 'GBP',
  sym: '£'
}, {
  code: 'JPY',
  sym: '¥'
}, {
  code: 'AED',
  sym: 'د.إ'
}, {
  code: 'SGD',
  sym: 'S$'
}];
const symOf = code => (CURRENCIES.find(c => c.code === code) || CURRENCIES[0]).sym;

// Category chips for this form — app's 4 categories, figure-first ordering + display labels.
const ADD_CATEGORIES = [{
  id: 'figures',
  label: 'Action Figure'
}, {
  id: 'diecast',
  label: 'Diecast'
}, {
  id: 'kits',
  label: 'Model Kits & Lego'
}, {
  id: 'designer',
  label: 'Designer Toys & Blind Boxes'
}];

// Action-figure specifics
const FIGURE_SCALES = ['1/1', '1/2', '1/3', '1/4', '1/6', '1/10', '1/12'];

// Per-category scale options (Blind Boxes use a free-text size instead).
const CAT_SCALES = {
  figures: ['1/1', '1/2', '1/3', '1/4', '1/6', '1/10', '1/12'],
  diecast: ['1/64', '1/43', '1/24', '1/18', '1/12'],
  kits: ['1/144', '1/100', '1/72', '1/60', '1/48', '1/35', '1/24', 'Non-scale'],
  designer: null // no scale — uses size text input
};

// Per-category condition ladders.
const FIGURE_CONDITIONS = [{
  id: 'Sealed',
  label: 'Sealed',
  sub: 'Factory sealed, never opened'
}, {
  id: 'MIB',
  label: 'MIB',
  sub: 'Mint in box'
}, {
  id: 'BIB',
  label: 'BIB',
  sub: 'Box in box / outer shipper kept'
}, {
  id: 'Loose',
  label: 'Loose',
  sub: 'Out of box / displayed'
}];

// Per-category brand suggestions (type-ahead).
const CAT_BRANDS = {
  figures: ['Hot Toys', 'Sideshow', 'Bandai', 'S.H.Figuarts', 'McFarlane Toys', 'NECA', 'Mezco', 'Good Smile Company', 'Kotobukiya', 'Threezero', 'Iron Studios', 'Prime 1 Studio', 'Hasbro', 'Mattel', 'Funko', 'Medicom', 'XM Studios', 'Queen Studios', 'Storm Collectibles', 'Sentinel'],
  diecast: ['Mini GT', 'Hot Wheels', 'Tomica', 'Inno64', 'Tarmac Works', 'AUTOart', 'Kyosho', 'Maisto', 'Bburago', 'Greenlight', 'Matchbox', 'GT Spirit', 'Solido', 'Schuco', 'Norev', 'Spark'],
  kits: ['LEGO', 'Bandai', 'Tamiya', 'Revell', 'Kotobukiya', 'Hasegawa', 'Aoshima', 'Meng', 'Academy', 'Trumpeter', 'Good Smile Company'],
  designer: ['Pop Mart', 'Medicom (Bearbrick)', 'KAWS', 'Funko', 'Jellycat', 'Sonny Angel', 'Kidrobot', 'Superplastic', 'Unbox Industries', '52Toys', 'How2Work']
};
const FIGURE_BRANDS = CAT_BRANDS.figures;

// Per-category copy (header subtitle + placeholders).
const CAT_META = {
  figures: {
    label: 'Action figure',
    titleEg: 'e.g. Iron Man Mark 85 — Endgame',
    brandEg: 'Hot Toys, Bandai, Sideshow…'
  },
  diecast: {
    label: 'Diecast',
    titleEg: 'e.g. Nissan Skyline GT-R R34 — Bayside Blue',
    brandEg: 'Mini GT, Tomica, Hot Wheels…'
  },
  kits: {
    label: 'Model kit / Lego',
    titleEg: 'e.g. RG 1/144 Nu Gundam',
    brandEg: 'LEGO, Bandai, Tamiya…'
  },
  designer: {
    label: 'Designer toy / blind box',
    titleEg: 'e.g. Skullpanda — Tell Me What You Want',
    brandEg: 'Pop Mart, Bearbrick, KAWS…'
  }
};
// cover-photo placeholder tones to cycle through (no real uploads in proto)
const PHOTO_TONES = ['ink', 'red', 'teal', 'gold', 'plum', 'forest'];

// ── small shared bits ─────────────────────────────────────────
function fieldStyle(bad) {
  return {
    width: '100%',
    boxSizing: 'border-box',
    height: 46,
    padding: '0 13px',
    borderRadius: 11,
    border: `1px solid ${bad ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
    background: 'var(--paper-soft)',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    color: 'var(--ink)',
    outline: 'none'
  };
}
function Lbl({
  children,
  required,
  missing,
  hint
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 9
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, children), required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: missing ? 'var(--stamp-red)' : 'var(--ink-ghost)',
      fontSize: 13,
      fontWeight: 700
    }
  }, "*"), hint && !missing && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--ink-ghost)',
      marginLeft: 'auto'
    }
  }, hint), missing && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--stamp-red)',
      marginLeft: 'auto',
      fontWeight: 600
    }
  }, "Required"));
}

// money input with leading currency selector — default INR
function MoneyField({
  value,
  onChange,
  cur,
  onCur,
  bad,
  placeholder = '0',
  big = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'stretch',
      height: big ? 54 : 46,
      borderRadius: 12,
      border: `1px solid ${bad ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
      background: 'var(--paper-soft)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      borderRight: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      padding: '0 11px',
      fontFamily: 'var(--font-mono)',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--ink-soft)',
      pointerEvents: 'none'
    }
  }, symOf(cur), " ", cur, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.chevR,
    size: 13,
    stroke: 2.2,
    style: {
      transform: 'rotate(90deg)',
      color: 'var(--ink-faint)'
    }
  })), /*#__PURE__*/React.createElement("select", {
    value: cur,
    onChange: e => onCur(e.target.value),
    style: {
      position: 'absolute',
      inset: 0,
      opacity: 0,
      cursor: 'pointer',
      fontSize: 16
    }
  }, CURRENCIES.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.code,
    value: c.code
  }, c.sym, " ", c.code)))), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange(e.target.value.replace(/[^0-9]/g, '')),
    inputMode: "numeric",
    placeholder: placeholder,
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      background: 'transparent',
      outline: 'none',
      padding: '0 13px',
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: big ? 21 : 16,
      color: 'var(--ink)'
    }
  }));
}

// toggle row inside a card
function ToggleRow({
  title,
  sub,
  on,
  onToggle,
  last
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 0',
      borderBottom: last ? 'none' : '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, title), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      marginTop: 2,
      lineHeight: 1.4
    }
  }, sub)), /*#__PURE__*/React.createElement(Toggle, {
    on: on,
    onClick: onToggle
  }));
}

// ── Main screen ───────────────────────────────────────────────
function AddListingView({
  route
}) {
  const {
    pop,
    push,
    flashToast
  } = useNav();
  const {
    addListing
  } = useAppState();
  const [cat, setCat] = React.useState('figures');

  // core
  const [photos, setPhotos] = React.useState([]); // each entry: { url: dataURL, tone: string }
  const fileInputRef = React.useRef();
  const [title, setTitle] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [brandFocus, setBrandFocus] = React.useState(false);
  const [scale, setScale] = React.useState('');
  const [scaleOther, setScaleOther] = React.useState('');
  const [size, setSize] = React.useState(''); // blind boxes — free text size
  const [year, setYear] = React.useState('');
  const [desc, setDesc] = React.useState('');

  // acquisition
  const [acq, setAcq] = React.useState('inhand'); // inhand | preorder
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
  const scales = CAT_SCALES[cat]; // null for designer
  const usesScale = !!scales;
  const meta = CAT_META[cat] || CAT_META.figures;

  // switching category resets the scale/size picks (options differ)
  const changeCat = id => {
    setCat(id);
    setScale('');
    setScaleOther('');
    setSize('');
  };

  // switching to pre-order disables the for-sale path
  const changeAcq = mode => {
    setAcq(mode);
    if (mode === 'preorder') setForSale(false);
  };

  // validation
  const missPhoto = photos.length === 0;
  const missTitle = !title.trim();
  const missBrand = !brand.trim();
  const missScale = usesScale && (scale === 'Other' ? !scaleOther.trim() : !scale);
  const missCond = acq === 'inhand' && !cond;
  const canSell = acq === 'inhand'; // pre-orders can't be listed for sale
  const missPrice = canSell && forSale && !price.trim();
  const invalid = missPhoto || missTitle || missBrand || missScale || missCond || missPrice;
  const condLabel = cond || (acq === 'preorder' ? 'Pre-order' : '');
  const addPhoto = () => {
    if (photos.length >= 8) return;
    fileInputRef.current && fileInputRef.current.click();
  };
  const rmPhoto = i => setPhotos(p => p.filter((_, idx) => idx !== i));
  const handleFiles = e => {
    const files = Array.from(e.target.files || []);
    files.slice(0, 8 - photos.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setPhotos(p => p.length < 8 ? [...p, {
        url: ev.target.result,
        tone: PHOTO_TONES[p.length % PHOTO_TONES.length]
      }] : p);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  const submit = () => {
    if (invalid) {
      setTried(true);
      flashToast('Fill the required fields marked *');
      return;
    }
    if (forSale) {
      addListing({
        id: 'u' + Date.now(),
        title: title.trim(),
        brand: brand.trim(),
        cat,
        tone: photos[0] || 'ink',
        photos: photos.slice(),
        photoCount: photos.length,
        scale: usesScale ? scale === 'Other' ? scaleOther.trim() : scale : size.trim(),
        year: year.trim(),
        desc: desc.trim(),
        price: Number(price) || 0,
        sym: symOf(priceCur),
        currency: priceCur,
        condition: condLabel,
        condNote: condNote.trim(),
        acq,
        poDate,
        poSeller: poSeller.trim(),
        trade,
        shipIncl,
        returns,
        status: 'available',
        verify: 'claimed',
        seller: 'you',
        mine: true
      });
      pop();
      flashToast('Listed in the Market — buyers can find it now');
    } else {
      pop();
      flashToast(acq === 'preorder' ? 'Pre-order saved to your collection' : 'Added to your collection');
    }
  };
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Add an item",
      subtitle: meta.label
    }),
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--paper)',
        padding: '11px 16px 30px'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: forSale ? 'primary' : 'dark',
      size: "block",
      onClick: submit,
      style: invalid ? {
        opacity: 0.5
      } : null,
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: forSale ? Icons.tag : Icons.plusCircle,
        size: 18
      })
    }, forSale ? 'List in the Market' : 'Add to my collection'))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 22px'
    }
  }, /*#__PURE__*/React.createElement(Lbl, null, "Category"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      flexWrap: 'wrap'
    }
  }, ADD_CATEGORIES.map(c => {
    const active = cat === c.id;
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => changeCat(c.id),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 13px',
        borderRadius: 999,
        background: active ? 'var(--ink)' : 'var(--paper-soft)',
        color: active ? 'var(--paper)' : 'var(--ink)',
        border: `1px solid ${active ? 'var(--ink)' : 'var(--border-strong)'}`,
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        fontSize: 13,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        lineHeight: 1
      }
    }, c.label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      margin: '9px 2px 0',
      lineHeight: 1.5
    }
  }, "The form adapts to the category \u2014 scale, brands and condition are tuned for ", meta.label.toLowerCase(), "s."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(Lbl, {
    required: true,
    missing: tried && missPhoto,
    hint: photos.length ? `${photos.length} added` : 'first = cover'
  }, "Photos")), /*#__PURE__*/React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: "image/*",
    multiple: true,
    style: {
      display: 'none'
    },
    onChange: handleFiles
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      overflowX: 'auto',
      paddingBottom: 2
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: addPhoto,
    style: {
      width: 88,
      height: 88,
      flexShrink: 0,
      borderRadius: 13,
      cursor: 'pointer',
      border: `1px dashed ${tried && missPhoto ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
      background: 'var(--paper-soft)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      color: 'var(--ink-mute)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.camera,
    size: 22
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600
    }
  }, "Add photo")), photos.map((photo, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      position: 'relative',
      width: 88,
      height: 88,
      flexShrink: 0,
      borderRadius: 13,
      overflow: 'visible'
    }
  }, photo.url ? /*#__PURE__*/React.createElement("img", {
    src: photo.url,
    style: {
      width: 88,
      height: 88,
      objectFit: 'cover',
      borderRadius: 13,
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: photo.tone || photo,
    ratio: "1/1",
    rounded: 13
  }), i === 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: 6,
      left: 6,
      background: 'var(--ink)',
      color: 'var(--paper)',
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: 9,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '3px 5px',
      borderRadius: 4
    }
  }, "Cover"), /*#__PURE__*/React.createElement("button", {
    onClick: () => rmPhoto(i),
    "aria-label": "Remove",
    style: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: '50%',
      cursor: 'pointer',
      background: 'var(--ink)',
      color: 'var(--paper)',
      border: '2px solid var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.close,
    size: 11,
    stroke: 3
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(Lbl, {
    required: true,
    missing: tried && missTitle
  }, "Title")), /*#__PURE__*/React.createElement("input", {
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: meta.titleEg,
    style: fieldStyle(tried && missTitle)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(Lbl, {
    required: true,
    missing: tried && missBrand
  }, "Brand")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: brand,
    onChange: e => {
      setBrand(e.target.value);
      setBrandFocus(true);
    },
    onFocus: () => setBrandFocus(true),
    onBlur: () => setTimeout(() => setBrandFocus(false), 120),
    placeholder: `Start typing — ${meta.brandEg}`,
    style: fieldStyle(tried && missBrand)
  }), brandFocus && (brandMatches.length > 0 || brand.trim() && !exactBrand) && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'calc(100% + 6px)',
      left: 0,
      right: 0,
      zIndex: 20,
      background: 'var(--paper)',
      border: '1px solid var(--border-strong)',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-3)'
    }
  }, brand.trim() && !exactBrand && /*#__PURE__*/React.createElement("button", {
    onMouseDown: e => {
      e.preventDefault();
      setBrand(brand.trim());
      setBrandFocus(false);
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      padding: '11px 13px',
      background: 'transparent',
      border: 'none',
      borderBottom: brandMatches.length ? '1px solid var(--border)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.plus,
    size: 15,
    stroke: 2.4,
    style: {
      color: 'var(--stamp-red)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--ink)'
    }
  }, "Use \u201C", /*#__PURE__*/React.createElement("b", null, brand.trim()), "\u201D")), brandMatches.map((b, i) => /*#__PURE__*/React.createElement("button", {
    key: b,
    onMouseDown: e => {
      e.preventDefault();
      setBrand(b);
      setBrandFocus(false);
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      padding: '11px 13px',
      background: brand.trim().toLowerCase() === b.toLowerCase() ? 'var(--bone)' : 'transparent',
      border: 'none',
      borderBottom: i < brandMatches.length - 1 ? '1px solid var(--border)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.tag,
    size: 14,
    style: {
      color: 'var(--ink-faint)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--ink)'
    }
  }, b))))), !brandFocus && !brand && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      margin: '8px 2px 0'
    }
  }, "We suggest brands as you type \u2014 pick one to keep the catalogue clean."), usesScale ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(Lbl, {
    required: true,
    missing: tried && missScale
  }, "Scale")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      flexWrap: 'wrap'
    }
  }, scales.map(s => /*#__PURE__*/React.createElement(CategoryChip, {
    key: s,
    active: scale === s,
    onClick: () => setScale(s)
  }, s)), /*#__PURE__*/React.createElement(CategoryChip, {
    active: scale === 'Other',
    onClick: () => setScale('Other')
  }, "+ Other")), scale === 'Other' && /*#__PURE__*/React.createElement("input", {
    value: scaleOther,
    onChange: e => setScaleOther(e.target.value),
    placeholder: "e.g. 1/20, non-scale",
    style: {
      ...fieldStyle(tried && missScale),
      height: 42,
      fontSize: 14.5,
      marginTop: 9
    }
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(Lbl, {
    hint: "optional"
  }, "Size")), /*#__PURE__*/React.createElement("input", {
    value: size,
    onChange: e => setSize(e.target.value),
    placeholder: "e.g. 400% \xB7 28 cm \xB7 7 inch",
    style: {
      ...fieldStyle(false),
      fontSize: 14.5
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      margin: '7px 2px 0'
    }
  }, "Blind boxes don\u2019t use scale \u2014 note the height or % size instead.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Lbl, {
    hint: "optional"
  }, "Release year")), /*#__PURE__*/React.createElement("input", {
    value: year,
    onChange: e => setYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4)),
    inputMode: "numeric",
    placeholder: "e.g. 2022",
    style: {
      ...fieldStyle(false),
      height: 42,
      fontSize: 14.5,
      fontFamily: 'var(--font-mono)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Lbl, {
    hint: "optional"
  }, "Description")), /*#__PURE__*/React.createElement("textarea", {
    value: desc,
    onChange: e => setDesc(e.target.value),
    rows: 3,
    placeholder: "What makes this one special? Accessories, edition, where you got it\u2026",
    style: {
      ...fieldStyle(false),
      height: 'auto',
      padding: '11px 13px',
      lineHeight: 1.5,
      resize: 'none',
      fontSize: 14.5
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "How did you get it?")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 9
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    value: acq,
    onChange: changeAcq,
    options: [{
      id: 'inhand',
      label: 'In hand'
    }, {
      id: 'preorder',
      label: 'Pre-order'
    }]
  })), acq === 'inhand' ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Lbl, {
    required: true,
    missing: tried && missCond
  }, "Condition"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 7
    }
  }, FIGURE_CONDITIONS.map(c => {
    const on = cond === c.id;
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => setCond(c.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        padding: '11px 13px',
        borderRadius: 11,
        background: on ? 'var(--ink)' : 'var(--paper-soft)',
        border: `1px solid ${on ? 'var(--ink)' : tried && missCond ? 'var(--stamp-red)' : 'var(--border-strong)'}`
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 18,
        height: 18,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `2px solid ${on ? 'var(--paper)' : 'var(--border-strong)'}`,
        background: on ? 'var(--paper)' : 'transparent'
      }
    }, on && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'var(--ink)'
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: on ? 'var(--paper)' : 'var(--ink)'
      }
    }, c.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: on ? 'rgba(244,239,230,0.7)' : 'var(--ink-faint)',
        marginTop: 1
      }
    }, c.sub)));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Lbl, {
    hint: "optional \xB7 private"
  }, "What you paid")), /*#__PURE__*/React.createElement(MoneyField, {
    value: paid,
    onChange: setPaid,
    cur: paidCur,
    onCur: setPaidCur,
    placeholder: "Purchase price"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      margin: '7px 2px 0'
    }
  }, "Only you see this \u2014 it helps track your collection\u2019s value.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      background: 'var(--grail-gold-soft)',
      border: '1px solid var(--grail-gold)',
      borderRadius: 14,
      padding: 15
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 13
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.clock,
    size: 16,
    style: {
      color: 'var(--grail-gold-deep)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--grail-gold-deep)'
    }
  }, "Pre-order details")), /*#__PURE__*/React.createElement(Lbl, {
    hint: "optional"
  }, "Release / launch date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: poDate,
    onChange: e => setPoDate(e.target.value),
    style: {
      ...fieldStyle(false),
      background: 'var(--paper)',
      fontFamily: 'var(--font-mono)',
      fontSize: 14
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Lbl, {
    hint: "optional"
  }, "Ordered from (seller)")), /*#__PURE__*/React.createElement("input", {
    value: poSeller,
    onChange: e => setPoSeller(e.target.value),
    placeholder: "Store, distributor or seller name",
    style: {
      ...fieldStyle(false),
      background: 'var(--paper)',
      fontSize: 14.5
    }
  })), canSell ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      borderRadius: 16,
      border: `1px solid ${forSale ? 'var(--stamp-red)' : 'var(--border)'}`,
      background: forSale ? 'var(--stamp-red-soft)' : 'var(--paper-soft)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 15
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 11,
      flexShrink: 0,
      background: forSale ? 'var(--stamp-red)' : 'var(--bone-deep)',
      color: forSale ? 'var(--paper)' : 'var(--ink-mute)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.tag,
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, "List for sale"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      marginTop: 2,
      lineHeight: 1.4
    }
  }, "Show it in the Market \u2014 goes live instantly.")), /*#__PURE__*/React.createElement(Toggle, {
    on: forSale,
    onClick: () => setForSale(v => !v)
  })), forSale && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '2px 15px 16px',
      borderTop: '1px solid var(--stamp-red)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 15
    }
  }, /*#__PURE__*/React.createElement(Lbl, {
    required: true,
    missing: tried && missPrice
  }, "Asking price")), /*#__PURE__*/React.createElement(MoneyField, {
    value: price,
    onChange: setPrice,
    cur: priceCur,
    onCur: setPriceCur,
    bad: tried && missPrice,
    placeholder: "Your price",
    big: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Lbl, {
    hint: "optional"
  }, "Condition notes")), /*#__PURE__*/React.createElement("textarea", {
    value: condNote,
    onChange: e => setCondNote(e.target.value),
    rows: 2,
    placeholder: "Box wear, paint, joints, what\u2019s included\u2026",
    style: {
      ...fieldStyle(false),
      height: 'auto',
      padding: '11px 13px',
      lineHeight: 1.5,
      resize: 'none',
      fontSize: 14.5,
      background: 'var(--paper)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      padding: '0 1px'
    }
  }, /*#__PURE__*/React.createElement(ToggleRow, {
    title: "Shipping included",
    sub: "Price covers delivery \u2014 no extra at checkout",
    on: shipIncl,
    onToggle: () => setShipIncl(v => !v)
  }), /*#__PURE__*/React.createElement(ToggleRow, {
    title: "Returns accepted",
    sub: "Buyer can return within a short window",
    on: returns,
    onToggle: () => setReturns(v => !v)
  }), /*#__PURE__*/React.createElement(ToggleRow, {
    title: "Open to trades",
    sub: "Buyers can propose an item swap",
    on: trade,
    onToggle: () => setTrade(v => !v),
    last: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Market preview")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 11,
      alignItems: 'center',
      marginTop: 10,
      padding: 10,
      borderRadius: 13,
      background: 'var(--paper)',
      border: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 9,
      overflow: 'hidden',
      flexShrink: 0
    }
  }, photos[0] && photos[0].url ? /*#__PURE__*/React.createElement("img", {
    src: photos[0].url,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: photos[0] && photos[0].tone || 'ink',
    ratio: "1/1",
    rounded: 9
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      lineHeight: 1.25,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title.trim() || 'Your item title'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginTop: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 15,
      color: 'var(--ink)'
    }
  }, symOf(priceCur), " ", price ? Number(price).toLocaleString('en-IN') : '—'), condLabel && /*#__PURE__*/React.createElement(Tag, {
    kind: "default",
    style: {
      background: 'var(--bone)'
    }
  }, condLabel))), trade && /*#__PURE__*/React.createElement(Stamp, {
    color: "var(--ink)",
    rotate: -3,
    style: {
      fontSize: 9
    }
  }, "Trade OK")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'flex-start',
      marginTop: 13,
      fontSize: 12,
      color: 'var(--ink-mute)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 15,
    style: {
      color: 'var(--verified-teal)',
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("span", null, "Listing goes live now. Add a ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--verified-teal)'
    }
  }, "verified in-app photo"), " later to earn the Verified badge and rank higher in search.")))) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: 'flex',
      gap: 11,
      alignItems: 'flex-start',
      padding: 15,
      borderRadius: 16,
      border: '1px solid var(--border)',
      background: 'var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 11,
      flexShrink: 0,
      background: 'var(--bone-deep)',
      color: 'var(--ink-faint)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.tag,
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, "Selling is off for pre-orders"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      marginTop: 3,
      lineHeight: 1.45
    }
  }, "List it on the Market once it\u2019s in hand and you can add a verified photo. For now it\u2019s saved to your collection as a pre-order.")))));
}

// ISOFormView now redirects to compose overlay
function ISOFormView() {
  const {
    pop,
    setOverlay
  } = useNav();
  React.useEffect(() => {
    pop();
    setTimeout(() => setOverlay({
      name: 'compose'
    }), 50);
  }, []);
  return null;
}
Object.assign(window, {
  AddListingView,
  ISOFormView,
  MoneyField,
  ToggleRow,
  CURRENCIES,
  CAT_BRANDS,
  CAT_SCALES,
  FIGURE_BRANDS,
  FIGURE_SCALES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/AddListing.jsx", error: String((e && e.message) || e) }); }

// app/AddToCollection.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Add to collection (catalogue search / scan) — BRD §9.4
// + Sell / Trade (create listing from item) — BRD §8.6 / §9.5
// ─────────────────────────────────────────────────────────────

// Defined brand list for the add form (+ 'Others') — BRD v1.2 §9.4
const BRAND_OPTIONS = ['Hot Toys', 'Bandai', 'LEGO', 'Pop Mart', 'Sideshow', 'Tomica', 'Mini GT', 'McFarlane'];
function AddItemView({
  route
}) {
  const {
    flashToast
  } = useNav();
  const [q, setQ] = React.useState('');
  const [picked, setPicked] = React.useState(route.sku ? catOf(route.sku) : null);
  const results = q.trim() ? CATALOGUE.filter(c => (c.title + c.brand + c.sku).toLowerCase().includes(q.toLowerCase())) : CATALOGUE.slice(0, 5);
  if (picked) return /*#__PURE__*/React.createElement(PickedForm, {
    key: picked.sku,
    picked: picked
  });
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Add to collection"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      height: 44,
      padding: '0 14px',
      borderRadius: 12,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.search,
    size: 18,
    style: {
      color: 'var(--ink-faint)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Search catalogue by name or SKU\u2026",
    style: {
      flex: 1,
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontFamily: 'var(--font-body)',
      fontSize: 14.5,
      color: 'var(--ink)'
    }
  })), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.scan,
      size: 20
    }),
    onClick: () => flashToast('Point camera at a barcode to auto-fill')
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      margin: '12px 2px 8px'
    }
  }, q.trim() ? `${results.length} catalogue matches` : 'Popular in your interests'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, results.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.sku,
    onClick: () => setPicked(c),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 8,
      overflow: 'hidden',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: c.tone,
    ratio: "1/1",
    rounded: 8
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      lineHeight: 1.25
    }
  }, c.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-mono)',
      marginTop: 2
    }
  }, c.sku, " \xB7 ", c.brand)), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.plusCircle,
    size: 22,
    style: {
      color: 'var(--stamp-red)'
    }
  })))), /*#__PURE__*/React.createElement("button", {
    onClick: () => flashToast('Free-text item submitted to grow the catalogue'),
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: '100%',
      height: 46,
      marginTop: 14,
      borderRadius: 12,
      border: '1px dashed var(--border-strong)',
      background: 'transparent',
      color: 'var(--ink-mute)',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 14
    }
  }, "Can\u2019t find it? Add free-text item")));
}

// Mandatory-field add form (BRD v1.2 §9.4) — Title*, Brand*, Scale*, ≥1 image*
function PickedForm({
  picked
}) {
  const {
    pop,
    flashToast
  } = useNav();
  const [title, setTitle] = React.useState(picked.title);
  const [cat, setCat] = React.useState(picked.cat);
  const [brand, setBrand] = React.useState(BRAND_OPTIONS.includes(picked.brand) ? picked.brand : 'Others');
  const [brandOther, setBrandOther] = React.useState(BRAND_OPTIONS.includes(picked.brand) ? '' : picked.brand);
  const [scale, setScale] = React.useState(SCALES.includes(picked.scale) ? picked.scale : 'Others');
  const [scaleOther, setScaleOther] = React.useState(SCALES.includes(picked.scale) ? '' : picked.scale === '—' ? '' : picked.scale);
  const [desc, setDesc] = React.useState('');
  const [est, setEst] = React.useState(String(picked.est));
  const [hasImage, setHasImage] = React.useState(false);
  const [status, setStatus] = React.useState('owned');
  const [tried, setTried] = React.useState(false);
  const missTitle = !title.trim();
  const missBrand = brand === 'Others' && !brandOther.trim();
  const missScale = scale === 'Others' && !scaleOther.trim();
  const missImage = !hasImage;
  const invalid = missTitle || missBrand || missScale || missImage;
  const submit = () => {
    if (invalid) {
      setTried(true);
      flashToast('Fill the required fields marked *');
      return;
    }
    pop();
    flashToast(`Added to your ${status} · ${status === 'owned' ? 'verify it to list' : 'saved'}`);
  };
  const Req = ({
    children,
    missing
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 9
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, children), /*#__PURE__*/React.createElement("span", {
    style: {
      color: missing && tried ? 'var(--stamp-red)' : 'var(--ink-ghost)',
      fontSize: 13,
      fontWeight: 700
    }
  }, "*"), missing && tried && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--stamp-red)',
      marginLeft: 'auto'
    }
  }, "Required"));
  const fieldBorder = bad => `1px solid ${bad && tried ? 'var(--stamp-red)' : 'var(--border-strong)'}`;
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Add to collection"
    }),
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--paper)',
        padding: '12px 16px 30px'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "block",
      onClick: submit,
      style: invalid ? {
        opacity: 0.55
      } : null
    }, "Add to ", statusLabel(status)))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: picked.tone,
    ratio: "3/2",
    label: picked.sku
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      margin: '12px 2px 4px'
    }
  }, "Catalogue pre-fills what it can. Fields marked ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--stamp-red)'
    }
  }, "*"), " are required."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Req, {
    missing: missTitle
  }, "Title")), /*#__PURE__*/React.createElement("input", {
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: "Item title",
    style: {
      width: '100%',
      boxSizing: 'border-box',
      height: 46,
      padding: '0 13px',
      borderRadius: 11,
      border: fieldBorder(missTitle),
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--ink)',
      outline: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Category")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      flexWrap: 'wrap',
      marginTop: 9
    }
  }, CATEGORIES.map(c => /*#__PURE__*/React.createElement(CategoryChip, {
    key: c.id,
    active: cat === c.id,
    onClick: () => setCat(c.id)
  }, c.short))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Req, {
    missing: missBrand
  }, "Brand")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      flexWrap: 'wrap'
    }
  }, BRAND_OPTIONS.map(b => /*#__PURE__*/React.createElement(CategoryChip, {
    key: b,
    active: brand === b,
    onClick: () => setBrand(b)
  }, b)), /*#__PURE__*/React.createElement(CategoryChip, {
    active: brand === 'Others',
    onClick: () => setBrand('Others')
  }, "+ Others")), brand === 'Others' && /*#__PURE__*/React.createElement("input", {
    value: brandOther,
    onChange: e => setBrandOther(e.target.value),
    placeholder: "Type the brand name",
    style: {
      width: '100%',
      boxSizing: 'border-box',
      height: 42,
      padding: '0 13px',
      borderRadius: 11,
      border: fieldBorder(missBrand),
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: 14.5,
      color: 'var(--ink)',
      outline: 'none',
      marginTop: 9
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Req, {
    missing: missScale
  }, "Scale")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      flexWrap: 'wrap'
    }
  }, SCALES.map(s => /*#__PURE__*/React.createElement(CategoryChip, {
    key: s,
    active: scale === s,
    onClick: () => setScale(s)
  }, s)), /*#__PURE__*/React.createElement(CategoryChip, {
    active: scale === 'Others',
    onClick: () => setScale('Others')
  }, "+ Others")), scale === 'Others' && /*#__PURE__*/React.createElement("input", {
    value: scaleOther,
    onChange: e => setScaleOther(e.target.value),
    placeholder: "e.g. 1/18, N/A",
    style: {
      width: '100%',
      boxSizing: 'border-box',
      height: 42,
      padding: '0 13px',
      borderRadius: 11,
      border: fieldBorder(missScale),
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: 14.5,
      color: 'var(--ink)',
      outline: 'none',
      marginTop: 9
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Description / Fun fact")), /*#__PURE__*/React.createElement("textarea", {
    value: desc,
    onChange: e => setDesc(e.target.value),
    rows: 3,
    placeholder: "Optional \u2014 what makes this one special?",
    style: {
      width: '100%',
      boxSizing: 'border-box',
      padding: '11px 13px',
      borderRadius: 11,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: 14.5,
      lineHeight: 1.5,
      color: 'var(--ink)',
      outline: 'none',
      resize: 'none',
      marginTop: 9
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Estimated value (INR)")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 46,
      padding: '0 13px',
      borderRadius: 11,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      marginTop: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 17,
      color: 'var(--ink-faint)'
    }
  }, "\u20B9"), /*#__PURE__*/React.createElement("input", {
    value: est,
    onChange: e => setEst(e.target.value.replace(/[^0-9]/g, '')),
    inputMode: "numeric",
    style: {
      flex: 1,
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 16,
      color: 'var(--ink)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Req, {
    missing: missImage
  }, "Photo")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setHasImage(true);
      flashToast('In-app camera capture — proves you own it (no gallery upload)');
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      background: hasImage ? 'var(--verified-teal-soft)' : 'var(--paper-soft)',
      border: hasImage ? '1px solid var(--verified-teal)' : `1px dashed ${missImage && tried ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
      borderRadius: 13,
      padding: 13
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 10,
      background: 'var(--verified-teal)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: hasImage ? Icons.check : Icons.camera,
    size: 19,
    stroke: hasImage ? 2.6 : 1.75
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600
    }
  }, hasImage ? 'Photo captured' : 'Capture a photo'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, hasImage ? 'Upgrades to Shown / Verified ownership' : 'In-app camera only · at least one required'))), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '20px 0 9px'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Status")), /*#__PURE__*/React.createElement(Segmented, {
    value: status,
    onChange: setStatus,
    options: [{
      id: 'owned',
      label: 'Owned'
    }, {
      id: 'wishlist',
      label: 'Wishlist'
    }, {
      id: 'preorder',
      label: 'Pre-order'
    }]
  }), status === 'preorder' && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 13,
      padding: 14,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Order date",
    value: "Today"
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Expected ship",
    value: "Set a date",
    placeholder: true
  }))));
}

// Sell / Trade — create a listing from an owned, verified item
function SellView({
  route
}) {
  const {
    pop,
    flashToast
  } = useNav();
  const c = catOf(route.sku);
  const item = MY_ITEMS.find(i => i.sku === route.sku);
  const [price, setPrice] = React.useState(String(Math.round((item ? item.value : c.est) * 0.88)));
  const [trade, setTrade] = React.useState(true);
  const [cond, setCond] = React.useState('MISB');
  const verified = item && item.verify === 'verified';
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Sell / Trade"
    }),
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--paper)',
        padding: '12px 16px 30px'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "block",
      disabled: !verified,
      onClick: () => {
        pop();
        flashToast('Listing published to the marketplace');
      }
    }, verified ? 'Publish listing' : 'Verify ownership to publish'))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 10,
      overflow: 'hidden',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: c.tone,
    ratio: "1/1",
    rounded: 10
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      lineHeight: 1.25
    }
  }, c.title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(VerifyBadge, {
    tier: item ? item.verify : 'claimed'
  })))), !verified && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--stamp-red-soft)',
      border: '1px solid var(--stamp-red)',
      borderRadius: 12,
      padding: '11px 13px',
      marginBottom: 18,
      display: 'flex',
      gap: 9,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 17,
    style: {
      color: 'var(--stamp-red-deep)',
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-soft)',
      lineHeight: 1.45
    }
  }, "This item is ", /*#__PURE__*/React.createElement("b", null, item ? item.verify : 'claimed'), ". Listings must be ", /*#__PURE__*/React.createElement("b", null, "Verified"), " \u2014 capture an in-app photo + challenge shot first.")), /*#__PURE__*/React.createElement(SectionLabel, null, "Price"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 52,
      padding: '0 14px',
      borderRadius: 12,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      margin: '10px 0 18px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 22,
      color: 'var(--ink-faint)'
    }
  }, "\u20B9"), /*#__PURE__*/React.createElement("input", {
    value: price,
    onChange: e => setPrice(e.target.value.replace(/[^0-9]/g, '')),
    inputMode: "numeric",
    style: {
      flex: 1,
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 22,
      color: 'var(--ink)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, "MRP ~\u20B9", c.est.toLocaleString('en-IN'))), /*#__PURE__*/React.createElement(SectionLabel, null, "Condition"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      flexWrap: 'wrap',
      margin: '10px 0 18px'
    }
  }, ['MISB', 'BNIB', 'Opened · mint', 'Displayed', 'Loose'].map(x => /*#__PURE__*/React.createElement(CategoryChip, {
    key: x,
    active: cond === x,
    onClick: () => setCond(x)
  }, x))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 13
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, "Open to trades"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, "Buyers can propose an item swap")), /*#__PURE__*/React.createElement(Toggle, {
    on: trade,
    onClick: () => setTrade(v => !v)
  }))));
}
function Field({
  label,
  value,
  placeholder
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-faint)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: placeholder ? 'var(--ink-ghost)' : 'var(--ink)'
    }
  }, value));
}
function Toggle({
  on,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      width: 46,
      height: 28,
      borderRadius: 999,
      border: 'none',
      cursor: 'pointer',
      position: 'relative',
      background: on ? 'var(--forest)' : 'var(--bone-deep)',
      transition: 'background 160ms'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: on ? 21 : 3,
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: 'var(--paper)',
      transition: 'left 160ms',
      boxShadow: 'var(--shadow-1)'
    }
  }));
}
Object.assign(window, {
  AddItemView,
  PickedForm,
  SellView,
  Field,
  Toggle
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/AddToCollection.jsx", error: String((e && e.message) || e) }); }

// app/App.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// CollectorHub — App shell + router
// ─────────────────────────────────────────────────────────────

const ROUTES = {
  feed: r => /*#__PURE__*/React.createElement(FeedView, null),
  market: r => /*#__PURE__*/React.createElement(MarketView, null),
  community: r => /*#__PURE__*/React.createElement(CommunityView, null),
  events: r => /*#__PURE__*/React.createElement(EventsView, null),
  profile: r => /*#__PURE__*/React.createElement(ProfileView, {
    route: r
  }),
  follows: r => /*#__PURE__*/React.createElement(FollowList, {
    route: r
  }),
  vouches: r => /*#__PURE__*/React.createElement(VouchList, {
    route: r
  }),
  vouch: r => /*#__PURE__*/React.createElement(VouchView, {
    route: r
  }),
  rewards: r => /*#__PURE__*/React.createElement(RewardsView, {
    route: r
  }),
  leaderboard: r => /*#__PURE__*/React.createElement(LeaderboardView, {
    route: r
  }),
  badges: r => /*#__PURE__*/React.createElement(BadgesView, {
    route: r
  }),
  listing: r => /*#__PURE__*/React.createElement(ListingView, {
    route: r
  }),
  post: r => /*#__PURE__*/React.createElement(PostDetail, {
    route: r
  }),
  item: r => /*#__PURE__*/React.createElement(ItemDetail, {
    route: r
  }),
  'add-item': r => /*#__PURE__*/React.createElement(AddItemView, {
    route: r
  }),
  'add-listing': r => /*#__PURE__*/React.createElement(AddListingView, {
    route: r
  }),
  'add-iso': r => /*#__PURE__*/React.createElement(ISOFormView, null),
  'edit-profile': r => /*#__PURE__*/React.createElement(EditProfileView, null),
  'edit-avatar': r => /*#__PURE__*/React.createElement(EditAvatarView, null),
  sell: r => /*#__PURE__*/React.createElement(SellView, {
    route: r
  }),
  settings: r => {
    const S = window.SettingsView;
    return S ? /*#__PURE__*/React.createElement(S, null) : null;
  },
  'vouch-request': r => /*#__PURE__*/React.createElement(VouchRequestView, null),
  'blocked-users': r => {
    const B = window.BlockedUsersView;
    return B ? /*#__PURE__*/React.createElement(B, null) : null;
  },
  'community-detail': r => /*#__PURE__*/React.createElement(CommunityDetail, {
    route: r
  }),
  'community-manage': r => /*#__PURE__*/React.createElement(CommunityManageView, {
    route: r
  }),
  'create-community': r => /*#__PURE__*/React.createElement(CreateCommunityView, {
    route: r
  }),
  event: r => /*#__PURE__*/React.createElement(EventDetail, {
    route: r
  }),
  'create-event': r => /*#__PURE__*/React.createElement(EventCreateView, {
    route: r
  }),
  'event-manage': r => /*#__PURE__*/React.createElement(EventManageView, {
    route: r
  }),
  inbox: r => /*#__PURE__*/React.createElement(InboxView, null),
  chat: r => /*#__PURE__*/React.createElement(ChatView, {
    route: r
  })
};
function Router() {
  const {
    tab,
    stacks,
    overlay
  } = useNav();
  const stack = stacks[tab];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden'
    }
  }, stack.map((route, i) => /*#__PURE__*/React.createElement("div", {
    key: tab + '-' + i + '-' + route.name,
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: i,
      visibility: i === stack.length - 1 ? 'visible' : 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StackedScreen, {
    depth: i
  }, (ROUTES[route.name] || ROUTES.feed)(route)))), overlay && overlay.name === 'compose' && /*#__PURE__*/React.createElement(ComposeOverlay, {
    community: overlay.community
  }), overlay && overlay.name === 'search' && /*#__PURE__*/React.createElement(SearchOverlay, null), overlay && overlay.name === 'notifications' && /*#__PURE__*/React.createElement(NotificationsOverlay, null), overlay && overlay.name === 'share' && /*#__PURE__*/React.createElement(ShareSheet, {
    label: overlay.label
  }), /*#__PURE__*/React.createElement(Toast, null));
}
function App() {
  return /*#__PURE__*/React.createElement(AppStateProvider, null, /*#__PURE__*/React.createElement(NavProvider, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      height: '100%',
      background: 'var(--paper)'
    }
  }, /*#__PURE__*/React.createElement(Router, null))));
}
function Root() {
  const [entered, setEntered] = React.useState(false);
  const enter = () => setEntered(true);
  // expose a reset so the Profile gear can replay onboarding
  window.chReset = () => setEntered(false);
  return entered ? /*#__PURE__*/React.createElement(App, null) : /*#__PURE__*/React.createElement(OnboardingFlow, {
    onEnter: enter
  });
}
ReactDOM.createRoot(document.getElementById('phone-mount')).render(/*#__PURE__*/React.createElement(IOSDevice, null, /*#__PURE__*/React.createElement(Root, null)));
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/App.jsx", error: String((e && e.message) || e) }); }

// app/Cards.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// CollectorHub — card components (feed, marketplace, lists)
// ─────────────────────────────────────────────────────────────

// Small author line: avatar + name + handle + trust tier + time (+ in-feed follow)
function AuthorLine({
  handle,
  time,
  community,
  onOpen,
  showFollow
}) {
  const u = userOf(handle);
  const c = community ? COMMUNITIES.find(x => x.id === community) : null;
  const {
    followed,
    toggleFollow
  } = useAppState();
  const {
    flashToast
  } = useNav();
  const isMe = handle === 'you';
  const following = followed[handle];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onOpen,
    style: {
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: u.name,
    color: u.color,
    size: 38,
    verified: u.tier === 'Top Seller' || u.tier === 'Trusted'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'nowrap',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 14,
      color: 'var(--ink)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      flexShrink: 1,
      minWidth: 0
    }
  }, u.name), /*#__PURE__*/React.createElement(TierChip, {
    tier: u.tier
  }), showFollow && !isMe && /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      toggleFollow(handle);
      flashToast(following ? `Unfollowed @${u.handle}` : `Following @${u.handle}`);
    },
    style: {
      marginLeft: 2,
      padding: '3px 9px',
      borderRadius: 999,
      cursor: 'pointer',
      lineHeight: 1,
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 11,
      whiteSpace: 'nowrap',
      background: following ? 'transparent' : 'var(--stamp-red-soft)',
      color: following ? 'var(--ink-faint)' : 'var(--stamp-red)',
      border: `1px solid ${following ? 'var(--border-strong)' : 'var(--stamp-red)'}`
    }
  }, following ? 'Following' : '+ Follow')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      marginTop: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, "@", u.handle, c ? ` · ${c.name}` : '', " \xB7 ", time)));
}

// ── Post card (showcase / discussion / review) — BRD §8.5, §9.3 ──
function PostCard({
  post,
  showFollow = false
}) {
  if (post.type === 'iso') return /*#__PURE__*/React.createElement(ISOCard, {
    post: post
  });
  const {
    push
  } = useNav();
  const {
    hearted,
    saved,
    toggleHeart,
    toggleSave,
    flashToast,
    setOverlay
  } = {
    ...useAppState(),
    ...useNav()
  };
  const liked = hearted[post.id];
  const isSaved = saved[post.id];
  const item = post.refSku ? catOf(post.refSku) : null;
  const open = () => push({
    name: 'post',
    id: post.id
  });
  const openUser = () => push({
    name: 'profile',
    user: post.user
  });

  // inline comments — BRD v1.2 §9.3 (expand in feed, no page nav)
  const baseComments = COMMENTS[post.id] || [];
  const [showComments, setShowComments] = React.useState(false);
  const [extra, setExtra] = React.useState([]);
  const [draft, setDraft] = React.useState('');
  const commentCount = (baseComments.length || post.comments || 0) + extra.length;
  const addComment = () => {
    if (draft.trim()) {
      setExtra(x => [...x, {
        user: 'you',
        time: 'now',
        body: draft.trim()
      }]);
      setDraft('');
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper)',
      borderBottom: '4px solid var(--bone)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(AuthorLine, {
    handle: post.user,
    time: post.time,
    community: post.community,
    onOpen: openUser,
    showFollow: showFollow
  }), /*#__PURE__*/React.createElement(PostTypeTag, {
    type: post.type
  })), /*#__PURE__*/React.createElement("div", {
    onClick: open,
    style: {
      cursor: 'pointer',
      marginTop: 11
    }
  }, post.type === 'review' && post.rating && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Stars, {
    n: post.rating
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, item ? `reviewing ${item.brand}` : `${post.rating} / 5`)), post.title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 17,
      letterSpacing: '-0.01em',
      lineHeight: 1.25,
      marginBottom: 5
    }
  }, post.title), post.body && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      lineHeight: 1.55,
      color: 'var(--ink-soft)'
    }
  }, post.body), post.tags && post.tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8
    }
  }, post.tags.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--plum)'
    }
  }, "#", t))))), post.images && post.images.length > 0 ? /*#__PURE__*/React.createElement("div", {
    onClick: open,
    style: {
      cursor: 'pointer',
      padding: '12px 16px 0'
    }
  }, /*#__PURE__*/React.createElement(PostImages, {
    images: post.images
  })) : post.image && item ? /*#__PURE__*/React.createElement("div", {
    onClick: open,
    style: {
      cursor: 'pointer',
      padding: '12px 16px 0'
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: post.tone,
    ratio: "3/2"
  })) : null, post.type === 'poll' && post.poll && /*#__PURE__*/React.createElement(PollBlock, {
    post: post
  }), item && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px 0'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'item',
      sku: item.sku
    }),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      textAlign: 'left',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 10,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 8,
      overflow: 'hidden',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: post.tone,
    ratio: "1/1",
    rounded: 8
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--ink)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, item.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-mono)'
    }
  }, item.sku, " \xB7 ", item.brand)), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 16,
    stroke: 2,
    style: {
      transform: 'rotate(180deg)',
      color: 'var(--ink-faint)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      padding: '10px 16px 14px'
    }
  }, /*#__PURE__*/React.createElement(ActionBtn, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.heart,
      size: 20
    }),
    label: (post.likes || 0) + (liked ? 1 : 0),
    active: liked,
    onClick: () => {
      toggleHeart(post.id);
    }
  }), /*#__PURE__*/React.createElement(ActionBtn, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.comment,
      size: 20
    }),
    label: commentCount,
    active: showComments,
    onClick: () => setShowComments(v => !v)
  }), /*#__PURE__*/React.createElement(ActionBtn, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.share,
      size: 19
    }),
    onClick: () => setOverlay({
      name: 'share',
      label: `${userOf(post.user).name.split(' ')[0]}’s post`
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(ActionBtn, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.bookmark,
      size: 20
    }),
    active: isSaved,
    activeColor: "var(--ink)",
    onClick: () => {
      toggleSave(post.id);
      flashToast(isSaved ? 'Removed from saved' : 'Saved');
    }
  })), showComments && /*#__PURE__*/React.createElement(CommentThread, {
    post: post
  }));
}

// Renders comment text with @mentions highlighted + tappable
function renderCommentBody(text, push) {
  return text.split(/(@\w+)/g).map((p, i) => p.startsWith('@') ? /*#__PURE__*/React.createElement("span", {
    key: i,
    onClick: push ? e => {
      e.stopPropagation();
      push({
        name: 'profile',
        user: p.slice(1)
      });
    } : undefined,
    style: {
      color: 'var(--stamp-red)',
      fontWeight: 700,
      cursor: push ? 'pointer' : 'default'
    }
  }, p) : p);
}

// Input that shows a user-picker dropdown when @ is typed
function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  size,
  autoFocus
}) {
  const h = size === 'sm' ? 34 : 38;
  const fs = size === 'sm' ? 13.5 : 14;
  const px = size === 'sm' ? 12 : 13;
  const ref = React.useRef();
  const [mentioning, setMentioning] = React.useState(null);
  const handleChange = e => {
    const v = e.target.value;
    const cur = e.target.selectionStart;
    const before = v.slice(0, cur);
    const m = before.match(/@(\w*)$/);
    setMentioning(m ? {
      start: cur - m[0].length,
      query: m[1]
    } : null);
    onChange(v);
  };
  const insertMention = handle => {
    const cur = ref.current ? ref.current.selectionStart : value.length;
    const before = value.slice(0, mentioning.start);
    const after = value.slice(cur);
    const next = before + '@' + handle + ' ' + after;
    onChange(next);
    setMentioning(null);
    setTimeout(() => {
      if (!ref.current) return;
      ref.current.focus();
      const pos = (before + '@' + handle + ' ').length;
      ref.current.setSelectionRange(pos, pos);
    }, 0);
  };
  const allUsers = Object.values(USERS);
  const suggestions = mentioning ? allUsers.filter(u => u.handle.toLowerCase().includes(mentioning.query.toLowerCase()) || u.name.toLowerCase().includes(mentioning.query.toLowerCase())).slice(0, 4) : [];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      position: 'relative'
    }
  }, suggestions.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: h + 6,
      left: 0,
      right: 0,
      zIndex: 30,
      background: 'var(--paper)',
      border: '1px solid var(--border-strong)',
      borderRadius: 13,
      overflow: 'hidden',
      boxShadow: '0 6px 24px rgba(0,0,0,0.13)'
    }
  }, suggestions.map((u, i) => /*#__PURE__*/React.createElement("button", {
    key: u.handle,
    onMouseDown: e => {
      e.preventDefault();
      insertMention(u.handle);
    },
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 13px',
      background: 'none',
      cursor: 'pointer',
      border: 'none',
      borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: u.name,
    color: u.color,
    size: 30
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: 'var(--ink)',
      fontFamily: 'var(--font-body)'
    }
  }, u.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-mono)'
    }
  }, "@", u.handle))))), /*#__PURE__*/React.createElement("input", {
    ref: ref,
    autoFocus: autoFocus,
    value: value,
    onChange: handleChange,
    onKeyDown: e => {
      if (e.key === 'Escape') setMentioning(null);
      if (e.key === 'Enter' && !suggestions.length) onSubmit && onSubmit();
    },
    placeholder: placeholder || 'Add a comment…',
    style: {
      width: '100%',
      height: h,
      padding: `0 ${px}px`,
      borderRadius: 999,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: fs,
      color: 'var(--ink)',
      outline: 'none',
      boxSizing: 'border-box'
    }
  }));
}

// Instagram-style comments: per-comment likes + reply threads
function CommentThread({
  post
}) {
  const {
    push
  } = useNav();
  const seed = (COMMENTS[post.id] || []).map((c, i) => ({
    id: 'seed' + i,
    user: c.user,
    time: c.time,
    body: c.body,
    likes: c.likes || 0,
    liked: false,
    replies: []
  }));
  const [comments, setComments] = React.useState(seed);
  const [draft, setDraft] = React.useState('');
  const [replyTo, setReplyTo] = React.useState(null);
  const [replyDraft, setReplyDraft] = React.useState('');
  const add = () => {
    if (!draft.trim()) return;
    setComments(cs => [...cs, {
      id: 'u' + Date.now(),
      user: 'you',
      time: 'now',
      body: draft.trim(),
      likes: 0,
      liked: false,
      replies: []
    }]);
    setDraft('');
  };
  const like = id => setComments(cs => cs.map(c => c.id === id ? {
    ...c,
    liked: !c.liked,
    likes: c.likes + (c.liked ? -1 : 1)
  } : c));
  const likeReply = (cid, rid) => setComments(cs => cs.map(c => c.id === cid ? {
    ...c,
    replies: c.replies.map(r => r.id === rid ? {
      ...r,
      liked: !r.liked,
      likes: r.likes + (r.liked ? -1 : 1)
    } : r)
  } : c));
  const addReply = cid => {
    if (!replyDraft.trim()) return;
    setComments(cs => cs.map(c => c.id === cid ? {
      ...c,
      replies: [...c.replies, {
        id: 'r' + Date.now(),
        user: 'you',
        time: 'now',
        body: replyDraft.trim(),
        likes: 0,
        liked: false
      }]
    } : c));
    setReplyDraft('');
    setReplyTo(null);
  };
  const Row = ({
    c,
    reply,
    onLike,
    onReply,
    pushFn
  }) => {
    const cu = c.user === 'you' ? {
      name: 'You',
      color: 'var(--ink)'
    } : userOf(c.user);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 9
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: cu.name,
      color: cu.color,
      size: reply ? 26 : 30
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--paper-soft)',
        border: '1px solid var(--border)',
        borderRadius: 13,
        padding: '8px 12px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, cu.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--ink-faint)',
        flexShrink: 0
      }
    }, c.time)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: 'var(--ink-soft)',
        lineHeight: 1.45,
        marginTop: 2
      }
    }, renderCommentBody(c.body, pushFn))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '5px 12px 0',
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: onLike,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: c.liked ? 'var(--stamp-red)' : 'var(--ink-faint)',
        fontWeight: 600
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: Icons.heart,
      size: 14,
      fill: c.liked ? 'var(--stamp-red)' : 'none'
    }), c.likes > 0 ? c.likes : 'Like'), onReply && /*#__PURE__*/React.createElement("button", {
      onClick: onReply,
      style: {
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: 'var(--ink-faint)',
        fontWeight: 600
      }
    }, "Reply"))));
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border)',
      padding: '12px 16px 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, comments.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Row, {
    c: c,
    pushFn: push,
    onLike: () => like(c.id),
    onReply: () => {
      setReplyTo(replyTo === c.id ? null : c.id);
      setReplyDraft('');
    }
  }), c.replies.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingLeft: 30
    }
  }, c.replies.map(r => /*#__PURE__*/React.createElement(Row, {
    key: r.id,
    c: r,
    reply: true,
    pushFn: push,
    onLike: () => likeReply(c.id, r.id)
  }))), replyTo === c.id && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      paddingLeft: 30
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "You",
    color: "var(--ink)",
    size: 26
  }), /*#__PURE__*/React.createElement(MentionInput, {
    size: "sm",
    autoFocus: true,
    value: replyDraft,
    onChange: v => setReplyDraft(v),
    onSubmit: () => addReply(c.id),
    placeholder: `Reply to @${c.user === 'you' ? 'you' : c.user}…`
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.send,
      size: 15
    }),
    active: !!replyDraft.trim(),
    onClick: () => addReply(c.id)
  })))), comments.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)'
    }
  }, "No comments yet \u2014 say something.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      alignItems: 'center',
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "You",
    color: "var(--ink)",
    size: 30
  }), /*#__PURE__*/React.createElement(MentionInput, {
    value: draft,
    onChange: setDraft,
    onSubmit: add,
    placeholder: "Add a comment\u2026 type @ to tag"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.send,
      size: 17
    }),
    active: !!draft.trim(),
    onClick: add
  })));
}

// Poll block — BRD v1.2 §9.6 (post type = poll)
function PollBlock({
  post
}) {
  const [vote, setVote] = React.useState(null);
  const total = post.poll.reduce((s, o) => s + o.votes, 0) + (vote != null ? 1 : 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, post.poll.map((o, i) => {
    const votes = o.votes + (vote === i ? 1 : 0);
    const pct = total ? Math.round(votes / total * 100) : 0;
    const picked = vote === i;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => setVote(i),
      style: {
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'left',
        cursor: 'pointer',
        border: `1px solid ${picked ? 'var(--ink)' : 'var(--border-strong)'}`,
        borderRadius: 11,
        background: 'var(--paper-soft)',
        padding: '11px 13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10
      }
    }, vote != null && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        width: pct + '%',
        background: picked ? 'var(--plum-soft)' : 'var(--bone)',
        transition: 'width 280ms var(--ease-out)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        fontSize: 14,
        fontWeight: picked ? 600 : 500,
        color: 'var(--ink)'
      }
    }, o.label), vote != null && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        fontFamily: 'var(--font-mono)',
        fontSize: 12.5,
        color: 'var(--ink-mute)'
      }
    }, pct, "%"));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-mono)',
      marginTop: 2
    }
  }, total, " votes", vote == null ? ' · tap to vote' : ''));
}

// ── Admin / release card — BRD §10 ────────────────────────────
function AdminCard({
  post
}) {
  const {
    push,
    flashToast
  } = useNav();
  const {
    interested,
    toggleInterested
  } = useAppState();
  const item = post.sku ? catOf(post.sku) : null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper)',
      borderBottom: '8px solid var(--bone)',
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(SealMark, {
    size: 30
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 14
    }
  }, "CollectorHub"), /*#__PURE__*/React.createElement(Tag, {
    kind: "misb",
    style: {
      background: 'var(--ink)'
    }
  }, "Official")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, "New release \xB7 ", post.time))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 17,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
      marginBottom: 5
    }
  }, post.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-mute)',
      lineHeight: 1.5
    }
  }, post.body), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 11
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: interested[post.sku] ? 'secondary' : 'grail',
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.bell,
      size: 15
    }),
    onClick: () => {
      toggleInterested(post.sku);
      flashToast(interested[post.sku] ? 'Alert removed' : 'Alert set - we will ping you when it lists');
    }
  }, interested[post.sku] ? 'Alert on' : 'Notify me'))), item && /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'item',
      sku: item.sku
    }),
    style: {
      width: 88,
      flexShrink: 0,
      border: 'none',
      background: 'none',
      padding: 0,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: post.tone,
    ratio: "1/1"
  }))));
}

// ── Listing announcement card (in feed) — BRD §8.4 FE-07 ──────
function ListingFeedCard({
  id
}) {
  const {
    push
  } = useNav();
  const l = listingOf(id);
  const c = catOf(l.sku);
  const seller = userOf(l.seller);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper)',
      borderBottom: '8px solid var(--bone)',
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: seller.name,
    color: seller.color,
    size: 34
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "@", seller.handle, " listed an item"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)'
    }
  }, l.ships.split(' · ')[0], " \xB7 ", l.posted)), /*#__PURE__*/React.createElement(Tag, {
    kind: "sale"
  }, "For sale")), /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'listing',
      id
    }),
    style: {
      display: 'flex',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      border: '1px solid var(--border)',
      background: 'var(--paper-soft)',
      borderRadius: 14,
      padding: 10,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 96,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: c.tone,
    ratio: "1/1"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--ink)',
      lineHeight: 1.25
    }
  }, c.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-mono)',
      margin: '3px 0 8px'
    }
  }, l.condition), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: l.price
  })), l.retail > l.price && /*#__PURE__*/React.createElement(Money, {
    value: l.retail,
    strike: true,
    size: 12
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement(VerifyBadge, {
    tier: l.verify
  }))))));
}

// ── Marketplace grid card — BRD §9.8 ──────────────────────────
function MarketCard({
  id,
  listing
}) {
  const {
    push,
    flashToast
  } = useNav();
  const {
    saved,
    toggleSave,
    wishlistedSkus,
    toggleWishlistSku
  } = useAppState();
  const l = listing || listingOf(id);
  const c = l.sku ? catOf(l.sku) : {
    tone: l.tone || 'ink',
    title: l.title,
    cat: l.cat
  };
  const seller = userOf(l.seller);
  const isSaved = saved[id];
  const isWishlisted = !!(wishlistedSkus || {})[l.sku || id];
  const status = l.status;
  const sym = l.sym || '₹';
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'listing',
      id
    }),
    onPointerDown: e => {
      e.currentTarget.style.transform = 'scale(0.96)';
      e.currentTarget.style.boxShadow = 'none';
    },
    onPointerUp: e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = '';
    },
    onPointerLeave: e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = '';
    },
    style: {
      background: 'var(--paper-soft)',
      border: `1px solid ${l.mine ? 'var(--verified-teal)' : 'var(--border)'}`,
      borderRadius: 14,
      overflow: 'hidden',
      cursor: 'pointer',
      textAlign: 'left',
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 80ms var(--ease-out), box-shadow 80ms',
      boxShadow: 'var(--shadow-1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: c.tone,
    ratio: "1/1",
    rounded: 0
  }), /*#__PURE__*/React.createElement("div", {
    onClick: e => {
      e.stopPropagation();
      toggleSave(id);
    },
    style: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: 'rgba(244,239,230,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isSaved ? 'var(--stamp-red)' : 'var(--ink-mute)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.heart,
    size: 16,
    fill: isSaved ? 'var(--stamp-red)' : 'none'
  })), !l.mine && /*#__PURE__*/React.createElement("div", {
    onClick: e => {
      e.stopPropagation();
      toggleWishlistSku(l.sku || id);
      flashToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    },
    style: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 7,
      background: isWishlisted ? 'var(--stamp-red)' : 'rgba(20,17,15,0.52)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.bookmark,
    size: 14,
    stroke: isWishlisted ? 0 : 1.75,
    fill: isWishlisted ? 'currentColor' : 'none'
  })), l.mine && status === 'available' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 8,
      left: 8
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: "vouch"
  }, "Just listed")), !l.mine && status !== 'available' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 8,
      left: 8
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: status === 'sold' ? 'sold' : 'reserved'
  }, statusLabel(status))), l.trade && status === 'available' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 8,
      left: 8
    }
  }, /*#__PURE__*/React.createElement(Stamp, {
    color: "var(--ink)",
    rotate: -3,
    style: {
      fontSize: 9
    }
  }, "Trade OK"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '9px 10px 11px',
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1.25,
      color: 'var(--ink)',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      minHeight: 32
    }
  }, c.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: l.price,
    currency: sym
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement(VerifyBadge, {
    tier: l.verify
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 11,
      color: 'var(--ink-faint)'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: seller.name,
    color: seller.color,
    size: 16
  }), l.mine ? /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, "You \xB7 just now") : /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 12,
    stroke: 2,
    style: {
      color: 'var(--verified-teal)',
      flexShrink: 0
    }
  }), "Vouched by ", seller.vouchesReceived)), !l.mine && /*#__PURE__*/React.createElement("div", {
    role: "button",
    tabIndex: 0,
    onClick: e => {
      e.stopPropagation();
      push({
        name: 'chat',
        user: l.seller,
        listing: l.id,
        intent: 'buy'
      });
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 2,
      height: 32,
      borderRadius: 9,
      background: 'var(--ink)',
      color: 'var(--paper)',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.message,
    size: 14
  }), "Message")));
}

// ── Event card — BRD §9.13 ────────────────────────────────────
function EventCard({
  ev,
  onOpen
}) {
  const {
    rsvp
  } = useAppState();
  const status = rsvp[ev.id];
  const count = goingCount(ev, rsvp);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onOpen,
    style: {
      display: 'flex',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      alignItems: 'stretch',
      background: 'var(--paper-soft)',
      border: `1px solid ${status === 'going' ? 'var(--forest)' : 'var(--border)'}`,
      borderRadius: 14,
      padding: 12,
      cursor: 'pointer',
      opacity: ev.past ? 0.72 : 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 58,
      flexShrink: 0,
      borderRadius: 10,
      background: 'var(--ink)',
      color: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'var(--grail-gold)'
    }
  }, ev.month), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 26,
      lineHeight: 1
    }
  }, ev.date), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: 'var(--ink-ghost)',
      marginTop: 2
    }
  }, ev.day)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      marginBottom: 4,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: ev.mode === 'Online' ? 'vouch' : 'event'
  }, ev.mode), status === 'going' && /*#__PURE__*/React.createElement(Tag, {
    kind: "sold"
  }, "Going"), status === 'interested' && /*#__PURE__*/React.createElement(Tag, {
    kind: "po"
  }, "Interested")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
      color: 'var(--ink)'
    }
  }, ev.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 12.5,
      color: 'var(--ink-mute)',
      marginTop: 5
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.pin,
    size: 14,
    stroke: 2
  }), ev.where), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.clock,
    size: 14,
    stroke: 2
  }), ev.when, " \xB7 ", count, " going")));
}

// Renders either a real uploaded image or a placeholder tone swatch
function PostImg({
  src,
  tone,
  ratio,
  style
}) {
  const url = typeof src === 'string' && src.startsWith('data:') ? src : null;
  if (url) {
    const paddingMap = {
      '3/2': '66.67%',
      '1/1': '100%',
      'auto': '100%'
    };
    const pb = paddingMap[ratio] || '66.67%';
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        paddingBottom: pb,
        overflow: 'hidden',
        ...style
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: url,
      style: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }
    }));
  }
  return /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: tone || src || 'ink',
    ratio: ratio || '3/2',
    rounded: 0,
    style: style
  });
}

// Post image gallery — 1 full, 2 side-by-side, 3+ grid (first big)
function PostImages({
  images
}) {
  const n = images.length;
  if (n === 1) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        borderRadius: 12,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement(PostImg, {
      src: images[0],
      ratio: "3/2"
    }));
  }
  if (n === 2) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 4,
        borderRadius: 12,
        overflow: 'hidden'
      }
    }, images.map((t, i) => /*#__PURE__*/React.createElement(PostImg, {
      key: i,
      src: t,
      ratio: "1/1"
    })));
  }
  const rest = images.slice(1, 4);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: 4,
      borderRadius: 12,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(PostImg, {
    src: images[0],
    ratio: "1/1"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateRows: `repeat(${rest.length}, 1fr)`,
      gap: 4
    }
  }, rest.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      position: 'relative',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(PostImg, {
    src: t,
    ratio: "auto",
    style: {
      height: '100%'
    }
  }), i === rest.length - 1 && n > 4 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(20,17,15,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--paper)',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 20
    }
  }, "+", n - 4)))));
}

// ── Community card — BRD §9.12 ────────────────────────────────
function CommunityCard({
  com,
  onOpen
}) {
  const {
    joined,
    toggleJoin,
    comRequested,
    requestJoin,
    cancelRequest,
    flashToast
  } = {
    ...useAppState(),
    ...useNav()
  };
  const isJoined = joined[com.id];
  const requested = !!(comRequested && comRequested[com.id]);
  const isPrivate = com.privacy === 'private' || com.invite;
  const youAdmin = adminsOf(com.id).some(a => a.handle === 'you');
  const tones = {
    plum: 'var(--plum)',
    forest: 'var(--forest)',
    teal: 'var(--verified-teal)',
    red: 'var(--stamp-red)',
    ink: 'var(--ink)',
    gold: 'var(--grail-gold)'
  };
  const onJoin = () => {
    if (isJoined) {
      toggleJoin(com.id);
      flashToast(`Left ${com.name}`);
      return;
    }
    if (isPrivate) {
      if (requested) {
        cancelRequest(com.id);
        flashToast('Request withdrawn');
      } else {
        requestJoin(com.id);
        flashToast('Request sent — an admin will review it');
      }
    } else {
      toggleJoin(com.id);
      flashToast(`Joined ${com.name}`);
    }
  };
  const label = isJoined ? 'Joined' : isPrivate ? requested ? 'Requested' : 'Request' : 'Join';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onOpen,
    style: {
      width: 50,
      height: 50,
      borderRadius: 12,
      flexShrink: 0,
      border: 'none',
      cursor: 'pointer',
      background: tones[com.tone] || 'var(--ink)',
      color: 'var(--paper)',
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 19,
      letterSpacing: '-0.02em',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, com.tag), /*#__PURE__*/React.createElement("button", {
    onClick: onOpen,
    style: {
      flex: 1,
      minWidth: 0,
      textAlign: 'left',
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 14.5,
      color: 'var(--ink)'
    }
  }, com.name), isPrivate && /*#__PURE__*/React.createElement(Tag, {
    kind: "reserved"
  }, "Private"), youAdmin && /*#__PURE__*/React.createElement(Tag, {
    kind: "vouch"
  }, "Admin")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-mute)',
      margin: '2px 0 3px',
      lineHeight: 1.4
    }
  }, com.short), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-mono)'
    }
  }, com.members.toLocaleString('en-IN'), " members")), youAdmin ? /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    onClick: onOpen
  }, "Open") : /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: isJoined || requested ? 'secondary' : 'dark',
    onClick: onJoin
  }, label));
}

// ── ISO (In Search Of) card — BRD §9.x ──────────────────────
function ISOCard({
  post
}) {
  const {
    push
  } = useNav();
  const {
    hearted,
    saved,
    toggleHeart,
    toggleSave
  } = useAppState();
  const {
    flashToast
  } = useNav();
  const liked = hearted[post.id];
  const isSaved = saved[post.id];
  const [showComments, setShowComments] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper)',
      borderBottom: '4px solid var(--bone)',
      borderLeft: '4px solid #E8A33D'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(AuthorLine, {
    handle: post.user,
    time: post.time,
    community: post.community,
    onOpen: () => push({
      name: 'profile',
      user: post.user
    })
  }), /*#__PURE__*/React.createElement(PostTypeTag, {
    type: "iso"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      borderRadius: 14,
      overflow: 'hidden',
      background: 'rgba(232,163,61,0.07)',
      border: '1.5px solid rgba(232,163,61,0.32)',
      padding: '13px 14px',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: -4,
      top: '50%',
      transform: 'translateY(-50%) rotate(15deg)',
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      fontSize: 30,
      letterSpacing: '0.2em',
      color: 'rgba(176,119,36,0.1)',
      textTransform: 'uppercase',
      pointerEvents: 'none',
      userSelect: 'none'
    }
  }, "WANTED"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16,
      letterSpacing: '-0.01em',
      color: 'var(--ink)',
      lineHeight: 1.25,
      marginBottom: 10,
      paddingRight: 48
    }
  }, post.isoItem), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, post.isoBudget && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 9px',
      borderRadius: 6,
      background: 'rgba(176,119,36,0.15)',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      fontWeight: 700,
      color: '#9A6010'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.tag,
    size: 11
  }), "Max \u20B9", Number(post.isoBudget).toLocaleString('en-IN')), post.isoCond && post.isoCond !== 'Any' && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 9px',
      borderRadius: 6,
      background: 'var(--bone)',
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--ink-mute)'
    }
  }, post.isoCond), post.isoCity && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 9px',
      borderRadius: 6,
      background: 'var(--bone)',
      fontSize: 12,
      fontWeight: 500,
      color: 'var(--ink-mute)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.pin,
    size: 11
  }), post.isoCity))), post.body && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--ink-soft)',
      lineHeight: 1.55,
      marginTop: 9
    }
  }, post.body)), post.images && post.images.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px 12px'
    }
  }, /*#__PURE__*/React.createElement(PostImages, {
    images: post.images
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px 16px 14px'
    }
  }, /*#__PURE__*/React.createElement(ActionBtn, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.heart,
      size: 19
    }),
    label: (post.likes || 0) + (liked ? 1 : 0),
    active: liked,
    onClick: () => toggleHeart(post.id)
  }), /*#__PURE__*/React.createElement(ActionBtn, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.comment,
      size: 19
    }),
    label: post.comments || 0,
    active: showComments,
    onClick: () => setShowComments(v => !v)
  }), /*#__PURE__*/React.createElement(ActionBtn, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.bookmark,
      size: 19
    }),
    active: isSaved,
    activeColor: "var(--ink)",
    onClick: () => {
      toggleSave(post.id);
      flashToast(isSaved ? 'Removed from saved' : 'Saved');
    }
  }), /*#__PURE__*/React.createElement(ActionBtn, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.share,
      size: 19
    }),
    onClick: () => setOverlay({
      name: 'share',
      label: `${userOf(post.user).name.split(' ')[0]}'s ISO`
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), post.user !== 'you' && /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "teal",
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.message,
      size: 15
    }),
    onClick: () => push({
      name: 'chat',
      user: post.user,
      intent: 'iso',
      isoItem: post.isoItem
    })
  }, "I have this")), showComments && /*#__PURE__*/React.createElement(CommentThread, {
    post: post
  }));
}
Object.assign(window, {
  AuthorLine,
  PostCard,
  ISOCard,
  CommentThread,
  PostImages,
  PollBlock,
  AdminCard,
  ListingFeedCard,
  MarketCard,
  EventCard,
  CommunityCard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/Cards.jsx", error: String((e && e.message) || e) }); }

// app/Chat.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Direct Messages — inbox + thread with Deal completion
// BRD §9.10 / §8.6 MK-08 / §8.7
// ─────────────────────────────────────────────────────────────

function InboxView() {
  const {
    push
  } = useNav();
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Messages"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 0 24px'
    }
  }, INBOX.map(c => {
    const u = userOf(c.user);
    const l = c.listing ? listingOf(c.listing) : null;
    return /*#__PURE__*/React.createElement("button", {
      key: c.user,
      onClick: () => push({
        name: 'chat',
        user: c.user
      }),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        padding: '13px 16px'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: u.name,
      color: u.color,
      size: 48,
      verified: u.tier !== 'Verified'
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14.5,
        fontWeight: 600,
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, u.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-faint)',
        flexShrink: 0
      }
    }, c.time)), l && l.sku && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-faint)',
        fontFamily: 'var(--font-mono)',
        margin: '2px 0'
      }
    }, "re: ", catOf(l.sku).sku), l && !l.sku && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-faint)',
        fontFamily: 'var(--font-mono)',
        margin: '2px 0',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, "re: ", l.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: c.unread ? 'var(--ink)' : 'var(--ink-faint)',
        fontWeight: c.unread ? 500 : 400,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, c.preview)), c.unread > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        minWidth: 20,
        height: 20,
        padding: '0 6px',
        borderRadius: 999,
        background: 'var(--stamp-red)',
        color: 'var(--paper)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, c.unread));
  })));
}
function ChatView({
  route
}) {
  const {
    push,
    flashToast
  } = useNav();
  const {
    threads,
    sendMessage,
    deals,
    requestDeal,
    confirmDeal
  } = useAppState();
  const handle = route.user;
  const u = userOf(handle);
  const thread = threads[handle] || {
    listing: route.listing || null,
    messages: []
  };
  const listingId = route.listing || thread.listing;
  const l = listingId ? listingOf(listingId) : null;
  const lName = l ? l.sku ? catOf(l.sku).brand : l.brand : 'item';
  const dealState = deals[handle];
  const [attachOpen, setAttachOpen] = React.useState(false);
  const [offerOpen, setOfferOpen] = React.useState(false);
  const [offerAmt, setOfferAmt] = React.useState(l ? String(Math.round((l.price || 0) * 0.9)) : '');

  // ── More / Report / Block sheet ──
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [isBlocked, setIsBlocked] = React.useState(false);
  const [reportReason, setReportReason] = React.useState(null);
  const [reportSent, setReportSent] = React.useState(false);
  const REPORT_REASONS = ['Fake / impersonation', 'Counterfeit / replica listings', 'Scam or fraud attempt', 'Harassment or abuse', 'Spam', 'Other'];
  const handleBlock = () => {
    setIsBlocked(v => !v);
    setBlockOpen(false);
    setMoreOpen(false);
    flashToast(isBlocked ? `@${u.handle} unblocked` : `@${u.handle} blocked`);
  };
  const handleReport = () => {
    setReportSent(true);
    setTimeout(() => {
      setReportOpen(false);
      setMoreOpen(false);
      setReportSent(false);
      setReportReason(null);
      flashToast('Report submitted — we\'ll review within 24 hrs');
    }, 1600);
  };
  const closeSheets = () => {
    setMoreOpen(false);
    setReportOpen(false);
    setBlockOpen(false);
    setReportReason(null);
    setAttachOpen(false);
    setOfferOpen(false);
  };
  const [draft, setDraft] = React.useState(route.intent === 'trade' ? `Hi! Would you trade the ${lName}? I can offer a sealed piece.` : route.intent === 'buy' && l ? `Hi! Is the ${lName} still available?` : '');
  const bodyRef = React.useRef(null);
  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [thread.messages.length, dealState]);
  const send = () => {
    if (draft.trim()) {
      sendMessage(handle, draft.trim());
      setDraft('');
    }
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, attachOpen && /*#__PURE__*/React.createElement("div", {
    onClick: () => setAttachOpen(false),
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.38)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      background: 'var(--paper)',
      borderRadius: '20px 20px 0 0',
      padding: '8px 0 36px',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      borderRadius: 2,
      background: 'var(--border-strong)',
      margin: '8px auto 20px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 12
    }
  }, [{
    icon: Icons.camera,
    label: 'Photo',
    action: () => {
      sendMessage(handle, '📷 [Photo attached]');
      setAttachOpen(false);
      flashToast('Photo sent');
    }
  }, {
    icon: Icons.bag,
    label: 'Share listing',
    action: () => {
      if (l) {
        sendMessage(handle, `📦 Sharing listing: ${l.title || catOf(l.sku).title}`);
        setAttachOpen(false);
        flashToast('Listing shared');
      } else {
        setAttachOpen(false);
        flashToast('No listing in this thread');
      }
    }
  }, {
    icon: Icons.tag,
    label: 'Make offer',
    action: () => {
      setAttachOpen(false);
      setTimeout(() => setOfferOpen(true), 80);
    }
  }].map(opt => /*#__PURE__*/React.createElement("button", {
    key: opt.label,
    onClick: opt.action,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 9,
      padding: '16px 8px',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 14,
      background: 'var(--bone)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--ink)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: opt.icon,
    size: 22
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      fontFamily: 'var(--font-body)',
      color: 'var(--ink)'
    }
  }, opt.label)))))), offerOpen && /*#__PURE__*/React.createElement("div", {
    onClick: () => setOfferOpen(false),
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.38)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      background: 'var(--paper)',
      borderRadius: '20px 20px 0 0',
      padding: '8px 20px 36px',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      borderRadius: 2,
      background: 'var(--border-strong)',
      margin: '8px auto 18px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 17,
      marginBottom: 4
    }
  }, "Make an offer"), l && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)',
      marginBottom: 16
    }
  }, "Listed at ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink)'
    }
  }, "\u20B9", (l.price || 0).toLocaleString('en-IN'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      border: '1px solid var(--border-strong)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '0 14px',
      fontSize: 18,
      fontWeight: 700,
      color: 'var(--ink-faint)',
      borderRight: '1px solid var(--border)',
      height: 50,
      display: 'flex',
      alignItems: 'center'
    }
  }, "\u20B9"), /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    type: "number",
    value: offerAmt,
    onChange: e => setOfferAmt(e.target.value),
    placeholder: "Enter amount",
    style: {
      flex: 1,
      height: 50,
      padding: '0 14px',
      border: 'none',
      outline: 'none',
      fontFamily: 'var(--font-mono)',
      fontSize: 18,
      fontWeight: 600,
      color: 'var(--ink)',
      background: 'none'
    }
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    style: {
      width: '100%',
      justifyContent: 'center',
      opacity: offerAmt ? 1 : 0.45
    },
    onClick: () => {
      if (!offerAmt) return;
      sendMessage(handle, `💰 Offer: ₹${Number(offerAmt).toLocaleString('en-IN')} for ${l ? l.title || catOf(l.sku).title : 'item'}`);
      setOfferOpen(false);
      flashToast('Offer sent!');
    }
  }, "Send offer"))), (moreOpen || reportOpen || blockOpen) && /*#__PURE__*/React.createElement("div", {
    onClick: closeSheets,
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.38)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'flex-end'
    }
  }, moreOpen && !reportOpen && !blockOpen && /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      background: 'var(--paper)',
      borderRadius: '20px 20px 0 0',
      padding: '8px 0 32px',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      borderRadius: 2,
      background: 'var(--border-strong)',
      margin: '8px auto 18px'
    }
  }), [{
    icon: Icons.flag,
    label: isBlocked ? 'Unblock @' + u.handle : 'Block @' + u.handle,
    danger: false,
    onClick: () => {
      setMoreOpen(false);
      setTimeout(() => setBlockOpen(true), 80);
    }
  }, {
    icon: Icons.close,
    label: 'Report @' + u.handle,
    danger: true,
    onClick: () => {
      setMoreOpen(false);
      setTimeout(() => setReportOpen(true), 80);
    }
  }].map(item => /*#__PURE__*/React.createElement("button", {
    key: item.label,
    onClick: item.onClick,
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 20px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: item.danger ? 'var(--stamp-red)' : 'var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      background: item.danger ? '#FEE2E2' : 'var(--paper-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'inherit'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: item.icon,
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: 15
    }
  }, item.label)))), reportOpen && /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      background: 'var(--paper)',
      borderRadius: '20px 20px 0 0',
      padding: '8px 0 32px',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      borderRadius: 2,
      background: 'var(--border-strong)',
      margin: '8px auto 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 20px 10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 17
    }
  }, "Report @", u.handle), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)',
      marginTop: 3
    }
  }, "Why are you reporting this conversation?")), reportSent ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 0 8px',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: '50%',
      background: 'var(--paper-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.check,
    size: 24,
    style: {
      color: 'var(--forest)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, "Report submitted"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)'
    }
  }, "We'll review this within 24 hrs")) : /*#__PURE__*/React.createElement(React.Fragment, null, REPORT_REASONS.map(reason => /*#__PURE__*/React.createElement("button", {
    key: reason,
    onClick: () => setReportReason(reason),
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '13px 20px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14.5,
      color: 'var(--ink)',
      fontWeight: reportReason === reason ? 600 : 400
    }
  }, reason), reportReason === reason && /*#__PURE__*/React.createElement(Ico, {
    d: Icons.check,
    size: 16,
    style: {
      color: 'var(--stamp-red)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px 0'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    style: {
      width: '100%',
      justifyContent: 'center',
      opacity: reportReason ? 1 : 0.45
    },
    onClick: reportReason ? handleReport : undefined
  }, "Submit report")))), blockOpen && /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      background: 'var(--paper)',
      borderRadius: '20px 20px 0 0',
      padding: '8px 0 32px',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      borderRadius: 2,
      background: 'var(--border-strong)',
      margin: '8px auto 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 20px 6px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: u.name,
    color: u.color,
    size: 56
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 17
    }
  }, isBlocked ? 'Unblock' : 'Block', " @", u.handle, "?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)',
      marginTop: 6,
      lineHeight: 1.55,
      maxWidth: 280,
      margin: '6px auto 0'
    }
  }, isBlocked ? `@${u.handle} will be able to message and see your profile again.` : `They won't be able to see your profile, listings or messages. You can unblock them anytime from Settings.`)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '20px 20px 0'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    style: {
      width: '100%',
      justifyContent: 'center',
      background: isBlocked ? 'var(--forest)' : 'var(--stamp-red)',
      borderColor: isBlocked ? 'var(--forest)' : 'var(--stamp-red)'
    },
    onClick: handleBlock
  }, isBlocked ? 'Unblock' : 'Block', " @", u.handle), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    style: {
      width: '100%',
      justifyContent: 'center'
    },
    onClick: () => setBlockOpen(false)
  }, "Cancel")))), /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    bodyRef: bodyRef,
    bg: "var(--bone)",
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: u.name,
      subtitle: `${u.vouchesReceived} vouches · ${u.deals} deals · ${u.response}`,
      trailing: /*#__PURE__*/React.createElement(IconButton, {
        icon: /*#__PURE__*/React.createElement(Ico, {
          d: Icons.more,
          size: 18
        }),
        onClick: () => setMoreOpen(true)
      })
    }),
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--paper)',
        padding: '10px 14px 30px'
      }
    }, dealState !== 'confirmed' && /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 10
      }
    }, !dealState && /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        requestDeal(handle);
        flashToast('Deal marked — waiting for @' + u.handle + ' to confirm');
      },
      style: dealBtn
    }, /*#__PURE__*/React.createElement(Ico, {
      d: Icons.check,
      size: 16
    }), "Mark as sold / traded to @", u.handle), dealState === 'requested' && /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--grail-gold-soft)',
        border: '1px solid var(--grail-gold)',
        borderRadius: 12,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: Icons.clock,
      size: 17,
      style: {
        color: 'var(--grail-gold-deep)',
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 12.5,
        color: 'var(--ink-soft)'
      }
    }, "Waiting for @", u.handle, " to confirm the deal."), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "grail",
      onClick: () => {
        confirmDeal(handle);
        flashToast('Deal confirmed · trade history updated');
      }
    }, "Simulate confirm"))), dealState === 'confirmed' && /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 10,
        background: 'var(--forest-soft)',
        border: '1px solid var(--forest)',
        borderRadius: 12,
        padding: '10px 12px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: 'var(--forest)',
        fontWeight: 600,
        fontSize: 13
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: Icons.shield,
      size: 16
    }), "Deal confirmed"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-mute)',
        flex: 1
      }
    }, "This deal is recorded on both profiles."), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "teal",
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.shield,
        size: 14
      }),
      onClick: () => push({
        name: 'vouch',
        user: handle,
        mode: 'give'
      })
    }, "Leave a vouch"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 9,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.plus,
        size: 20
      }),
      onClick: () => setAttachOpen(true)
    }), /*#__PURE__*/React.createElement("input", {
      value: draft,
      onChange: e => setDraft(e.target.value),
      onKeyDown: e => e.key === 'Enter' && send(),
      placeholder: "Message\u2026",
      style: {
        flex: 1,
        height: 42,
        padding: '0 14px',
        borderRadius: 999,
        border: '1px solid var(--border-strong)',
        background: 'var(--paper-soft)',
        fontFamily: 'var(--font-body)',
        fontSize: 14.5,
        color: 'var(--ink)',
        outline: 'none'
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.send,
        size: 18
      }),
      active: !!draft.trim(),
      onClick: send
    })))
  }, l && (() => {
    const c = l.sku ? catOf(l.sku) : {
      tone: l.tone || 'ink',
      title: l.title
    };
    return /*#__PURE__*/React.createElement("button", {
      onClick: () => push({
        name: 'listing',
        id: l.id
      }),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        width: 'calc(100% - 28px)',
        margin: '12px 14px',
        cursor: 'pointer',
        background: 'var(--paper)',
        border: '1px solid var(--border)',
        borderRadius: 13,
        padding: 10,
        textAlign: 'left'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 44,
        height: 44,
        borderRadius: 9,
        overflow: 'hidden',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(ProductPhoto, {
      tone: c.tone,
      ratio: "1/1",
      rounded: 9
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, c.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13
      }
    }, /*#__PURE__*/React.createElement(Money, {
      value: l.price,
      currency: l.sym || '₹'
    }), " \xB7 ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--ink-faint)'
      }
    }, (l.condition || '').split('·')[0]))), /*#__PURE__*/React.createElement(VerifyBadge, {
      tier: l.verify
    }));
  })(), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 14px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, thread.messages.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start',
      maxWidth: '78%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '9px 13px',
      borderRadius: 16,
      fontSize: 14.5,
      lineHeight: 1.45,
      background: m.from === 'me' ? 'var(--stamp-red)' : 'var(--paper)',
      color: m.from === 'me' ? 'var(--paper)' : 'var(--ink)',
      border: m.from === 'me' ? 'none' : '1px solid var(--border)',
      borderBottomRightRadius: m.from === 'me' ? 5 : 16,
      borderBottomLeftRadius: m.from === 'me' ? 16 : 5
    }
  }, m.text), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: 'var(--ink-faint)',
      marginTop: 3,
      textAlign: m.from === 'me' ? 'right' : 'left',
      padding: '0 4px'
    }
  }, m.time))), dealState === 'confirmed' && /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: 'center',
      background: 'var(--bone-deep)',
      color: 'var(--ink-mute)',
      fontSize: 11.5,
      padding: '4px 12px',
      borderRadius: 999,
      margin: '6px 0'
    }
  }, "Deal completed \xB7 recorded on both profiles")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 11,
      color: 'var(--ink-faint)',
      padding: '0 32px 12px',
      lineHeight: 1.5
    }
  }, "First time trading with @", u.handle, "? Deals complete off-platform \u2014 check trust signals & ask for an in-hand video.")));
}
const dealBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  height: 44,
  borderRadius: 12,
  border: '1px solid var(--ink)',
  background: 'var(--ink)',
  color: 'var(--paper)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 14
};
Object.assign(window, {
  InboxView,
  ChatView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/Chat.jsx", error: String((e && e.message) || e) }); }

// app/Chrome.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// CollectorHub — app chrome: AppBar, DetailHeader, BottomNav
// ─────────────────────────────────────────────────────────────

// Wordmark seal used in the home app bar
function SealMark({
  size = 26
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: 6,
      background: 'var(--stamp-red)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: size * 0.62,
      transform: 'rotate(-4deg)',
      boxShadow: 'var(--shadow-stamp)',
      flexShrink: 0
    }
  }, "C");
}

// Top bar for root tabs:  [+ create]   Title / wordmark   [search] [bell•]
function AppBar({
  title,
  wordmark = false,
  trailing
}) {
  const {
    setOverlay,
    push
  } = useNav();
  const {
    readNotifs,
    liveNotifs
  } = useAppState();
  const allNotifs = [...(liveNotifs || []), ...NOTIFICATIONS];
  const unread = allNotifs.filter(n => n.unread && !readNotifs[n.id]).length;
  const msgUnread = INBOX.reduce((s, m) => s + m.unread, 0);

  // Web (Instagram-style): slim column header — wordmark/title only; actions live in the sidebar.
  if (window.CH_WEB) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        background: 'var(--paper)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '16px 20px 15px',
        minHeight: 30
      }
    }, wordmark && /*#__PURE__*/React.createElement(SealMark, {
      size: 24
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: wordmark ? 20 : 21,
        letterSpacing: '-0.03em',
        color: 'var(--ink)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, title)));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      paddingTop: 52,
      background: 'var(--paper)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 16px 12px',
      minHeight: 44
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOverlay({
      name: 'compose'
    }),
    "aria-label": "Create post",
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      flexShrink: 0,
      background: 'var(--ink)',
      color: 'var(--paper)',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    },
    onPointerDown: e => e.currentTarget.style.transform = 'scale(0.92)',
    onPointerUp: e => e.currentTarget.style.transform = '',
    onPointerLeave: e => e.currentTarget.style.transform = ''
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.plus,
    size: 22,
    stroke: 2.2
  })), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.search,
      size: 20
    }),
    onClick: () => setOverlay({
      name: 'search'
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      minWidth: 0,
      justifyContent: 'center'
    }
  }, wordmark && /*#__PURE__*/React.createElement(SealMark, null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: wordmark ? 22 : 24,
      letterSpacing: '-0.03em',
      color: 'var(--ink)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.message,
      size: 20
    }),
    badge: msgUnread || null,
    onClick: () => push({
      name: 'inbox'
    })
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.bell,
      size: 20
    }),
    badge: unread || null,
    onClick: () => setOverlay({
      name: 'notifications'
    })
  }), trailing && /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 2
    }
  }, trailing))));
}

// Header for pushed detail screens
function DetailHeader({
  title,
  subtitle,
  trailing,
  onBack,
  transparent = false
}) {
  const {
    pop
  } = useNav();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      paddingTop: window.CH_WEB ? 14 : 52,
      background: transparent ? 'transparent' : 'var(--paper)',
      borderBottom: transparent ? 'none' : '1px solid var(--border)',
      position: window.CH_WEB && !transparent ? 'sticky' : 'static',
      top: 0,
      zIndex: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 14px 12px',
      minHeight: 40
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack || pop,
    "aria-label": "Back",
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      flexShrink: 0,
      background: transparent ? 'rgba(20,17,15,0.5)' : 'transparent',
      color: transparent ? 'var(--paper)' : 'var(--ink)',
      border: transparent ? 'none' : '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      backdropFilter: transparent ? 'blur(6px)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 20
  })), title != null && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 19,
      letterSpacing: '-0.02em',
      color: 'var(--ink)',
      lineHeight: 1.15,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      marginTop: 1
    }
  }, subtitle)), trailing && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginLeft: 'auto'
    }
  }, trailing)));
}

// Bottom tab bar — 5 tabs (BRD IA: Home / Market / Community / Events / Profile)
function BottomNav() {
  if (window.CH_WEB) return null; // web uses the left sidebar instead
  const {
    tab,
    switchTab
  } = useNav();
  const tabs = [{
    id: 'feed',
    label: 'Home',
    icon: Icons.home
  }, {
    id: 'market',
    label: 'Market',
    icon: Icons.bag
  }, {
    id: 'community',
    label: 'Community',
    icon: Icons.users
  }, {
    id: 'events',
    label: 'Events',
    icon: Icons.calendar
  }, {
    id: 'me',
    label: 'Profile',
    icon: Icons.user
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      paddingBottom: 30,
      background: 'var(--paper)',
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'stretch',
      padding: '8px 4px 2px'
    }
  }, tabs.map(t => {
    const active = tab === t.id;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => switchTab(t.id),
      onPointerDown: e => e.currentTarget.style.opacity = '0.65',
      onPointerUp: e => e.currentTarget.style.opacity = '',
      onPointerLeave: e => e.currentTarget.style.opacity = '',
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: '5px 2px 2px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        transition: 'opacity 80ms'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 48,
        height: 28,
        borderRadius: 10,
        background: active ? 'var(--stamp-red-soft)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 200ms var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: t.icon,
      size: 21,
      stroke: active ? 2.2 : 1.75,
      style: {
        color: active ? 'var(--stamp-red)' : 'var(--ink-faint)',
        transition: 'color 200ms'
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: active ? 700 : 400,
        color: active ? 'var(--stamp-red)' : 'var(--ink-faint)',
        transition: 'color 200ms',
        letterSpacing: active ? '-0.01em' : '0.01em'
      }
    }, t.label));
  })));
}

// Standard screen shell: appbar/header + scroll body + bottom nav
function Screen({
  header,
  children,
  nav = true,
  footer,
  bodyRef,
  bg = 'var(--paper)'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      background: bg,
      color: 'var(--ink)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      lineHeight: 1.5
    }
  }, header, /*#__PURE__*/React.createElement("div", {
    ref: bodyRef,
    style: {
      flex: 1,
      overflow: 'auto',
      minHeight: 0,
      WebkitOverflowScrolling: 'touch'
    }
  }, children), footer, nav && /*#__PURE__*/React.createElement(BottomNav, null));
}
Object.assign(window, {
  SealMark,
  AppBar,
  DetailHeader,
  BottomNav,
  Screen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/Chrome.jsx", error: String((e && e.message) || e) }); }

// app/CommunityDetail.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Community detail — Facebook-Groups-style (BRD §9.12)
// Public vs private · join / request-to-join · Posts / Members / About
// tabs · private locked preview · admin "Manage community" entry.
// ─────────────────────────────────────────────────────────────

function CommunityDetail({
  route
}) {
  const {
    push,
    flashToast,
    setOverlay
  } = useNav();
  const {
    joined,
    toggleJoin,
    comRequested,
    requestJoin,
    cancelRequest,
    userCommunities
  } = useAppState();
  const com = COMMUNITIES.find(c => c.id === route.id) || (userCommunities || []).find(c => c.id === route.id);
  if (!com) return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Community"
    })
  }, /*#__PURE__*/React.createElement(EmptyNote, null, "This community isn\u2019t available."));
  const isMember = !!joined[com.id];
  const requested = !!comRequested[com.id];
  const isPrivate = com.privacy === 'private' || com.invite;
  const founder = userOf(com.founder);
  const [tab, setTab] = React.useState('posts');
  const [accepted, setAccepted] = React.useState(false);
  const postMode = postModeOf(com.id);
  let admins = adminsOf(com.id);
  if (!admins.length && com.founder) admins = [{
    handle: com.founder,
    role: 'Founder'
  }];
  const isAdmin = admins.some(a => a.handle === 'you');
  const members = membersOf(com.id);
  const reqCount = joinRequestsOf(com.id).length;
  const pendCount = pendingPostsOf(com.id).length;
  const tones = {
    plum: 'var(--plum)',
    forest: 'var(--forest)',
    teal: 'var(--verified-teal)',
    red: 'var(--stamp-red)',
    ink: 'var(--ink)',
    gold: 'var(--grail-gold)'
  };
  const posts = POSTS.filter(p => p.community === com.id);

  // private + not member + not admin → locked preview
  const locked = isPrivate && !isMember && !isAdmin;
  const startCompose = () => {
    if (!accepted) {
      setTab('about');
      flashToast('Accept the community guidelines first');
      return;
    }
    setOverlay({
      name: 'compose',
      community: com.id
    });
  };
  const onJoinClick = () => {
    if (isMember) {
      toggleJoin(com.id);
      flashToast(`Left ${com.name}`);
      return;
    }
    if (isPrivate) {
      if (requested) {
        cancelRequest(com.id);
        flashToast('Request withdrawn');
      } else {
        requestJoin(com.id);
        flashToast('Request sent — an admin will review it');
      }
    } else {
      toggleJoin(com.id);
      flashToast(`Joined ${com.name}`);
    }
  };
  const joinLabel = isMember ? 'Joined' : isPrivate ? requested ? 'Requested' : 'Request to join' : 'Join';
  const tabs = locked ? [{
    id: 'posts',
    label: 'About'
  }] : [{
    id: 'posts',
    label: 'Posts'
  }, {
    id: 'members',
    label: `Members`
  }, {
    id: 'about',
    label: 'About'
  }];
  const activeTab = locked ? 'about' : tab;
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: null
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 3
    }
  }, /*#__PURE__*/React.createElement(DetailHeader, {
    transparent: true,
    trailing: /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.share,
        size: 17
      }),
      onClick: () => setOverlay({
        name: 'share',
        label: com.name
      })
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 132,
      background: tones[com.tone] || 'var(--plum)',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      backgroundImage: 'radial-gradient(circle at 25% 30%, rgba(255,255,255,0.18), transparent 55%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: -20,
      bottom: -30,
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 150,
      color: 'rgba(255,255,255,0.12)',
      lineHeight: 1
    }
  }, com.tag))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 14,
      marginTop: -34
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 76,
      height: 76,
      borderRadius: 18,
      background: tones[com.tone] || 'var(--plum)',
      color: 'var(--paper)',
      border: '3px solid var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 28,
      flexShrink: 0
    }
  }, com.tag), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      paddingBottom: 4,
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8
    }
  }, isAdmin && /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.settings,
      size: 15
    }),
    onClick: () => push({
      name: 'community-manage',
      id: com.id
    })
  }, "Manage", reqCount + pendCount > 0 ? ` · ${reqCount + pendCount}` : ''), !isAdmin && /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: isMember ? 'secondary' : requested ? 'secondary' : 'dark',
    onClick: onJoinClick
  }, joinLabel))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      margin: '12px 0 4px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 23,
      letterSpacing: '-0.025em',
      margin: 0
    }
  }, com.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--ink-mute)',
      lineHeight: 1.5
    }
  }, com.short), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      marginTop: 10,
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink)',
      fontFamily: 'var(--font-mono)'
    }
  }, com.members.toLocaleString('en-IN')), " members"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink)',
      fontFamily: 'var(--font-mono)'
    }
  }, com.posts.toLocaleString('en-IN')), " posts"), /*#__PURE__*/React.createElement("span", null, "by @", founder.handle)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 10px',
      borderRadius: 999,
      background: 'var(--bone)',
      border: '1px solid var(--border-strong)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: isPrivate ? Icons.shield : Icons.globe,
    size: 13,
    style: {
      color: 'var(--ink-mute)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: 'var(--ink-soft)'
    }
  }, isPrivate ? 'Private' : 'Public')), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 10px',
      borderRadius: 999,
      background: postMode === 'approval' ? 'var(--grail-gold-soft)' : 'var(--forest-soft)',
      border: `1px solid ${postMode === 'approval' ? 'var(--grail-gold)' : 'var(--forest)'}`
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: postMode === 'approval' ? Icons.shield : Icons.check,
    size: 13,
    style: {
      color: postMode === 'approval' ? 'var(--grail-gold-deep)' : 'var(--forest)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: postMode === 'approval' ? 'var(--grail-gold-deep)' : 'var(--forest)'
    }
  }, postMode === 'approval' ? 'Posts reviewed' : 'Open posting')), isAdmin && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 10px',
      borderRadius: 999,
      background: 'var(--ink)',
      border: '1px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 13,
    style: {
      color: 'var(--paper)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: 'var(--paper)'
    }
  }, "You\u2019re an admin")))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 3,
      background: 'var(--paper)',
      padding: '16px 16px 10px',
      marginTop: 14,
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    value: activeTab,
    onChange: setTab,
    options: tabs
  })), locked ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '8px 0 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 15,
      background: 'var(--bone)',
      border: '1px solid var(--border-strong)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--ink-mute)',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 17
    }
  }, "This community is private"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-faint)',
      marginTop: 6,
      maxWidth: 280,
      lineHeight: 1.55
    }
  }, "Posts and members are visible once an admin approves your request to join."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: requested ? 'secondary' : 'dark',
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: requested ? Icons.clock : Icons.userPlus,
      size: 17
    }),
    onClick: onJoinClick
  }, requested ? 'Request pending — tap to withdraw' : 'Request to join'))), /*#__PURE__*/React.createElement(RulesAndAdmins, {
    com: com,
    admins: admins,
    push: push
  })) : activeTab === 'posts' ? /*#__PURE__*/React.createElement("div", null, isMember && (accepted ? /*#__PURE__*/React.createElement("button", {
    onClick: startCompose,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: 'calc(100% - 32px)',
      margin: '14px 16px 4px',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '11px 14px',
      cursor: 'pointer',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "You",
    color: "var(--ink)",
    size: 30
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--ink-faint)'
    }
  }, postMode === 'approval' ? `Suggest a post to ${com.name}…` : `Share something with ${com.name}…`)) : /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '14px 16px 4px',
      background: 'var(--bone)',
      border: '1px solid var(--border)',
      borderRadius: 13,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 17,
    style: {
      color: 'var(--ink-mute)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "Read the guidelines before posting")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      lineHeight: 1.5,
      margin: '7px 0 12px'
    }
  }, com.name, " asks every member to accept its house rules before their first post."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    onClick: () => setTab('about')
  }, "View rules"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "dark",
    onClick: () => {
      setAccepted(true);
      flashToast('Guidelines accepted — you can post now');
    }
  }, "Accept & continue")))), !isMember && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '14px 16px 4px',
      textAlign: 'center',
      fontSize: 13,
      color: 'var(--ink-faint)',
      padding: '8px 0'
    }
  }, isPrivate ? 'Request to join to post here.' : 'Join to post and join the conversation.'), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '8px 0 0'
    }
  }, posts.map(p => /*#__PURE__*/React.createElement(PostCard, {
    key: p.id,
    post: p
  })), posts.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, "Quiet so far \u2014 be the first to post."))) : activeTab === 'members' ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, members.length, " members"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginTop: 12
    }
  }, members.map(h => {
    const mu = h === 'you' ? {
      ...ME,
      name: 'You',
      handle: 'you'
    } : userOf(h);
    const role = roleOf(com.id, h);
    return /*#__PURE__*/React.createElement("button", {
      key: h,
      onClick: () => push({
        name: 'profile',
        user: h
      }),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        padding: 10,
        cursor: 'pointer',
        background: 'var(--paper-soft)',
        border: '1px solid var(--border)',
        borderRadius: 13
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: mu.name,
      color: mu.color,
      size: 40,
      verified: role && mu.tier !== 'Verified'
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        fontSize: 14
      }
    }, mu.name), h !== 'you' && /*#__PURE__*/React.createElement(TierChip, {
      tier: mu.tier
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-faint)'
      }
    }, "@", mu.handle)), role && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '4px 9px',
        borderRadius: 7,
        background: role === 'Founder' ? 'var(--ink)' : 'var(--bone-deep)',
        color: role === 'Founder' ? 'var(--paper)' : 'var(--ink-mute)',
        fontWeight: 700
      }
    }, role));
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement(RulesAndAdmins, {
    com: com,
    admins: admins,
    push: push
  }), isMember && !accepted && /*#__PURE__*/React.createElement(Button, {
    size: "block",
    variant: "primary",
    style: {
      marginTop: 16
    },
    onClick: () => {
      setAccepted(true);
      setTab('posts');
      flashToast('Guidelines accepted — you can post now');
    }
  }, "Accept guidelines"), accepted && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      color: 'var(--forest)',
      fontSize: 13,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.check,
    size: 16,
    stroke: 2.4
  }), "You\u2019ve accepted these guidelines.")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  }));
}

// Rules list + admins list (shared by About tab and the private lock)
function RulesAndAdmins({
  com,
  admins,
  push
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionLabel, null, "Community rules"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 12
    }
  }, com.rules.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 11,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: 6,
      background: 'var(--bone)',
      color: 'var(--ink-mute)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      fontWeight: 600,
      flexShrink: 0
    }
  }, i + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--ink-soft)',
      lineHeight: 1.5,
      paddingTop: 1
    }
  }, r)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Admins & mods")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9,
      marginTop: 12
    }
  }, admins.map(a => {
    const au = a.handle === 'you' ? {
      ...ME,
      name: 'You',
      handle: 'you'
    } : userOf(a.handle);
    return /*#__PURE__*/React.createElement("button", {
      key: a.handle,
      onClick: () => push({
        name: 'profile',
        user: a.handle
      }),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        padding: 12,
        cursor: 'pointer',
        background: 'var(--paper-soft)',
        border: '1px solid var(--border)',
        borderRadius: 13
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: au.name,
      color: au.color,
      size: 42,
      verified: au.tier !== 'Verified'
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        fontSize: 14
      }
    }, au.name), a.handle !== 'you' && /*#__PURE__*/React.createElement(TierChip, {
      tier: au.tier
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-faint)'
      }
    }, "@", au.handle)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '4px 9px',
        borderRadius: 7,
        background: a.role === 'Founder' ? 'var(--ink)' : 'var(--bone-deep)',
        color: a.role === 'Founder' ? 'var(--paper)' : 'var(--ink-mute)',
        fontWeight: 700
      }
    }, a.role));
  })));
}
Object.assign(window, {
  CommunityDetail,
  RulesAndAdmins
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/CommunityDetail.jsx", error: String((e && e.message) || e) }); }

// app/CommunityManage.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Manage community — admin dashboard (BRD §9.12)
// Join requests · pending posts · members & roles · settings.
// Admins = founder + mods (adminsOf). Moderation is local prototype state.
// ─────────────────────────────────────────────────────────────

function CommunityManageView({
  route
}) {
  const {
    pop,
    push,
    flashToast
  } = useNav();
  const {
    userCommunities
  } = useAppState();
  const com = COMMUNITIES.find(c => c.id === route.id) || (userCommunities || []).find(c => c.id === route.id);
  if (!com) return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Manage community"
    })
  }, /*#__PURE__*/React.createElement(EmptyNote, null, "Community not found."));
  const isPrivate = com.privacy === 'private' || com.invite;
  const [seg, setSeg] = React.useState('requests');

  // local moderation state (seeded from data)
  const [requests, setRequests] = React.useState(joinRequestsOf(com.id));
  const [pending, setPending] = React.useState(pendingPostsOf(com.id));
  const [members, setMembers] = React.useState(membersOf(com.id).map(h => ({
    handle: h,
    role: roleOf(com.id, h)
  })));
  const [memberCount, setMemberCount] = React.useState(com.members);
  const [privacy, setPrivacy] = React.useState(isPrivate ? 'private' : 'public');
  const [posting, setPosting] = React.useState(postModeOf(com.id));
  const approveReq = h => {
    setRequests(r => r.filter(x => x !== h));
    setMembers(m => [...m, {
      handle: h,
      role: null
    }]);
    setMemberCount(c => c + 1);
    flashToast(`@${h} approved`);
  };
  const declineReq = h => {
    setRequests(r => r.filter(x => x !== h));
    flashToast(`@${h} declined`);
  };
  const approvePost = id => {
    setPending(p => p.filter(x => x.id !== id));
    flashToast('Post approved & published');
  };
  const declinePost = id => {
    setPending(p => p.filter(x => x.id !== id));
    flashToast('Post declined');
  };
  const promote = h => {
    setMembers(m => m.map(x => x.handle === h ? {
      ...x,
      role: x.role === 'Mod' ? null : 'Mod'
    } : x));
  };
  const removeMember = h => {
    setMembers(m => m.filter(x => x.handle !== h));
    setMemberCount(c => Math.max(0, c - 1));
    flashToast(`@${h} removed`);
  };
  const tabs = [{
    id: 'requests',
    label: `Requests${requests.length ? ` ${requests.length}` : ''}`
  }, {
    id: 'posts',
    label: `Posts${pending.length ? ` ${pending.length}` : ''}`
  }, {
    id: 'members',
    label: 'Members'
  }, {
    id: 'settings',
    label: 'Settings'
  }];
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Manage community",
      subtitle: com.name
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      padding: '14px 16px 4px'
    }
  }, /*#__PURE__*/React.createElement(ManageStat, {
    n: memberCount,
    l: "Members",
    accent: "var(--ink)"
  }), /*#__PURE__*/React.createElement(ManageStat, {
    n: requests.length,
    l: "Requests",
    accent: requests.length ? 'var(--stamp-red)' : 'var(--ink-mute)'
  }), /*#__PURE__*/React.createElement(ManageStat, {
    n: pending.length,
    l: "To review",
    accent: pending.length ? 'var(--grail-gold-deep)' : 'var(--ink-mute)'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 3,
      background: 'var(--paper)',
      padding: '12px 16px 10px',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    value: seg,
    onChange: setSeg,
    options: tabs
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, seg === 'requests' && (isPrivate ? requests.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, requests.map(h => {
    const u = userOf(h);
    return /*#__PURE__*/React.createElement("div", {
      key: h,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: 11,
        background: 'var(--paper-soft)',
        border: '1px solid var(--border)',
        borderRadius: 13
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => push({
        name: 'profile',
        user: h
      }),
      style: {
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: u.name,
      color: u.color,
      size: 40
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        fontSize: 14
      }
    }, u.name), /*#__PURE__*/React.createElement(TierChip, {
      tier: u.tier
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-faint)'
      }
    }, "@", u.handle, " \xB7 ", u.deals, " deals \xB7 ", u.vouchesReceived, " vouches")), /*#__PURE__*/React.createElement("button", {
      onClick: () => declineReq(h),
      "aria-label": "Decline",
      style: {
        width: 34,
        height: 34,
        borderRadius: 9,
        border: '1px solid var(--border-strong)',
        background: 'var(--paper)',
        color: 'var(--ink-mute)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: Icons.close,
      size: 15,
      stroke: 2.4
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => approveReq(h),
      "aria-label": "Approve",
      style: {
        width: 34,
        height: 34,
        borderRadius: 9,
        border: '1px solid var(--forest)',
        background: 'var(--forest)',
        color: 'var(--paper)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: Icons.check,
      size: 16,
      stroke: 2.6
    })));
  })) : /*#__PURE__*/React.createElement(EmptyNote, null, "No pending join requests.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      alignItems: 'flex-start',
      padding: 13,
      background: 'var(--bone)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      fontSize: 12.5,
      color: 'var(--ink-soft)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.globe,
    size: 15,
    style: {
      flexShrink: 0,
      marginTop: 1,
      color: 'var(--ink-faint)'
    }
  }), "This is a ", /*#__PURE__*/React.createElement("b", null, "public"), " community \u2014 anyone can join instantly, so there are no requests to approve. Switch to private in Settings to review members.")), seg === 'posts' && (pending.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 11
    }
  }, pending.map(p => {
    const u = userOf(p.author);
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      style: {
        background: 'var(--paper-soft)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 13px 0'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: u.name,
      color: u.color,
      size: 32
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 600
      }
    }, u.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-faint)'
      }
    }, "@", u.handle, " \xB7 ", p.time)), /*#__PURE__*/React.createElement(PostTypeTag, {
      type: p.type
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--ink-soft)',
        lineHeight: 1.55,
        padding: '10px 13px 12px'
      }
    }, p.text), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 9,
        padding: '0 13px 13px'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      style: {
        flex: 1,
        justifyContent: 'center',
        color: 'var(--stamp-red)',
        borderColor: 'var(--border-strong)'
      },
      onClick: () => declinePost(p.id)
    }, "Decline"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "dark",
      style: {
        flex: 1,
        justifyContent: 'center'
      },
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.check,
        size: 15
      }),
      onClick: () => approvePost(p.id)
    }, "Approve")));
  })) : /*#__PURE__*/React.createElement(EmptyNote, null, "Nothing waiting for review. ", posting === 'open' ? 'Posts publish instantly here.' : '')), seg === 'members' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, members.map(m => {
    const u = m.handle === 'you' ? {
      ...ME,
      name: 'You',
      handle: 'you'
    } : userOf(m.handle);
    const isYou = m.handle === 'you';
    const isFounder = m.role === 'Founder';
    return /*#__PURE__*/React.createElement("div", {
      key: m.handle,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: 10,
        background: 'var(--paper-soft)',
        border: '1px solid var(--border)',
        borderRadius: 13
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: u.name,
      color: u.color,
      size: 38
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        fontSize: 14
      }
    }, u.name), m.role && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 9.5,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '2px 6px',
        borderRadius: 6,
        background: isFounder ? 'var(--ink)' : 'var(--bone-deep)',
        color: isFounder ? 'var(--paper)' : 'var(--ink-mute)',
        fontWeight: 700
      }
    }, m.role)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-faint)'
      }
    }, "@", u.handle)), !isFounder && !isYou && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: () => promote(m.handle),
      style: {
        fontSize: 11.5,
        fontWeight: 600,
        padding: '6px 10px',
        borderRadius: 8,
        border: '1px solid var(--border-strong)',
        background: m.role === 'Mod' ? 'var(--bone)' : 'var(--paper)',
        color: 'var(--ink-soft)',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }
    }, m.role === 'Mod' ? 'Remove mod' : 'Make mod'), /*#__PURE__*/React.createElement("button", {
      onClick: () => removeMember(m.handle),
      "aria-label": "Remove member",
      style: {
        width: 32,
        height: 32,
        borderRadius: 8,
        border: '1px solid var(--border-strong)',
        background: 'var(--paper)',
        color: 'var(--stamp-red)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: Icons.close,
      size: 14,
      stroke: 2.4
    }))));
  })), seg === 'settings' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "Privacy"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      margin: '11px 0 20px'
    }
  }, /*#__PURE__*/React.createElement(CCRadioRow, {
    title: "Public",
    sub: "Anyone can find and join instantly",
    on: privacy === 'public',
    onClick: () => {
      setPrivacy('public');
      flashToast('Community is now public');
    }
  }), /*#__PURE__*/React.createElement(CCRadioRow, {
    title: "Private",
    sub: "People request to join \u2014 you approve them",
    on: privacy === 'private',
    onClick: () => {
      setPrivacy('private');
      flashToast('Community is now private');
    }
  })), /*#__PURE__*/React.createElement(SectionLabel, null, "Who can post"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      margin: '11px 0 20px'
    }
  }, /*#__PURE__*/React.createElement(CCRadioRow, {
    title: "Anyone can post",
    sub: "Members post freely",
    on: posting === 'open',
    onClick: () => {
      setPosting('open');
      flashToast('Members can post freely');
    }
  }), /*#__PURE__*/React.createElement(CCRadioRow, {
    title: "Admin-approved",
    sub: "Posts are reviewed before they show",
    on: posting === 'approval',
    onClick: () => {
      setPosting('approval');
      flashToast('Posts will be reviewed');
    }
  })), /*#__PURE__*/React.createElement(SectionLabel, null, "Rules"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      margin: '11px 0 14px'
    }
  }, com.rules.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      padding: '10px 12px',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--ink-faint)',
      flexShrink: 0
    }
  }, i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-soft)',
      lineHeight: 1.45
    }
  }, r)))), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "block",
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.edit,
      size: 16
    }),
    onClick: () => flashToast('Editing community details — coming soon')
  }, "Edit details & rules"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      paddingTop: 18,
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "block",
    style: {
      color: 'var(--stamp-red)',
      borderColor: 'var(--stamp-red)'
    },
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.close,
      size: 16,
      stroke: 2.4
    }),
    onClick: () => flashToast('Archiving needs a second confirmation')
  }, "Archive community")))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  }));
}
Object.assign(window, {
  CommunityManageView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/CommunityManage.jsx", error: String((e && e.message) || e) }); }

// app/CommunityView.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Community directory — BRD §9.12
// Joined communities + discover, search by category.
// ─────────────────────────────────────────────────────────────

function CommunityView() {
  const {
    push,
    setOverlay,
    flashToast
  } = useNav();
  const {
    joined,
    userCommunities
  } = useAppState();
  const [cats, setCats] = React.useState([]); // [] = all
  const toggleCat = id => setCats(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id]);
  const all = [...(userCommunities || []), ...COMMUNITIES];
  const joinedList = all.filter(c => joined[c.id] || c.founder === 'you');
  const joinedIds = new Set(joinedList.map(c => c.id));
  let discover = all.filter(c => !joinedIds.has(c.id));
  if (cats.length > 0) discover = discover.filter(c => cats.includes(c.cat));
  return /*#__PURE__*/React.createElement(Screen, {
    header: /*#__PURE__*/React.createElement(AppBar, {
      title: "Community"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      padding: '14px 16px 0',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOverlay({
      name: 'search'
    }),
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      height: 40,
      padding: '0 14px',
      borderRadius: 11,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      color: 'var(--ink-faint)',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.search,
    size: 18
  }), "Find a community\u2026"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "primary",
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.plusCircle,
      size: 15
    }),
    onClick: () => push({
      name: 'create-community'
    })
  }, "Create")), joinedList.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 16px 0'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Your communities"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 10
    }
  }, joinedList.map(c => /*#__PURE__*/React.createElement(CommunityCard, {
    key: c.id,
    com: c,
    onOpen: () => push({
      name: 'community-detail',
      id: c.id
    })
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 16px 0'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Discover"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      margin: '10px 0',
      overflowX: 'auto',
      paddingRight: 16,
      paddingBottom: 2
    }
  }, /*#__PURE__*/React.createElement(CategoryChip, {
    active: cats.length === 0,
    onClick: () => setCats([])
  }, "All"), CATEGORIES.map(c => /*#__PURE__*/React.createElement(CategoryChip, {
    key: c.id,
    active: cats.includes(c.id),
    onClick: () => toggleCat(c.id)
  }, c.short))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, discover.map(c => /*#__PURE__*/React.createElement(CommunityCard, {
    key: c.id,
    com: c,
    onOpen: () => push({
      name: 'community-detail',
      id: c.id
    })
  })), discover.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, "You\u2019ve joined everything in this category."))));
}
function SectionLabel({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--ink-faint)'
    }
  }, children);
}
function EmptyNote({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 0',
      textAlign: 'center',
      color: 'var(--ink-faint)',
      fontSize: 13
    }
  }, children);
}
Object.assign(window, {
  CommunityView,
  SectionLabel,
  EmptyNote
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/CommunityView.jsx", error: String((e && e.message) || e) }); }

// app/CreateCommunity.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Create a community — app-wide flow (BRD §8.8 CM-04)
// Used from the Community tab AND when a host creates a community for
// their event (route.forEvent → binds back to the event on submit).
// Communities are reviewed before they go public.
// ─────────────────────────────────────────────────────────────

function ccFieldStyle(bad) {
  return {
    width: '100%',
    boxSizing: 'border-box',
    height: 46,
    padding: '0 13px',
    borderRadius: 11,
    border: `1px solid ${bad ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
    background: 'var(--paper-soft)',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    color: 'var(--ink)',
    outline: 'none'
  };
}
function CCLbl({
  children,
  req,
  miss,
  hint
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 9,
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, children), req && /*#__PURE__*/React.createElement("span", {
    style: {
      color: miss ? 'var(--stamp-red)' : 'var(--ink-ghost)',
      fontSize: 13,
      fontWeight: 700
    }
  }, "*"), hint && !miss && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--ink-ghost)',
      marginLeft: 'auto'
    }
  }, hint), miss && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--stamp-red)',
      marginLeft: 'auto',
      fontWeight: 600
    }
  }, "Required"));
}
function CCRadioRow({
  title,
  sub,
  on,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 11,
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      padding: '12px 13px',
      borderRadius: 12,
      border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
      background: on ? 'var(--bone)' : 'var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      borderRadius: '50%',
      flexShrink: 0,
      marginTop: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `2px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`
    }
  }, on && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--ink)'
    }
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 12,
      color: 'var(--ink-faint)',
      marginTop: 2,
      lineHeight: 1.4
    }
  }, sub)));
}
function CreateCommunityView({
  route
}) {
  const {
    pop,
    push,
    flashToast
  } = useNav();
  const {
    addCommunity,
    bindEventCommunity
  } = useAppState();
  const forEvent = route && route.forEvent; // event id when launched from the event flow

  const [name, setName] = React.useState(route && route.prefillName || '');
  const [cats, setCats] = React.useState(route && route.prefillCat ? [route.prefillCat] : []);
  const toggleCat = id => setCats(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id]);
  const [desc, setDesc] = React.useState('');
  const [privacy, setPrivacy] = React.useState('public'); // public | invite
  const [posting, setPosting] = React.useState('open'); // open | approval
  const [rules, setRules] = React.useState('');
  const [tried, setTried] = React.useState(false);
  const miss = {
    name: !name.trim(),
    desc: !desc.trim()
  };
  const invalid = miss.name || miss.desc;
  const setRule = (i, v) => setRules(rs => rs.map((r, idx) => idx === i ? v : r));
  const submit = () => {
    if (invalid) {
      setTried(true);
      flashToast('Add a name and a short description');
      return;
    }
    const id = (forEvent ? 'c-' : 'com-') + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 14) + '-' + Date.now().toString().slice(-4);
    const tone = ['plum', 'forest', 'teal', 'red', 'ink', 'gold'][Math.floor(Math.random() * 6)];
    const com = {
      id,
      name: name.trim(),
      tag: (name.trim().replace(/[^A-Za-z]/g, '').slice(0, 2) || 'CH').toUpperCase(),
      tone,
      cat: cats[0] || 'figures',
      cats: cats.slice(),
      short: desc.trim(),
      members: 1,
      posts: 0,
      founder: 'you',
      invite: privacy === 'invite',
      postMode: posting,
      rules: rules.trim() ? rules.split('\n').map(r => r.trim()).filter(Boolean) : ['Be decent — keep it collector-friendly', 'Trades are off-platform; vouch after'],
      forEvent: forEvent || undefined
    };
    addCommunity(com);
    if (forEvent) {
      bindEventCommunity(id);
      pop();
      flashToast('Community created — bound to your event');
    } else {
      pop();
      flashToast('Community submitted — live after a quick review');
    }
  };
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: forEvent ? 'Community for your event' : 'Create a community',
      subtitle: forEvent ? 'Attendees can talk, network & post' : 'Reviewed before it goes public',
      trailing: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "dark",
        onClick: submit,
        style: invalid ? {
          opacity: 0.5
        } : null
      }, forEvent ? 'Done' : 'Submit')
    }),
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--paper)',
        padding: '11px 16px 30px'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "dark",
      size: "block",
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: forEvent ? Icons.check : Icons.shield,
        size: 18
      }),
      onClick: submit,
      style: invalid ? {
        opacity: 0.5
      } : null
    }, forEvent ? 'Create & bind to event' : 'Submit for review'), !forEvent && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        fontSize: 11.5,
        color: 'var(--ink-faint)',
        marginTop: 8
      }
    }, "CollectorHub reviews new communities before they're public."))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 16px 16px'
    }
  }, /*#__PURE__*/React.createElement(CCLbl, {
    req: true,
    miss: tried && miss.name
  }, "Community name"), /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "e.g. Mumbai Figure Heads",
    style: ccFieldStyle(tried && miss.name)
  }), /*#__PURE__*/React.createElement(CCLbl, {
    req: true
  }, "Category ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 400,
      color: 'var(--ink-faint)'
    }
  }, "(pick one or more)")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, CATEGORIES.map(c => {
    const on = cats.includes(c.id);
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => toggleCat(c.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 13px',
        borderRadius: 12,
        cursor: 'pointer',
        textAlign: 'left',
        border: `1.5px solid ${on ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
        background: on ? 'rgba(255,36,66,0.06)' : 'var(--paper-soft)',
        transition: 'all 150ms'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 32,
        height: 32,
        borderRadius: 8,
        flexShrink: 0,
        background: on ? 'var(--stamp-red)' : 'var(--bone)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 150ms'
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: c.id === 'figures' ? Icons.user : c.id === 'designer' ? Icons.star : c.id === 'kits' ? Icons.box : Icons.tag,
      size: 16,
      style: {
        color: on ? 'var(--paper)' : 'var(--ink-faint)'
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-body)',
        fontWeight: on ? 700 : 500,
        fontSize: 13,
        color: on ? 'var(--stamp-red)' : 'var(--ink)',
        lineHeight: 1.3
      }
    }, c.label));
  })), /*#__PURE__*/React.createElement(CCLbl, {
    req: true,
    miss: tried && miss.desc
  }, "Short description"), /*#__PURE__*/React.createElement("textarea", {
    value: desc,
    onChange: e => setDesc(e.target.value.slice(0, 140)),
    rows: 2,
    placeholder: "What this community is about \u2014 one line.",
    style: {
      ...ccFieldStyle(tried && miss.desc),
      height: 'auto',
      padding: '11px 13px',
      lineHeight: 1.5,
      resize: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      textAlign: 'right',
      margin: '5px 2px 0'
    }
  }, desc.length, "/140"), /*#__PURE__*/React.createElement(CCLbl, {
    req: true
  }, "Who can join"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(CCRadioRow, {
    title: "Public",
    sub: "Anyone can find and join",
    on: privacy === 'public',
    onClick: () => setPrivacy('public')
  }), /*#__PURE__*/React.createElement(CCRadioRow, {
    title: "Invite-only",
    sub: "People join by approval or invite",
    on: privacy === 'invite',
    onClick: () => setPrivacy('invite')
  })), /*#__PURE__*/React.createElement(CCLbl, {
    req: true
  }, "Who can post"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(CCRadioRow, {
    title: "Anyone can post",
    sub: "Members post freely",
    on: posting === 'open',
    onClick: () => setPosting('open')
  }), /*#__PURE__*/React.createElement(CCRadioRow, {
    title: "Admin-approved",
    sub: "Posts are reviewed before they show",
    on: posting === 'approval',
    onClick: () => setPosting('approval')
  })), /*#__PURE__*/React.createElement(CCLbl, {
    hint: "optional"
  }, "Community rules & terms"), /*#__PURE__*/React.createElement("textarea", {
    value: rules,
    onChange: e => setRules(e.target.value),
    rows: 7,
    placeholder: `1. Be respectful — no harassment or hate speech.\n2. No spam or self-promotion without context.\n3. Trades are off-platform — always vouch after a deal.\n4. Verified photos only for listings...`,
    style: {
      ...ccFieldStyle(false),
      height: 'auto',
      padding: '12px 13px',
      lineHeight: 1.6,
      resize: 'vertical',
      minHeight: 160,
      fontFamily: 'var(--font-body)',
      fontSize: 13.5
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      margin: '6px 2px 0',
      lineHeight: 1.5
    }
  }, "One rule per line. You can edit rules and manage members after the community goes live.")));
}
Object.assign(window, {
  CreateCommunityView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/CreateCommunity.jsx", error: String((e && e.message) || e) }); }

// app/EventCreate.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Host an event — create flow (BRD §9.13 EV-02)
// Facebook-style: no tickets. Multi-category, start + end time.
// Binds to a NEW community (you become admin) or an EXISTING one you own.
// Submits for app-owner approval.
// ─────────────────────────────────────────────────────────────

const EV_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EV_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  if (isNaN(d)) return null;
  return {
    date: String(d.getDate()).padStart(2, '0'),
    month: EV_MONTHS[d.getMonth()],
    day: EV_DAYS[d.getDay()]
  };
}
function slugify(s) {
  return (s || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 14);
}
function evFieldStyle(bad) {
  return {
    width: '100%',
    boxSizing: 'border-box',
    height: 46,
    padding: '0 13px',
    borderRadius: 11,
    border: `1px solid ${bad ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
    background: 'var(--paper-soft)',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    color: 'var(--ink)',
    outline: 'none'
  };
}
function EvLbl({
  children,
  req,
  miss,
  hint
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 9,
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, children), req && /*#__PURE__*/React.createElement("span", {
    style: {
      color: miss ? 'var(--stamp-red)' : 'var(--ink-ghost)',
      fontSize: 13,
      fontWeight: 700
    }
  }, "*"), hint && !miss && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--ink-ghost)',
      marginLeft: 'auto'
    }
  }, hint), miss && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--stamp-red)',
      marginLeft: 'auto',
      fontWeight: 600
    }
  }, "Required"));
}
function EventCreateView() {
  const {
    pop,
    push,
    flashToast
  } = useNav();
  const {
    addEvent,
    addCommunity,
    userCommunities,
    eventCommunityDraft,
    clearEventCommunityDraft
  } = useAppState();
  const fileRef = React.useRef(null);
  const [cover, setCover] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [cats, setCats] = React.useState([]); // multi-select
  const [mode, setMode] = React.useState('In person');
  const [date, setDate] = React.useState('');
  const [endDate, setEndDate] = React.useState(''); // optional — multi-day events
  const [time, setTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [venue, setVenue] = React.useState('');
  const [city, setCity] = React.useState(ME.city || '');
  const [about, setAbout] = React.useState('');
  const [bring, setBring] = React.useState('');
  const [comMode, setComMode] = React.useState('none'); // none | create | existing
  const [existingCom, setExistingCom] = React.useState('');
  const [createdCom, setCreatedCom] = React.useState(null); // community made via the create flow
  const [tried, setTried] = React.useState(false);

  // existing-community option: only communities YOU own (founder === 'you')
  const ownedComs = [...(userCommunities || []), ...COMMUNITIES].filter(c => c.founder === 'you');

  // when the create-community screen hands a community back, bind it here
  React.useEffect(() => {
    if (eventCommunityDraft) {
      const com = (userCommunities || []).find(c => c.id === eventCommunityDraft);
      if (com) {
        setCreatedCom(com);
        setComMode('create');
      }
      clearEventCommunityDraft();
    }
  }, [eventCommunityDraft]);
  const online = mode === 'Online';
  const miss = {
    title: !title.trim(),
    cats: cats.length === 0,
    date: !date,
    time: !time.trim(),
    venue: !venue.trim(),
    city: !online && !city.trim(),
    about: !about.trim(),
    endDate: endDate && date && endDate < date,
    community: comMode === 'existing' ? !existingCom : comMode === 'create' ? !createdCom : false
  };
  const invalid = Object.values(miss).some(Boolean);
  const toggleCat = id => setCats(cs => cs.includes(id) ? cs.filter(c => c !== id) : [...cs, id]);
  const onCover = e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setCover(r.result);
    r.readAsDataURL(f);
  };
  const launchCreateCommunity = () => push({
    name: 'create-community',
    forEvent: 'draft',
    prefillName: title.trim(),
    prefillCat: cats[0] || 'figures'
  });
  const submit = () => {
    if (invalid) {
      setTried(true);
      flashToast('Fill the required fields marked *');
      return;
    }
    const pd = parseDate(date) || {
      date: '01',
      month: 'Jan',
      day: 'Mon'
    };
    const ped = endDate ? parseDate(endDate) : null;
    const id = slugify(title) + '-' + Date.now().toString().slice(-4);
    const communityId = comMode === 'existing' ? existingCom : comMode === 'create' && createdCom ? createdCom.id : null;

    // date / time display string
    const sameDay = !ped || ped.date === pd.date && ped.month === pd.month;
    const dateStr = sameDay ? `${pd.day} · ${pd.date} ${pd.month}` : `${pd.date} ${pd.month} – ${ped.date} ${ped.month}`;
    const timeStr = `${time.trim()}${endTime.trim() ? ` – ${endTime.trim()}` : ''}`;
    const whenRange = `${dateStr} · ${timeStr}`;
    addEvent({
      id,
      title: title.trim(),
      cats,
      mode,
      date: pd.date,
      month: pd.month,
      day: pd.day,
      endDate: ped ? ped.date : undefined,
      endMonth: ped ? ped.month : undefined,
      multiDay: !sameDay,
      time: time.trim(),
      endTime: endTime.trim() || undefined,
      when: whenRange,
      where: venue.trim(),
      city: online ? 'Online' : city.trim(),
      about: about.trim(),
      bring: bring.trim() || undefined,
      host: 'you',
      community: communityId,
      status: 'pending',
      going: [],
      interested: [],
      cover: cover || undefined
    });
    pop();
    flashToast('Submitted for approval — find it under “Hosting”');
  };
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Host an event",
      subtitle: "Reviewed before it goes live",
      trailing: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "dark",
        onClick: submit,
        style: invalid ? {
          opacity: 0.5
        } : null
      }, "Submit")
    }),
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--paper)',
        padding: '11px 16px 30px'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "dark",
      size: "block",
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.shield,
        size: 18
      }),
      onClick: submit,
      style: invalid ? {
        opacity: 0.5
      } : null
    }, "Submit for approval"), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        fontSize: 11.5,
        color: 'var(--ink-faint)',
        marginTop: 8
      }
    }, "CollectorHub reviews every event before it\u2019s public."))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 16px 16px'
    }
  }, /*#__PURE__*/React.createElement(EvLbl, {
    hint: "optional"
  }, "Cover photo"), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    onChange: onCover,
    style: {
      display: 'none'
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => fileRef.current && fileRef.current.click(),
    style: {
      position: 'relative',
      width: '100%',
      aspectRatio: '2 / 1',
      borderRadius: 14,
      overflow: 'hidden',
      cursor: 'pointer',
      border: '1px solid var(--border-strong)',
      padding: 0,
      background: 'var(--paper-soft)'
    }
  }, cover ? /*#__PURE__*/React.createElement("img", {
    src: cover,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      color: 'var(--ink-mute)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.camera,
    size: 24
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, "Add a cover photo"))), /*#__PURE__*/React.createElement(EvLbl, {
    req: true,
    miss: tried && miss.title
  }, "Event title"), /*#__PURE__*/React.createElement("input", {
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: "e.g. Mumbai Collector Meet \xB7 Vol 5",
    style: evFieldStyle(tried && miss.title)
  }), /*#__PURE__*/React.createElement(EvLbl, {
    req: true,
    miss: tried && miss.cats,
    hint: "pick one or more"
  }, "Categories"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      flexWrap: 'wrap'
    }
  }, CATEGORIES.map(c => {
    const on = cats.includes(c.id);
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => toggleCat(c.id),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 13px',
        borderRadius: 999,
        cursor: 'pointer',
        background: on ? 'var(--ink)' : 'var(--paper-soft)',
        color: on ? 'var(--paper)' : 'var(--ink)',
        border: `1px solid ${on ? 'var(--ink)' : tried && miss.cats ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        fontSize: 13,
        lineHeight: 1
      }
    }, on && /*#__PURE__*/React.createElement(Ico, {
      d: Icons.check,
      size: 13,
      stroke: 2.6
    }), c.short);
  })), /*#__PURE__*/React.createElement(EvLbl, {
    req: true
  }, "Format"), /*#__PURE__*/React.createElement(Segmented, {
    value: mode,
    onChange: setMode,
    options: [{
      id: 'In person',
      label: 'In person'
    }, {
      id: 'Online',
      label: 'Online'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(EvLbl, {
    req: true,
    miss: tried && miss.date
  }, "Start date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: date,
    onChange: e => setDate(e.target.value),
    style: {
      ...evFieldStyle(tried && miss.date),
      fontFamily: 'var(--font-mono)',
      fontSize: 13
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(EvLbl, {
    miss: tried && miss.endDate,
    hint: "optional"
  }, "End date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: endDate,
    min: date || undefined,
    onChange: e => setEndDate(e.target.value),
    style: {
      ...evFieldStyle(tried && miss.endDate),
      fontFamily: 'var(--font-mono)',
      fontSize: 13
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(EvLbl, {
    req: true,
    miss: tried && miss.time
  }, "Start time"), /*#__PURE__*/React.createElement("input", {
    value: time,
    onChange: e => setTime(e.target.value),
    placeholder: "e.g. 4:00 pm",
    style: evFieldStyle(tried && miss.time)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(EvLbl, {
    hint: "optional"
  }, "End time"), /*#__PURE__*/React.createElement("input", {
    value: endTime,
    onChange: e => setEndTime(e.target.value),
    placeholder: "e.g. 8:00 pm",
    style: evFieldStyle(false)
  }))), /*#__PURE__*/React.createElement(EvLbl, {
    req: true,
    miss: tried && miss.venue
  }, online ? 'Stream / link name' : 'Venue'), /*#__PURE__*/React.createElement("input", {
    value: venue,
    onChange: e => setVenue(e.target.value),
    placeholder: online ? 'e.g. CollectorHub Live' : 'e.g. Phoenix Marketcity, Kurla',
    style: evFieldStyle(tried && miss.venue)
  }), !online && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(EvLbl, {
    req: true,
    miss: tried && miss.city
  }, "City"), /*#__PURE__*/React.createElement("input", {
    value: city,
    onChange: e => setCity(e.target.value),
    placeholder: "e.g. Mumbai",
    style: evFieldStyle(tried && miss.city)
  })), /*#__PURE__*/React.createElement(EvLbl, {
    req: true,
    miss: tried && miss.about
  }, "Description"), /*#__PURE__*/React.createElement("textarea", {
    value: about,
    onChange: e => setAbout(e.target.value),
    rows: 3,
    placeholder: "What\u2019s happening, who it\u2019s for, what to expect\u2026",
    style: {
      ...evFieldStyle(tried && miss.about),
      height: 'auto',
      padding: '11px 13px',
      lineHeight: 1.5,
      resize: 'none'
    }
  }), /*#__PURE__*/React.createElement(EvLbl, {
    hint: "optional"
  }, "What to bring"), /*#__PURE__*/React.createElement("input", {
    value: bring,
    onChange: e => setBring(e.target.value),
    placeholder: "e.g. Up to 3 pieces to display or trade",
    style: evFieldStyle(false)
  }), /*#__PURE__*/React.createElement(EvLbl, {
    hint: "optional"
  }, "Event community"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      margin: '-2px 2px 10px',
      lineHeight: 1.5
    }
  }, "A space for attendees to talk, network and post. Totally optional."), /*#__PURE__*/React.createElement(Segmented, {
    value: comMode,
    onChange: setComMode,
    options: [{
      id: 'none',
      label: 'None'
    }, {
      id: 'create',
      label: 'Create new'
    }, {
      id: 'existing',
      label: 'Use mine'
    }]
  }), comMode === 'none' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      alignItems: 'flex-start',
      marginTop: 11,
      padding: 13,
      background: 'var(--bone)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      fontSize: 12.5,
      color: 'var(--ink-soft)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.info,
    size: 15,
    style: {
      flexShrink: 0,
      marginTop: 1,
      color: 'var(--ink-faint)'
    }
  }), "No community \u2014 attendees just RSVP. You can add one later."), comMode === 'create' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 11
    }
  }, createdCom ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      padding: 12,
      background: 'var(--verified-teal-soft)',
      border: '1px solid var(--verified-teal)',
      borderRadius: 13
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 10,
      flexShrink: 0,
      background: 'var(--verified-teal)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 14
    }
  }, createdCom.tag), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, createdCom.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)'
    }
  }, "New community \xB7 you\u2019re the admin")), /*#__PURE__*/React.createElement("button", {
    onClick: launchCreateCommunity,
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--stamp-red)',
      fontSize: 12.5,
      fontWeight: 600,
      cursor: 'pointer',
      padding: 4
    }
  }, "Edit")) : /*#__PURE__*/React.createElement("button", {
    onClick: launchCreateCommunity,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      padding: 13,
      borderRadius: 13,
      border: `1px dashed ${tried && miss.community ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
      background: 'var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 10,
      flexShrink: 0,
      background: 'var(--ink)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.plus,
    size: 19
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, "Set up the community"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)'
    }
  }, "Name, privacy, posting & rules")), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 18,
    stroke: 2,
    style: {
      transform: 'rotate(180deg)',
      color: 'var(--ink-faint)'
    }
  }))), comMode === 'existing' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 11
    }
  }, ownedComs.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      alignItems: 'flex-start',
      padding: 13,
      background: 'var(--bone)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      fontSize: 12.5,
      color: 'var(--ink-soft)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.info,
    size: 15,
    style: {
      flexShrink: 0,
      marginTop: 1,
      color: 'var(--ink-faint)'
    }
  }), "You don\u2019t admin any communities yet. Pick ", /*#__PURE__*/React.createElement("b", null, "Create new"), " to start one.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, ownedComs.map(c => {
    const on = existingCom === c.id;
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => setExistingCom(c.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        padding: 11,
        borderRadius: 12,
        border: `1.5px solid ${on ? 'var(--ink)' : tried && miss.community ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
        background: on ? 'var(--bone)' : 'var(--paper-soft)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 9,
        flexShrink: 0,
        background: 'var(--ink)',
        color: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 14
      }
    }, c.tag), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600
      }
    }, c.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-faint)'
      }
    }, "You\u2019re the admin")), on && /*#__PURE__*/React.createElement(Ico, {
      d: Icons.check,
      size: 17,
      stroke: 2.6,
      style: {
        color: 'var(--ink)'
      }
    }));
  })))));
}
Object.assign(window, {
  EventCreateView,
  parseDate,
  slugify
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/EventCreate.jsx", error: String((e && e.message) || e) }); }

// app/EventDetail.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Event detail — Facebook-style. Going / Interested RSVP, guest list,
// bound community, reminders, share, host controls.  (BRD §9.13)
// No tickets, no QR — RSVP only.
// ─────────────────────────────────────────────────────────────

function EventDetail({
  route
}) {
  const {
    push,
    flashToast,
    setOverlay
  } = useNav();
  const {
    userEvents,
    userCommunities,
    rsvp,
    reminders,
    profile,
    setEventRsvp,
    toggleReminder
  } = useAppState();
  const ev = allEvents(userEvents).find(e => e.id === route.id) || (userEvents || []).find(e => e.id === route.id);
  if (!ev) return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Event"
    })
  }, /*#__PURE__*/React.createElement(EmptyNote, null, "This event isn\u2019t available."));
  const com = COMMUNITIES.find(c => c.id === ev.community) || (userCommunities || []).find(c => c.id === ev.community);
  const host = userOf(ev.host);
  const isHost = ev.host === 'you';
  const myStatus = rsvp[ev.id]; // 'going' | 'interested' | undefined
  const remind = !!reminders[ev.id];

  // guest lists = seed handles + you (per your RSVP)
  const goers = [...(ev.going || [])];
  const interestedList = [...(ev.interested || [])];
  if (myStatus === 'going' && !goers.includes('you')) goers.push('you');
  if (myStatus === 'interested' && !interestedList.includes('you')) interestedList.push('you');
  const count = goers.length;
  const intCount = interestedList.length;
  const tones = {
    plum: 'var(--plum)',
    forest: 'var(--forest)',
    teal: 'var(--verified-teal)',
    red: 'var(--stamp-red)',
    ink: 'var(--ink)',
    gold: 'var(--grail-gold)'
  };
  const cats = ev.cats || (ev.cat ? [ev.cat] : []);
  const catLabel = id => (CATEGORIES.find(c => c.id === id) || {}).short || id;
  const footer = ev.past ? /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      borderTop: '1px solid var(--border)',
      background: 'var(--paper)',
      padding: '14px 16px 30px',
      textAlign: 'center',
      fontSize: 13,
      color: 'var(--ink-faint)'
    }
  }, "This event has ended.") : isHost ? /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      borderTop: '1px solid var(--border)',
      background: 'var(--paper)',
      padding: '12px 16px 30px'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "dark",
    size: "block",
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.settings,
      size: 18
    }),
    onClick: () => push({
      name: 'event-manage',
      id: ev.id
    })
  }, "Manage your event")) : /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      borderTop: '1px solid var(--border)',
      background: 'var(--paper)',
      padding: '12px 16px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setEventRsvp(ev.id, 'going');
      flashToast(myStatus === 'going' ? 'Removed your RSVP' : 'You’re going — added to the guest list');
    },
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      height: 50,
      borderRadius: 13,
      cursor: 'pointer',
      border: `1.5px solid ${myStatus === 'going' ? 'var(--forest)' : 'var(--ink)'}`,
      background: myStatus === 'going' ? 'var(--forest)' : 'var(--ink)',
      color: 'var(--paper)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: myStatus === 'going' ? Icons.check : Icons.users,
    size: 18,
    stroke: 2.2
  }), myStatus === 'going' ? 'Going' : 'Going'), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setEventRsvp(ev.id, 'interested');
      flashToast(myStatus === 'interested' ? 'Removed your RSVP' : 'Marked interested — you’ll get updates');
    },
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      height: 50,
      borderRadius: 13,
      cursor: 'pointer',
      border: `1.5px solid ${myStatus === 'interested' ? 'var(--grail-gold-deep)' : 'var(--border-strong)'}`,
      background: myStatus === 'interested' ? 'var(--grail-gold-soft)' : 'var(--paper-soft)',
      color: myStatus === 'interested' ? 'var(--grail-gold-deep)' : 'var(--ink)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.star,
    size: 18,
    fill: myStatus === 'interested' ? 'var(--grail-gold-deep)' : 'none'
  }), "Interested")), com && /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'community-detail',
      id: com.id
    }),
    style: {
      width: '100%',
      marginTop: 10,
      height: 40,
      borderRadius: 11,
      cursor: 'pointer',
      border: '1px solid var(--border-strong)',
      background: 'transparent',
      color: 'var(--ink-soft)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 13.5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.comment,
    size: 16
  }), "Open event community"));
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: null,
    footer: footer
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 3
    }
  }, /*#__PURE__*/React.createElement(DetailHeader, {
    transparent: true,
    trailing: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8
      }
    }, !ev.past && !isHost && /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.bell,
        size: 17,
        fill: remind ? 'var(--paper)' : 'none'
      }),
      onClick: () => {
        toggleReminder(ev.id);
        flashToast(remind ? 'Reminder off' : 'We’ll remind you before it starts');
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.share,
        size: 17
      }),
      onClick: () => setOverlay({
        name: 'share',
        label: ev.title
      })
    }))
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, ev.cover ? /*#__PURE__*/React.createElement("img", {
    src: ev.cover,
    alt: "",
    style: {
      width: '100%',
      aspectRatio: '3 / 2',
      objectFit: 'cover',
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: com ? com.tone : 'plum',
    ratio: "3/2",
    rounded: 0
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, transparent 40%, rgba(20,17,15,0.8) 100%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 14,
      left: 16,
      right: 16,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      borderRadius: 12,
      background: 'var(--paper)',
      color: 'var(--ink)',
      textAlign: 'center',
      padding: '8px 0',
      flexShrink: 0,
      boxShadow: 'var(--shadow-2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'var(--stamp-red)'
    }
  }, ev.month), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 28,
      lineHeight: 1
    }
  }, ev.date), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--ink-faint)'
    }
  }, ev.day)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      color: 'var(--paper)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginBottom: 6,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: ev.mode === 'Online' ? 'vouch' : 'event'
  }, ev.mode)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 22,
      letterSpacing: '-0.02em',
      lineHeight: 1.1
    }
  }, ev.title))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
      padding: '11px 14px',
      background: myStatus === 'going' ? 'var(--forest-soft)' : 'var(--paper-soft)',
      border: `1px solid ${myStatus === 'going' ? 'var(--forest)' : 'var(--border)'}`,
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.users,
    size: 17,
    style: {
      color: myStatus === 'going' ? 'var(--forest)' : 'var(--ink-mute)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 600
    }
  }, count, " going"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-ghost)'
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-faint)'
    }
  }, intCount, " interested"), myStatus && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 12,
      fontWeight: 600,
      color: myStatus === 'going' ? 'var(--forest)' : 'var(--grail-gold-deep)'
    }
  }, "You\u2019re ", myStatus)), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 13,
      overflow: 'hidden',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(DetailRow, {
    icon: Icons.calendar,
    title: ev.when,
    sub: remind ? 'Reminder on' : ev.past ? 'Ended' : 'Tap the bell to get reminded'
  }), /*#__PURE__*/React.createElement(DetailRow, {
    icon: ev.mode === 'Online' ? Icons.globe : Icons.pin,
    title: ev.where,
    sub: ev.city
  }), cats.length > 0 && /*#__PURE__*/React.createElement(DetailRow, {
    icon: Icons.tag,
    title: cats.map(catLabel).join(' · '),
    sub: cats.length > 1 ? 'Categories' : 'Category',
    last: !ev.bring
  }), ev.bring && /*#__PURE__*/React.createElement(DetailRow, {
    icon: Icons.bag,
    title: ev.bring,
    sub: "What to bring",
    last: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Who\u2019s going"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, count)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      margin: '12px 0 14px'
    }
  }, goers.slice(0, 10).map(h => {
    const gu = h === 'you' ? {
      ...ME,
      name: 'You'
    } : userOf(h);
    return /*#__PURE__*/React.createElement("button", {
      key: h,
      onClick: () => h !== 'you' && push({
        name: 'profile',
        user: h
      }),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '5px 11px 5px 5px',
        borderRadius: 999,
        background: h === 'you' ? 'var(--forest-soft)' : 'var(--paper-soft)',
        border: `1px solid ${h === 'you' ? 'var(--forest)' : 'var(--border)'}`,
        cursor: h === 'you' ? 'default' : 'pointer'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: gu.name,
      color: gu.color,
      photo: h === 'you' ? (profile || {}).photo : undefined,
      size: 22
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: 'var(--ink)'
      }
    }, h === 'you' ? 'You' : gu.name.split(' ')[0]));
  }), count === 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)'
    }
  }, "Be the first to RSVP."), count > 10 && /*#__PURE__*/React.createElement("span", {
    style: {
      alignSelf: 'center',
      fontSize: 12.5,
      color: 'var(--ink-faint)'
    }
  }, "+", count - 10, " more")), intCount > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      fontWeight: 600
    }
  }, "Interested"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex'
    }
  }, interestedList.slice(0, 6).map((h, i) => {
    const gu = h === 'you' ? {
      ...ME,
      name: 'You'
    } : userOf(h);
    return /*#__PURE__*/React.createElement("div", {
      key: h,
      style: {
        marginLeft: i ? -8 : 0,
        borderRadius: '50%',
        boxShadow: '0 0 0 2px var(--paper)'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: gu.name,
      color: gu.color,
      photo: h === 'you' ? (profile || {}).photo : undefined,
      size: 26
    }));
  })), intCount > 6 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, "+", intCount - 6)), /*#__PURE__*/React.createElement(SectionLabel, null, "About"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.6,
      color: 'var(--ink-soft)',
      margin: '10px 0 18px'
    }
  }, ev.about), com && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionLabel, null, "Event community"), /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'community-detail',
      id: com.id
    }),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      margin: '10px 0 18px',
      padding: 13,
      cursor: 'pointer',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 12,
      flexShrink: 0,
      background: tones[com.tone] || 'var(--plum)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 18
    }
  }, com.tag), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600
    }
  }, com.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)'
    }
  }, "Talk, network & post with attendees")), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 18,
    stroke: 2,
    style: {
      transform: 'rotate(180deg)',
      color: 'var(--ink-faint)'
    }
  }))), /*#__PURE__*/React.createElement(SectionLabel, null, "Hosted by"), /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'profile',
      user: ev.host
    }),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      marginTop: 10,
      padding: 12,
      cursor: 'pointer',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 13
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: host.name,
    color: host.color,
    size: 40,
    verified: host.tier !== 'Verified'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, isHost ? 'You' : host.name), !isHost && /*#__PURE__*/React.createElement(TierChip, {
    tier: host.tier
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)'
    }
  }, "@", host.handle, " \xB7 ", host.city)), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 18,
    stroke: 2,
    style: {
      transform: 'rotate(180deg)',
      color: 'var(--ink-faint)'
    }
  }))));
}
function DetailRow({
  icon,
  title,
  sub,
  last
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 14px',
      borderBottom: last ? 'none' : '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      background: 'var(--bone)',
      color: 'var(--ink-mute)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: icon,
    size: 17
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, sub)));
}
Object.assign(window, {
  EventDetail,
  DetailRow
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/EventDetail.jsx", error: String((e && e.message) || e) }); }

// app/EventManage.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Manage your event — host dashboard (BRD §9.13)
// Approval state · Going / Interested guest lists · share · cancel.
// No tickets / QR — Facebook-style RSVP.
// ─────────────────────────────────────────────────────────────

function EventManageView({
  route
}) {
  const {
    pop,
    push,
    flashToast,
    setOverlay
  } = useNav();
  const {
    userEvents,
    userCommunities,
    approveEvent,
    cancelEvent
  } = useAppState();
  const ev = (userEvents || []).find(e => e.id === route.id) || EVENTS.find(e => e.id === route.id);
  if (!ev) return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Manage event"
    })
  }, /*#__PURE__*/React.createElement(EmptyNote, null, "Event not found."));
  const com = COMMUNITIES.find(c => c.id === ev.community) || (userCommunities || []).find(c => c.id === ev.community);
  const pending = ev.status === 'pending';
  const goers = ev.going || [];
  const interestedList = ev.interested || [];
  const cats = ev.cats || (ev.cat ? [ev.cat] : []);
  const catLabel = id => (CATEGORIES.find(c => c.id === id) || {}).short || id;

  // PENDING — approval gate (demo: simulate the app owner approving)
  if (pending) {
    return /*#__PURE__*/React.createElement(Screen, {
      nav: false,
      header: /*#__PURE__*/React.createElement(DetailHeader, {
        title: "Pending approval",
        subtitle: ev.title
      })
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '16px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: 16,
        background: 'var(--grail-gold-soft)',
        border: '1px solid var(--grail-gold)',
        borderRadius: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 11,
        flexShrink: 0,
        background: 'var(--grail-gold)',
        color: 'var(--ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: Icons.clock,
      size: 20
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 16,
        color: 'var(--grail-gold-deep)'
      }
    }, "Waiting for review"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--ink-soft)',
        lineHeight: 1.5,
        marginTop: 5
      }
    }, "Only you can see this event until CollectorHub approves it. We review for safety and accuracy \u2014 usually within a day."))), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--paper-soft)',
        border: '1px solid var(--border)',
        borderRadius: 13,
        overflow: 'hidden',
        margin: '16px 0'
      }
    }, /*#__PURE__*/React.createElement(DetailRow, {
      icon: Icons.calendar,
      title: ev.when,
      sub: ev.city
    }), /*#__PURE__*/React.createElement(DetailRow, {
      icon: ev.mode === 'Online' ? Icons.globe : Icons.pin,
      title: ev.where,
      sub: ev.mode
    }), /*#__PURE__*/React.createElement(DetailRow, {
      icon: Icons.tag,
      title: cats.map(catLabel).join(' · ') || '—',
      sub: com ? `Community: ${com.name}` : 'No community',
      last: true
    })), /*#__PURE__*/React.createElement(Button, {
      variant: "grail",
      size: "block",
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.shield,
        size: 18
      }),
      onClick: () => {
        approveEvent(ev.id);
        flashToast('Approved — your event is now live');
      }
    }, "Simulate app-owner approval"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "block",
      style: {
        marginTop: 10,
        color: 'var(--stamp-red)',
        borderColor: 'var(--stamp-red)'
      },
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.close,
        size: 16,
        stroke: 2.4
      }),
      onClick: () => {
        cancelEvent(ev.id);
        pop();
        flashToast('Event withdrawn');
      }
    }, "Withdraw event")));
  }

  // APPROVED — host dashboard
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Manage event",
      subtitle: ev.title,
      trailing: /*#__PURE__*/React.createElement(IconButton, {
        icon: /*#__PURE__*/React.createElement(Ico, {
          d: Icons.share,
          size: 17
        }),
        onClick: () => setOverlay({
          name: 'share',
          label: ev.title
        })
      })
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      padding: '10px 14px',
      background: 'var(--forest-soft)',
      border: '1px solid var(--forest)',
      borderRadius: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--forest)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--forest)'
    }
  }, "Live & public"), /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'event',
      id: ev.id
    }),
    style: {
      marginLeft: 'auto',
      background: 'none',
      border: 'none',
      color: 'var(--ink-soft)',
      fontSize: 12.5,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "View public page \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(ManageStat, {
    n: goers.length,
    l: "Going",
    accent: "var(--forest)"
  }), /*#__PURE__*/React.createElement(ManageStat, {
    n: interestedList.length,
    l: "Interested",
    accent: "var(--grail-gold-deep)"
  }), /*#__PURE__*/React.createElement(ManageStat, {
    n: com ? com.members : '—',
    l: "Community",
    accent: "var(--ink)"
  })), com && /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'community-detail',
      id: com.id
    }),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      marginBottom: 18,
      padding: 13,
      cursor: 'pointer',
      background: 'var(--ink)',
      color: 'var(--paper)',
      border: 'none',
      borderRadius: 13
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.comment,
    size: 19
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, "Post an update"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'rgba(244,239,230,0.7)'
    }
  }, "Reach attendees in ", com.name)), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 18,
    stroke: 2,
    style: {
      transform: 'rotate(180deg)',
      opacity: 0.7
    }
  })), /*#__PURE__*/React.createElement(SectionLabel, null, "Going \xB7 ", goers.length), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      margin: '10px 0 18px'
    }
  }, goers.map(h => /*#__PURE__*/React.createElement(GuestRow, {
    key: h,
    handle: h,
    onOpen: () => push({
      name: 'profile',
      user: h
    })
  })), goers.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, "No one\u2019s RSVP\u2019d \u201Cgoing\u201D yet. Share your event to spread the word.")), interestedList.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionLabel, null, "Interested \xB7 ", interestedList.length), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      margin: '10px 0 18px'
    }
  }, interestedList.map(h => /*#__PURE__*/React.createElement(GuestRow, {
    key: h,
    handle: h,
    muted: true,
    onOpen: () => push({
      name: 'profile',
      user: h
    })
  })))), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "block",
    style: {
      marginTop: 4,
      color: 'var(--stamp-red)',
      borderColor: 'var(--stamp-red)'
    },
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.close,
      size: 16,
      stroke: 2.4
    }),
    onClick: () => {
      cancelEvent(ev.id);
      pop();
      flashToast('Event cancelled — attendees notified');
    }
  }, "Cancel event")));
}
function GuestRow({
  handle,
  muted,
  onOpen
}) {
  const u = userOf(handle);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onOpen,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      width: '100%',
      textAlign: 'left',
      padding: 10,
      cursor: 'pointer',
      borderRadius: 12,
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: u.name,
    color: u.color,
    size: 38,
    verified: !muted && u.tier !== 'Verified'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, u.name), !muted && /*#__PURE__*/React.createElement(TierChip, {
    tier: u.tier
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, "@", u.handle, " \xB7 ", u.city)), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 17,
    stroke: 2,
    style: {
      transform: 'rotate(180deg)',
      color: 'var(--ink-faint)'
    }
  }));
}
function ManageStat({
  n,
  l,
  accent
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 13,
      padding: '12px 10px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 22,
      color: accent,
      lineHeight: 1
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--ink-faint)',
      marginTop: 5
    }
  }, l));
}
Object.assign(window, {
  EventManageView,
  ManageStat,
  GuestRow
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/EventManage.jsx", error: String((e && e.message) || e) }); }

// app/EventsView.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Events — list, tabs (Upcoming / Past / Hosting), host CTA  (BRD §9.13)
// Facebook-style RSVP (Going / Interested). No tickets.
// ─────────────────────────────────────────────────────────────

// shared helpers (used by EventDetail / EventCard / Manage too)
function allEvents(userEvents) {
  // approved user events join the public list; newest user events first
  const mine = (userEvents || []).filter(e => e.status === 'approved');
  const ids = new Set(mine.map(e => e.id));
  return [...mine, ...EVENTS.filter(e => !ids.has(e.id))];
}
function amGoing(id, rsvp) {
  return rsvp && rsvp[id] === 'going';
}
function goingCount(ev, rsvp) {
  const base = (ev.going || []).length;
  return base + (amGoing(ev.id, rsvp) && !(ev.going || []).includes('you') ? 1 : 0);
}
function EventsView() {
  const {
    push,
    flashToast
  } = useNav();
  const {
    userEvents,
    rsvp
  } = useAppState();
  const [tab, setTab] = React.useState('upcoming');
  const myCity = (ME.city || '').toLowerCase();
  const events = allEvents(userEvents);
  const upcoming = events.filter(e => !e.past);
  const past = events.filter(e => e.past);
  const hosting = userEvents || [];

  // sort upcoming so my-city in-person events come first
  const sortedUpcoming = [...upcoming].sort((a, b) => {
    const aCity = a.city.toLowerCase() === myCity ? 0 : 1;
    const bCity = b.city.toLowerCase() === myCity ? 0 : 1;
    return aCity - bCity;
  });
  const cityCount = upcoming.filter(e => e.city.toLowerCase() === myCity).length;
  const list = tab === 'upcoming' ? sortedUpcoming : tab === 'past' ? past : hosting;
  return /*#__PURE__*/React.createElement(Screen, {
    header: /*#__PURE__*/React.createElement(AppBar, {
      title: "Events"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 4,
      background: 'var(--paper)',
      borderBottom: '1px solid var(--border)',
      padding: '10px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    options: [{
      id: 'upcoming',
      label: 'Upcoming'
    }, {
      id: 'past',
      label: 'Past'
    }, {
      id: 'hosting',
      label: 'My Events'
    }],
    value: tab,
    onChange: setTab
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'create-event'
    }),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      height: 36,
      padding: '0 13px',
      borderRadius: 10,
      border: 'none',
      background: 'var(--ink)',
      color: 'var(--paper)',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 13,
      flexShrink: 0,
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.plus,
    size: 15,
    stroke: 2.2
  }), "List an event"))), tab === 'upcoming' && /*#__PURE__*/React.createElement(React.Fragment, null, sortedUpcoming.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 0'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, cityCount > 0 ? `Next up in ${ME.city}` : 'Next up'), /*#__PURE__*/React.createElement(FeaturedEvent, {
    ev: sortedUpcoming[0],
    onOpen: () => push({
      name: 'event',
      id: sortedUpcoming[0].id
    })
  })), cityCount === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '14px 16px 0',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      padding: '12px 14px',
      background: 'var(--bone)',
      border: '1px solid var(--border)',
      borderRadius: 13
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.pin,
    size: 16,
    style: {
      color: 'var(--ink-faint)',
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-soft)',
      lineHeight: 1.5
    }
  }, "No events in ", /*#__PURE__*/React.createElement("b", null, ME.city), " yet \u2014 showing national & online events. ", /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'create-event'
    }),
    style: {
      background: 'none',
      border: 'none',
      padding: 0,
      color: 'var(--stamp-red)',
      fontWeight: 600,
      fontSize: 12.5,
      cursor: 'pointer'
    }
  }, "List one \u2192"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 16px 0'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "All upcoming"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 11,
      marginTop: 10
    }
  }, sortedUpcoming.slice(1).map(ev => /*#__PURE__*/React.createElement(EventCard, {
    key: ev.id,
    ev: ev,
    onOpen: () => push({
      name: 'event',
      id: ev.id
    })
  })), sortedUpcoming.length <= 1 && /*#__PURE__*/React.createElement(EmptyNote, null, "That\u2019s every upcoming event for now."))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 11.5,
      color: 'var(--ink-faint)'
    }
  }, "Events are reviewed by CollectorHub before going live."))), tab === 'past' && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 11
    }
  }, past.map(ev => /*#__PURE__*/React.createElement(EventCard, {
    key: ev.id,
    ev: ev,
    onOpen: () => push({
      name: 'event',
      id: ev.id
    })
  })), past.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, "No past events yet."))), tab === 'hosting' && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'create-event'
    }),
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: '100%',
      height: 46,
      borderRadius: 12,
      background: 'var(--ink)',
      color: 'var(--paper)',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 14.5,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.plus,
    size: 18
  }), "List an event"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 11
    }
  }, hosting.map(ev => /*#__PURE__*/React.createElement("button", {
    key: ev.id,
    onClick: () => push({
      name: 'event-manage',
      id: ev.id
    }),
    style: {
      display: 'flex',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      alignItems: 'center',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: 12,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 50,
      height: 50,
      borderRadius: 11,
      flexShrink: 0,
      background: ev.status === 'pending' ? 'var(--grail-gold-soft)' : 'var(--ink)',
      color: ev.status === 'pending' ? 'var(--grail-gold-deep)' : 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    }
  }, ev.month), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 20,
      lineHeight: 1
    }
  }, ev.date)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600,
      lineHeight: 1.25
    }
  }, ev.title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5
    }
  }, ev.status === 'pending' ? /*#__PURE__*/React.createElement(Tag, {
    kind: "po"
  }, "Pending approval") : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, (ev.going || []).length, " going \xB7 tap to manage"))), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 18,
    stroke: 2,
    style: {
      transform: 'rotate(180deg)',
      color: 'var(--ink-faint)'
    }
  }))), hosting.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, "You\u2019re not hosting any events yet. Tap \u201CList an event\u201D."))));
}
function FeaturedEvent({
  ev,
  onOpen
}) {
  const com = COMMUNITIES.find(c => c.id === ev.community);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onOpen,
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      marginTop: 10,
      padding: 0,
      border: 'none',
      borderRadius: 16,
      overflow: 'hidden',
      cursor: 'pointer',
      background: 'var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: com ? com.tone : 'plum',
    ratio: "2/1",
    rounded: 0
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, transparent 30%, rgba(20,17,15,0.88) 100%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12,
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: ev.mode === 'Online' ? 'vouch' : 'event'
  }, ev.mode)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 12,
      left: 14,
      right: 14,
      color: 'var(--paper)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 22,
      letterSpacing: '-0.02em',
      lineHeight: 1.1
    }
  }, ev.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'rgba(244,239,230,0.85)',
      marginTop: 4,
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.calendar,
    size: 14,
    stroke: 2
  }), ev.when, " \xB7 ", ev.city))));
}
Object.assign(window, {
  EventsView,
  FeaturedEvent,
  allEvents,
  amGoing,
  goingCount
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/EventsView.jsx", error: String((e && e.message) || e) }); }

// app/FeedView.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Feed (Home) — BRD §9.3
// Personalised stream: posts, admin/releases, listings, events.
// Sort (For You / Latest / Top) + filter (post type / source).
// ─────────────────────────────────────────────────────────────

function FeedView() {
  const {
    posts
  } = useAppState();
  const [sort, setSort] = React.useState('foryou'); // foryou | latest | following
  const [tag, setTag] = React.useState('All');
  const tagBar = React.useRef(null);
  const drag = React.useRef({
    down: false,
    startX: 0,
    startScroll: 0,
    moved: false
  });
  const onDown = e => {
    const el = tagBar.current;
    if (!el) return;
    drag.current = {
      down: true,
      startX: e.pageX,
      startScroll: el.scrollLeft,
      moved: false
    };
  };
  const onMove = e => {
    const el = tagBar.current;
    if (!el || !drag.current.down) return;
    const dx = e.pageX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - dx;
  };
  const endDrag = () => {
    drag.current.down = false;
  };
  const [customOpen, setCustomOpen] = React.useState(false);
  // which categories the "Your Feed" view shows
  const [feedCats, setFeedCats] = React.useState(() => {
    const init = {};
    CATEGORIES.forEach(c => init[c.id] = ME.interests.includes(c.id));
    return init;
  });
  const [draftCats, setDraftCats] = React.useState(feedCats);
  // hide listing cards from the feed — on by default (collectors who want posts-only)
  const [hideListings, setHideListings] = React.useState(true);
  const [draftHide, setDraftHide] = React.useState(true);
  const activeCats = CATEGORIES.filter(c => feedCats[c.id]).map(c => c.id);
  const openCustomise = () => {
    setDraftCats(feedCats);
    setDraftHide(hideListings);
    setCustomOpen(true);
  };
  const saveCustomise = () => {
    setFeedCats(draftCats);
    setHideListings(draftHide);
    setCustomOpen(false);
  };
  const allOn = CATEGORIES.every(c => draftCats[c.id]);
  const toggleAll = () => {
    const v = !allOn;
    const n = {};
    CATEGORIES.forEach(c => n[c.id] = v);
    setDraftCats(n);
  };

  // Build the mixed feed (order is the "ranking")
  const stream = React.useMemo(() => {
    const base = [...posts.map(p => ({
      t: 'post',
      post: p,
      tags: ['#NewDrops']
    })), {
      t: 'listing',
      id: 'mms601',
      cat: 'figures',
      tags: ['#HotToys', '#NewDrops', '#Marvel']
    }, {
      t: 'post',
      post: POSTS[0],
      tags: ['#Grails', '#HotToys', '#Marvel']
    }, {
      t: 'admin',
      post: ADMIN_POSTS[0],
      tags: ['#NewDrops', '#Restock']
    }, {
      t: 'event',
      id: 'mumbai4',
      tags: ['#Meetups']
    }, {
      t: 'post',
      post: POSTS[4],
      tags: ['#Gunpla', '#Sealed']
    }, {
      t: 'listing',
      id: 'lego10307',
      cat: 'kits',
      tags: ['#Grails', '#Sealed']
    }, {
      t: 'post',
      post: POSTS[3],
      tags: ['#HotToys', '#PopMart']
    }, {
      t: 'post',
      post: POSTS[1],
      tags: ['#Gunpla', '#NewDrops']
    }, {
      t: 'listing',
      id: 'minigt-r35',
      cat: 'diecast',
      tags: ['#Diecast', '#NewDrops', '#Restock']
    }, {
      t: 'post',
      post: POSTS[2],
      tags: ['#Grails', '#PopMart']
    }, {
      t: 'admin',
      post: ADMIN_POSTS[1],
      tags: ['#HotToys', '#Restock']
    }, {
      t: 'listing',
      id: 'tomica-r34',
      cat: 'diecast',
      tags: ['#Diecast']
    }];
    let s = base;
    if (sort === 'latest') s = [...base].reverse();
    // "Your Feed" tunes to the chosen categories (posts/events always pass through)
    if (sort === 'foryou' && activeCats.length && activeCats.length < CATEGORIES.length) {
      s = s.filter(x => !x.cat || activeCats.includes(x.cat));
    }
    // "Remove Listing posts" — drop marketplace listing cards from Your Feed
    if (sort === 'foryou' && hideListings) s = s.filter(x => x.t !== 'listing');
    if (sort === 'following') s = s.filter(x => x.t === 'post' || x.t === 'listing');
    // hashtag slider filter
    if (tag !== 'All') s = s.filter(x => (x.tags || []).includes(tag));
    return s;
  }, [posts, sort, feedCats, hideListings, tag]);
  const HASHTAGS = ['All', '#NewDrops', '#Grails', '#HotToys', '#Gunpla', '#Diecast', '#PopMart', '#Sealed', '#Marvel', '#Restock', '#Meetups'];
  const TABS = [{
    id: 'foryou',
    label: 'For You',
    icon: Icons.home,
    caret: true
  }, {
    id: 'latest',
    label: 'Explore',
    icon: Icons.globe
  }, {
    id: 'following',
    label: 'Following',
    icon: Icons.userPlus
  }];
  return /*#__PURE__*/React.createElement(Screen, {
    header: /*#__PURE__*/React.createElement(AppBar, {
      title: "CollectorHub",
      wordmark: true
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 5,
      background: 'var(--paper)',
      borderBottom: '1px solid var(--border)',
      padding: '10px 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      background: 'var(--bone)',
      borderRadius: 13,
      padding: 4
    }
  }, TABS.map(t => {
    const on = sort === t.id;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => {
        if (t.id === 'foryou' && on) {
          customOpen ? setCustomOpen(false) : openCustomise();
        } else {
          setSort(t.id);
          setCustomOpen(false);
        }
      },
      style: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        border: 'none',
        cursor: 'pointer',
        borderRadius: 10,
        padding: '8px 6px',
        background: on ? 'var(--paper)' : 'transparent',
        color: on ? 'var(--ink)' : 'var(--ink-faint)',
        fontFamily: 'var(--font-body)',
        fontWeight: on ? 700 : 500,
        fontSize: 13.5,
        boxShadow: on ? 'var(--shadow-1)' : 'none',
        transition: 'all 130ms',
        whiteSpace: 'nowrap'
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: t.icon,
      size: 16,
      stroke: on ? 2.3 : 1.9
    }), t.label, t.caret && /*#__PURE__*/React.createElement(Ico, {
      d: "M6 9l6 6 6-6",
      size: 13,
      stroke: 2.4,
      style: {
        transform: customOpen ? 'rotate(180deg)' : 'none',
        transition: 'transform 160ms',
        marginLeft: -1
      }
    }));
  })), customOpen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: () => setCustomOpen(false),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 30
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: 0,
      zIndex: 31,
      width: 'min(320px, 100%)',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 17,
      boxShadow: 'var(--shadow-4)',
      padding: '16px 16px 14px',
      animation: 'fadeIn 140ms ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16.5,
      letterSpacing: '-0.01em',
      color: 'var(--ink)'
    }
  }, "Customize feed"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      marginTop: 2,
      marginBottom: 12
    }
  }, "Pick the categories you want to see."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, CATEGORIES.map(c => {
    const on = draftCats[c.id];
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => setDraftCats(s => ({
        ...s,
        [c.id]: !s[c.id]
      })),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        width: '100%',
        textAlign: 'left',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: '9px 4px',
        borderRadius: 9
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: 7,
        flexShrink: 0,
        border: `1.5px solid ${on ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
        background: on ? 'var(--stamp-red)' : 'transparent',
        color: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 120ms'
      }
    }, on && /*#__PURE__*/React.createElement(Ico, {
      d: Icons.check,
      size: 15,
      stroke: 3
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 500,
        color: 'var(--ink)'
      }
    }, c.label));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--border)',
      margin: '10px 4px 4px'
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDraftHide(v => !v),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      width: '100%',
      textAlign: 'left',
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      padding: '9px 4px',
      borderRadius: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: 7,
      flexShrink: 0,
      border: `1.5px solid ${draftHide ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
      background: draftHide ? 'var(--stamp-red)' : 'transparent',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 120ms'
    }
  }, draftHide && /*#__PURE__*/React.createElement(Ico, {
    d: Icons.check,
    size: 15,
    stroke: 3
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: 'var(--ink)'
    }
  }, "Remove Listing posts"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)'
    }
  }, "Hide marketplace listings from your feed"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: toggleAll,
    style: {
      flex: 1,
      borderRadius: 11,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper)',
      color: 'var(--ink)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 14,
      padding: '11px 0',
      cursor: 'pointer'
    }
  }, allOn ? 'Clear all' : 'Select all'), /*#__PURE__*/React.createElement("button", {
    onClick: saveCustomise,
    style: {
      flex: 1.4,
      borderRadius: 11,
      border: 'none',
      background: 'var(--stamp-red)',
      color: 'var(--paper)',
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: 14,
      padding: '11px 0',
      cursor: 'pointer'
    }
  }, "Save"))))), /*#__PURE__*/React.createElement("div", {
    ref: tagBar,
    onMouseDown: onDown,
    onMouseMove: onMove,
    onMouseUp: endDrag,
    onMouseLeave: endDrag,
    className: "ch-tagbar",
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      WebkitOverflowScrolling: 'touch',
      margin: '10px -14px 0',
      padding: '1px 14px 2px',
      cursor: 'grab',
      userSelect: 'none'
    }
  }, HASHTAGS.map(h => {
    const on = tag === h;
    const all = h === 'All';
    return /*#__PURE__*/React.createElement("button", {
      key: h,
      onClick: () => {
        if (!drag.current.moved) setTag(h);
      },
      draggable: false,
      style: {
        flexShrink: 0,
        cursor: 'pointer',
        borderRadius: 999,
        padding: '7px 15px',
        border: `1px solid ${on ? all ? 'var(--stamp-red)' : 'var(--ink)' : 'var(--border-strong)'}`,
        background: on ? all ? 'var(--stamp-red)' : 'var(--ink)' : 'var(--paper-soft)',
        color: on ? 'var(--paper)' : 'var(--ink-soft)',
        fontFamily: 'var(--font-body)',
        fontWeight: on ? 700 : 500,
        fontSize: 13,
        letterSpacing: '-0.01em',
        transition: 'background 120ms, color 120ms, border-color 120ms',
        whiteSpace: 'nowrap'
      }
    }, h);
  }))), stream.map((x, i) => {
    if (x.t === 'post') return /*#__PURE__*/React.createElement(PostCard, {
      key: x.post.id || i,
      post: x.post,
      showFollow: true
    });
    if (x.t === 'admin') return /*#__PURE__*/React.createElement(AdminCard, {
      key: x.post.id,
      post: x.post
    });
    if (x.t === 'listing') return /*#__PURE__*/React.createElement(ListingFeedCard, {
      key: x.id + i,
      id: x.id
    });
    if (x.t === 'event') return /*#__PURE__*/React.createElement(FeedEventCard, {
      key: x.id,
      id: x.id
    });
    return null;
  }), stream.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '52px 24px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 17,
      color: 'var(--ink)'
    }
  }, "No posts under ", tag), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-faint)',
      marginTop: 5
    }
  }, "Try another hashtag or tap All.")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 16px 32px',
      textAlign: 'center',
      color: 'var(--ink-ghost)',
      fontSize: 12.5
    }
  }, "You\u2019re all caught up", sort === 'foryou' ? ` · tuned to ${activeCats.length || CATEGORIES.length} ${(activeCats.length || CATEGORIES.length) === 1 ? 'category' : 'categories'}` : ''));
}

// event surfaced as a feed card — BRD §8.4 FE-03
function FeedEventCard({
  id
}) {
  const {
    push
  } = useNav();
  const ev = EVENTS.find(e => e.id === id);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper)',
      borderBottom: '8px solid var(--bone)',
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.calendar,
    size: 16,
    stroke: 2,
    style: {
      color: 'var(--plum)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--plum)'
    }
  }, "Event near you")), /*#__PURE__*/React.createElement(EventCard, {
    ev: ev,
    onOpen: () => push({
      name: 'event',
      id
    })
  }));
}
Object.assign(window, {
  FeedView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/FeedView.jsx", error: String((e && e.message) || e) }); }

// app/IOSFrame.jsx
try { (() => {
// iOS.jsx — Simplified iOS 26 (Liquid Glass) device frame
// Based on the iOS 26 UI Kit + Figma status bar spec. No assets, no deps.
// Exports: IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill, IOSList, IOSListRow, IOSKeyboard

// ─────────────────────────────────────────────────────────────
// Status bar
// ─────────────────────────────────────────────────────────────
function IOSStatusBar({
  dark = false,
  time = '9:41'
}) {
  const c = dark ? '#fff' : '#000';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 154,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '21px 24px 19px',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 20,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: '-apple-system, "SF Pro", system-ui',
      fontWeight: 590,
      fontSize: 17,
      lineHeight: '22px',
      color: c
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingTop: 1,
      paddingRight: 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "19",
    height: "12",
    viewBox: "0 0 19 12"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "7.5",
    width: "3.2",
    height: "4.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4.8",
    y: "5",
    width: "3.2",
    height: "7",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9.6",
    y: "2.5",
    width: "3.2",
    height: "9.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14.4",
    y: "0",
    width: "3.2",
    height: "12",
    rx: "0.7",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "12",
    viewBox: "0 0 17 12"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z",
    fill: c
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "10.5",
    r: "1.5",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "27",
    height: "13",
    viewBox: "0 0 27 13"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.5",
    y: "0.5",
    width: "23",
    height: "12",
    rx: "3.5",
    stroke: c,
    strokeOpacity: "0.35",
    fill: "none"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2",
    width: "20",
    height: "9",
    rx: "2",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z",
    fill: c,
    fillOpacity: "0.4"
  }))));
}

// ─────────────────────────────────────────────────────────────
// Liquid glass pill — blur + tint + shine
// ─────────────────────────────────────────────────────────────
function IOSGlassPill({
  children,
  dark = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      minWidth: 44,
      borderRadius: 9999,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: dark ? '0 2px 6px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.06)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.28)' : 'rgba(255,255,255,0.5)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15), inset -1px -1px 1px rgba(255,255,255,0.08)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Navigation bar — glass pills + large title
// ─────────────────────────────────────────────────────────────
function IOSNavBar({
  title = 'Title',
  dark = false,
  trailingIcon = true
}) {
  const muted = dark ? 'rgba(255,255,255,0.6)' : '#404040';
  const text = dark ? '#fff' : '#000';
  const pillIcon = content => /*#__PURE__*/React.createElement(IOSGlassPill, {
    dark: dark
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, content));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingTop: 62,
      paddingBottom: 10,
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px'
    }
  }, pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "20",
    viewBox: "0 0 12 20",
    fill: "none",
    style: {
      marginLeft: -1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 2L2 10l8 8",
    stroke: muted,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), trailingIcon && pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "6",
    viewBox: "0 0 22 6"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "3",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "3",
    r: "2.5",
    fill: muted
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px',
      fontFamily: '-apple-system, system-ui',
      fontSize: 34,
      fontWeight: 700,
      lineHeight: '41px',
      color: text,
      letterSpacing: 0.4
    }
  }, title));
}

// ─────────────────────────────────────────────────────────────
// Grouped list (inset card, r:26) + row (52px)
// ─────────────────────────────────────────────────────────────
function IOSListRow({
  title,
  detail,
  icon,
  chevron = true,
  isLast = false,
  dark = false
}) {
  const text = dark ? '#fff' : '#000';
  const sec = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const ter = dark ? 'rgba(235,235,245,0.3)' : 'rgba(60,60,67,0.3)';
  const sep = dark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.12)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      minHeight: 52,
      padding: '0 16px',
      position: 'relative',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      letterSpacing: -0.43
    }
  }, icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 7,
      background: icon,
      marginRight: 12,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      color: text
    }
  }, title), detail && /*#__PURE__*/React.createElement("span", {
    style: {
      color: sec,
      marginRight: 6
    }
  }, detail), chevron && /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "14",
    viewBox: "0 0 8 14",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l6 6-6 6",
    stroke: ter,
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), !isLast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      left: icon ? 58 : 16,
      height: 0.5,
      background: sep
    }
  }));
}
function IOSList({
  header,
  children,
  dark = false
}) {
  const hc = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const bg = dark ? '#1C1C1E' : '#fff';
  return /*#__PURE__*/React.createElement("div", null, header && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '-apple-system, system-ui',
      fontSize: 13,
      color: hc,
      textTransform: 'uppercase',
      padding: '8px 36px 6px',
      letterSpacing: -0.08
    }
  }, header), /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      borderRadius: 26,
      margin: '0 16px',
      overflow: 'hidden'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Device frame
// ─────────────────────────────────────────────────────────────
function IOSDevice({
  children,
  width = 402,
  height = 874,
  dark = false,
  title,
  keyboard = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: 48,
      overflow: 'hidden',
      position: 'relative',
      background: dark ? '#000' : '#F2F2F7',
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      fontFamily: '-apple-system, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 11,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 126,
      height: 37,
      borderRadius: 24,
      background: '#000',
      zIndex: 50
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement(IOSStatusBar, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }
  }, title !== undefined && /*#__PURE__*/React.createElement(IOSNavBar, {
    title: title,
    dark: dark
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, children), keyboard && /*#__PURE__*/React.createElement(IOSKeyboard, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 60,
      height: 34,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingBottom: 8,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 139,
      height: 5,
      borderRadius: 100,
      background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)'
    }
  })));
}

// ─────────────────────────────────────────────────────────────
// Keyboard — iOS 26 liquid glass
// ─────────────────────────────────────────────────────────────
function IOSKeyboard({
  dark = false
}) {
  const glyph = dark ? 'rgba(255,255,255,0.7)' : '#595959';
  const sugg = dark ? 'rgba(255,255,255,0.6)' : '#333';
  const keyBg = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)';

  // special-key icons
  const icons = {
    shift: /*#__PURE__*/React.createElement("svg", {
      width: "19",
      height: "17",
      viewBox: "0 0 19 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M9.5 1L1 9.5h4.5V16h8V9.5H18L9.5 1z",
      fill: glyph
    })),
    del: /*#__PURE__*/React.createElement("svg", {
      width: "23",
      height: "17",
      viewBox: "0 0 23 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M7 1h13a2 2 0 012 2v11a2 2 0 01-2 2H7l-6-7.5L7 1z",
      fill: "none",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 5l7 7M17 5l-7 7",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinecap: "round"
    })),
    ret: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "14",
      viewBox: "0 0 20 14"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M18 1v6H4m0 0l4-4M4 7l4 4",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }))
  };
  const key = (content, {
    w,
    flex,
    ret,
    fs = 25,
    k
  } = {}) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      height: 42,
      borderRadius: 8.5,
      flex: flex ? 1 : undefined,
      width: w,
      minWidth: 0,
      background: ret ? '#08f' : keyBg,
      boxShadow: '0 1px 0 rgba(0,0,0,0.075)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, "SF Compact", system-ui',
      fontSize: fs,
      fontWeight: 458,
      color: ret ? '#fff' : glyph
    }
  }, content);
  const row = (keys, pad = 0) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      justifyContent: 'center',
      padding: `0 ${pad}px`
    }
  }, keys.map(l => key(l, {
    flex: true,
    k: l
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 15,
      borderRadius: 27,
      overflow: 'hidden',
      padding: '11px 0 2px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: dark ? '0 -2px 20px rgba(0,0,0,0.09)' : '0 -1px 6px rgba(0,0,0,0.018), 0 -3px 20px rgba(0,0,0,0.012)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.14)' : 'rgba(255,255,255,0.25)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      padding: '8px 22px 13px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, ['"The"', 'the', 'to'].map((w, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 25,
      background: '#ccc',
      opacity: 0.3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      color: sugg,
      letterSpacing: -0.43,
      lineHeight: '22px'
    }
  }, w)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13,
      padding: '0 6.5px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']), row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], 20), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14.25,
      alignItems: 'center'
    }
  }, key(icons.shift, {
    w: 45,
    k: 'shift'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      flex: 1
    }
  }, ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(l => key(l, {
    flex: true,
    k: l
  }))), key(icons.del, {
    w: 45,
    k: 'del'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, key('ABC', {
    w: 92.25,
    fs: 18,
    k: 'abc'
  }), key('', {
    flex: true,
    k: 'space'
  }), key(icons.ret, {
    w: 92.25,
    ret: true,
    k: 'ret'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      width: '100%',
      position: 'relative'
    }
  }));
}
Object.assign(window, {
  IOSDevice,
  IOSStatusBar,
  IOSNavBar,
  IOSGlassPill,
  IOSList,
  IOSListRow,
  IOSKeyboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/IOSFrame.jsx", error: String((e && e.message) || e) }); }

// app/ItemDetail.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Item detail (in collection) — BRD §9.5
// Entry point for Sell/Trade; verification upgrade; wishlist alert.
// ─────────────────────────────────────────────────────────────

function ItemDetail({
  route
}) {
  const {
    push,
    flashToast
  } = useNav();
  const {
    wishAlerts,
    toggleWish
  } = useAppState();
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
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: null,
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--paper)',
        padding: '12px 16px 30px'
      }
    }, owned ? mine.listed ? /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "block",
      onClick: () => market && push({
        name: 'listing',
        id: market.id
      })
    }, "Manage listing") : /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "block",
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.tag,
        size: 18
      }),
      onClick: () => push({
        name: 'sell',
        sku: route.sku
      })
    }, "Sell / Trade this item") : isWish ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: alerted ? 'secondary' : 'teal',
      size: "lg",
      style: {
        flex: 1,
        justifyContent: 'center'
      },
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.bell,
        size: 17
      }),
      onClick: () => {
        toggleWish(mine.id);
        flashToast(alerted ? 'Wishlist alert off' : 'We’ll notify you when it lists');
      }
    }, alerted ? 'Alert on' : 'Notify when listed'), market && /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      onClick: () => push({
        name: 'listing',
        id: market.id
      })
    }, "View listing")) : /*#__PURE__*/React.createElement(Button, {
      variant: "dark",
      size: "block",
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.plusCircle,
        size: 18
      }),
      onClick: () => push({
        name: 'add-item',
        sku: route.sku
      })
    }, "Add to my collection"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 3
    }
  }, /*#__PURE__*/React.createElement(DetailHeader, {
    transparent: true,
    trailing: mine && /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.more,
        size: 18
      }),
      onClick: () => flashToast('Edit · privacy · remove')
    })
  })), /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: c.tone,
    ratio: "1/1",
    rounded: 0,
    label: mine && mine.photos ? `your photo · ${photo + 1} of ${nPhotos}` : 'catalogue reference'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      marginBottom: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(VerifyBadge, {
    tier: verify,
    size: "lg"
  }), mine && /*#__PURE__*/React.createElement(Tag, {
    kind: mine.status === 'preorder' ? 'po' : mine.status === 'wishlist' ? 'reserved' : 'default'
  }, statusLabel(mine.status)), mine && mine.listed && /*#__PURE__*/React.createElement(Tag, {
    kind: "sale"
  }, "Listed")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 23,
      letterSpacing: '-0.025em',
      lineHeight: 1.15,
      margin: '0 0 4px'
    }
  }, c.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      marginBottom: 14
    }
  }, c.brand, " \xB7 ", c.scale, " \xB7 ", c.year, " \xB7 SKU ", c.sku), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(ValueCard, {
    label: isWish ? 'Est. market value' : 'Est. value',
    value: mine ? mine.value : c.est,
    accent: "var(--ink)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 13,
      padding: '12px 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      marginBottom: 6
    }
  }, "Ownership"), /*#__PURE__*/React.createElement(VerifyBadge, {
    tier: verify,
    size: "lg"
  }))), mine && mine.status === 'preorder' && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--grail-gold-soft)',
      border: '1px solid var(--grail-gold)',
      borderRadius: 13,
      padding: '12px 14px',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: 'var(--grail-gold-deep)',
      fontWeight: 600,
      fontSize: 13.5
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.clock,
    size: 16
  }), "Pre-order timeline"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-mute)',
      marginTop: 6
    }
  }, mine.order, " \xB7 ", mine.eta)), owned && verify !== 'verified' && /*#__PURE__*/React.createElement("button", {
    onClick: () => flashToast('Open camera to capture an ownership photo'),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      background: 'var(--paper-soft)',
      border: '1px dashed var(--border-strong)',
      borderRadius: 13,
      padding: 13,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 10,
      background: 'var(--verified-teal)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.camera,
    size: 19
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "Verify ownership to list it"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, "Capture an in-app photo + challenge shot. Listings need Verified."))), /*#__PURE__*/React.createElement(SectionLabel, null, "About this item"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.6,
      color: 'var(--ink-soft)',
      marginTop: 10
    }
  }, c.brand, " ", c.title.split('·').slice(1).join('·').trim() || c.title, ". Catalogue entry from the CollectorHub database, ", c.year, ". ", market ? 'Currently available on the marketplace from a verified seller.' : 'No active listings right now — add a wishlist alert to get notified.')));
}
Object.assign(window, {
  ItemDetail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/ItemDetail.jsx", error: String((e && e.message) || e) }); }

// app/ListingView.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Listing detail — BRD §9.9
// Gallery + item info + verification + seller trust + DM to transact.
// ─────────────────────────────────────────────────────────────

function ListingView({
  route
}) {
  const {
    push,
    pop,
    flashToast,
    setOverlay
  } = useNav();
  const {
    saved,
    toggleSave,
    listingStatus,
    userListings,
    wishlistedSkus,
    toggleWishlistSku
  } = useAppState();

  // User-created listings (from Add an item → For sale) AND seed listings
  // both use the add-item shape and render from their own captured data —
  // never the seed catalogue lookup.
  const ul = (userListings || []).find(x => x.id === route.id) || MARKET_SEED.find(x => x.id === route.id);
  if (ul) return /*#__PURE__*/React.createElement(UserListingView, {
    listing: ul
  });
  const l = listingOf(route.id);
  const c = catOf(l.sku);
  const seller = userOf(l.seller);
  const status = listingStatus[l.id] || l.status;
  const isSaved = saved[l.id];
  const isWishlisted = !!(wishlistedSkus || {})[l.sku];
  const [photo, setPhoto] = React.useState(0);
  const [tab, setTab] = React.useState('details'); // details | terms (v1.2 §9.9)
  const [qty, setQty] = React.useState(1); // purchase field (v1.2 §9.9)
  const [fulfil, setFulfil] = React.useState(l.trade ? 'ship' : 'ship'); // ship | pickup
  const [priceVote, setPriceVote] = React.useState(null); // anon feedback (v1.2 §9.9)
  const sold = status === 'sold';
  const terms = termsOf(l.id);
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: null,
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--paper)',
        padding: '12px 16px 30px'
      }
    }, sold ? /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "block",
      disabled: true
    }, "This listing is sold") : status === 'reserved' ? /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "block",
      disabled: true
    }, "Reserved \u2014 ask to join the queue") : /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10
      }
    }, l.trade && /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "lg",
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.swap,
        size: 18
      }),
      onClick: () => push({
        name: 'chat',
        user: l.seller,
        listing: l.id,
        intent: 'trade'
      })
    }, "Trade"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      style: {
        flex: 1,
        justifyContent: 'center'
      },
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.message,
        size: 18
      }),
      onClick: () => push({
        name: 'chat',
        user: l.seller,
        listing: l.id,
        intent: 'buy'
      })
    }, "Message seller")))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 3
    }
  }, /*#__PURE__*/React.createElement(DetailHeader, {
    transparent: true,
    trailing: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.bookmark,
        size: 17,
        fill: isWishlisted ? 'currentColor' : 'none'
      }),
      onClick: () => {
        toggleWishlistSku(l.sku);
        flashToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.heart,
        size: 18,
        fill: isSaved ? 'var(--stamp-red)' : 'none'
      }),
      onClick: () => {
        toggleSave(l.id);
        flashToast(isSaved ? 'Removed from watchlist' : 'Saved to watchlist');
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.share,
        size: 17
      }),
      onClick: () => setOverlay({
        name: 'share',
        label: 'this listing'
      })
    }))
  })), /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: c.tone,
    ratio: "1/1",
    rounded: 0,
    label: `${l.sku} · ${photo + 1} of ${l.photos}`
  }, status !== 'available' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 60,
      left: 16
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: sold ? 'sold' : 'reserved',
    style: {
      fontSize: 12,
      padding: '5px 10px'
    }
  }, statusLabel(status))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      justifyContent: 'center',
      padding: '12px 0 4px'
    }
  }, Array.from({
    length: Math.min(l.photos, 6)
  }).map((_, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setPhoto(i),
    style: {
      width: i === photo ? 18 : 7,
      height: 7,
      borderRadius: 999,
      border: 'none',
      cursor: 'pointer',
      background: i === photo ? 'var(--ink)' : 'var(--bone-deep)',
      transition: 'all 160ms'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 16px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(VerifyBadge, {
    tier: l.verify,
    size: "lg"
  }), l.trade && /*#__PURE__*/React.createElement(Tag, {
    kind: "default"
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.swap,
    size: 11
  }), " Trade considered")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 23,
      letterSpacing: '-0.025em',
      lineHeight: 1.15,
      margin: '0 0 4px'
    }
  }, c.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      marginBottom: 12
    }
  }, c.brand, " \xB7 ", c.scale, " \xB7 ", c.year, " \xB7 SKU ", c.sku), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 28,
      color: 'var(--stamp-red)'
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: l.price
  })), l.retail > l.price && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: l.retail,
    strike: true
  })), l.retail > l.price && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--forest)',
      fontWeight: 600
    }
  }, Math.round((1 - l.price / l.retail) * 100), "% off MRP")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      borderBottom: '1px solid var(--border)',
      marginBottom: 16
    }
  }, [{
    id: 'details',
    label: 'Details'
  }, {
    id: 'terms',
    label: 'Seller terms'
  }].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    onClick: () => setTab(t.id),
    style: {
      background: 'none',
      border: 'none',
      padding: '0 0 10px',
      cursor: 'pointer',
      position: 'relative',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 14,
      color: tab === t.id ? 'var(--ink)' : 'var(--ink-faint)'
    }
  }, t.label, tab === t.id && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: -1,
      height: 2,
      background: 'var(--stamp-red)',
      borderRadius: 2
    }
  })))), tab === 'details' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 13,
      overflow: 'hidden',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(SpecRow, {
    label: "Condition",
    value: l.condition
  }), /*#__PURE__*/React.createElement(SpecRow, {
    label: "Quantity",
    value: `${l.qty} available`
  }), /*#__PURE__*/React.createElement(SpecRow, {
    label: "Ships from",
    value: l.ships
  }), /*#__PURE__*/React.createElement(SpecRow, {
    label: "Watching",
    value: `${l.watching} people`,
    last: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5,
      flexWrap: 'wrap',
      marginBottom: 16
    }
  }, CONDITION_LADDER.map(cd => {
    const on = cd === gradeOf(l.condition);
    return /*#__PURE__*/React.createElement("span", {
      key: cd,
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        letterSpacing: '0.04em',
        padding: '4px 8px',
        borderRadius: 6,
        background: on ? 'var(--ink)' : 'var(--bone)',
        color: on ? 'var(--paper)' : 'var(--ink-faint)',
        border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
        fontWeight: on ? 700 : 500
      }
    }, cd);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--ink-soft)',
      marginBottom: 18
    }
  }, l.notes), !sold && status === 'available' && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Your order"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--ink-soft)'
    }
  }, "Quantity"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Stepper, {
    sign: "\u2212",
    disabled: qty <= 1,
    onClick: () => setQty(q => Math.max(1, q - 1))
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      textAlign: 'center',
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 16
    }
  }, qty), /*#__PURE__*/React.createElement(Stepper, {
    sign: "+",
    disabled: qty >= l.qty,
    onClick: () => setQty(q => Math.min(l.qty, q + 1))
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--ink-soft)'
    }
  }, "Fulfilment")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 9
    }
  }, [{
    id: 'ship',
    label: 'Shipping'
  }, {
    id: 'pickup',
    label: 'Local pickup'
  }].map(o => /*#__PURE__*/React.createElement("button", {
    key: o.id,
    onClick: () => setFulfil(o.id),
    style: {
      flex: 1,
      padding: '10px 0',
      borderRadius: 11,
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 13.5,
      border: `1px solid ${fulfil === o.id ? 'var(--ink)' : 'var(--border-strong)'}`,
      background: fulfil === o.id ? 'var(--ink)' : 'transparent',
      color: fulfil === o.id ? 'var(--paper)' : 'var(--ink)'
    }
  }, o.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: 14,
      paddingTop: 12,
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)'
    }
  }, "Est. total ", fulfil === 'ship' ? '(+ shipping)' : '(pickup)'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      color: 'var(--stamp-red)'
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: l.price * qty
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bone)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.info,
    size: 15,
    style: {
      color: 'var(--ink-mute)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "Is this price fair?"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--ink-faint)',
      marginLeft: 'auto'
    }
  }, "Anonymous")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 11
    }
  }, [{
    id: 'low',
    label: 'Too low'
  }, {
    id: 'fair',
    label: 'Fair'
  }, {
    id: 'high',
    label: 'Too high'
  }].map(o => {
    const on = priceVote === o.id;
    return /*#__PURE__*/React.createElement("button", {
      key: o.id,
      onClick: () => {
        setPriceVote(o.id);
        flashToast('Thanks — feedback sent anonymously');
      },
      style: {
        flex: 1,
        padding: '9px 0',
        borderRadius: 10,
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 13,
        border: `1px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
        background: on ? 'var(--ink)' : 'var(--paper)',
        color: on ? 'var(--paper)' : 'var(--ink-soft)'
      }
    }, o.label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      marginTop: 9
    }
  }, priceVote ? 'Your vote is private. The seller only sees the overall split.' : `${l.priceVotes || 28} collectors weighed in · mostly “Fair”.`))) :
  /*#__PURE__*/
  /* ── Seller terms tab ── */
  React.createElement("div", {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)',
      marginBottom: 12
    }
  }, "Set by ", seller.name, ". Read before you message."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 13,
      overflow: 'hidden'
    }
  }, terms.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 11,
      alignItems: 'flex-start',
      padding: '13px 14px',
      borderBottom: i < terms.length - 1 ? '1px solid var(--border)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.check,
    size: 16,
    stroke: 2.4,
    style: {
      color: 'var(--forest)',
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--ink-soft)',
      lineHeight: 1.45
    }
  }, t))))), /*#__PURE__*/React.createElement(ListingQA, {
    seller: l.seller
  }), /*#__PURE__*/React.createElement(SectionLabel, null, "Seller"), /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'profile',
      user: l.seller
    }),
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      marginTop: 10,
      padding: 14,
      cursor: 'pointer',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: seller.name,
    color: seller.color,
    size: 46,
    verified: seller.tier !== 'Verified'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 15,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 0
    }
  }, seller.name), /*#__PURE__*/React.createElement(TierChip, {
    tier: seller.tier
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      marginTop: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, "@", seller.handle, " \xB7 ", seller.city)), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 18,
    stroke: 2,
    style: {
      transform: 'rotate(180deg)',
      color: 'var(--ink-faint)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      paddingTop: 14,
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(TrustSignals, {
    u: seller
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      background: 'var(--grail-gold-soft)',
      border: '1px solid var(--grail-gold)',
      borderRadius: 13,
      padding: '12px 14px',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 17,
    style: {
      color: 'var(--grail-gold-deep)',
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-soft)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("b", null, "Safe trading:"), " deals complete off-platform. CollectorHub doesn\u2019t hold payments. Always check trust signals, ask for an in-hand video, and never pay before you\u2019ve verified the seller."))));
}

// ── Detail for a user-created listing — renders ONLY what the seller
//    entered in Add an item. No catalogue lookup, no invented data. ──
function UserListingView({
  listing: l
}) {
  const {
    push,
    pop,
    flashToast,
    setOverlay
  } = useNav();
  const {
    saved,
    toggleSave,
    wishlistedSkus,
    toggleWishlistSku
  } = useAppState();
  const isSaved = saved[l.id];
  const isWishlisted = !!(wishlistedSkus || {})[l.id];
  const [photo, setPhoto] = React.useState(0);
  const photos = l.photos && l.photos.length ? l.photos : [l.tone || 'ink'];
  const sym = l.sym || '₹';
  const mine = l.mine;
  const seller = mine ? null : userOf(l.seller);
  const SCALE_LABEL = {
    figures: 'Action Figure',
    diecast: 'Diecast',
    kits: 'Model Kits & Lego',
    designer: 'Designer Toys & Blind Boxes'
  };
  const terms = [];
  terms.push(l.shipIncl ? 'Shipping included in the price' : 'Buyer pays shipping');
  terms.push(l.returns ? 'Returns accepted within a short window' : 'No returns — sold as described');
  if (l.trade) terms.push('Open to trade offers');
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: null,
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--paper)',
        padding: '12px 16px 30px'
      }
    }, mine ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-faint)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em'
      }
    }, "YOUR LISTING \xB7 LIVE"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        color: 'var(--stamp-red)'
      }
    }, /*#__PURE__*/React.createElement(Money, {
      value: l.price,
      currency: sym
    }))), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.edit,
        size: 17
      }),
      onClick: () => {
        pop();
        setTimeout(() => push({
          name: 'add-listing'
        }), 10);
      }
    }, "Edit"), /*#__PURE__*/React.createElement(Button, {
      variant: "dark",
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.share,
        size: 17
      }),
      onClick: () => setOverlay({
        name: 'share',
        label: l.title
      })
    }, "Share")) : /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10
      }
    }, l.trade && /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "lg",
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.swap,
        size: 18
      }),
      onClick: () => push({
        name: 'chat',
        user: l.seller,
        listing: l.id,
        intent: 'trade'
      })
    }, "Trade"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      style: {
        flex: 1,
        justifyContent: 'center'
      },
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.message,
        size: 18
      }),
      onClick: () => push({
        name: 'chat',
        user: l.seller,
        listing: l.id,
        intent: 'buy'
      })
    }, "Message seller")))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 3
    }
  }, /*#__PURE__*/React.createElement(DetailHeader, {
    transparent: true,
    trailing: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.bookmark,
        size: 17,
        fill: isWishlisted ? 'currentColor' : 'none'
      }),
      onClick: () => {
        toggleWishlistSku(l.id);
        flashToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.heart,
        size: 18,
        fill: isSaved ? 'var(--stamp-red)' : 'none'
      }),
      onClick: () => {
        toggleSave(l.id);
        flashToast(isSaved ? 'Removed from watchlist' : 'Saved to watchlist');
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.share,
        size: 17
      }),
      onClick: () => setOverlay({
        name: 'share',
        label: l.title
      })
    }))
  })), /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: photos[photo],
    ratio: "1/1",
    rounded: 0,
    label: `${photo + 1} of ${photos.length}`
  })), photos.length > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      justifyContent: 'center',
      padding: '12px 0 4px'
    }
  }, photos.map((_, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setPhoto(i),
    style: {
      width: i === photo ? 18 : 7,
      height: 7,
      borderRadius: 999,
      border: 'none',
      cursor: 'pointer',
      background: i === photo ? 'var(--ink)' : 'var(--bone-deep)',
      transition: 'all 160ms'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 16px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(VerifyBadge, {
    tier: l.verify,
    size: "lg"
  }), l.acq === 'preorder' && /*#__PURE__*/React.createElement(Tag, {
    kind: "default"
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.clock,
    size: 11
  }), " Pre-order"), l.trade && /*#__PURE__*/React.createElement(Tag, {
    kind: "default"
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.swap,
    size: 11
  }), " Trade considered")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 23,
      letterSpacing: '-0.025em',
      lineHeight: 1.15,
      margin: '0 0 4px'
    }
  }, l.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      marginBottom: 12
    }
  }, [l.brand, l.scale, l.year].filter(Boolean).join(' · ')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      color: 'var(--stamp-red)',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: l.price,
    currency: sym
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 13,
      overflow: 'hidden',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(SpecRow, {
    label: "Category",
    value: SCALE_LABEL[l.cat] || l.cat
  }), /*#__PURE__*/React.createElement(SpecRow, {
    label: "Brand",
    value: l.brand
  }), l.scale && /*#__PURE__*/React.createElement(SpecRow, {
    label: "Scale",
    value: l.scale
  }), /*#__PURE__*/React.createElement(SpecRow, {
    label: "Condition",
    value: l.condition
  }), l.year && /*#__PURE__*/React.createElement(SpecRow, {
    label: "Release year",
    value: l.year
  }), l.acq === 'preorder' && l.poDate && /*#__PURE__*/React.createElement(SpecRow, {
    label: "Launch date",
    value: l.poDate
  }), l.acq === 'preorder' && l.poSeller && /*#__PURE__*/React.createElement(SpecRow, {
    label: "Pre-order from",
    value: l.poSeller
  }), /*#__PURE__*/React.createElement(SpecRow, {
    label: "Shipping",
    value: l.shipIncl ? 'Included' : 'Extra',
    last: !l.condNote && !l.desc
  })), l.desc && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionLabel, null, "About this item"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--ink-soft)',
      margin: '10px 0 18px'
    }
  }, l.desc)), l.condNote && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionLabel, null, "Condition notes"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.6,
      color: 'var(--ink-soft)',
      margin: '10px 0 18px',
      padding: 13,
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 12
    }
  }, l.condNote)), /*#__PURE__*/React.createElement(SectionLabel, null, "Seller terms"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 13,
      overflow: 'hidden',
      margin: '10px 0 18px'
    }
  }, terms.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 11,
      alignItems: 'flex-start',
      padding: '13px 14px',
      borderBottom: i < terms.length - 1 ? '1px solid var(--border)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.check,
    size: 16,
    stroke: 2.4,
    style: {
      color: 'var(--forest)',
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--ink-soft)',
      lineHeight: 1.45
    }
  }, t)))), !mine && /*#__PURE__*/React.createElement(ListingQA, {
    seller: l.seller
  }), mine ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      background: 'var(--grail-gold-soft)',
      border: '1px solid var(--grail-gold)',
      borderRadius: 13,
      padding: '12px 14px'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 17,
    style: {
      color: 'var(--grail-gold-deep)',
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-soft)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("b", null, "Boost trust:"), " add a verified in-app photo to earn the Verified badge \u2014 verified listings rank higher and sell faster.")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionLabel, null, "Seller"), /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'profile',
      user: l.seller
    }),
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      marginTop: 10,
      padding: 14,
      cursor: 'pointer',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: seller.name,
    color: seller.color,
    size: 46,
    verified: seller.tier !== 'Verified'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 15,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 0
    }
  }, seller.name), /*#__PURE__*/React.createElement(TierChip, {
    tier: seller.tier
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      marginTop: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, "@", seller.handle, " \xB7 ", seller.city)), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 18,
    stroke: 2,
    style: {
      transform: 'rotate(180deg)',
      color: 'var(--ink-faint)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      paddingTop: 14,
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(TrustSignals, {
    u: seller
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      background: 'var(--grail-gold-soft)',
      border: '1px solid var(--grail-gold)',
      borderRadius: 13,
      padding: '12px 14px',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 17,
    style: {
      color: 'var(--grail-gold-deep)',
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-soft)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("b", null, "Safe trading:"), " deals complete off-platform. CollectorHub doesn\u2019t hold payments. Always check trust signals, ask for an in-hand video, and never pay before you\u2019ve verified the seller.")))));
}

// ── Public Q&A block for listing pages ──
const SEED_QA = [{
  q: 'Is this sealed or previously opened?',
  a: 'Completely sealed — never opened, box is in mint condition.',
  user: 'aman_toys',
  time: '2d'
}, {
  q: 'Can you do local pickup in Mumbai?',
  a: 'Yes, Andheri West. DM me to arrange.',
  user: 'meera',
  time: '5d'
}];
function ListingQA({
  seller
}) {
  const {
    flashToast
  } = useNav();
  const [questions, setQuestions] = React.useState(SEED_QA);
  const [draft, setDraft] = React.useState('');
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? questions : questions.slice(0, 2);
  const ask = () => {
    if (!draft.trim()) return;
    setQuestions(qs => [{
      q: draft.trim(),
      a: null,
      user: 'you',
      time: 'just now'
    }, ...qs]);
    setDraft('');
    flashToast('Question posted — seller will be notified');
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Q&A"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      marginBottom: 12,
      marginTop: 4
    }
  }, "Questions are public \u2014 don't share personal info here."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: draft,
    onChange: e => setDraft(e.target.value),
    onKeyDown: e => e.key === 'Enter' && ask(),
    placeholder: "Ask the seller a question\u2026",
    style: {
      flex: 1,
      height: 40,
      padding: '0 13px',
      borderRadius: 10,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: 13.5,
      color: 'var(--ink)',
      outline: 'none'
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: ask,
    style: {
      height: 40,
      padding: '0 14px',
      borderRadius: 10,
      border: 'none',
      background: draft.trim() ? 'var(--ink)' : 'var(--bone-deep)',
      color: draft.trim() ? 'var(--paper)' : 'var(--ink-faint)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 13,
      cursor: draft.trim() ? 'pointer' : 'default',
      transition: 'all 120ms'
    }
  }, "Ask")), questions.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-faint)',
      padding: '12px 0'
    }
  }, "No questions yet \u2014 be the first to ask.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, visible.map((item, i) => {
    const qu = item.user === 'you' ? {
      name: 'You',
      color: 'var(--ink)'
    } : userOf(item.user);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: 'var(--paper-soft)',
        border: '1px solid var(--border)',
        borderRadius: 13,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '11px 13px',
        display: 'flex',
        gap: 9,
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: qu.name,
      color: qu.color,
      size: 26
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-faint)',
        marginBottom: 3
      }
    }, qu.name, " \xB7 ", item.time), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--ink)',
        lineHeight: 1.45
      }
    }, item.q))), item.a ? /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '10px 13px 12px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bone)',
        display: 'flex',
        gap: 9
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: userOf(seller).name,
      color: userOf(seller).color,
      size: 26
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-faint)',
        marginBottom: 3
      }
    }, "Seller \xB7 verified answer"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: 'var(--ink-soft)',
        lineHeight: 1.45
      }
    }, item.a))) : /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '9px 13px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bone)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-faint)',
        fontStyle: 'italic'
      }
    }, "Awaiting seller response\u2026")));
  }), questions.length > 2 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setExpanded(v => !v),
    style: {
      background: 'none',
      border: 'none',
      padding: '4px 0',
      cursor: 'pointer',
      color: 'var(--stamp-red)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 13,
      textAlign: 'left'
    }
  }, expanded ? 'Show less' : `View all ${questions.length} questions`)));
}
function SpecRow({
  label,
  value,
  last
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '11px 14px',
      borderBottom: last ? 'none' : '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)',
      width: 92,
      flexShrink: 0
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink)',
      fontWeight: 500,
      textAlign: 'right',
      flex: 1
    }
  }, value));
}
function Stepper({
  sign,
  onClick,
  disabled
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      cursor: disabled ? 'default' : 'pointer',
      border: '1px solid var(--border-strong)',
      background: 'var(--paper)',
      color: disabled ? 'var(--ink-ghost)' : 'var(--ink)',
      fontSize: 18,
      lineHeight: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)'
    }
  }, sign);
}
Object.assign(window, {
  ListingView,
  UserListingView,
  SpecRow,
  Stepper
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/ListingView.jsx", error: String((e && e.message) || e) }); }

// app/MarketView.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Marketplace (Browse) — BRD §9.8
// ─────────────────────────────────────────────────────────────

function FilterLabel({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--ink-faint)',
      marginBottom: 8
    }
  }, children);
}
function FilterChip({
  active,
  onClick,
  children,
  icon,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '7px 12px',
      borderRadius: 8,
      cursor: 'pointer',
      border: `1px solid ${active ? 'var(--ink)' : 'var(--border-strong)'}`,
      background: active ? 'var(--ink)' : 'var(--paper-soft)',
      color: active ? 'var(--paper)' : 'var(--ink)',
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: 12.5,
      whiteSpace: 'nowrap',
      lineHeight: 1,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(Ico, {
    d: icon,
    size: 13,
    stroke: 1.75
  }), children);
}

// Dual-thumb price range slider
const PRICE_MAX = 200000;
const PRICE_STEP = 2500;
function PriceRangeSlider({
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice
}) {
  const mn = minPrice === '' ? 0 : Number(minPrice);
  const mx = maxPrice === '' ? PRICE_MAX : Number(maxPrice);
  const minPct = mn / PRICE_MAX * 100;
  const maxPct = mx / PRICE_MAX * 100;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, "\u20B9", mn === 0 ? '0' : mn.toLocaleString('en-IN')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, mx >= PRICE_MAX ? 'Any' : '₹' + mx.toLocaleString('en-IN'))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 28,
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 4,
      borderRadius: 2,
      background: 'var(--bone)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: minPct + '%',
      width: maxPct - minPct + '%',
      height: 4,
      borderRadius: 2,
      background: 'var(--ink)',
      transition: 'left 60ms, width 60ms'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: minPct + '%',
      transform: 'translateX(-50%)',
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: 'var(--ink)',
      border: '3px solid var(--paper)',
      boxShadow: '0 1px 5px rgba(0,0,0,0.28)',
      pointerEvents: 'none',
      zIndex: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: maxPct + '%',
      transform: 'translateX(-50%)',
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: 'var(--ink)',
      border: '3px solid var(--paper)',
      boxShadow: '0 1px 5px rgba(0,0,0,0.28)',
      pointerEvents: 'none',
      zIndex: 2
    }
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 0,
    max: PRICE_MAX,
    step: PRICE_STEP,
    value: mn,
    onChange: e => {
      const v = Math.min(Number(e.target.value), mx - PRICE_STEP);
      setMinPrice(v === 0 ? '' : String(v));
    },
    style: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      opacity: 0,
      cursor: 'pointer',
      zIndex: mn > PRICE_MAX * 0.75 ? 5 : 3
    }
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 0,
    max: PRICE_MAX,
    step: PRICE_STEP,
    value: mx,
    onChange: e => {
      const v = Math.max(Number(e.target.value), mn + PRICE_STEP);
      setMaxPrice(v >= PRICE_MAX ? '' : String(v));
    },
    style: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      opacity: 0,
      cursor: 'pointer',
      zIndex: 4
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      color: 'var(--ink-faint)',
      marginTop: 4,
      fontFamily: 'var(--font-mono)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u20B90"), /*#__PURE__*/React.createElement("span", null, "\u20B92L+")));
}
function MarketView() {
  const {
    push
  } = useNav();
  const {
    userListings,
    saved
  } = useAppState();
  const [query, setQuery] = React.useState('');
  const [showSaved, setShowSaved] = React.useState(false);
  const [showFilter, setShowFilter] = React.useState(false);
  const [sort, setSort] = React.useState('new');
  const [cats, setCats] = React.useState([]); // [] = All (multi-select)
  const [minPrice, setMinPrice] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');
  const [conds, setConds] = React.useState([]); // [] = all
  const [tradeOnly, setTradeOnly] = React.useState(false);
  const [shipOnly, setShipOnly] = React.useState(false);
  const toggleArr = (set, val) => set(a => a.includes(val) ? a.filter(x => x !== val) : [...a, val]);
  const SORT_OPTIONS = [{
    id: 'new',
    label: 'Newest'
  }, {
    id: 'low',
    label: 'Price ↑'
  }, {
    id: 'high',
    label: 'Price ↓'
  }, {
    id: 'saved',
    label: 'Most Saved'
  }, {
    id: 'watched',
    label: 'Most Watched'
  }];
  const COND_OPTIONS = ['Sealed', 'MIB', 'BIB', 'Loose'];
  const activeCount = [sort !== 'new', cats.length > 0, minPrice !== '', maxPrice !== '', conds.length > 0, tradeOnly, shipOnly].filter(Boolean).length;
  const resetAll = () => {
    setSort('new');
    setCats([]);
    setMinPrice('');
    setMaxPrice('');
    setConds([]);
    setTradeOnly(false);
    setShipOnly(false);
    setQuery('');
  };
  const allListings = React.useMemo(() => [...userListings, ...MARKET_SEED].filter(x => x.status !== 'sold'), [userListings]);
  const list = React.useMemo(() => {
    let l = allListings;
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(x => (x.title || '').toLowerCase().includes(q) || (x.brand || '').toLowerCase().includes(q) || (x.seller || '').toLowerCase().includes(q) || (x.desc || '').toLowerCase().includes(q));
    }
    if (cats.length > 0) l = l.filter(x => cats.includes(x.cat));
    if (minPrice !== '') l = l.filter(x => x.price >= Number(minPrice));
    if (maxPrice !== '') l = l.filter(x => x.price <= Number(maxPrice));
    if (conds.length > 0) l = l.filter(x => conds.includes(x.condition));
    if (tradeOnly) l = l.filter(x => x.trade);
    if (shipOnly) l = l.filter(x => x.shipIncl);
    if (sort === 'low') l = [...l].sort((a, b) => a.price - b.price);else if (sort === 'high') l = [...l].sort((a, b) => b.price - a.price);else if (sort === 'saved') l = [...l].sort((a, b) => (b.saves || 0) - (a.saves || 0));else if (sort === 'watched') l = [...l].sort((a, b) => (b.watching || 0) - (a.watching || 0));
    return l;
  }, [query, cats, sort, minPrice, maxPrice, conds, tradeOnly, shipOnly, allListings]);
  const savedListings = React.useMemo(() => allListings.filter(l => saved[l.id]), [allListings, saved]);
  const isEmpty = allListings.length === 0;
  return /*#__PURE__*/React.createElement(Screen, {
    header: /*#__PURE__*/React.createElement(AppBar, {
      title: "Market"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 4,
      background: 'var(--paper)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      padding: '10px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      height: 40,
      padding: '0 13px',
      borderRadius: 11,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.search,
    size: 17,
    style: {
      color: 'var(--ink-faint)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "Search listings, brands, sellers\u2026",
    style: {
      flex: 1,
      border: 'none',
      background: 'none',
      outline: 'none',
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--ink)'
    }
  }), query && /*#__PURE__*/React.createElement("button", {
    onClick: () => setQuery(''),
    style: {
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      color: 'var(--ink-faint)',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.close,
    size: 15
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowSaved(v => !v);
      setShowFilter(false);
    },
    style: {
      position: 'relative',
      width: 40,
      height: 40,
      borderRadius: 11,
      flexShrink: 0,
      background: showSaved ? 'var(--stamp-red)' : 'var(--paper-soft)',
      color: showSaved ? 'var(--paper)' : 'var(--ink)',
      border: `1px solid ${showSaved ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.heart,
    size: 18,
    fill: showSaved ? 'currentColor' : 'none'
  }), savedListings.length > 0 && !showSaved && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 16,
      height: 16,
      padding: '0 3px',
      borderRadius: 999,
      background: 'var(--stamp-red)',
      color: 'var(--paper)',
      fontSize: 9,
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1.5px solid var(--paper)'
    }
  }, savedListings.length)), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowFilter(v => !v);
      setShowSaved(false);
    },
    style: {
      position: 'relative',
      width: 40,
      height: 40,
      borderRadius: 11,
      flexShrink: 0,
      background: showFilter || activeCount > 0 ? 'var(--ink)' : 'var(--paper-soft)',
      color: showFilter || activeCount > 0 ? 'var(--paper)' : 'var(--ink)',
      border: `1px solid ${showFilter || activeCount > 0 ? 'var(--ink)' : 'var(--border-strong)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.filter,
    size: 18
  }), activeCount > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 16,
      height: 16,
      padding: '0 3px',
      borderRadius: 999,
      background: 'var(--stamp-red)',
      color: 'var(--paper)',
      fontSize: 9,
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1.5px solid var(--paper)'
    }
  }, activeCount))), showFilter && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border)',
      padding: '16px 16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      maxHeight: 460,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FilterLabel, null, "Category"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 6
    }
  }, CATEGORIES.map(c => /*#__PURE__*/React.createElement(FilterChip, {
    key: c.id,
    active: cats.includes(c.id),
    onClick: () => toggleArr(setCats, c.id),
    style: {
      justifyContent: 'center'
    }
  }, c.label))), cats.length > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setCats([]),
    style: {
      marginTop: 7,
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-body)',
      fontSize: 12
    }
  }, "Clear category selection")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FilterLabel, null, "Sort by"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, SORT_OPTIONS.map(o => /*#__PURE__*/React.createElement(FilterChip, {
    key: o.id,
    active: sort === o.id,
    onClick: () => setSort(o.id)
  }, o.label)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FilterLabel, null, "Price range"), /*#__PURE__*/React.createElement(PriceRangeSlider, {
    minPrice: minPrice,
    maxPrice: maxPrice,
    setMinPrice: setMinPrice,
    setMaxPrice: setMaxPrice
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FilterLabel, null, "Condition"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, COND_OPTIONS.map(c => /*#__PURE__*/React.createElement(FilterChip, {
    key: c,
    active: conds.includes(c),
    onClick: () => toggleArr(setConds, c)
  }, c)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FilterLabel, null, "Quick filters"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(FilterChip, {
    active: tradeOnly,
    onClick: () => setTradeOnly(v => !v),
    icon: Icons.swap
  }, "Trade open"), /*#__PURE__*/React.createElement(FilterChip, {
    active: shipOnly,
    onClick: () => setShipOnly(v => !v),
    icon: Icons.send
  }, "Shipping incl."))), activeCount > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: resetAll,
    style: {
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      color: 'var(--stamp-red)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 13,
      textAlign: 'left'
    }
  }, "Reset all filters"))), showSaved ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--ink-faint)',
      letterSpacing: '0.04em'
    }
  }, savedListings.length, " SAVED")), savedListings.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '48px 0',
      color: 'var(--ink-faint)',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.heart,
    size: 28,
    style: {
      opacity: 0.3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      marginTop: 10
    }
  }, "No saved listings yet."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      marginTop: 4,
      color: 'var(--ink-ghost)'
    }
  }, "Tap \u2764\uFE0F on any listing to save it here.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, savedListings.map(l => /*#__PURE__*/React.createElement(MarketCard, {
    key: l.id,
    id: l.id,
    listing: l
  })))) : isEmpty ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '64px 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 18,
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      color: 'var(--ink-faint)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.bag,
    size: 28
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 19,
      letterSpacing: '-0.01em'
    }
  }, "Nothing listed yet"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-faint)',
      marginTop: 7,
      maxWidth: 270,
      lineHeight: 1.55
    }
  }, "Add an item and flip ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink-soft)'
    }
  }, "List for sale"), " \u2014 it shows up here instantly."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.tag,
      size: 17
    }),
    onClick: () => push({
      name: 'add-listing'
    })
  }, "Add an item"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px 8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--ink-faint)',
      letterSpacing: '0.04em'
    }
  }, list.length, " ", list.length === 1 ? 'LISTING' : 'LISTINGS'), activeCount > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: resetAll,
    style: {
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      color: 'var(--stamp-red)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 12.5
    }
  }, "Clear filters")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      padding: '0 16px 28px'
    }
  }, list.map(l => /*#__PURE__*/React.createElement(MarketCard, {
    key: l.id,
    id: l.id,
    listing: l
  })), list.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '44px 0',
      color: 'var(--ink-faint)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.filter,
    size: 26,
    style: {
      opacity: 0.35
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      marginTop: 10
    }
  }, "No listings match these filters."), /*#__PURE__*/React.createElement("button", {
    onClick: resetAll,
    style: {
      marginTop: 10,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--stamp-red)',
      fontWeight: 600,
      fontFamily: 'var(--font-body)',
      fontSize: 13
    }
  }, "Clear filters")))));
}
Object.assign(window, {
  MarketView
});
function ISOBoardContent({
  push
}) {
  const {
    posts
  } = useAppState();
  const {
    setOverlay
  } = useNav();
  const allISO = React.useMemo(() => {
    const live = (posts || []).filter(p => p.type === 'iso');
    const seed = typeof ISO_POSTS !== 'undefined' ? ISO_POSTS : [];
    // deduplicate by id
    const seen = new Set(live.map(p => p.id));
    return [...live, ...seed.filter(p => !seen.has(p.id))];
  }, [posts]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px 10px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--ink-faint)',
      letterSpacing: '0.04em'
    }
  }, allISO.length, " ", allISO.length === 1 ? 'COLLECTOR' : 'COLLECTORS', " LOOKING"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "grail",
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.edit,
      size: 14
    }),
    onClick: () => {
      setOverlay({
        name: 'compose'
      });
    }
  }, "Post ISO")), allISO.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '56px 32px',
      textAlign: 'center',
      gap: 12,
      color: 'var(--ink-faint)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.search,
    size: 28,
    style: {
      opacity: 0.3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, "No ISOs yet"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      lineHeight: 1.55,
      maxWidth: 260
    }
  }, "Be the first \u2014 let collectors know what you're hunting."), /*#__PURE__*/React.createElement(Button, {
    variant: "teal",
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.edit,
      size: 16
    }),
    onClick: () => setOverlay({
      name: 'compose'
    })
  }, "Post an ISO")) : allISO.map(post => /*#__PURE__*/React.createElement(ISOCard, {
    key: post.id,
    post: post
  })));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/MarketView.jsx", error: String((e && e.message) || e) }); }

// app/Nav.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// CollectorHub — Navigation + App state (5-tab IA, BRD §9)
// ─────────────────────────────────────────────────────────────

const NavContext = React.createContext(null);
const useNav = () => React.useContext(NavContext);
const StateContext = React.createContext(null);
const useAppState = () => React.useContext(StateContext);
const TAB_ROOTS = {
  feed: {
    name: 'feed'
  },
  market: {
    name: 'market'
  },
  community: {
    name: 'community'
  },
  events: {
    name: 'events'
  },
  me: {
    name: 'profile',
    user: 'you',
    isMe: true
  }
};
function NavProvider({
  children
}) {
  const [tab, setTab] = React.useState('feed');
  const [stacks, setStacks] = React.useState({
    feed: [TAB_ROOTS.feed],
    market: [TAB_ROOTS.market],
    community: [TAB_ROOTS.community],
    events: [TAB_ROOTS.events],
    me: [TAB_ROOTS.me]
  });
  // overlay: { name: 'compose'|'search'|'notifications', ... } | null
  const [overlay, setOverlay] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const push = React.useCallback(route => {
    setStacks(s => ({
      ...s,
      [tab]: [...s[tab], route]
    }));
  }, [tab]);
  const pop = React.useCallback(() => {
    setStacks(s => {
      const cur = s[tab];
      if (cur.length <= 1) return s;
      return {
        ...s,
        [tab]: cur.slice(0, -1)
      };
    });
  }, [tab]);
  const switchTab = React.useCallback(t => {
    setOverlay(null);
    if (t === tab) setStacks(s => ({
      ...s,
      [tab]: [s[tab][0]]
    }));else setTab(t);
  }, [tab]);
  const flashToast = React.useCallback(text => {
    const id = Date.now();
    setToast({
      id,
      text
    });
    setTimeout(() => setToast(t => t && t.id === id ? null : t), 2400);
  }, []);
  const value = {
    tab,
    stacks,
    push,
    pop,
    switchTab,
    overlay,
    setOverlay,
    toast,
    flashToast
  };
  return /*#__PURE__*/React.createElement(NavContext.Provider, {
    value: value
  }, children);
}
function AppStateProvider({
  children
}) {
  const [hearted, setHearted] = React.useState({
    p2: true
  });
  const [saved, setSaved] = React.useState({
    'sideshow-batman': true
  });
  const [followed, setFollowed] = React.useState({
    rohit_scale: true,
    vikram: true
  });
  const [joined, setJoined] = React.useState({
    itm: true,
    jdm: true,
    mfh: true
  });
  const [comRequested, setComRequested] = React.useState({}); // private communities I've requested to join
  const [interested, setInterested] = React.useState({
    mumbai4: true
  });
  const [wishAlerts, setWishAlerts] = React.useState({
    w1: true,
    w2: true
  });
  const [readNotifs, setReadNotifs] = React.useState({});
  const [threads, setThreads] = React.useState(() => JSON.parse(JSON.stringify(THREADS)));
  const [deals, setDeals] = React.useState({}); // chat handle -> 'requested'|'confirmed'
  const [listingStatus, setListingStatus] = React.useState({}); // listing id -> status override
  const [posts, setPosts] = React.useState(() => typeof ISO_POSTS !== 'undefined' ? ISO_POSTS.slice(0, 3) : []); // seeded with ISO posts + user-created posts
  const [userListings, setUserListings] = React.useState([]); // user-created market listings
  const [profile, setProfile] = React.useState({}); // overrides on ME (edit profile / avatar)
  const [vouched, setVouched] = React.useState({}); // handle -> { rel, note } (vouches you've given)
  const [userEvents, setUserEvents] = React.useState([]); // events you host (pending/approved)
  const [rsvp, setRsvp] = React.useState({}); // eventId -> 'going' | 'interested'
  const [userCommunities, setUserCommunities] = React.useState([]); // communities created via event hosting
  const [eventCommunityDraft, setEventCommunityDraft] = React.useState(null); // id handed back from create-community
  const [reminders, setReminders] = React.useState({}); // eventId -> true
  const [wishlistedSkus, setWishlistedSkus] = React.useState({}); // sku -> true (wishlisted from others' profiles)
  const [liveNotifs, setLiveNotifs] = React.useState([]); // runtime notifications added by user actions

  const toggleHeart = id => setHearted(h => ({
    ...h,
    [id]: !h[id]
  }));
  const toggleSave = id => setSaved(s => ({
    ...s,
    [id]: !s[id]
  }));
  const toggleFollow = h => setFollowed(f => ({
    ...f,
    [h]: !f[h]
  }));
  const toggleJoin = id => setJoined(j => ({
    ...j,
    [id]: !j[id]
  }));
  const requestJoin = id => setComRequested(r => ({
    ...r,
    [id]: true
  }));
  const cancelRequest = id => setComRequested(r => {
    const c = {
      ...r
    };
    delete c[id];
    return c;
  });
  const toggleInterested = id => setInterested(r => ({
    ...r,
    [id]: !r[id]
  }));
  const toggleWish = id => setWishAlerts(w => ({
    ...w,
    [id]: !w[id]
  }));
  const addNotif = n => setLiveNotifs(p => [{
    ...n,
    id: 'ln' + Date.now(),
    unread: true,
    time: 'just now'
  }, ...p]);
  const markNotifsRead = () => setReadNotifs(r => {
    const all = {
      ...r
    };
    NOTIFICATIONS.forEach(n => {
      all[n.id] = true;
    });
    liveNotifs.forEach(n => {
      all[n.id] = true;
    });
    return all;
  });
  const sendMessage = (handle, text) => setThreads(t => {
    const cur = t[handle] || {
      listing: null,
      messages: []
    };
    return {
      ...t,
      [handle]: {
        ...cur,
        messages: [...cur.messages, {
          from: 'me',
          text,
          time: 'now'
        }]
      }
    };
  });
  const requestDeal = handle => setDeals(d => ({
    ...d,
    [handle]: 'requested'
  }));
  const confirmDeal = handle => setDeals(d => ({
    ...d,
    [handle]: 'confirmed'
  }));
  const setListing = (id, status) => setListingStatus(s => ({
    ...s,
    [id]: status
  }));
  const addPost = post => setPosts(p => [{
    ...post,
    id: 'u' + Date.now(),
    mine: true,
    time: 'now',
    likes: 0,
    comments: 0
  }, ...p]);
  const addListing = l => setUserListings(p => [{
    ...l,
    posted: 'now'
  }, ...p]);
  const updateProfile = patch => setProfile(p => ({
    ...p,
    ...patch
  }));
  const addVouch = (handle, data) => setVouched(v => ({
    ...v,
    [handle]: data
  }));
  const removeVouch = handle => setVouched(v => {
    const c = {
      ...v
    };
    delete c[handle];
    return c;
  });
  const addEvent = ev => setUserEvents(p => [{
    ...ev
  }, ...p]);
  const approveEvent = id => setUserEvents(p => p.map(e => e.id === id ? {
    ...e,
    status: 'approved'
  } : e));
  const cancelEvent = id => setUserEvents(p => p.filter(e => e.id !== id));
  const setEventRsvp = (id, status) => setRsvp(r => ({
    ...r,
    [id]: r[id] === status ? undefined : status
  }));
  const addCommunity = com => setUserCommunities(p => [{
    ...com
  }, ...p]);
  const bindEventCommunity = id => setEventCommunityDraft(id);
  const clearEventCommunityDraft = () => setEventCommunityDraft(null);
  const toggleReminder = id => setReminders(r => ({
    ...r,
    [id]: !r[id]
  }));
  const toggleWishlistSku = sku => setWishlistedSkus(w => ({
    ...w,
    [sku]: !w[sku]
  }));
  const value = {
    hearted,
    saved,
    followed,
    joined,
    comRequested,
    interested,
    wishAlerts,
    readNotifs,
    threads,
    deals,
    listingStatus,
    posts,
    userListings,
    profile,
    vouched,
    userEvents,
    rsvp,
    userCommunities,
    eventCommunityDraft,
    reminders,
    wishlistedSkus,
    liveNotifs,
    toggleHeart,
    toggleSave,
    toggleFollow,
    toggleJoin,
    requestJoin,
    cancelRequest,
    toggleInterested,
    toggleWish,
    markNotifsRead,
    addNotif,
    sendMessage,
    requestDeal,
    confirmDeal,
    setListing,
    addPost,
    addListing,
    updateProfile,
    addVouch,
    removeVouch,
    addEvent,
    approveEvent,
    cancelEvent,
    setEventRsvp,
    addCommunity,
    bindEventCommunity,
    clearEventCommunityDraft,
    toggleReminder,
    toggleWishlistSku
  };
  return /*#__PURE__*/React.createElement(StateContext.Provider, {
    value: value
  }, children);
}

// Animated stacked screen wrapper
function StackedScreen({
  children,
  depth
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      animation: depth > 0 ? 'slideInRight 240ms cubic-bezier(0.22,1,0.36,1)' : 'fadeIn 160ms'
    }
  }, children);
}
function Toast() {
  const {
    toast
  } = useNav();
  if (!toast) return null;
  return /*#__PURE__*/React.createElement("div", {
    key: toast.id,
    style: {
      position: 'absolute',
      bottom: 104,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--ink)',
      color: 'var(--paper)',
      padding: '11px 18px',
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 500,
      boxShadow: 'var(--shadow-3)',
      animation: 'pop 240ms var(--ease-spring)',
      zIndex: 200,
      whiteSpace: 'nowrap',
      maxWidth: 340,
      fontFamily: 'var(--font-body)'
    }
  }, toast.text);
}
Object.assign(window, {
  NavContext,
  useNav,
  StateContext,
  useAppState,
  NavProvider,
  AppStateProvider,
  StackedScreen,
  Toast
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/Nav.jsx", error: String((e && e.message) || e) }); }

// app/Onboarding.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Onboarding flow — Splash & Auth (§9.1) + Interest selection (§9.2)
// Renders full-screen inside the device until the user enters the app.
// ─────────────────────────────────────────────────────────────

const SUBINTERESTS = {
  figures: ['Hot Toys', 'SH Figuarts', 'Sideshow', 'Marvel Legends', 'McFarlane', 'Premium Format'],
  designer: ['Pop Mart', 'Skullpanda', 'Labubu', 'KAWS', 'Soft vinyl', 'Sonny Angel'],
  kits: ['LEGO', 'Gunpla', 'MOC builds', 'Bandai', 'Scale models'],
  diecast: ['Tomica', 'Mini GT', 'Hot Wheels', 'Inno64', 'Kyosho']
};

// ── Splash ────────────────────────────────────────────────────
function Splash({
  onStart,
  onLogin,
  onGuest
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 52,
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      backgroundImage: 'radial-gradient(circle at 22% 18%, rgba(217,51,36,0.07), transparent 55%), radial-gradient(circle at 84% 86%, rgba(20,17,15,0.05), transparent 55%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 22,
      position: 'relative',
      padding: '0 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 96,
      height: 96,
      borderRadius: 22,
      background: 'var(--stamp-red)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 58,
      transform: 'rotate(-4deg)',
      boxShadow: 'var(--shadow-stamp)'
    }
  }, "C"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 38,
      letterSpacing: '-0.035em',
      margin: 0,
      color: 'var(--ink)'
    }
  }, "CollectorHub"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      color: 'var(--ink-mute)',
      lineHeight: 1.5,
      margin: '12px 0 0',
      maxWidth: 280
    }
  }, "The home for collectors. Showcase what you own, find your niche, and trade with people you can trust."))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '0 24px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: 11
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "block",
    onClick: onStart
  }, "Create account"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "block",
    onClick: onLogin
  }, "I already have an account"), /*#__PURE__*/React.createElement("button", {
    onClick: onGuest,
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
      padding: '8px 0',
      marginTop: 2
    }
  }, "Explore as guest \u2192")));
}

// ── Auth (email + social) ─────────────────────────────────────
function Auth({
  mode,
  onBack,
  onDone,
  onSocial
}) {
  const [m, setM] = React.useState(mode);
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const signup = m === 'signup';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 52
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 14px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '12px 24px 24px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 30,
      letterSpacing: '-0.03em',
      margin: '0 0 6px'
    }
  }, signup ? 'Create your account' : 'Welcome back'), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: 'var(--ink-mute)',
      margin: '0 0 26px'
    }
  }, signup ? 'Build your collection and start trading.' : 'Log in to pick up where you left off.'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(AuthField, {
    label: "Email",
    type: "email",
    value: email,
    onChange: setEmail,
    placeholder: "you@email.com"
  }), /*#__PURE__*/React.createElement(AuthField, {
    label: "Password",
    type: "password",
    value: pw,
    onChange: setPw,
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
  })), !signup && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("a", {
    style: {
      fontSize: 13,
      color: 'var(--stamp-red)',
      fontWeight: 600,
      textDecoration: 'none'
    },
    href: "#"
  }, "Forgot password?")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "block",
    onClick: () => onDone(email)
  }, signup ? 'Continue' : 'Log in')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      margin: '22px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: 'var(--border)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, "or continue with"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: 'var(--border)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 11
    }
  }, /*#__PURE__*/React.createElement(SocialBtn, {
    label: "Google",
    onClick: onSocial
  }), /*#__PURE__*/React.createElement(SocialBtn, {
    label: "Apple",
    onClick: onSocial
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 26,
      fontSize: 13.5,
      color: 'var(--ink-mute)'
    }
  }, signup ? 'Already have an account? ' : 'New to CollectorHub? ', /*#__PURE__*/React.createElement("button", {
    onClick: () => setM(signup ? 'login' : 'signup'),
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--stamp-red)',
      fontWeight: 600,
      fontSize: 13.5,
      cursor: 'pointer',
      padding: 0
    }
  }, signup ? 'Log in' : 'Sign up')), signup && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      textAlign: 'center',
      lineHeight: 1.5,
      marginTop: 18
    }
  }, "By continuing you agree to our Terms of Service and Privacy Policy.")));
}
function AuthField({
  label,
  type,
  value,
  onChange,
  placeholder
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--ink-mute)',
      letterSpacing: '0.02em'
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    type: type,
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    style: {
      display: 'block',
      width: '100%',
      boxSizing: 'border-box',
      height: 48,
      marginTop: 7,
      padding: '0 14px',
      borderRadius: 12,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--ink)',
      outline: 'none'
    }
  }));
}
function SocialBtn({
  label,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      color: 'var(--ink)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 14.5,
      cursor: 'pointer'
    }
  }, label);
}

// ── Interest onboarding wizard (§9.2) ─────────────────────────
function Onboard({
  onFinish
}) {
  const [step, setStep] = React.useState(0); // 0 profile · 1 categories · 2 communities
  const [cats, setCats] = React.useState({});
  const [joins, setJoins] = React.useState({
    itm: true
  });
  const [name, setName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [age, setAge] = React.useState(24);
  const chosenCats = CATEGORIES.filter(c => cats[c.id]);
  const suggested = COMMUNITIES.filter(c => chosenCats.some(cc => cc.id === c.cat));
  const canNext = step === 1 ? chosenCats.length > 0 : true;
  const next = () => step < 2 ? setStep(step + 1) : onFinish();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 52
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 20px 6px'
    }
  }, step > 0 ? /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep(step - 1),
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 18
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      gap: 6
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      height: 4,
      borderRadius: 999,
      background: i <= step ? 'var(--stamp-red)' : 'var(--bone-deep)',
      transition: 'background 200ms'
    }
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: onFinish,
    style: {
      width: 50,
      textAlign: 'right',
      background: 'none',
      border: 'none',
      color: 'var(--ink-faint)',
      fontSize: 13.5,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "Skip")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '14px 20px 20px'
    }
  }, step === 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StepTitle, {
    title: "Set up your profile",
    sub: "A quick intro other collectors see when you trade. You can change these later."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      margin: '24px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: name || 'You',
    color: "var(--ink)",
    size: 84
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: 'var(--stamp-red)',
      color: 'var(--paper)',
      border: '3px solid var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.camera,
    size: 15
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(AuthField, {
    label: "Display name",
    type: "text",
    value: name,
    onChange: setName,
    placeholder: "e.g. Aman Iyer"
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--ink-mute)',
      letterSpacing: '0.02em'
    }
  }, "Bio"), /*#__PURE__*/React.createElement("textarea", {
    value: bio,
    onChange: e => setBio(e.target.value),
    rows: 3,
    maxLength: 150,
    placeholder: "Who you are and what you collect \u2014 e.g. \u201CSneakerhead & Gunpla builder, chasing 90s Jordans.\u201D",
    style: {
      display: 'block',
      width: '100%',
      boxSizing: 'border-box',
      marginTop: 7,
      padding: '11px 14px',
      borderRadius: 12,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      lineHeight: 1.45,
      color: 'var(--ink)',
      outline: 'none',
      resize: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      textAlign: 'right',
      margin: '5px 2px 0'
    }
  }, bio.length, "/150")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--ink-mute)',
      letterSpacing: '0.02em'
    }
  }, "Gender"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 7
    }
  }, [['f', 'Female'], ['m', 'Male']].map(([val, lbl]) => {
    const on = gender === val;
    return /*#__PURE__*/React.createElement("button", {
      key: val,
      onClick: () => setGender(on ? '' : val),
      style: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        cursor: 'pointer',
        border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
        background: on ? 'var(--ink)' : 'var(--paper-soft)',
        color: on ? 'var(--paper)' : 'var(--ink)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 14.5
      }
    }, lbl);
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--ink-mute)',
      letterSpacing: '0.02em'
    }
  }, "How old are you?"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 16,
      color: 'var(--ink)'
    }
  }, age >= 80 ? '80+' : age)), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 13,
    max: 80,
    step: 1,
    value: age,
    onChange: e => setAge(+e.target.value),
    style: {
      width: '100%',
      marginTop: 12,
      accentColor: 'var(--stamp-red)',
      cursor: 'pointer'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      color: 'var(--ink-faint)',
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("span", null, "13"), /*#__PURE__*/React.createElement("span", null, "80+"))))), step === 1 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StepTitle, {
    title: "What do you collect?",
    sub: "Pick all that apply. Your feed and communities tune to this instantly \u2014 no followers needed."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 20
    }
  }, CATEGORIES.map(c => {
    const on = cats[c.id];
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => setCats(s => ({
        ...s,
        [c.id]: !s[c.id]
      })),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
        borderRadius: 14,
        background: on ? 'var(--bone)' : 'var(--paper-soft)',
        padding: '15px 16px',
        transition: 'border-color 120ms, background 120ms'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 16.5,
        letterSpacing: '-0.01em',
        color: 'var(--ink)'
      }
    }, c.label), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: 7,
        flexShrink: 0,
        border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
        background: on ? 'var(--ink)' : 'transparent',
        color: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, on && /*#__PURE__*/React.createElement(Ico, {
      d: Icons.check,
      size: 15,
      stroke: 3
    })));
  }))), step === 2 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StepTitle, {
    title: "Join your communities",
    sub: "Recommended from what you collect. Pick all you like \u2014 you can join more anytime."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 18
    }
  }, suggested.map(c => {
    const on = joins[c.id];
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => setJoins(j => ({
        ...j,
        [c.id]: !j[c.id]
      })),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
        borderRadius: 14,
        background: on ? 'var(--bone)' : 'var(--paper-soft)',
        padding: '14px 16px',
        transition: 'border-color 120ms, background 120ms'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 16,
        letterSpacing: '-0.01em',
        color: 'var(--ink)'
      }
    }, c.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-faint)',
        fontFamily: 'var(--font-mono)',
        marginTop: 2
      }
    }, c.members.toLocaleString('en-IN'), " members")), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: 7,
        flexShrink: 0,
        border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
        background: on ? 'var(--ink)' : 'transparent',
        color: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, on && /*#__PURE__*/React.createElement(Ico, {
      d: Icons.check,
      size: 15,
      stroke: 3
    })));
  }), suggested.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, "Pick a category first to see recommended communities.")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 20px 30px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "block",
    disabled: !canNext,
    onClick: next
  }, step === 0 ? 'Continue' : step === 1 ? `Continue${chosenCats.length ? ` · ${chosenCats.length} picked` : ''}` : 'Enter CollectorHub')));
}
function StepTitle({
  title,
  sub
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 27,
      letterSpacing: '-0.03em',
      margin: 0,
      lineHeight: 1.1
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      color: 'var(--ink-mute)',
      lineHeight: 1.5,
      margin: '8px 0 0'
    }
  }, sub));
}

// ── Email OTP verification (signup) ───────────────────────────
function OtpVerify({
  email,
  onBack,
  onVerified
}) {
  const [digits, setDigits] = React.useState(['', '', '', '', '', '']);
  const [secs, setSecs] = React.useState(30);
  const [resent, setResent] = React.useState(false);
  const refs = React.useRef([]);
  React.useEffect(() => {
    if (refs.current[0]) refs.current[0].focus();
  }, []);
  React.useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);
  const full = digits.every(d => d !== '');
  const setAt = (i, v) => {
    const nv = (v || '').replace(/\D/g, '').slice(-1);
    setDigits(d => {
      const c = [...d];
      c[i] = nv;
      return c;
    });
    if (nv && i < 5 && refs.current[i + 1]) refs.current[i + 1].focus();
  };
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0 && refs.current[i - 1]) refs.current[i - 1].focus();
  };
  const onPaste = e => {
    const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!t) return;
    e.preventDefault();
    const c = ['', '', '', '', '', ''];
    for (let i = 0; i < t.length; i++) c[i] = t[i];
    setDigits(c);
    const ni = Math.min(t.length, 5);
    if (refs.current[ni]) refs.current[ni].focus();
  };
  const resend = () => {
    setSecs(30);
    setResent(true);
    setDigits(['', '', '', '', '', '']);
    if (refs.current[0]) refs.current[0].focus();
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 52
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 14px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '12px 24px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 15,
      background: 'var(--stamp-red-soft)',
      color: 'var(--stamp-red)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.mail,
    size: 26
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 30,
      letterSpacing: '-0.03em',
      margin: '0 0 6px'
    }
  }, "Check your email"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: 'var(--ink-mute)',
      lineHeight: 1.5,
      margin: '0 0 26px'
    }
  }, "We sent a 6-digit code to ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink)'
    }
  }, email || 'your email'), ". Enter it below to confirm your account."), /*#__PURE__*/React.createElement("div", {
    onPaste: onPaste,
    style: {
      display: 'flex',
      gap: 9,
      justifyContent: 'space-between'
    }
  }, digits.map((d, i) => /*#__PURE__*/React.createElement("input", {
    key: i,
    ref: el => refs.current[i] = el,
    value: d,
    inputMode: "numeric",
    maxLength: 1,
    onChange: e => setAt(i, e.target.value),
    onKeyDown: e => onKey(i, e),
    style: {
      width: '100%',
      height: 58,
      textAlign: 'center',
      borderRadius: 13,
      border: `1.5px solid ${d ? 'var(--ink)' : 'var(--border-strong)'}`,
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 24,
      color: 'var(--ink)',
      outline: 'none',
      caretColor: 'var(--stamp-red)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "block",
    disabled: !full,
    onClick: onVerified
  }, "Verify & continue")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 22,
      fontSize: 13.5,
      color: 'var(--ink-mute)'
    }
  }, secs > 0 ? /*#__PURE__*/React.createElement("span", null, "Resend code in ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink)',
      fontFamily: 'var(--font-mono)'
    }
  }, "0:", String(secs).padStart(2, '0'))) : /*#__PURE__*/React.createElement("button", {
    onClick: resend,
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--stamp-red)',
      fontWeight: 600,
      fontSize: 13.5,
      cursor: 'pointer',
      padding: 0
    }
  }, "Resend code")), resent && secs > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 8,
      fontSize: 12.5,
      color: 'var(--forest)'
    }
  }, "A new code is on its way."), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 18,
      fontSize: 13,
      color: 'var(--ink-faint)'
    }
  }, "Wrong address?", ' ', /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--ink-soft)',
      fontWeight: 600,
      fontSize: 13,
      cursor: 'pointer',
      padding: 0,
      textDecoration: 'underline'
    }
  }, "Change email"))));
}

// ── Flow controller ───────────────────────────────────────────
function OnboardingFlow({
  onEnter
}) {
  const [phase, setPhase] = React.useState('splash'); // splash | auth-signup | auth-login | otp | onboard
  const [email, setEmail] = React.useState('');
  if (phase === 'splash') return /*#__PURE__*/React.createElement(Splash, {
    onStart: () => setPhase('auth-signup'),
    onLogin: () => setPhase('auth-login'),
    onGuest: onEnter
  });
  if (phase === 'auth-signup') return /*#__PURE__*/React.createElement(Auth, {
    mode: "signup",
    onBack: () => setPhase('splash'),
    onDone: em => {
      setEmail(em || '');
      setPhase('otp');
    },
    onSocial: () => setPhase('onboard')
  });
  if (phase === 'auth-login') return /*#__PURE__*/React.createElement(Auth, {
    mode: "login",
    onBack: () => setPhase('splash'),
    onDone: onEnter,
    onSocial: onEnter
  });
  if (phase === 'otp') return /*#__PURE__*/React.createElement(OtpVerify, {
    email: email,
    onBack: () => setPhase('auth-signup'),
    onVerified: () => setPhase('onboard')
  });
  return /*#__PURE__*/React.createElement(Onboard, {
    onFinish: onEnter
  });
}
Object.assign(window, {
  OnboardingFlow
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/Onboarding.jsx", error: String((e && e.message) || e) }); }

// app/Overlays.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Overlays — Compose (§9.6), Search (§9.15), Notifications (§9.14)
// Rendered above everything; dismiss via close.
// ─────────────────────────────────────────────────────────────

function OverlayShell({
  children,
  onClose,
  onBack,
  title,
  trailing
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 120,
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'sheetUp 240ms cubic-bezier(0.22,1,0.36,1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      paddingTop: window.CH_WEB ? 14 : 52,
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 14px 12px',
      minHeight: 40
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack || onClose,
    "aria-label": onBack ? 'Back' : 'Close',
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: onBack ? Icons.back : Icons.close,
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 19,
      letterSpacing: '-0.02em'
    }
  }, title), trailing)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      minHeight: 0
    }
  }, children));
}

// ── Compose / Post composer — BRD §9.6 (v1.2: type-first + Poll) ──
function ComposeOverlay({
  community
}) {
  const {
    setOverlay,
    flashToast,
    push
  } = useNav();
  const {
    addPost
  } = useAppState();
  const [kind, setKind] = React.useState(null); // null = choose Post vs Listing first
  const [type, setType] = React.useState('post'); // post | poll | review (single-window switch)
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [images, setImages] = React.useState([]); // [{ url, tone }]
  const imgInputRef = React.useRef();
  const [tags, setTags] = React.useState([]);
  const [tagInput, setTagInput] = React.useState('');
  const [showEmoji, setShowEmoji] = React.useState(false);
  const [com, setCom] = React.useState(community || '');
  const [choices, setChoices] = React.useState(['', '']);
  const [rating, setRating] = React.useState(0);
  const [isoItem, setIsoItem] = React.useState('');
  const [isoBudget, setIsoBudget] = React.useState('');
  const [isoCond, setIsoCond] = React.useState('any');
  const BODY_MAX = 600;
  const POST_TONES = ['ink', 'red', 'teal', 'gold', 'plum', 'forest'];
  const EMOJIS = ['😍', '🔥', '🤩', '😎', '🥹', '👀', '🙌', '👏', '💎', '🏆', '📦', '🚀', '✨', '❤️', '🤝', '💰', '🫡', '🧩', '🎯', '😱'];
  const TAG_SUGGEST = ['NewDrops', 'Grails', 'HotToys', 'Gunpla', 'Diecast', 'PopMart', 'Sealed', 'Marvel'];
  const pollValid = choices.filter(c => c.trim()).length >= 2;
  const canPost = type === 'poll' ? body.trim() && pollValid : type === 'review' ? rating > 0 && (title.trim() || body.trim()) : type === 'iso' ? isoItem.trim().length > 0 : title.trim() || body.trim() || images.length > 0;
  const addImg = () => {
    if (images.length >= 6) return;
    imgInputRef.current && imgInputRef.current.click();
  };
  const rmImg = i => setImages(im => im.filter((_, j) => j !== i));
  const handleImgFiles = e => {
    Array.from(e.target.files || []).slice(0, 6 - images.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setImages(im => im.length < 6 ? [...im, {
        url: ev.target.result,
        tone: POST_TONES[im.length % POST_TONES.length]
      }] : im);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  const addTag = t => {
    const v = (t != null ? t : tagInput).replace(/[^a-zA-Z0-9]/g, '');
    if (v && tags.length < 8 && !tags.includes(v)) setTags(ts => [...ts, v]);
    setTagInput('');
  };
  const rmTag = t => setTags(ts => ts.filter(x => x !== t));
  const addEmoji = e => setBody(b => (b + e).slice(0, BODY_MAX));
  const publish = () => {
    if (type === 'poll' && !pollValid) {
      flashToast('A poll needs at least two choices');
      return;
    }
    if (type === 'review' && !rating) {
      flashToast('Add a star rating');
      return;
    }
    const poll = type === 'poll' ? choices.filter(c => c.trim()).map(l => ({
      label: l,
      votes: 0
    })) : null;
    addPost(type === 'iso' ? {
      type: 'iso',
      isoItem: isoItem.trim(),
      body: body.trim() || null,
      user: 'you',
      community: com || null,
      isoBudget: isoBudget ? Number(isoBudget) : null,
      isoCond: isoCond,
      image: images.length > 0,
      images: images.length > 0 ? images.map(i => i.url || i) : undefined,
      tone: images[0] && images[0].tone || 'gold',
      tags: tags.slice(),
      cat: null
    } : {
      type,
      title: title.trim() || null,
      body: body.trim(),
      user: 'you',
      community: com || null,
      images: images.map(i => i.url || i),
      imageCount: images.length,
      image: images.length > 0,
      tone: images[0] && images[0].tone || 'ink',
      tags: tags.slice(),
      rating: type === 'review' ? rating : null,
      cat: null,
      poll
    });
    setOverlay(null);
    flashToast(type === 'poll' ? 'Poll posted' : type === 'review' ? 'Review posted' : type === 'iso' ? 'ISO posted — collectors will reach out!' : 'Posted to your feed');
  };

  // ── Stage 0: choose what to create — Post or Listing ──
  if (!kind) {
    const OPTIONS = [{
      id: 'post',
      label: 'Create a Post',
      desc: 'Showcase, ask, review or poll the community.',
      c: 'var(--plum)',
      icon: Icons.edit
    }, {
      id: 'listing',
      label: 'Add an item',
      desc: 'Add to your shelf — and list it for sale if you like.',
      c: 'var(--stamp-red)',
      icon: Icons.tag
    }];
    return /*#__PURE__*/React.createElement(OverlayShell, {
      title: "Create",
      onClose: () => setOverlay(null)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '16px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: 'var(--ink-mute)',
        margin: '0 2px 14px'
      }
    }, "What would you like to create?"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, OPTIONS.map(o => /*#__PURE__*/React.createElement("button", {
      key: o.id,
      onClick: () => {
        if (o.id === 'listing') {
          setOverlay(null);
          setTimeout(() => push({
            name: 'add-listing'
          }), 10);
        } else setKind(o.id);
      },
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        background: 'var(--paper-soft)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 50,
        height: 50,
        borderRadius: 13,
        background: o.c,
        color: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: o.icon,
      size: 23
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 17,
        letterSpacing: '-0.01em'
      }
    }, o.label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-faint)',
        marginTop: 2
      }
    }, o.desc)), /*#__PURE__*/React.createElement(Ico, {
      d: Icons.back,
      size: 18,
      stroke: 2,
      style: {
        transform: 'rotate(180deg)',
        color: 'var(--ink-faint)'
      }
    }))))));
  }

  // ── Listing flow — to be designed; placeholder for now ──
  if (kind === 'listing') {
    return /*#__PURE__*/React.createElement(OverlayShell, {
      title: "Create a Listing",
      onBack: () => setKind(null),
      onClose: () => setOverlay(null)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '40px 24px',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 60,
        height: 60,
        borderRadius: 16,
        background: 'var(--stamp-red)',
        color: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px'
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: Icons.tag,
      size: 28
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 19,
        letterSpacing: '-0.01em',
        color: 'var(--ink)'
      }
    }, "Listing composer"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: 'var(--ink-faint)',
        marginTop: 6,
        maxWidth: 280,
        marginInline: 'auto',
        lineHeight: 1.5
      }
    }, "We\u2019ll design this flow next \u2014 list an item with photos, price and condition.")));
  }

  // ── Post composer — single window, switch type at the top ──
  const TYPES = [{
    id: 'post',
    label: 'Post'
  }, {
    id: 'iso',
    label: 'ISO'
  }, {
    id: 'poll',
    label: 'Poll'
  }, {
    id: 'review',
    label: 'Review'
  }];
  const placeholder = type === 'poll' ? 'Ask your question…' : type === 'review' ? 'What did you think? Build, value, would you buy again…' : 'What’s on your mind? Use # to tag topics.';
  return /*#__PURE__*/React.createElement(OverlayShell, {
    title: "Create a post",
    onBack: () => setKind(null),
    onClose: () => setOverlay(null),
    trailing: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "primary",
      onClick: publish,
      disabled: !canPost,
      style: !canPost ? {
        opacity: 0.5
      } : null
    }, "Post")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 24px'
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    value: type,
    onChange: setType,
    options: TYPES
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "You",
    color: "var(--ink)",
    size: 38
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, "You", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-faint)',
      fontWeight: 400
    }
  }, " \xB7 ", com ? 'posting to a community' : 'posting to your feed'))), /*#__PURE__*/React.createElement("input", {
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: type === 'poll' ? 'Poll title (optional)' : 'Add a title',
    style: {
      width: '100%',
      boxSizing: 'border-box',
      marginTop: 14,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 19,
      letterSpacing: '-0.01em',
      color: 'var(--ink)'
    }
  }), type === 'review' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      margin: '8px 0 2px'
    }
  }, /*#__PURE__*/React.createElement(StarPicker, {
    value: rating,
    onChange: setRating
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)'
    }
  }, rating ? `${rating} / 5` : 'Tap to rate')), /*#__PURE__*/React.createElement("textarea", {
    value: body,
    onChange: e => setBody(e.target.value.slice(0, BODY_MAX)),
    rows: type === 'poll' ? 2 : 4,
    placeholder: placeholder,
    style: {
      width: '100%',
      boxSizing: 'border-box',
      marginTop: 8,
      border: 'none',
      outline: 'none',
      resize: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      lineHeight: 1.55,
      color: 'var(--ink)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowEmoji(v => !v),
    "aria-label": "Add emoji",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      height: 32,
      padding: '0 11px',
      borderRadius: 9,
      border: `1px solid ${showEmoji ? 'var(--ink)' : 'var(--border-strong)'}`,
      background: showEmoji ? 'var(--bone)' : 'var(--paper-soft)',
      color: 'var(--ink)',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15
    }
  }, "\uD83D\uDE0A"), "Emoji"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: body.length > BODY_MAX - 60 ? 'var(--stamp-red)' : 'var(--ink-ghost)',
      fontFamily: 'var(--font-mono)'
    }
  }, body.length, "/", BODY_MAX)), showEmoji && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 8,
      padding: 10,
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 12
    }
  }, EMOJIS.map(e => /*#__PURE__*/React.createElement("button", {
    key: e,
    onClick: () => addEmoji(e),
    style: {
      width: 38,
      height: 38,
      borderRadius: 9,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      fontSize: 22,
      lineHeight: 1
    },
    onMouseEnter: ev => ev.currentTarget.style.background = 'var(--bone)',
    onMouseLeave: ev => ev.currentTarget.style.background = 'transparent'
  }, e))), type === 'iso' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "What are you looking for? *"), /*#__PURE__*/React.createElement("input", {
    value: isoItem,
    onChange: e => setIsoItem(e.target.value),
    placeholder: "e.g. Hot Toys Iron Man Mark III",
    style: {
      width: '100%',
      boxSizing: 'border-box',
      marginTop: 8,
      height: 44,
      padding: '0 13px',
      borderRadius: 11,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: 14.5,
      color: 'var(--ink)',
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Max budget"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      height: 44,
      padding: '0 13px',
      borderRadius: 11,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: 'var(--ink-faint)'
    }
  }, "\u20B9"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: isoBudget,
    onChange: e => setIsoBudget(e.target.value),
    placeholder: "Any",
    style: {
      flex: 1,
      border: 'none',
      background: 'none',
      outline: 'none',
      fontFamily: 'var(--font-mono)',
      fontSize: 14.5,
      color: 'var(--ink)',
      width: 0
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Condition"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5,
      marginTop: 8,
      flexWrap: 'wrap'
    }
  }, ['Any', 'Sealed', 'MIB', 'BIB', 'Loose'].map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setIsoCond(c.toLowerCase()),
    style: {
      padding: '6px 10px',
      borderRadius: 7,
      border: `1px solid ${isoCond === c.toLowerCase() ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
      background: isoCond === c.toLowerCase() ? 'var(--stamp-red)' : 'var(--paper-soft)',
      color: isoCond === c.toLowerCase() ? 'var(--paper)' : 'var(--ink)',
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: 12,
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }
  }, c))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "Extra details (optional)"), /*#__PURE__*/React.createElement("textarea", {
    value: body,
    onChange: e => setBody(e.target.value.slice(0, BODY_MAX)),
    placeholder: "Variant, colourway, packaging notes...",
    rows: 3,
    style: {
      width: '100%',
      boxSizing: 'border-box',
      marginTop: 8,
      padding: '10px 13px',
      borderRadius: 11,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--ink)',
      outline: 'none',
      resize: 'none'
    }
  }))), type === 'poll' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Choices"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginTop: 10
    }
  }, choices.map((ch, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: ch,
    onChange: e => setChoices(cs => cs.map((c, j) => j === i ? e.target.value : c)),
    placeholder: `Choice ${i + 1}`,
    style: {
      flex: 1,
      height: 42,
      padding: '0 13px',
      borderRadius: 11,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: 14.5,
      color: 'var(--ink)',
      outline: 'none'
    }
  }), choices.length > 2 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setChoices(cs => cs.filter((_, j) => j !== i)),
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--ink-faint)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.close,
    size: 16
  }))))), choices.length < 5 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setChoices(cs => [...cs, '']),
    style: {
      marginTop: 9,
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      background: 'none',
      border: 'none',
      color: 'var(--stamp-red)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 13.5,
      cursor: 'pointer',
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.plusCircle,
    size: 17
  }), "Add choice"), !pollValid && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      marginTop: 8
    }
  }, "A poll needs at least two choices.")), type !== 'poll' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: imgInputRef,
    type: "file",
    accept: "image/*",
    multiple: true,
    style: {
      display: 'none'
    },
    onChange: handleImgFiles
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      overflowX: 'auto',
      paddingBottom: 2
    }
  }, images.map((img, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      position: 'relative',
      width: 84,
      height: 84,
      flexShrink: 0,
      borderRadius: 12,
      overflow: 'visible'
    }
  }, img.url ? /*#__PURE__*/React.createElement("img", {
    src: img.url,
    style: {
      width: 84,
      height: 84,
      objectFit: 'cover',
      borderRadius: 12,
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: img.tone || img,
    ratio: "1/1",
    rounded: 12
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => rmImg(i),
    "aria-label": "Remove",
    style: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: '50%',
      cursor: 'pointer',
      background: 'var(--ink)',
      color: 'var(--paper)',
      border: '2px solid var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.close,
    size: 11,
    stroke: 3
  })))), images.length < 6 && /*#__PURE__*/React.createElement("button", {
    onClick: addImg,
    style: {
      width: 84,
      height: 84,
      flexShrink: 0,
      borderRadius: 12,
      cursor: 'pointer',
      border: '1px dashed var(--border-strong)',
      background: 'var(--paper-soft)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      color: 'var(--ink-mute)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.camera,
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 600
    }
  }, "Photo")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Hashtags")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
      height: 44,
      padding: '0 13px',
      borderRadius: 11,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 16,
      color: 'var(--ink-faint)'
    }
  }, "#"), /*#__PURE__*/React.createElement("input", {
    value: tagInput,
    onChange: e => setTagInput(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        addTag();
      }
    },
    placeholder: "Add a tag \u2014 e.g. HotToys",
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontFamily: 'var(--font-body)',
      fontSize: 14.5,
      color: 'var(--ink)'
    }
  }), tagInput.trim() && /*#__PURE__*/React.createElement("button", {
    onClick: () => addTag(),
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--stamp-red)',
      fontWeight: 600,
      fontSize: 13,
      cursor: 'pointer',
      padding: 0
    }
  }, "Add")), tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 10
    }
  }, tags.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '5px 7px 5px 11px',
      borderRadius: 999,
      background: 'var(--ink)',
      color: 'var(--paper)',
      fontSize: 12.5,
      fontWeight: 600
    }
  }, "#", t, /*#__PURE__*/React.createElement("button", {
    onClick: () => rmTag(t),
    "aria-label": "Remove tag",
    style: {
      width: 18,
      height: 18,
      borderRadius: '50%',
      border: 'none',
      background: 'rgba(244,239,230,0.2)',
      color: 'var(--paper)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.close,
    size: 10,
    stroke: 3
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 10
    }
  }, TAG_SUGGEST.filter(t => !tags.includes(t)).map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => addTag(t),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      padding: '5px 11px',
      borderRadius: 999,
      background: 'var(--paper-soft)',
      border: '1px solid var(--border-strong)',
      color: 'var(--ink-soft)',
      fontSize: 12.5,
      fontWeight: 500,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-faint)'
    }
  }, "#"), t))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Post to")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      flexWrap: 'wrap',
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(CategoryChip, {
    active: com === '',
    onClick: () => setCom('')
  }, "Your feed"), COMMUNITIES.filter(c => c.joined).map(c => /*#__PURE__*/React.createElement(CategoryChip, {
    key: c.id,
    active: com === c.id,
    onClick: () => setCom(c.id)
  }, c.name)))));
}

// 1–5 interactive star picker (review composer)
function StarPicker({
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 4
    }
  }, [1, 2, 3, 4, 5].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    onClick: () => onChange(n === value ? 0 : n),
    "aria-label": `${n} star`,
    style: {
      background: 'none',
      border: 'none',
      padding: 2,
      cursor: 'pointer',
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "26",
    height: "26",
    viewBox: "0 0 24 24",
    fill: n <= value ? 'var(--grail-gold-deep)' : 'none',
    stroke: n <= value ? 'var(--grail-gold-deep)' : 'var(--border-strong)',
    strokeWidth: 1.6
  }, /*#__PURE__*/React.createElement("path", {
    d: "m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
  })))));
}
function ComposeTool({
  icon,
  label,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      height: 38,
      padding: '0 14px',
      borderRadius: 10,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      color: 'var(--ink)',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: icon,
    size: 17
  }), label);
}

// ── Search (global) — BRD §9.15 ───────────────────────────────
function SearchOverlay() {
  const {
    setOverlay,
    push
  } = useNav();
  const {
    posts: userPosts
  } = useAppState();
  const [q, setQ] = React.useState('');
  const [scope, setScope] = React.useState('all');
  const go = route => {
    setOverlay(null);
    setTimeout(() => push(route), 10);
  };
  const ql = q.toLowerCase();
  const items = CATALOGUE.filter(c => !ql || (c.title + c.brand).toLowerCase().includes(ql));
  const people = Object.values(USERS).filter(u => !ql || (u.name + u.handle).toLowerCase().includes(ql));
  const coms = COMMUNITIES.filter(c => !ql || c.name.toLowerCase().includes(ql));
  const evs = EVENTS.filter(e => !ql || e.title.toLowerCase().includes(ql));
  const allPosts = [...(userPosts || []), ...POSTS, ...(typeof ISO_POSTS !== 'undefined' ? ISO_POSTS : [])];
  const posts = allPosts.filter(p => !ql || (p.body || '').toLowerCase().includes(ql) || (p.isoItem || '').toLowerCase().includes(ql) || (p.user || '').toLowerCase().includes(ql) || (p.community || '').toLowerCase().includes(ql));
  const showItems = scope === 'all' || scope === 'items';
  const showPeople = scope === 'all' || scope === 'people';
  const showComs = scope === 'all' || scope === 'communities';
  const showEvs = scope === 'all' || scope === 'events';
  const showPosts = scope === 'all' || scope === 'posts';
  const SCOPES = [{
    id: 'all',
    label: 'All'
  }, {
    id: 'items',
    label: 'Items'
  }, {
    id: 'posts',
    label: 'Posts'
  }, {
    id: 'people',
    label: 'People'
  }, {
    id: 'communities',
    label: 'Communities'
  }, {
    id: 'events',
    label: 'Events'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 120,
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeIn 160ms'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      borderBottom: '1px solid var(--border)',
      padding: window.CH_WEB ? '16px 14px 12px' : '52px 14px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      height: 42,
      padding: '0 14px',
      borderRadius: 12,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.search,
    size: 18,
    style: {
      color: 'var(--ink-faint)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Items, posts, people, communities\u2026",
    style: {
      flex: 1,
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--ink)'
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOverlay(null),
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--ink)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 15,
      cursor: 'pointer'
    }
  }, "Cancel")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      marginTop: 12,
      overflowX: 'auto'
    }
  }, SCOPES.map(s => /*#__PURE__*/React.createElement(CategoryChip, {
    key: s.id,
    active: scope === s.id,
    onClick: () => setScope(s.id)
  }, s.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '8px 16px 24px'
    }
  }, showPosts && posts.length > 0 && /*#__PURE__*/React.createElement(ResGroup, {
    label: "Posts"
  }, posts.slice(0, 5).map(p => {
    const u = p.user === 'you' ? ME : USERS[p.user] || ME;
    const com = p.community ? COMMUNITIES.find(c => c.id === p.community) : null;
    const snippet = (p.isoItem || p.body || '').slice(0, 72) + ((p.isoItem || p.body || '').length > 72 ? '…' : '');
    return /*#__PURE__*/React.createElement(ResRow, {
      key: p.id,
      onClick: () => go({
        name: 'post',
        id: p.id
      }),
      media: /*#__PURE__*/React.createElement(Avatar, {
        name: u.name,
        color: u.color,
        size: 40
      }),
      title: snippet || '(no text)',
      sub: `@${u.handle}${com ? ' · ' + com.name : ''}`
    });
  })), showItems && items.length > 0 && /*#__PURE__*/React.createElement(ResGroup, {
    label: "Catalogue items"
  }, items.slice(0, 4).map(c => /*#__PURE__*/React.createElement(ResRow, {
    key: c.sku,
    onClick: () => go({
      name: 'item',
      sku: c.sku
    }),
    media: /*#__PURE__*/React.createElement("div", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 8,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement(ProductPhoto, {
      tone: c.tone,
      ratio: "1/1",
      rounded: 8
    })),
    title: c.title,
    sub: `${c.sku} · ${c.brand}`,
    action: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.plusCircle,
      size: 20,
      style: {
        color: 'var(--stamp-red)'
      }
    })
  }))), showPeople && people.length > 0 && /*#__PURE__*/React.createElement(ResGroup, {
    label: "People"
  }, people.slice(0, 4).map(u => /*#__PURE__*/React.createElement(ResRow, {
    key: u.handle,
    onClick: () => go({
      name: 'profile',
      user: u.handle
    }),
    media: /*#__PURE__*/React.createElement(Avatar, {
      name: u.name,
      color: u.color,
      size: 40,
      verified: u.tier !== 'Verified'
    }),
    title: u.name,
    sub: `@${u.handle} · ${u.deals} deals · ${u.vouchesReceived} vouches`
  }))), showComs && coms.length > 0 && /*#__PURE__*/React.createElement(ResGroup, {
    label: "Communities"
  }, coms.slice(0, 4).map(c => /*#__PURE__*/React.createElement(ResRow, {
    key: c.id,
    onClick: () => go({
      name: 'community-detail',
      id: c.id
    }),
    media: /*#__PURE__*/React.createElement("div", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 9,
        background: 'var(--ink)',
        color: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 15
      }
    }, c.tag),
    title: c.name,
    sub: `${c.members.toLocaleString('en-IN')} members`
  }))), showEvs && evs.length > 0 && /*#__PURE__*/React.createElement(ResGroup, {
    label: "Events"
  }, evs.slice(0, 4).map(e => /*#__PURE__*/React.createElement(ResRow, {
    key: e.id,
    onClick: () => go({
      name: 'event',
      id: e.id
    }),
    media: /*#__PURE__*/React.createElement("div", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 9,
        background: 'var(--plum)',
        color: 'var(--paper)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 8,
        fontWeight: 700
      }
    }, e.month), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 15,
        lineHeight: 1
      }
    }, e.date)),
    title: e.title,
    sub: e.when
  })))));
}
function ResGroup({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, label), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, children));
}
function ResRow({
  media,
  title,
  sub,
  action,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      background: 'none',
      border: 'none',
      padding: '8px 0',
      cursor: 'pointer'
    }
  }, media, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--ink)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-mono)'
    }
  }, sub)), action);
}

// ── Notifications centre — BRD §9.14 ──────────────────────────
// Notification categories — 4 explicit types + 1 generic catch-all (§9.14).
// `kinds: null` marks the catch-all: it collects anything not matched above.
const NOTIF_CATS = [{
  id: 'likes',
  label: 'Likes',
  icon: Icons.heart,
  c: 'var(--stamp-red)',
  kinds: ['like']
}, {
  id: 'follows',
  label: 'Follows',
  icon: Icons.user,
  c: 'var(--plum)',
  kinds: ['follow']
}, {
  id: 'replies',
  label: 'Replies',
  icon: Icons.comment,
  c: 'var(--verified-teal)',
  kinds: ['community']
}, {
  id: 'vouches',
  label: 'Vouch',
  icon: Icons.shield,
  c: 'var(--forest)',
  kinds: ['vouch']
}, {
  id: 'other',
  label: 'Other',
  icon: Icons.grid,
  c: 'var(--grail-gold-deep)',
  kinds: null
}];
// every kind explicitly claimed by a category → the rest fall into "Other"
const CLAIMED_KINDS = NOTIF_CATS.filter(c => c.kinds).flatMap(c => c.kinds);
const catOfKind = kind => NOTIF_CATS.find(c => c.kinds && c.kinds.includes(kind)) || NOTIF_CATS.find(c => c.kinds === null);
function NotificationsOverlay() {
  const {
    setOverlay,
    push
  } = useNav();
  const {
    readNotifs,
    markNotifsRead,
    liveNotifs
  } = useAppState();
  const allNotifs = React.useMemo(() => [...(liveNotifs || []), ...NOTIFICATIONS], [liveNotifs]);
  const [active, setActive] = React.useState(null); // null = Messages view; else a category id
  React.useEffect(() => {
    markNotifsRead();
  }, []);
  const go = ref => {
    setOverlay(null);
    if (!ref) return;
    setTimeout(() => {
      if (ref.type === 'listing') push({
        name: 'listing',
        id: ref.id
      });else if (ref.type === 'chat') push({
        name: 'chat',
        user: ref.id
      });else if (ref.type === 'profile') push({
        name: 'profile',
        user: ref.id
      });else if (ref.type === 'post') push({
        name: 'post',
        id: ref.id
      });else if (ref.type === 'community') push({
        name: 'community-detail',
        id: ref.id
      });else if (ref.type === 'event') push({
        name: 'event',
        id: ref.id
      });else if (ref.type === 'item') push({
        name: 'item',
        sku: 'SHF-GUI'
      });
    }, 10);
  };
  const openChat = handle => {
    setOverlay(null);
    setTimeout(() => push({
      name: 'chat',
      user: handle
    }), 10);
  };

  // unread count per category
  const unreadIn = cat => allNotifs.filter(n => n.unread && !readNotifs[n.id] && (cat.kinds ? cat.kinds.includes(n.kind) : !CLAIMED_KINDS.includes(n.kind))).length;
  const activeCat = NOTIF_CATS.find(c => c.id === active);
  // filtered by category when one is active; otherwise the full activity feed
  const shown = activeCat ? allNotifs.filter(n => activeCat.kinds ? activeCat.kinds.includes(n.kind) : !CLAIMED_KINDS.includes(n.kind)) : allNotifs;
  const refCode = slug => slug ? slug.toUpperCase().replace(/-/g, '') : null;
  return /*#__PURE__*/React.createElement(OverlayShell, {
    title: "Notifications",
    onClose: () => setOverlay(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 9,
      padding: '14px 16px 12px'
    }
  }, NOTIF_CATS.map(cat => {
    const on = active === cat.id;
    const count = unreadIn(cat);
    return /*#__PURE__*/React.createElement("button", {
      key: cat.id,
      onClick: () => setActive(on ? null : cat.id),
      "aria-label": cat.label,
      style: {
        position: 'relative',
        aspectRatio: '1 / 1',
        borderRadius: 15,
        cursor: 'pointer',
        border: `1.5px solid ${on ? cat.c : 'var(--border)'}`,
        background: on ? cat.c : 'var(--paper-soft)',
        color: on ? 'var(--paper)' : cat.c,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: on ? 'none' : 'var(--shadow-1)',
        transition: 'all 130ms'
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: cat.icon,
      size: 23,
      stroke: 2
    }), count > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: -6,
        right: -6,
        minWidth: 19,
        height: 19,
        padding: '0 5px',
        borderRadius: 999,
        background: on ? 'var(--paper)' : cat.c,
        color: on ? cat.c : 'var(--paper)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid var(--paper)'
      }
    }, count));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 18px 4px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.12em',
      color: activeCat ? activeCat.c : 'var(--ink-faint)',
      textTransform: 'uppercase'
    }
  }, activeCat ? `Recent ${activeCat.label}` : 'All activity'), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: 'var(--border)'
    }
  }), activeCat && /*#__PURE__*/React.createElement("button", {
    onClick: () => setActive(null),
    "aria-label": "Clear filter",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      background: 'none',
      border: 'none',
      color: 'var(--ink-faint)',
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.close,
    size: 13,
    stroke: 2.5
  }), " Clear")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflow: 'auto',
      padding: '6px 16px 20px'
    }
  }, shown.map(n => {
    const m = catOfKind(n.kind);
    const u = n.user ? userOf(n.user) : null;
    return /*#__PURE__*/React.createElement("button", {
      key: n.id,
      onClick: () => go(n.ref),
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        padding: '13px 0'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        flexShrink: 0
      }
    }, u ? /*#__PURE__*/React.createElement(Avatar, {
      name: u.name,
      color: u.color,
      size: 42
    }) : /*#__PURE__*/React.createElement("div", {
      style: {
        width: 42,
        height: 42,
        borderRadius: '50%',
        background: 'var(--bone)',
        color: m.c,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: m.icon,
      size: 20
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 19,
        height: 19,
        borderRadius: '50%',
        background: m.c,
        color: 'var(--paper)',
        border: '2px solid var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: m.icon,
      size: 10,
      stroke: 2.5
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        paddingTop: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--ink-soft)',
        lineHeight: 1.45
      }
    }, u && /*#__PURE__*/React.createElement("b", {
      style: {
        color: 'var(--ink)',
        fontWeight: 600
      }
    }, "@", u.handle, " "), n.text), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-faint)',
        marginTop: 3
      }
    }, n.time)), n.unread && !readNotifs[n.id] && /*#__PURE__*/React.createElement("div", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'var(--stamp-red)',
        flexShrink: 0,
        marginTop: 6
      }
    }));
  }), shown.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      color: 'var(--ink-faint)',
      fontSize: 13.5,
      padding: '40px 0'
    }
  }, "Nothing here yet.")))));
}

// ── Share sheet — industry-standard targets (bottom sheet) ────
function ShareSheet({
  label
}) {
  const {
    setOverlay,
    flashToast
  } = useNav();
  const what = label || 'this';
  const close = () => setOverlay(null);
  const send = name => {
    close();
    flashToast(name === 'Copy link' ? 'Link copied to clipboard' : `Shared to ${name}`);
  };

  // brand glyphs (simple inline marks)
  const wa = /*#__PURE__*/React.createElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "#fff"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 0 16 8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 0 1 12 4zm-2.5 4c-.2 0-.5 0-.7.4-.3.3-1 .9-1 2.3s1 2.6 1.2 2.8c.2.2 2 3 4.8 4.1 2.4 1 2.9.8 3.4.8.5-.1 1.6-.7 1.9-1.4.2-.7.2-1.2.1-1.4-.1-.1-.3-.2-.6-.4l-2-1c-.3-.1-.5-.2-.7.1l-.7.9c-.1.2-.3.2-.5.1-.3-.1-1.2-.5-2.2-1.4-.8-.7-1.4-1.6-1.5-1.8-.1-.3 0-.4.1-.5l.4-.5c.2-.2.2-.3.3-.5l.2-.4c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5z"
  }));
  const tg = /*#__PURE__*/React.createElement(Ico, {
    d: Icons.send,
    size: 22,
    style: {
      color: '#fff',
      transform: 'rotate(-12deg)'
    }
  });
  const targets = [{
    name: 'WhatsApp',
    bg: '#25D366',
    el: wa
  }, {
    name: 'Instagram',
    bg: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)',
    el: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.camera,
      size: 21,
      style: {
        color: '#fff'
      }
    })
  }, {
    name: 'Facebook',
    bg: '#1877F2',
    el: /*#__PURE__*/React.createElement("span", {
      style: {
        color: '#fff',
        fontFamily: 'Georgia, serif',
        fontWeight: 800,
        fontSize: 22
      }
    }, "f")
  }, {
    name: 'X',
    bg: '#000',
    el: /*#__PURE__*/React.createElement("span", {
      style: {
        color: '#fff',
        fontWeight: 800,
        fontSize: 18
      }
    }, "\uD835\uDD4F")
  }, {
    name: 'Telegram',
    bg: '#229ED9',
    el: tg
  }, {
    name: 'Email',
    bg: 'var(--ink-mute)',
    el: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.mail,
      size: 21,
      style: {
        color: '#fff'
      }
    })
  }];
  return /*#__PURE__*/React.createElement("div", {
    onClick: close,
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 130,
      background: 'rgba(20,17,15,0.45)',
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeIn 160ms'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      background: 'var(--paper)',
      borderRadius: '20px 20px 0 0',
      padding: '10px 18px 30px',
      animation: 'sheetUp 240ms cubic-bezier(0.22,1,0.36,1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 4,
      borderRadius: 2,
      background: 'var(--border-strong)',
      margin: '0 auto 14px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 18,
      letterSpacing: '-0.01em'
    }
  }, "Share ", what), /*#__PURE__*/React.createElement("button", {
    onClick: close,
    "aria-label": "Close",
    style: {
      marginLeft: 'auto',
      width: 32,
      height: 32,
      borderRadius: 9,
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--ink-mute)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.close,
    size: 17
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      overflowX: 'auto',
      paddingBottom: 6
    }
  }, targets.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.name,
    onClick: () => send(t.name),
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 7,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      flexShrink: 0,
      width: 60
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 54,
      height: 54,
      borderRadius: '50%',
      background: t.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, t.el), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-soft)',
      fontWeight: 500
    }
  }, t.name)))), /*#__PURE__*/React.createElement("button", {
    onClick: () => send('Copy link'),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      marginTop: 18,
      padding: '13px 14px',
      borderRadius: 13,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 10,
      background: 'var(--bone)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--ink-mute)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.share,
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, "Copy link"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-mono)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, "collectorhub.app/s/9f2a1")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--stamp-red)'
    }
  }, "Copy"))));
}
Object.assign(window, {
  OverlayShell,
  ComposeOverlay,
  ComposeTool,
  SearchOverlay,
  NotificationsOverlay,
  ResGroup,
  ResRow,
  ShareSheet,
  StarPicker
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/Overlays.jsx", error: String((e && e.message) || e) }); }

// app/PostDetail.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Post detail & discussion — BRD §9.7
// ─────────────────────────────────────────────────────────────

function PostDetail({
  route
}) {
  const {
    push,
    flashToast,
    setOverlay
  } = useNav();
  const {
    hearted,
    toggleHeart,
    saved,
    toggleSave
  } = useAppState();
  const all = [...POSTS];
  const post = all.find(p => p.id === route.id) || POSTS[0];
  const u = userOf(post.user);
  const item = post.refSku ? catOf(post.refSku) : null;
  const comments = COMMENTS[post.id] || [];
  const liked = hearted[post.id];
  const isSaved = saved[post.id];
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Post"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 16px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(AuthorLine, {
    handle: post.user,
    time: post.time,
    community: post.community,
    onOpen: () => push({
      name: 'profile',
      user: post.user
    })
  }), /*#__PURE__*/React.createElement(PostTypeTag, {
    type: post.type
  })), post.type === 'review' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      margin: '12px 0 0'
    }
  }, /*#__PURE__*/React.createElement(Stars, {
    n: post.rating
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)'
    }
  }, post.rating, "/5 build quality")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      lineHeight: 1.6,
      color: 'var(--ink-soft)',
      margin: '12px 0'
    }
  }, post.body)), post.image && item && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px'
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: post.tone,
    ratio: "3/2",
    label: item.sku
  })), item && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px 0'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'item',
      sku: item.sku
    }),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      textAlign: 'left',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 10,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 8,
      overflow: 'hidden',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: post.tone,
    ratio: "1/1",
    rounded: 8
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, item.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-mono)'
    }
  }, item.sku, " \xB7 view item")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      padding: '12px 16px',
      margin: '6px 0',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(ActionBtn, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.heart,
      size: 21
    }),
    label: (post.likes || 0) + (liked ? 1 : 0),
    active: liked,
    onClick: () => toggleHeart(post.id)
  }), /*#__PURE__*/React.createElement(ActionBtn, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.comment,
      size: 21
    }),
    label: comments.length
  }), /*#__PURE__*/React.createElement(ActionBtn, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.share,
      size: 20
    }),
    onClick: () => setOverlay({
      name: 'share',
      label: `${userOf(post.user).name.split(' ')[0]}’s post`
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(ActionBtn, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.bookmark,
      size: 21
    }),
    active: isSaved,
    activeColor: "var(--ink)",
    onClick: () => toggleSave(post.id)
  })), /*#__PURE__*/React.createElement(CommentThread, {
    post: post
  }));
}
Object.assign(window, {
  PostDetail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/PostDetail.jsx", error: String((e && e.message) || e) }); }

// app/ProfileCollection.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// ProfileCollection — CollectionTab, charts, calendar, collage, ItemTile
// ─────────────────────────────────────────────────────────────

// Collection portfolio tab — grid + chart / calendar / collage views (BRD v1.2 §9.5)
function CollectionTab({
  items,
  u,
  isMe
}) {
  const [seg, setSeg] = React.useState('owned');
  const [view, setView] = React.useState('grid');
  // per-view visibility (BRD v1.2 §9.5) — owner sets each view public/private
  const [vis, setVis] = React.useState({
    grid: 'public',
    chart: 'public',
    calendar: 'public',
    collage: 'private'
  });
  const {
    flashToast
  } = useNav();
  const {
    wishlistedSkus
  } = useAppState();
  const owned = items.filter(i => i.status !== 'wishlist');
  const ownedValue = items.filter(i => i.status === 'owned').reduce((s, i) => s + i.value, 0);

  // Wishlist: static items + SKUs dynamically wishlisted from other profiles (own view only)
  const staticWishlist = items.filter(i => i.status === 'wishlist');
  const dynamicWishlist = isMe ? Object.keys(wishlistedSkus || {}).filter(sku => wishlistedSkus[sku] && !staticWishlist.find(s => s.sku === sku)).map(sku => {
    const c = catOf(sku);
    return c ? {
      id: 'dw-' + sku,
      sku,
      status: 'wishlist',
      verify: 'claimed',
      value: c.est || 0,
      listed: false,
      photos: 0
    } : null;
  }).filter(Boolean) : [];
  const wishlistItems = [...staticWishlist, ...dynamicWishlist];
  const filtered = seg === 'wishlist' ? wishlistItems : items.filter(i => i.status === seg);
  const views = [{
    id: 'grid',
    icon: Icons.grid,
    label: 'Grid'
  }, {
    id: 'chart',
    icon: Icons.chart,
    label: 'Chart'
  }, {
    id: 'calendar',
    icon: Icons.calendar,
    label: 'Calendar'
  }, {
    id: 'collage',
    icon: Icons.gallery,
    label: 'Collage'
  }];
  const isPrivate = vis[view] === 'private';
  const hiddenFromViewer = !isMe && isPrivate;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(ValueCard, {
    label: "Portfolio Value",
    value: ownedValue,
    accent: "var(--stamp-red)"
  }), /*#__PURE__*/React.createElement(ValueCard, {
    label: "Items Owned",
    value: owned.length,
    plain: true,
    accent: "var(--ink)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flex: 1,
      overflowX: 'auto'
    }
  }, views.map(v => {
    const on = view === v.id;
    return /*#__PURE__*/React.createElement("button", {
      key: v.id,
      onClick: () => setView(v.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 11px',
        borderRadius: 999,
        cursor: 'pointer',
        border: `1px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
        background: on ? 'var(--ink)' : 'var(--paper-soft)',
        color: on ? 'var(--paper)' : 'var(--ink)',
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        fontSize: 12.5,
        whiteSpace: 'nowrap',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: v.icon,
      size: 15,
      stroke: on ? 2 : 1.75
    }), v.label);
  })), isMe && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setVis(s => ({
        ...s,
        [view]: isPrivate ? 'public' : 'private'
      }));
      flashToast(`${views.find(v => v.id === view).label} view ${isPrivate ? 'now public' : 'now private'}`);
    },
    title: "Toggle who can see this view",
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      flexShrink: 0,
      cursor: 'pointer',
      border: '1px solid var(--border-strong)',
      background: isPrivate ? 'var(--bone)' : 'var(--paper-soft)',
      color: isPrivate ? 'var(--ink-faint)' : 'var(--verified-teal)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: isPrivate ? Icons.eyeOff : Icons.eye,
    size: 18
  }))), hiddenFromViewer ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '34px 0',
      color: 'var(--ink-faint)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.eyeOff,
    size: 26,
    style: {
      color: 'var(--ink-ghost)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      marginTop: 8
    }
  }, "This view is private.")) : /*#__PURE__*/React.createElement(React.Fragment, null, isMe && isPrivate && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.eyeOff,
    size: 14
  }), " Only you can see this view."), view === 'grid' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Segmented, {
    value: seg,
    onChange: setSeg,
    options: [{
      id: 'owned',
      label: 'Owned'
    }, {
      id: 'wishlist',
      label: 'Wishlist'
    }, {
      id: 'preorder',
      label: 'Pre-order'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 11,
      marginTop: 14
    }
  }, filtered.map(it => /*#__PURE__*/React.createElement(ItemTile, {
    key: it.id,
    item: it,
    isMe: isMe
  }))), filtered.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, isMe ? 'Nothing here yet — add from the catalogue.' : 'Private or empty.')), view === 'chart' && /*#__PURE__*/React.createElement(PortfolioChart, {
    items: owned
  }), view === 'calendar' && /*#__PURE__*/React.createElement(PortfolioCalendar, {
    items: items
  }), view === 'collage' && /*#__PURE__*/React.createElement(PortfolioCollage, {
    items: owned
  })));
}

// Chart view — SVG donut/pie by value (BRD v1.2 §9.5)
function PortfolioChart({
  items
}) {
  const byCat = {};
  items.forEach(i => {
    const c = catOf(i.sku);
    const k = c ? c.cat : 'other';
    if (!byCat[k]) byCat[k] = {
      count: 0,
      value: 0
    };
    byCat[k].count++;
    byCat[k].value += i.value;
  });
  const rows = Object.entries(byCat).sort((a, b) => b[1].value - a[1].value);
  if (rows.length === 0) return /*#__PURE__*/React.createElement(EmptyNote, null, "No items to chart yet.");
  const total = rows.reduce((s, [, v]) => s + v.value, 0) || 1;
  const totalCount = rows.reduce((s, [, v]) => s + v.count, 0);
  const tones = {
    figures: 'var(--stamp-red)',
    designer: 'var(--plum)',
    kits: 'var(--forest)',
    diecast: 'var(--verified-teal)',
    other: 'var(--ink-mute)'
  };
  const labels = {
    figures: 'Action Figures',
    designer: 'Designer & Blind Boxes',
    kits: 'Kits & Lego',
    diecast: 'Diecast',
    other: 'Other'
  };
  const cx = 100,
    cy = 100,
    R = 76,
    ir = 44;
  let angle = -Math.PI / 2;
  const slices = rows.map(([k, v]) => {
    const pct = v.value / total;
    const sweep = pct * 2 * Math.PI;
    const sa = angle,
      ea = angle + sweep;
    angle = ea;
    if (pct > 0.9999) {
      const pathD = `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx} ${cy + R} A ${R} ${R} 0 1 1 ${cx} ${cy - R} M ${cx} ${cy - ir} A ${ir} ${ir} 0 1 0 ${cx} ${cy + ir} A ${ir} ${ir} 0 1 0 ${cx} ${cy - ir} Z`;
      return {
        k,
        v,
        pct,
        pathD
      };
    }
    const lg = sweep > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.cos(sa),
      y1 = cy + R * Math.sin(sa);
    const x2 = cx + R * Math.cos(ea),
      y2 = cy + R * Math.sin(ea);
    const xi1 = cx + ir * Math.cos(sa),
      yi1 = cy + ir * Math.sin(sa);
    const xi2 = cx + ir * Math.cos(ea),
      yi2 = cy + ir * Math.sin(ea);
    const pathD = `M ${xi1} ${yi1} L ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ir} ${ir} 0 ${lg} 0 ${xi1} ${yi1} Z`;
    return {
      k,
      v,
      pct,
      pathD
    };
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 200,
    height: 200,
    viewBox: "0 0 200 200"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: (R + ir) / 2,
    fill: "none",
    stroke: "var(--bone)",
    strokeWidth: R - ir + 1
  }), slices.map(({
    k,
    pathD
  }) => /*#__PURE__*/React.createElement("path", {
    key: k,
    d: pathD,
    style: {
      fill: tones[k] || 'var(--ink-mute)'
    },
    stroke: "var(--paper)",
    strokeWidth: 2.5
  })), /*#__PURE__*/React.createElement("text", {
    x: cx,
    y: cy - 4,
    textAnchor: "middle",
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '22px',
      fontWeight: 700,
      fill: 'var(--ink)'
    }
  }, totalCount), /*#__PURE__*/React.createElement("text", {
    x: cx,
    y: cy + 13,
    textAnchor: "middle",
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: '11px',
      fill: 'var(--ink-faint)'
    }
  }, "items"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 11,
      padding: '0 2px'
    }
  }, slices.map(({
    k,
    v,
    pct
  }) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: tones[k] || 'var(--ink-mute)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: 600
    }
  }, labels[k] || k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-mono)'
    }
  }, v.count, " \xB7 ", Math.round(pct * 100), "%"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-mute)',
      fontFamily: 'var(--font-mono)',
      minWidth: 76,
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: v.value
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--ink-soft)'
    }
  }, "Portfolio value"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 15,
      color: 'var(--stamp-red)'
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: total
  }))));
}

// Calendar view — upcoming pre-orders grouped by month (BRD v1.2 §9.5)
function PortfolioCalendar({
  items
}) {
  const pos = items.filter(i => i.status === 'preorder');
  const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MONTH_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Group by etaMonth + etaYear
  const grouped = {};
  pos.forEach(it => {
    const m = it.etaMonth != null ? it.etaMonth : 11;
    const y = it.etaYear || 2026;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = {
      month: m,
      year: y,
      items: []
    };
    grouped[key].items.push(it);
  });
  const keys = Object.keys(grouped).sort();
  if (keys.length === 0) return /*#__PURE__*/React.createElement(EmptyNote, null, "No pre-orders on the calendar.");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, keys.map(key => {
    const g = grouped[key];
    return /*#__PURE__*/React.createElement("div", {
      key: key
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--grail-gold)',
        color: 'var(--ink)',
        borderRadius: 7,
        padding: '4px 11px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap'
      }
    }, MONTH_FULL[g.month], " ", g.year), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        height: 1,
        background: 'var(--border)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--ink-faint)',
        fontFamily: 'var(--font-mono)',
        whiteSpace: 'nowrap'
      }
    }, g.items.length, " item", g.items.length !== 1 ? 's' : '')), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 9
      }
    }, g.items.map(it => {
      const c = catOf(it.sku);
      const dayMatch = it.eta && it.eta.match(/\d+/);
      const day = dayMatch ? dayMatch[0] : null;
      return /*#__PURE__*/React.createElement("div", {
        key: it.id,
        style: {
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          background: 'var(--paper-soft)',
          border: '1px solid var(--border)',
          borderRadius: 13,
          padding: 12
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 48,
          height: 48,
          borderRadius: 10,
          flexShrink: 0,
          overflow: 'hidden',
          border: '1px solid var(--grail-gold)',
          display: 'flex',
          flexDirection: 'column'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          background: 'var(--grail-gold)',
          textAlign: 'center',
          fontSize: 8,
          fontWeight: 700,
          color: 'var(--ink)',
          letterSpacing: '0.07em',
          padding: '3px 0',
          lineHeight: 1
        }
      }, MONTH_SHORT[g.month]), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--grail-gold-soft)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: day ? 17 : 13,
          color: 'var(--grail-gold-deep)',
          lineHeight: 1
        }
      }, day || '~')), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13.5,
          fontWeight: 600,
          lineHeight: 1.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }
      }, c.title), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: 'var(--ink-faint)',
          marginTop: 3
        }
      }, it.order || 'On order'), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: 'var(--grail-gold-deep)',
          fontFamily: 'var(--font-mono)',
          marginTop: 2
        }
      }, it.eta || 'ETA TBD')), /*#__PURE__*/React.createElement(Tag, {
        kind: "po"
      }, "PO"));
    })));
  }));
}

// Collage view — showcase wall (BRD v1.2 §9.5)
function PortfolioCollage({
  items
}) {
  const {
    push
  } = useNav();
  if (items.length === 0) return /*#__PURE__*/React.createElement(EmptyNote, null, "Nothing to show off yet.");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      columnCount: 2,
      columnGap: 8
    }
  }, items.map((it, i) => {
    const c = catOf(it.sku);
    const ratio = ['3/4', '1/1', '4/5', '1/1'][i % 4];
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => push({
        name: 'item',
        sku: it.sku
      }),
      style: {
        width: '100%',
        marginBottom: 8,
        padding: 0,
        border: 'none',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'inline-block',
        breakInside: 'avoid',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement(ProductPhoto, {
      tone: c.tone,
      ratio: ratio,
      rounded: 12,
      label: c.brand
    }));
  }));
}
function ValueCard({
  label,
  value,
  accent,
  plain
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 13,
      padding: '12px 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      marginBottom: 5
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 19,
      color: accent,
      fontFeatureSettings: '"tnum" 1'
    }
  }, plain ? value : /*#__PURE__*/React.createElement(Money, {
    value: value
  })));
}
function ItemTile({
  item,
  isMe
}) {
  const {
    push,
    flashToast
  } = useNav();
  const {
    wishlistedSkus,
    toggleWishlistSku
  } = useAppState();
  const c = catOf(item.sku);
  const isWishlisted = !isMe && !!(wishlistedSkus || {})[item.sku];
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => push({
      name: 'item',
      sku: item.sku
    }),
    role: "button",
    tabIndex: 0,
    style: {
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 13,
      overflow: 'hidden',
      cursor: 'pointer',
      textAlign: 'left',
      padding: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: c.tone,
    ratio: "1/1",
    rounded: 0
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 7,
      left: 7
    }
  }, /*#__PURE__*/React.createElement(VerifyBadge, {
    tier: item.verify
  })), item.listed && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 7,
      right: 7
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: "sale"
  }, "Listed")), item.status === 'preorder' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 7,
      left: 7
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: "po"
  }, "PO")), !isMe && /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      toggleWishlistSku(item.sku);
      flashToast(isWishlisted ? 'Removed from wishlist' : 'Added to your wishlist');
    },
    "aria-label": isWishlisted ? 'Remove from wishlist' : 'Add to wishlist',
    style: {
      position: 'absolute',
      bottom: 7,
      right: 7,
      width: 28,
      height: 28,
      borderRadius: 7,
      border: 'none',
      cursor: 'pointer',
      background: isWishlisted ? 'var(--stamp-red)' : 'rgba(20,17,15,0.52)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.bookmark,
    size: 14,
    stroke: isWishlisted ? 0 : 1.75,
    fill: isWishlisted ? 'currentColor' : 'none'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 9px 10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      lineHeight: 1.25,
      color: 'var(--ink)',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      minHeight: 31
    }
  }, c.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      marginTop: 5,
      color: 'var(--ink-mute)'
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: item.value
  }))));
}
function TradesTab() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0
    }
  }, TRADE_HISTORY.map((d, i) => {
    const u = userOf(d.with);
    return /*#__PURE__*/React.createElement("div", {
      key: d.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: i < TRADE_HISTORY.length - 1 ? '1px solid var(--border)' : 'none'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: u.name,
      color: u.color,
      size: 40
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 600,
        color: 'var(--ink)'
      }
    }, d.dir, " \xB7 ", d.item), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-faint)'
      }
    }, "with @", u.handle, " \xB7 ", d.when)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 3
      }
    }, /*#__PURE__*/React.createElement(Tag, {
      kind: "vouch",
      style: {
        fontSize: 9
      }
    }, "Vouched")));
  }));
}
Object.assign(window, {
  CollectionTab,
  PortfolioChart,
  PortfolioCalendar,
  PortfolioCollage,
  ValueCard,
  ItemTile,
  TradesTab
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/ProfileCollection.jsx", error: String((e && e.message) || e) }); }

// app/ProfileEdit.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Edit profile + Profile-photo update — mirrors onboarding step 0 (§9.2)
// Routes: 'edit-profile' (form) · 'edit-avatar' (photo / colour picker)
// Edits persist via app-state `profile` overrides and reflect on the
// own-profile header instantly.
// ─────────────────────────────────────────────────────────────

const PROFILE_COLORS = ['var(--ink)', 'var(--stamp-red)', 'var(--plum)', 'var(--verified-teal)', 'var(--forest)', 'var(--grail-gold)', 'var(--ink-mute)'];

// reusable labelled field (matches onboarding's AuthField styling)
function EPField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--ink-mute)',
      letterSpacing: '0.02em'
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    type: type,
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    style: {
      display: 'block',
      width: '100%',
      boxSizing: 'border-box',
      height: 48,
      marginTop: 7,
      padding: '0 14px',
      borderRadius: 12,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--ink)',
      outline: 'none'
    }
  }));
}

// ── Edit profile form ─────────────────────────────────────────
function EditProfileView() {
  const {
    pop,
    push,
    flashToast
  } = useNav();
  const {
    profile,
    updateProfile
  } = useAppState();
  const me = {
    ...ME,
    ...profile
  };
  const [name, setName] = React.useState(me.name === 'You' ? '' : me.name);
  const [bio, setBio] = React.useState(me.bio || '');
  const [city, setCity] = React.useState(me.city || '');
  const [gender, setGender] = React.useState(me.gender || '');
  const [age, setAge] = React.useState(me.age || 24);
  const save = () => {
    updateProfile({
      name: name.trim() || 'You',
      bio: bio.trim(),
      city: city.trim(),
      gender,
      age
    });
    pop();
    flashToast('Profile updated');
  };
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Edit profile",
      subtitle: "What other collectors see",
      trailing: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "dark",
        onClick: save
      }, "Save")
    }),
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--paper)',
        padding: '12px 16px 30px'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "dark",
      size: "block",
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.check,
        size: 18
      }),
      onClick: save
    }, "Save changes"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'edit-avatar'
    }),
    style: {
      position: 'relative',
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: name || 'You',
    color: me.color,
    photo: me.photo,
    size: 92
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: 'var(--stamp-red)',
      color: 'var(--paper)',
      border: '3px solid var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.camera,
    size: 16
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: -14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'edit-avatar'
    }),
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--stamp-red)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 13.5,
      cursor: 'pointer',
      padding: 4
    }
  }, "Change profile photo")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(EPField, {
    label: "Display name",
    value: name,
    onChange: setName,
    placeholder: "e.g. Aman Iyer"
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--ink-mute)',
      letterSpacing: '0.02em'
    }
  }, "Bio"), /*#__PURE__*/React.createElement("textarea", {
    value: bio,
    onChange: e => setBio(e.target.value.slice(0, 150)),
    rows: 3,
    placeholder: "Who you are and what you collect \u2014 e.g. \u201CHot Toys obsessive, chasing 1/6 Marvel.\u201D",
    style: {
      display: 'block',
      width: '100%',
      boxSizing: 'border-box',
      marginTop: 7,
      padding: '11px 14px',
      borderRadius: 12,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      lineHeight: 1.45,
      color: 'var(--ink)',
      outline: 'none',
      resize: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      textAlign: 'right',
      margin: '5px 2px 0'
    }
  }, bio.length, "/150")), /*#__PURE__*/React.createElement(EPField, {
    label: "City",
    value: city,
    onChange: setCity,
    placeholder: "e.g. Mumbai"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--ink-mute)',
      letterSpacing: '0.02em'
    }
  }, "Gender"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 7
    }
  }, [['f', 'Female'], ['m', 'Male'], ['x', 'Prefer not to say']].map(([val, lbl]) => {
    const on = gender === val;
    return /*#__PURE__*/React.createElement("button", {
      key: val,
      onClick: () => setGender(on ? '' : val),
      style: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        cursor: 'pointer',
        padding: '0 6px',
        border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
        background: on ? 'var(--ink)' : 'var(--paper-soft)',
        color: on ? 'var(--paper)' : 'var(--ink)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 13.5,
        lineHeight: 1.1
      }
    }, lbl);
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--ink-mute)',
      letterSpacing: '0.02em'
    }
  }, "How old are you?"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 16,
      color: 'var(--ink)'
    }
  }, age >= 80 ? '80+' : age)), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 13,
    max: 80,
    step: 1,
    value: age,
    onChange: e => setAge(+e.target.value),
    style: {
      width: '100%',
      marginTop: 12,
      accentColor: 'var(--stamp-red)',
      cursor: 'pointer'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      color: 'var(--ink-faint)',
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("span", null, "13"), /*#__PURE__*/React.createElement("span", null, "80+"))))));
}

// ── Profile-photo updater ─────────────────────────────────────
function EditAvatarView() {
  const {
    pop,
    flashToast
  } = useNav();
  const {
    profile,
    updateProfile
  } = useAppState();
  const me = {
    ...ME,
    ...profile
  };
  const fileRef = React.useRef(null);
  const [name] = React.useState(me.name);
  const onFile = e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({
        photo: reader.result
      });
      flashToast('Profile photo updated');
    };
    reader.readAsDataURL(f);
  };
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Profile photo",
      subtitle: "Upload a photo or pick a colour",
      trailing: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "dark",
        onClick: pop
      }, "Done")
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 26
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: name || 'You',
    color: me.color,
    photo: me.photo,
    size: 132
  })), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    onChange: onFile,
    style: {
      display: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "dark",
    style: {
      flex: 1,
      justifyContent: 'center'
    },
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.camera,
      size: 18
    }),
    onClick: () => fileRef.current && fileRef.current.click()
  }, me.photo ? 'Replace photo' : 'Upload a photo'), me.photo && /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.close,
      size: 17
    }),
    onClick: () => {
      updateProfile({
        photo: null
      });
      flashToast('Photo removed');
    }
  }, "Remove")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 26
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Or pick an avatar colour")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      marginTop: 14
    }
  }, PROFILE_COLORS.map(c => {
    const on = !me.photo && me.color === c;
    return /*#__PURE__*/React.createElement("button", {
      key: c,
      onClick: () => updateProfile({
        color: c,
        photo: null
      }),
      "aria-label": "Pick colour",
      style: {
        width: 50,
        height: 50,
        borderRadius: '50%',
        background: c,
        cursor: 'pointer',
        position: 'relative',
        border: 'none',
        boxShadow: on ? '0 0 0 3px var(--paper), 0 0 0 5px var(--ink)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--paper)'
      }
    }, on && /*#__PURE__*/React.createElement(Ico, {
      d: Icons.check,
      size: 20,
      stroke: 3
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      alignItems: 'flex-start',
      marginTop: 26,
      fontSize: 12,
      color: 'var(--ink-faint)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 15,
    style: {
      color: 'var(--verified-teal)',
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("span", null, "A clear face or collection photo helps other collectors trust you when trading."))));
}
Object.assign(window, {
  EditProfileView,
  EditAvatarView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/ProfileEdit.jsx", error: String((e && e.message) || e) }); }

// app/ProfileSettings.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// ProfileSettings — SettingsView, BlockedUsersView
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// SettingsView — industry-standard app settings
// ─────────────────────────────────────────────────────────────
function SettingsView() {
  const {
    pop,
    push,
    flashToast
  } = useNav();

  // Notification toggles
  const [notifs, setNotifs] = React.useState({
    followers: true,
    messages: true,
    listingActivity: true,
    tradeRequests: true,
    eventReminders: true,
    communityActivity: false,
    priceDrops: true,
    newListings: false
  });
  const toggleNotif = k => setNotifs(s => ({
    ...s,
    [k]: !s[k]
  }));

  // Privacy
  const [collectionVis, setCollectionVis] = React.useState('public');
  const [messagingPref, setMessagingPref] = React.useState('followers');
  const [wishlistVis, setWishlistVis] = React.useState('followers');
  const [showOnline, setShowOnline] = React.useState(true);

  // Trading
  const [acceptTrades, setAcceptTrades] = React.useState(true);
  const [shippingRange, setShippingRange] = React.useState('india');
  const [showPhone, setShowPhone] = React.useState(false);

  // UI helpers
  const SectionHeader = ({
    children
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 16px 7px',
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.09em',
      textTransform: 'uppercase',
      color: 'var(--ink-faint)'
    }
  }, children);
  const Row = ({
    icon,
    label,
    sub,
    trailing,
    onClick,
    danger
  }) => /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '13px 16px',
      borderBottom: '1px solid var(--border)',
      cursor: onClick ? 'pointer' : 'default',
      background: 'var(--paper)'
    }
  }, icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      background: danger ? '#FEE2E2' : 'var(--paper-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      color: danger ? 'var(--stamp-red)' : 'var(--ink-soft)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: icon,
    size: 17,
    stroke: 1.8
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 500,
      color: danger ? 'var(--stamp-red)' : 'var(--ink)',
      lineHeight: 1.2
    }
  }, label), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      marginTop: 2,
      lineHeight: 1.3
    }
  }, sub)), trailing, onClick && !trailing && /*#__PURE__*/React.createElement(Ico, {
    d: Icons.chevRight,
    size: 16,
    style: {
      color: 'var(--ink-ghost)',
      flexShrink: 0
    }
  }));
  const Toggle = ({
    on,
    onToggle
  }) => /*#__PURE__*/React.createElement("div", {
    onClick: onToggle,
    style: {
      width: 44,
      height: 26,
      borderRadius: 13,
      flexShrink: 0,
      cursor: 'pointer',
      position: 'relative',
      background: on ? 'var(--ink)' : 'var(--border-strong)',
      transition: 'background 0.2s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 3,
      left: on ? 21 : 3,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--paper)',
      transition: 'left 0.18s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.18)'
    }
  }));
  const RadioGroup = ({
    value,
    onChange,
    options
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, options.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.id,
    onClick: () => onChange(o.id),
    style: {
      padding: '5px 11px',
      borderRadius: 8,
      border: `1px solid ${value === o.id ? 'var(--ink)' : 'var(--border-strong)'}`,
      background: value === o.id ? 'var(--ink)' : 'var(--paper-soft)',
      color: value === o.id ? 'var(--paper)' : 'var(--ink)',
      fontFamily: 'var(--font-body)',
      fontSize: 12,
      fontWeight: 500,
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }
  }, o.label)));
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Settings",
      onBack: pop
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 40
    }
  }, /*#__PURE__*/React.createElement(SectionHeader, null, "Account"), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.edit,
    label: "Edit profile",
    onClick: () => push({
      name: 'edit-profile'
    })
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.user,
    label: "Edit avatar",
    onClick: () => push({
      name: 'edit-avatar'
    })
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.shield,
    label: "Verified badge",
    sub: "Tier: Shown \xB7 3 vouches",
    onClick: () => push({
      name: 'vouch-request'
    })
  }), /*#__PURE__*/React.createElement(SectionHeader, null, "Notifications"), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.user,
    label: "New followers",
    trailing: /*#__PURE__*/React.createElement(Toggle, {
      on: notifs.followers,
      onToggle: () => toggleNotif('followers')
    })
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.message,
    label: "Messages",
    trailing: /*#__PURE__*/React.createElement(Toggle, {
      on: notifs.messages,
      onToggle: () => toggleNotif('messages')
    })
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.heart,
    label: "Listing saves & watches",
    trailing: /*#__PURE__*/React.createElement(Toggle, {
      on: notifs.listingActivity,
      onToggle: () => toggleNotif('listingActivity')
    })
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.swap,
    label: "Trade requests",
    trailing: /*#__PURE__*/React.createElement(Toggle, {
      on: notifs.tradeRequests,
      onToggle: () => toggleNotif('tradeRequests')
    })
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.calendar,
    label: "Event reminders",
    trailing: /*#__PURE__*/React.createElement(Toggle, {
      on: notifs.eventReminders,
      onToggle: () => toggleNotif('eventReminders')
    })
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.community,
    label: "Community activity",
    trailing: /*#__PURE__*/React.createElement(Toggle, {
      on: notifs.communityActivity,
      onToggle: () => toggleNotif('communityActivity')
    })
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.tag,
    label: "Price drops on saved",
    trailing: /*#__PURE__*/React.createElement(Toggle, {
      on: notifs.priceDrops,
      onToggle: () => toggleNotif('priceDrops')
    })
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.bag,
    label: "New listings matching wishlist",
    trailing: /*#__PURE__*/React.createElement(Toggle, {
      on: notifs.newListings,
      onToggle: () => toggleNotif('newListings')
    })
  }), /*#__PURE__*/React.createElement(SectionHeader, null, "Privacy & Safety"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--paper)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 500,
      marginBottom: 9,
      color: 'var(--ink)'
    }
  }, "Who can see my collection"), /*#__PURE__*/React.createElement(RadioGroup, {
    value: collectionVis,
    onChange: setCollectionVis,
    options: [{
      id: 'public',
      label: 'Everyone'
    }, {
      id: 'followers',
      label: 'Followers'
    }, {
      id: 'private',
      label: 'Only me'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--paper)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 500,
      marginBottom: 9,
      color: 'var(--ink)'
    }
  }, "Who can message me"), /*#__PURE__*/React.createElement(RadioGroup, {
    value: messagingPref,
    onChange: setMessagingPref,
    options: [{
      id: 'everyone',
      label: 'Everyone'
    }, {
      id: 'followers',
      label: 'Followers'
    }, {
      id: 'none',
      label: 'No one'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--paper)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 500,
      marginBottom: 9,
      color: 'var(--ink)'
    }
  }, "Who can see my wishlist"), /*#__PURE__*/React.createElement(RadioGroup, {
    value: wishlistVis,
    onChange: setWishlistVis,
    options: [{
      id: 'public',
      label: 'Everyone'
    }, {
      id: 'followers',
      label: 'Followers'
    }, {
      id: 'private',
      label: 'Only me'
    }]
  })), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.eye,
    label: "Show online status",
    trailing: /*#__PURE__*/React.createElement(Toggle, {
      on: showOnline,
      onToggle: () => setShowOnline(v => !v)
    })
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.close,
    label: "Blocked users",
    sub: "Manage users you have blocked",
    onClick: () => push({
      name: 'blocked-users'
    })
  }), /*#__PURE__*/React.createElement(SectionHeader, null, "Support"), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.info,
    label: "Help centre",
    onClick: () => flashToast('Help centre — coming soon')
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.flag,
    label: "Report a bug",
    onClick: () => flashToast('Bug report — coming soon')
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.doc,
    label: "Terms of service",
    onClick: () => flashToast('Terms of service — coming soon')
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.shield,
    label: "Privacy policy",
    onClick: () => flashToast('Privacy policy — coming soon')
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.star,
    label: "Rate the app",
    onClick: () => flashToast('Thanks for the love! ⭐')
  }), /*#__PURE__*/React.createElement(SectionHeader, null, "Account"), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.logout,
    label: "Log out",
    danger: true,
    onClick: () => {
      if (window.chReset) window.chReset();
    }
  }), /*#__PURE__*/React.createElement(Row, {
    icon: Icons.trash,
    label: "Delete account",
    danger: true,
    sub: "This cannot be undone",
    onClick: () => flashToast('Please contact support to delete your account.')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '22px 16px 4px',
      fontSize: 11.5,
      color: 'var(--ink-ghost)'
    }
  }, "CollectorHub \xB7 v0.9.1 (prototype)")));
}

// ── Blocked users screen ─────────────────────────────
function BlockedUsersView() {
  const {
    pop,
    flashToast
  } = useNav();
  // For the prototype we use a local list seeded empty.
  const [blocked, setBlocked] = React.useState([]);
  const unblock = handle => {
    setBlocked(b => b.filter(h => h !== handle));
    flashToast(`@${handle} unblocked`);
  };
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Blocked users",
      onBack: pop
    })
  }, blocked.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '72px 32px',
      textAlign: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 16,
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--ink-faint)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.close,
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 18,
      color: 'var(--ink)'
    }
  }, "No blocked users"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-faint)',
      lineHeight: 1.55,
      maxWidth: 260
    }
  }, "Users you block won't be able to see your profile, listings or messages.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 24
    }
  }, blocked.map(handle => {
    const u = userOf(handle) || {
      name: handle,
      handle,
      color: 'var(--ink-mute)'
    };
    return /*#__PURE__*/React.createElement("div", {
      key: handle,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: u.name,
      color: u.color,
      size: 44
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--ink)'
      }
    }, u.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-faint)'
      }
    }, "@", u.handle)), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      onClick: () => unblock(handle)
    }, "Unblock"));
  })));
}
Object.assign(window, {
  SettingsView,
  BlockedUsersView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/ProfileSettings.jsx", error: String((e && e.message) || e) }); }

// app/ProfileView.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Profile (own & others) — BRD §9.11
// Header + trust signals + tabs: Posts / Collection / Communities / Trades
// ─────────────────────────────────────────────────────────────

function ProfileView({
  route
}) {
  const handle = route.user;
  const isMe = !!route.isMe || handle === 'you';
  // Cross-scope references (split files)
  const CollectionTab = window.CollectionTab;
  const TradesTab = window.TradesTab || (() => /*#__PURE__*/React.createElement(EmptyNote, null, "No trades yet."));
  const {
    push,
    pop,
    flashToast,
    setOverlay
  } = useNav();
  const {
    followed,
    toggleFollow,
    joined,
    profile,
    vouched,
    saved,
    posts: livePosts
  } = useAppState();
  const u = isMe ? {
    ...ME,
    ...profile
  } : userOf(handle);
  const isVouched = !!vouched[handle];
  const [tab, setTab] = React.useState('collection');
  const isFollowing = followed[handle];

  // ── More menu state ──
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [isBlocked, setIsBlocked] = React.useState(false);
  const [reportReason, setReportReason] = React.useState(null);
  const [reportSent, setReportSent] = React.useState(false);
  const REPORT_REASONS = ['Fake / impersonation', 'Counterfeit / replica listings', 'Scam or fraud attempt', 'Harassment or abuse', 'Spam', 'Other'];
  const handleBlock = () => {
    setIsBlocked(true);
    setBlockOpen(false);
    setMoreOpen(false);
    flashToast(`@${u.handle} blocked`);
  };
  const handleReport = () => {
    setReportSent(true);
    setTimeout(() => {
      setReportOpen(false);
      setMoreOpen(false);
      setReportSent(false);
      setReportReason(null);
      flashToast('Report submitted — thank you');
    }, 1200);
  };

  // livePosts already destructured above from useAppState()
  const allISOSeed = typeof ISO_POSTS !== 'undefined' ? ISO_POSTS : [];
  const myItems = MY_ITEMS || [];
  const myCommunities = COMMUNITIES.filter(c => joined[c.id]);
  const myPosts = React.useMemo(() => {
    const seed = POSTS.filter(p => p.user === handle);
    const isoSeed = allISOSeed.filter(p => p.user === handle);
    const live = isMe ? livePosts || [] : [];
    const all = [...live, ...seed, ...isoSeed];
    // dedupe by id
    const seen = new Set();
    return all.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [handle, isMe, livePosts]);
  const header = isMe ? /*#__PURE__*/React.createElement(AppBar, {
    title: "Profile"
  }) : /*#__PURE__*/React.createElement(DetailHeader, {
    title: u.name,
    subtitle: '@' + u.handle,
    trailing: /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.more,
        size: 18
      }),
      onClick: () => setMoreOpen(true)
    })
  });
  return /*#__PURE__*/React.createElement(Screen, {
    header: header,
    nav: isMe
  }, (moreOpen || reportOpen || blockOpen) && /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      setMoreOpen(false);
      setReportOpen(false);
      setBlockOpen(false);
      setReportReason(null);
    },
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.38)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'flex-end'
    }
  }, moreOpen && !reportOpen && !blockOpen && /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      background: 'var(--paper)',
      borderRadius: '20px 20px 0 0',
      padding: '8px 0 32px',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      borderRadius: 2,
      background: 'var(--border-strong)',
      margin: '8px auto 18px'
    }
  }), [{
    icon: Icons.share,
    label: 'Copy profile link',
    onClick: () => {
      setMoreOpen(false);
      flashToast('Profile link copied');
    }
  }, {
    icon: Icons.flag,
    label: isBlocked ? 'Unblock @' + u.handle : 'Block @' + u.handle,
    danger: false,
    onClick: () => {
      setMoreOpen(false);
      setTimeout(() => setBlockOpen(true), 80);
    }
  }, {
    icon: Icons.close,
    label: 'Report @' + u.handle,
    danger: true,
    onClick: () => {
      setMoreOpen(false);
      setTimeout(() => setReportOpen(true), 80);
    }
  }].map(item => /*#__PURE__*/React.createElement("button", {
    key: item.label,
    onClick: item.onClick,
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 20px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: item.danger ? 'var(--stamp-red)' : 'var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      background: item.danger ? '#FEE2E2' : 'var(--paper-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'inherit'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: item.icon,
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: 15
    }
  }, item.label)))), reportOpen && /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      background: 'var(--paper)',
      borderRadius: '20px 20px 0 0',
      padding: '8px 0 32px',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      borderRadius: 2,
      background: 'var(--border-strong)',
      margin: '8px auto 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 20px 10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 17
    }
  }, "Report @", u.handle), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)',
      marginTop: 3
    }
  }, "Why are you reporting this account?")), reportSent ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 0 8px',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: '50%',
      background: 'var(--paper-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.check,
    size: 24,
    style: {
      color: 'var(--forest)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, "Report submitted"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)'
    }
  }, "We'll review this within 24\u202Fhrs")) : /*#__PURE__*/React.createElement(React.Fragment, null, REPORT_REASONS.map(reason => /*#__PURE__*/React.createElement("button", {
    key: reason,
    onClick: () => setReportReason(reason),
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '13px 20px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14.5,
      color: 'var(--ink)',
      fontWeight: reportReason === reason ? 600 : 400
    }
  }, reason), reportReason === reason && /*#__PURE__*/React.createElement(Ico, {
    d: Icons.check,
    size: 16,
    style: {
      color: 'var(--stamp-red)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px 0'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    style: {
      width: '100%',
      justifyContent: 'center',
      opacity: reportReason ? 1 : 0.45
    },
    onClick: reportReason ? handleReport : undefined
  }, "Submit report")))), blockOpen && /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      background: 'var(--paper)',
      borderRadius: '20px 20px 0 0',
      padding: '8px 0 32px',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.12)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      borderRadius: 2,
      background: 'var(--border-strong)',
      margin: '8px auto 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 20px 6px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: u.name,
    color: u.color,
    size: 56,
    style: {
      margin: '0 auto 12px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 17
    }
  }, "Block @", u.handle, "?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)',
      marginTop: 6,
      lineHeight: 1.55,
      maxWidth: 280,
      margin: '6px auto 0'
    }
  }, "They won't be able to see your profile, listings or messages. You can unblock them anytime from Settings.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '20px 20px 0'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    style: {
      width: '100%',
      justifyContent: 'center',
      background: 'var(--stamp-red)',
      borderColor: 'var(--stamp-red)'
    },
    onClick: handleBlock
  }, isBlocked ? 'Unblock' : 'Block', " @", u.handle), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    style: {
      width: '100%',
      justifyContent: 'center'
    },
    onClick: () => setBlockOpen(false)
  }, "Cancel")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 16px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, isMe ? /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'edit-avatar'
    }),
    "aria-label": "Change profile photo",
    style: {
      position: 'relative',
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: u.name,
    color: u.color,
    photo: u.photo,
    size: 76
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 26,
      height: 26,
      borderRadius: '50%',
      background: 'var(--stamp-red)',
      color: 'var(--paper)',
      border: '2.5px solid var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.camera,
    size: 13
  }))) : /*#__PURE__*/React.createElement(Avatar, {
    name: u.name,
    color: u.color,
    photo: u.photo,
    size: 76
  }), !isMe && topBadge(u) && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: -4,
      bottom: -4,
      borderRadius: '50%',
      boxShadow: '0 0 0 2.5px var(--paper)'
    }
  }, /*#__PURE__*/React.createElement(SeasonBadge, {
    b: topBadge(u),
    size: 26
  }))), /*#__PURE__*/React.createElement(TierChip, {
    tier: u.tier
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'flex-start'
    }
  }, [{
    n: u.deals,
    label: 'Deals',
    onClick: null
  }, {
    n: u.followers,
    label: 'Followers',
    onClick: () => push({
      name: 'follows',
      user: u.handle,
      mode: 'followers'
    })
  }, {
    n: u.vouchesReceived,
    label: 'Vouches',
    onClick: () => push({
      name: 'vouches',
      user: u.handle,
      mode: 'received'
    })
  }].map(({
    n,
    label,
    onClick
  }) => /*#__PURE__*/React.createElement("button", {
    key: label,
    onClick: onClick,
    disabled: !onClick,
    style: {
      background: 'none',
      border: 'none',
      padding: '4px 8px',
      cursor: onClick ? 'pointer' : 'default',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 22,
      color: 'var(--ink)',
      lineHeight: 1,
      fontFeatureSettings: '"tnum" 1'
    }
  }, compactNum(n)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--ink-faint)',
      letterSpacing: '0.05em',
      textTransform: 'uppercase'
    }
  }, label))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 20,
      letterSpacing: '-0.02em',
      color: 'var(--ink)'
    }
  }, u.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginTop: 3,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)'
    }
  }, "@", u.handle, " \xB7 ", u.city), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: presenceOf(u.handle) === 'Online now' ? 'var(--forest)' : 'var(--ink-ghost)',
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: presenceOf(u.handle) === 'Online now' ? 'var(--forest)' : 'var(--ink-faint)',
      fontWeight: presenceOf(u.handle) === 'Online now' ? 600 : 400
    }
  }, presenceOf(u.handle)))), u.bio && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-soft)',
      lineHeight: 1.55,
      marginTop: 7
    }
  }, u.bio), /*#__PURE__*/React.createElement(BadgeShelf, {
    u: u,
    style: {
      marginTop: 10
    },
    onOpen: () => push({
      name: 'badges',
      user: handle
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'stretch',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      marginTop: 14,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    icon: Icons.users,
    n: u.followers,
    l: "Followers",
    onClick: () => push({
      name: 'follows',
      user: u.handle,
      mode: 'followers'
    })
  }), /*#__PURE__*/React.createElement(StatDivider, null), /*#__PURE__*/React.createElement(StatTile, {
    icon: Icons.userPlus,
    n: u.following,
    l: "Following",
    onClick: () => push({
      name: 'follows',
      user: u.handle,
      mode: 'following'
    })
  }), /*#__PURE__*/React.createElement(StatDivider, null), /*#__PURE__*/React.createElement(StatTile, {
    icon: Icons.shield,
    accent: "var(--verified-teal)",
    n: u.vouchesReceived + (isMe ? 0 : vouched[handle] ? 1 : 0),
    l: "Vouches In",
    onClick: () => push({
      name: 'vouches',
      user: u.handle,
      mode: 'received'
    })
  }), /*#__PURE__*/React.createElement(StatDivider, null), /*#__PURE__*/React.createElement(StatTile, {
    icon: Icons.shield,
    accent: "var(--verified-teal)",
    n: u.vouchesGiven + (isMe ? Object.keys(vouched).length : 0),
    l: "Vouches Out",
    onClick: () => push({
      name: 'vouches',
      user: u.handle,
      mode: 'given'
    })
  })), isMe && /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'vouch-request'
    }),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      marginTop: 8,
      padding: '10px 13px',
      borderRadius: 11,
      background: 'var(--verified-teal-soft)',
      border: '1px solid var(--verified-teal)',
      cursor: 'pointer',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 16,
    style: {
      color: 'var(--verified-teal)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: 'var(--verified-teal)'
    }
  }, "Request a vouch"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--verified-teal)',
      opacity: 0.75,
      marginLeft: 6
    }
  }, "Ask collectors who know you")), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.chevR,
    size: 15,
    style: {
      color: 'var(--verified-teal)',
      opacity: 0.7,
      flexShrink: 0
    }
  })), /*#__PURE__*/React.createElement(RewardCard, {
    u: u,
    isMe: isMe
  }), isMe ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "dark",
    style: {
      flex: 1,
      justifyContent: 'center'
    },
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.edit,
      size: 16
    }),
    onClick: () => push({
      name: 'edit-profile'
    })
  }, "Edit profile"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.plusCircle,
      size: 17
    }),
    onClick: () => push({
      name: 'add-listing'
    })
  }, "Add item"), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.settings,
      size: 18
    }),
    onClick: () => push({
      name: 'settings'
    })
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: isFollowing ? 'secondary' : 'dark',
    style: {
      flex: 1,
      justifyContent: 'center'
    },
    onClick: () => {
      toggleFollow(handle);
      flashToast(isFollowing ? `Unfollowed @${u.handle}` : `Following @${u.handle}`);
    }
  }, isFollowing ? 'Following' : 'Follow'), /*#__PURE__*/React.createElement(Button, {
    variant: "dark",
    style: {
      flex: 1,
      justifyContent: 'center'
    },
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.message,
      size: 16
    }),
    onClick: () => push({
      name: 'chat',
      user: handle
    })
  }, "Message")), /*#__PURE__*/React.createElement(Button, {
    variant: isVouched ? 'secondary' : 'teal',
    style: {
      width: '100%',
      justifyContent: 'center',
      ...(isVouched ? {
        borderColor: 'var(--verified-teal)',
        color: 'var(--verified-teal)'
      } : null)
    },
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: isVouched ? Icons.check : Icons.shield,
      size: 17,
      stroke: isVouched ? 2.6 : 2
    }),
    onClick: () => push({
      name: 'vouch',
      user: handle,
      mode: 'give'
    })
  }, isVouched ? 'Vouched · Edit' : `Vouch for ${u.name.split(' ')[0]}`))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 3,
      background: 'var(--paper)',
      padding: '16px 16px 10px',
      marginTop: 8,
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    value: tab,
    onChange: setTab,
    options: [{
      id: 'collection',
      label: 'Collection'
    }, {
      id: 'posts',
      label: 'Posts'
    }, {
      id: 'communities',
      label: 'Communities'
    }, {
      id: 'trades',
      label: 'Trades'
    }, ...(isMe ? [{
      id: 'saved',
      label: 'Saved'
    }] : [])]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 28px'
    }
  }, tab === 'collection' && /*#__PURE__*/React.createElement(CollectionTab, {
    items: myItems,
    u: u,
    isMe: isMe
  }), tab === 'posts' && (myPosts.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '0 -16px'
    }
  }, myPosts.map(p => p.type === 'iso' ? /*#__PURE__*/React.createElement(ISOCard, {
    key: p.id,
    post: p
  }) : /*#__PURE__*/React.createElement(PostCard, {
    key: p.id,
    post: p
  }))) : /*#__PURE__*/React.createElement(EmptyNote, null, isMe ? "You haven't posted yet. Tap + to showcase a piece." : 'No posts yet.')), tab === 'communities' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, myCommunities.map(c => /*#__PURE__*/React.createElement(CommunityCard, {
    key: c.id,
    com: c,
    onOpen: () => push({
      name: 'community-detail',
      id: c.id
    })
  })), myCommunities.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, "Not in any community yet.")), tab === 'trades' && /*#__PURE__*/React.createElement(TradesTab, null), tab === 'saved' && isMe && (() => {
    const allPosts = [...(livePosts || []), ...POSTS];
    const savedPosts = allPosts.filter(p => saved[p.id]);
    return savedPosts.length ? /*#__PURE__*/React.createElement("div", {
      style: {
        margin: '0 -16px'
      }
    }, savedPosts.map(p => /*#__PURE__*/React.createElement(PostCard, {
      key: p.id,
      post: p
    }))) : /*#__PURE__*/React.createElement(EmptyNote, null, "No saved posts yet \u2014 tap the bookmark on any post to save it here.");
  })()));
}
function StatTile({
  icon,
  n,
  l,
  accent,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 7,
      background: 'none',
      border: 'none',
      padding: '14px 4px',
      cursor: onClick ? 'pointer' : 'default'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5
    },
    title: (n || 0).toLocaleString('en-IN')
  }, /*#__PURE__*/React.createElement(Ico, {
    d: icon,
    size: 15,
    stroke: 1.9,
    style: {
      color: accent || 'var(--ink-mute)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 17,
      color: 'var(--ink)',
      fontFeatureSettings: '"tnum" 1',
      lineHeight: 1
    }
  }, compactNum(n))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      lineHeight: 1,
      textAlign: 'center',
      color: 'var(--ink-faint)',
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap'
    }
  }, l));
}
function StatDivider() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      background: 'var(--border)',
      alignSelf: 'stretch',
      margin: '11px 0'
    }
  });
}

// Followers / Following list (BRD v1.2 §9.11) — tappable counts open this
function FollowList({
  route
}) {
  const {
    push
  } = useNav();
  const {
    followed,
    toggleFollow,
    flashToast
  } = {
    ...useAppState(),
    ...useNav()
  };
  const subject = route.user === 'you' ? ME : userOf(route.user);
  const mode = route.mode || 'followers';
  // build a plausible list from the user directory
  const people = Object.values(USERS).filter(u => u.handle !== route.user);
  const count = mode === 'followers' ? subject.followers : subject.following;
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: mode === 'followers' ? 'Followers' : 'Following',
      subtitle: `@${subject.handle} · ${count.toLocaleString('en-IN')}`
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 0 24px'
    }
  }, people.map(u => {
    const isFollowing = followed[u.handle];
    return /*#__PURE__*/React.createElement("div", {
      key: u.handle,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 16px',
        borderBottom: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => push({
        name: 'profile',
        user: u.handle
      }),
      style: {
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: u.name,
      color: u.color,
      size: 44
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => push({
        name: 'profile',
        user: u.handle
      }),
      style: {
        flex: 1,
        minWidth: 0,
        textAlign: 'left',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 600
      }
    }, u.name), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: presenceOf(u.handle) === 'Online now' ? 'var(--forest)' : 'transparent'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-faint)'
      }
    }, "@", u.handle, " \xB7 ", u.deals, " deals")), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: isFollowing ? 'secondary' : 'dark',
      onClick: () => {
        toggleFollow(u.handle);
        flashToast(isFollowing ? `Unfollowed @${u.handle}` : `Following @${u.handle}`);
      }
    }, isFollowing ? 'Following' : 'Follow'));
  })));
}

// ── Vouches: independent peer endorsements (not tied to a deal) ──
// A vouch can be given by anyone, for any reason — including history
// from outside CollectorHub. Anyone can also request a vouch.
const VOUCH_RELATIONS = ['Traded on CollectorHub', 'Traded off-app', 'Met in person', 'Known from a community', 'Trusted collector friend', 'Vouched on request'];
function vouchRelOf(handle, salt = 0) {
  const s = (handle || 'x').split('').reduce((a, c) => a + c.charCodeAt(0), 0) + salt;
  return VOUCH_RELATIONS[s % VOUCH_RELATIONS.length];
}

// Vouches received / given list — mirrors FollowList (BRD §8.2)
function VouchList({
  route
}) {
  const {
    push,
    flashToast
  } = useNav();
  const {
    followed,
    toggleFollow
  } = useAppState();
  const subject = route.user === 'you' ? ME : userOf(route.user);
  const isMe = route.user === 'you';
  const received = (route.mode || 'received') === 'received';
  const count = received ? subject.vouchesReceived : subject.vouchesGiven;
  const people = Object.values(USERS).filter(u => u.handle !== route.user);
  const list = people.slice(0, Math.max(0, Math.min(people.length, count)));
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: received ? 'Vouches received' : 'Vouches given',
      subtitle: `@${subject.handle} · ${count} ${received ? 'received' : 'given'}`,
      trailing: isMe && received ? /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "teal",
        icon: /*#__PURE__*/React.createElement(Ico, {
          d: Icons.shield,
          size: 15
        }),
        onClick: () => push({
          name: 'vouch',
          user: 'you',
          mode: 'request'
        })
      }, "Request") : !isMe ? /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "teal",
        icon: /*#__PURE__*/React.createElement(Ico, {
          d: Icons.shield,
          size: 15
        }),
        onClick: () => push({
          name: 'vouch',
          user: subject.handle,
          mode: 'give'
        })
      }, "Vouch") : null
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 0 24px'
    }
  }, list.map(u => {
    const isFollowing = followed[u.handle];
    const rel = vouchRelOf(u.handle, received ? 0 : 3);
    return /*#__PURE__*/React.createElement("div", {
      key: u.handle,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 16px',
        borderBottom: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => push({
        name: 'profile',
        user: u.handle
      }),
      style: {
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: u.name,
      color: u.color,
      size: 44
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => push({
        name: 'profile',
        user: u.handle
      }),
      style: {
        flex: 1,
        minWidth: 0,
        textAlign: 'left',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600
      }
    }, u.name), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        marginTop: 2
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: Icons.shield,
      size: 12,
      stroke: 2,
      style: {
        color: 'var(--verified-teal)',
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--ink-faint)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, rel))), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: isFollowing ? 'secondary' : 'dark',
      onClick: () => {
        toggleFollow(u.handle);
        flashToast(isFollowing ? `Unfollowed @${u.handle}` : `Following @${u.handle}`);
      }
    }, isFollowing ? 'Following' : 'Follow'));
  }), list.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, received ? 'No vouches yet.' : "Hasn't vouched for anyone yet.")));
}

// Vouch composer (give) + request flow — independent of any deal
function VouchView({
  route
}) {
  if ((route.mode || 'give') === 'request') return /*#__PURE__*/React.createElement(VouchRequestView, null);
  const {
    pop,
    flashToast
  } = useNav();
  const u = userOf(route.user);
  const REL = [{
    id: 'app',
    label: 'Traded on CollectorHub',
    icon: Icons.swap
  }, {
    id: 'offapp',
    label: 'Traded off-app',
    icon: Icons.bag
  }, {
    id: 'person',
    label: 'Met in person',
    icon: Icons.users
  }, {
    id: 'community',
    label: 'Known from a community',
    icon: Icons.globe
  }, {
    id: 'friend',
    label: 'Trusted collector friend',
    icon: Icons.shield
  }];
  const {
    vouched,
    addVouch,
    removeVouch,
    addNotif
  } = useAppState();
  const existing = vouched[route.user];
  const [rel, setRel] = React.useState(existing ? existing.rel : null);
  const [note, setNote] = React.useState(existing ? existing.note || '' : '');
  const first = u.name.split(' ')[0];
  const editing = !!existing;
  const send = () => {
    if (!rel) return;
    const relLabel = (REL.find(r => r.id === rel) || {}).label || rel;
    addVouch(route.user, {
      rel,
      note
    });
    addNotif({
      kind: 'vouch',
      user: 'you',
      text: `You vouched for @${u.handle} · ${relLabel}`,
      ref: {
        type: 'profile',
        id: u.handle
      }
    });
    pop();
    flashToast(editing ? `Vouch for @${u.handle} updated` : `Vouch sent to @${u.handle}`);
  };
  const remove = () => {
    removeVouch(route.user);
    pop();
    flashToast(`Vouch for @${u.handle} removed`);
  };
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: editing ? 'Edit vouch' : 'Vouch',
      subtitle: '@' + u.handle,
      trailing: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "teal",
        onClick: send,
        disabled: !rel
      }, editing ? 'Update' : 'Send')
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: u.name,
    color: u.color,
    size: 46
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16
    }
  }, u.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)'
    }
  }, "@", u.handle, " \xB7 ", u.city))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 14,
      padding: '12px 14px',
      background: 'var(--verified-teal-soft)',
      border: '1px solid var(--verified-teal)',
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 18,
    style: {
      color: 'var(--verified-teal)',
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-soft)',
      lineHeight: 1.5
    }
  }, "A vouch is your personal endorsement \u2014 it doesn't need a sale or trade. Vouch for anyone you trust, including people you know from outside CollectorHub.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "How do you know them?")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9,
      marginTop: 10
    }
  }, REL.map(r => {
    const on = rel === r.id;
    return /*#__PURE__*/React.createElement("button", {
      key: r.id,
      onClick: () => setRel(r.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        padding: '12px 14px',
        borderRadius: 13,
        border: `1.5px solid ${on ? 'var(--verified-teal)' : 'var(--border-strong)'}`,
        background: on ? 'var(--verified-teal-soft)' : 'var(--paper-soft)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 38,
        height: 38,
        borderRadius: 10,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: on ? 'var(--verified-teal)' : 'var(--bone)',
        color: on ? 'var(--paper)' : 'var(--ink-mute)'
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: r.icon,
      size: 18
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--ink)'
      }
    }, r.label), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 20,
        height: 20,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1.5px solid ${on ? 'var(--verified-teal)' : 'var(--border-strong)'}`,
        background: on ? 'var(--verified-teal)' : 'transparent',
        color: 'var(--paper)'
      }
    }, on && /*#__PURE__*/React.createElement(Ico, {
      d: Icons.check,
      size: 12,
      stroke: 3
    })));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Add a note (optional)")), /*#__PURE__*/React.createElement("textarea", {
    value: note,
    onChange: e => setNote(e.target.value),
    rows: 3,
    placeholder: `Why do you vouch for ${first}?`,
    style: {
      width: '100%',
      marginTop: 10,
      padding: '12px 13px',
      borderRadius: 12,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      resize: 'none',
      fontFamily: 'var(--font-body)',
      fontSize: 14.5,
      lineHeight: 1.5,
      color: 'var(--ink)',
      outline: 'none',
      boxSizing: 'border-box'
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "teal",
    style: {
      width: '100%',
      justifyContent: 'center',
      marginTop: 18
    },
    disabled: !rel,
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.shield,
      size: 17
    }),
    onClick: send
  }, editing ? 'Update vouch' : `Vouch for ${first}`), editing && /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    style: {
      width: '100%',
      justifyContent: 'center',
      marginTop: 10,
      color: 'var(--stamp-red)',
      borderColor: 'var(--stamp-red)'
    },
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.close,
      size: 16,
      stroke: 2.4
    }),
    onClick: remove
  }, "Remove vouch"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      textAlign: 'center',
      marginTop: 10,
      lineHeight: 1.5
    }
  }, "Your vouch will appear on @", u.handle, "'s profile.")));
}

// Request a vouch — anyone can ask collectors who know them
function VouchRequestView() {
  const {
    push,
    flashToast
  } = useNav();
  const {
    addNotif
  } = useAppState();
  const [sent, setSent] = React.useState({});
  const people = Object.values(USERS);
  const sendRequest = u => {
    setSent(s => ({
      ...s,
      [u.handle]: true
    }));
    addNotif({
      kind: 'vouch',
      user: u.handle,
      text: `Vouch request sent to @${u.handle} — they will be notified.`,
      ref: {
        type: 'profile',
        id: u.handle
      }
    });
    flashToast(`Vouch request sent to @${u.handle}`);
  };
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Request a vouch",
      subtitle: "Ask people who know you"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 6px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      padding: '12px 14px',
      background: 'var(--verified-teal-soft)',
      border: '1px solid var(--verified-teal)',
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 18,
    style: {
      color: 'var(--verified-teal)',
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-soft)',
      lineHeight: 1.5
    }
  }, "Vouches build trust independent of trades. Ask collectors who know you \u2014 from a deal, a meet-up, a community, or anywhere \u2014 to vouch for you."))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 0 24px'
    }
  }, people.map(u => {
    const done = sent[u.handle];
    return /*#__PURE__*/React.createElement("div", {
      key: u.handle,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 16px',
        borderBottom: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => push({
        name: 'profile',
        user: u.handle
      }),
      style: {
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: u.name,
      color: u.color,
      size: 44
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600
      }
    }, u.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-faint)'
      }
    }, "@", u.handle, " \xB7 ", u.city)), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: done ? 'secondary' : 'dark',
      disabled: done,
      onClick: () => sendRequest(u)
    }, done ? 'Requested' : 'Request'));
  })));
}
Object.assign(window, {
  ProfileView,
  FollowList,
  VouchList,
  VouchView,
  VouchRequestView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/ProfileView.jsx", error: String((e && e.message) || e) }); }

// app/Rewards.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Engagement rewards — Collector XP, ranks & leaderboards
// RewardCard (profile), RewardsView (earn + ladder), LeaderboardView
// ─────────────────────────────────────────────────────────────

// Colored rank tile — flat fill, rank icon (or padlock when locked)
function TierBadge({
  tier,
  size = 40,
  locked = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: size * 0.3,
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: locked ? 'var(--bone)' : tier.c,
      color: locked ? 'var(--ink-ghost)' : 'var(--paper)',
      boxShadow: locked ? 'none' : `0 2px 8px ${tier.c}55, inset 0 1px 0 rgba(255,255,255,0.35)`
    }
  }, !locked && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: '-30%',
      left: '-10%',
      width: '70%',
      height: '70%',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.28)',
      filter: 'blur(2px)'
    }
  }), /*#__PURE__*/React.createElement(Ico, {
    d: locked ? Icons.lock : tier.icon,
    size: Math.round(size * 0.5),
    stroke: 2,
    style: {
      position: 'relative'
    }
  }));
}

// Season medallion — circular metal badge earned at end of a cycle
function SeasonBadge({
  b,
  size = 40
}) {
  const m = badgeMeta(b);
  return /*#__PURE__*/React.createElement("div", {
    title: `${b.title} · ${b.period}`,
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      flexShrink: 0,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: m.fill,
      color: m.ink,
      boxShadow: `inset 0 0 0 ${Math.max(1.5, size * 0.055)}px ${m.ring}, 0 1px 5px ${m.ring}55`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: '8%',
      left: '14%',
      width: '46%',
      height: '38%',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.4)',
      filter: 'blur(1px)'
    }
  }), /*#__PURE__*/React.createElement(Ico, {
    d: m.icon,
    size: Math.round(size * 0.46),
    stroke: 2.2,
    style: {
      position: 'relative'
    }
  }));
}

// Overlapping badge shelf for the profile header — tap to open trophy case
function BadgeShelf({
  u,
  onOpen,
  style
}) {
  const bs = badgesOf(u);
  if (!bs.length) return null;
  const shown = bs.slice(0, 4);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onOpen,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 9,
      padding: '4px 9px 4px 4px',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 999,
      cursor: 'pointer',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex'
    }
  }, shown.map((b, i) => /*#__PURE__*/React.createElement("span", {
    key: b.id,
    style: {
      marginLeft: i ? -9 : 0,
      borderRadius: '50%',
      boxShadow: '0 0 0 2px var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement(SeasonBadge, {
    b: b,
    size: 24
  })))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--ink-soft)'
    }
  }, bs.length, " badge", bs.length > 1 ? 's' : ''), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.chevR,
    size: 14,
    style: {
      color: 'var(--ink-ghost)'
    }
  }));
}

// Progress helpers shared by card + screen
function rankProgress(xp) {
  const tier = tierOf(xp);
  const next = nextTierOf(xp);
  const span = next ? next.at - tier.at : 1;
  const pct = next ? Math.min(100, Math.max(3, Math.round((xp - tier.at) / span * 100))) : 100;
  const need = next ? next.at - xp : 0;
  return {
    tier,
    next,
    pct,
    need,
    idx: tierIndexOf(xp)
  };
}

// Small archetype pill — "what they contribute"
function ArchetypeChip({
  arche,
  size = 'md'
}) {
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: sm ? 4 : 5,
      padding: sm ? '2px 7px 2px 5px' : '3px 9px 3px 6px',
      borderRadius: 999,
      background: 'var(--bone)',
      border: `1px solid ${arche.c}33`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: sm ? 15 : 18,
      height: sm ? 15 : 18,
      borderRadius: '50%',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: arche.c,
      color: 'var(--paper)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: arche.icon,
    size: sm ? 9 : 11,
    stroke: 2.2
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: sm ? 11 : 12,
      fontWeight: 700,
      color: arche.c,
      letterSpacing: '0.01em'
    }
  }, arche.name));
}

// Compact rank card — lives in the profile header (own + others)
function RewardCard({
  u,
  isMe
}) {
  const {
    push
  } = useNav();
  const {
    tier,
    next,
    pct,
    need,
    idx
  } = rankProgress(u.xp);
  const arche = archetypeOf(u);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 15px 12px'
    }
  }, /*#__PURE__*/React.createElement(TierBadge, {
    tier: tier,
    size: 46
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16,
      letterSpacing: '-0.01em'
    }
  }, tier.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: 'var(--ink-faint)',
      letterSpacing: '0.06em'
    }
  }, "RANK ", idx + 1, "/", REWARD_TIERS.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5
    }
  }, /*#__PURE__*/React.createElement(ArchetypeChip, {
    arche: arche,
    size: "sm"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 18,
      color: 'var(--ink)',
      fontFeatureSettings: '"tnum" 1',
      lineHeight: 1
    }
  }, u.xp.toLocaleString('en-IN')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--ink-faint)',
      letterSpacing: '0.1em',
      marginTop: 3
    }
  }, "XP"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 15px 13px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 999,
      background: 'var(--bone)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: pct + '%',
      background: tier.c,
      borderRadius: 999,
      transition: 'width 320ms var(--ease-out)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: 7,
      fontSize: 11.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-faint)'
    }
  }, next ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink)',
      fontFamily: 'var(--font-mono)'
    }
  }, need.toLocaleString('en-IN'), " XP"), " to ", next.name) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: tier.c,
      fontWeight: 600
    }
  }, "Top rank reached")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-mono)'
    }
  }, "+", u.xpWeek, " this week"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      padding: '0 15px 15px'
    }
  }, isMe && /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "dark",
    style: {
      flex: 1,
      justifyContent: 'center'
    },
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.zap,
      size: 15
    }),
    onClick: () => push({
      name: 'rewards',
      user: 'you'
    })
  }, "Earn points"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: isMe ? 'secondary' : 'dark',
    style: {
      flex: 1,
      justifyContent: 'center'
    },
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.trophy,
      size: 15
    }),
    onClick: () => push({
      name: 'leaderboard'
    })
  }, "Leaderboard")));
}

// A single "way to earn" row
function EarnRow({
  a
}) {
  const sub = a.type === 'once' ? a.progress ? `${a.progress.done}/${a.progress.total} steps done` : 'One-time' : a.type === 'daily' ? 'Once a day' : 'Repeatable';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '11px 13px',
      borderRadius: 13,
      border: '1px solid var(--border)',
      background: 'var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 10,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bone)',
      color: 'var(--ink-mute)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: a.icon,
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, a.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      marginTop: 1
    }
  }, sub)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 13.5,
      color: 'var(--verified-teal)'
    }
  }, "+", a.xp));
}

// Rewards screen — hero + daily check-in + ways to earn + rank ladder
function RewardsView() {
  const {
    push,
    flashToast
  } = useNav();
  const u = ME;
  const {
    tier,
    next,
    pct,
    need,
    idx
  } = rankProgress(u.xp);
  const arche = archetypeOf(u);
  const mix = contribMix(u);
  const [checked, setChecked] = React.useState(false);
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Rewards",
      subtitle: "Collector XP",
      trailing: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "secondary",
        icon: /*#__PURE__*/React.createElement(Ico, {
          d: Icons.trophy,
          size: 15
        }),
        onClick: () => push({
          name: 'leaderboard'
        })
      }, "Ranks")
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '20px 16px 22px',
      borderRadius: 18,
      border: '1px solid var(--border)',
      background: 'var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement(TierBadge, {
    tier: tier,
    size: 66
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 24,
      letterSpacing: '-0.02em',
      marginTop: 12
    }
  }, tier.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--ink-faint)',
      letterSpacing: '0.04em',
      marginTop: 3
    }
  }, u.xp.toLocaleString('en-IN'), " XP \xB7 RANK ", idx + 1, " OF ", REWARD_TIERS.length), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 11
    }
  }, /*#__PURE__*/React.createElement(ArchetypeChip, {
    arche: arche
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 10,
      borderRadius: 999,
      background: 'var(--bone)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: pct + '%',
      background: tier.c,
      borderRadius: 999,
      transition: 'width 360ms var(--ease-out)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      marginTop: 9,
      lineHeight: 1.5
    }
  }, next ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink)',
      fontFamily: 'var(--font-mono)'
    }
  }, need.toLocaleString('en-IN'), " XP"), " to unlock ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: tier.c
    }
  }, next.name)) : 'You’ve reached the top rank — Legend.'))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!checked) {
        setChecked(true);
        flashToast('Checked in · +5 XP');
      }
    },
    disabled: checked,
    style: {
      width: '100%',
      marginTop: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 15px',
      borderRadius: 14,
      textAlign: 'left',
      cursor: checked ? 'default' : 'pointer',
      border: `1px solid ${checked ? 'var(--border)' : 'var(--grail-gold)'}`,
      background: checked ? 'var(--paper-soft)' : 'var(--grail-gold-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 11,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: checked ? 'var(--bone)' : 'var(--grail-gold)',
      color: checked ? 'var(--ink-faint)' : 'var(--ink)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: checked ? Icons.check : Icons.zap,
    size: 20,
    stroke: 2.2
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--ink)'
    }
  }, checked ? 'Checked in today' : 'Daily check-in'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      marginTop: 1
    }
  }, checked ? 'Come back tomorrow for more' : 'Tap to claim today’s bonus')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 14,
      color: checked ? 'var(--ink-faint)' : 'var(--grail-gold-deep)'
    }
  }, "+5")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Your contribution mix")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 11,
      padding: '15px 15px 13px',
      borderRadius: 14,
      border: '1px solid var(--border)',
      background: 'var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: arche.c,
      color: 'var(--paper)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: arche.icon,
    size: 17,
    stroke: 2.1
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: 'var(--ink)'
    }
  }, "You\u2019re a ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: arche.c
    }
  }, arche.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      marginTop: 1
    }
  }, arche.blurb))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: 9,
      borderRadius: 999,
      overflow: 'hidden',
      background: 'var(--bone)'
    }
  }, mix.map(m => m.pct > 0 && /*#__PURE__*/React.createElement("span", {
    key: m.key,
    style: {
      width: m.pct + '%',
      background: m.arche.c
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginTop: 13
    }
  }, mix.map(m => /*#__PURE__*/React.createElement("div", {
    key: m.key,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 3,
      flexShrink: 0,
      background: m.arche.c
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--ink-soft)',
      flex: 1
    }
  }, m.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)'
    }
  }, m.arche.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 12.5,
      color: 'var(--ink)',
      width: 38,
      textAlign: 'right'
    }
  }, m.pct, "%"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Ways to earn")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9,
      marginTop: 11
    }
  }, EARN_ACTIONS.filter(a => a.id !== 'checkin').map(a => /*#__PURE__*/React.createElement(EarnRow, {
    key: a.id,
    a: a
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Rank ladder"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--ink-faint)'
    }
  }, "Lifetime \xB7 never resets")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginTop: 11
    }
  }, REWARD_TIERS.map((t, i) => {
    const reached = u.xp >= t.at;
    const current = i === idx;
    return /*#__PURE__*/React.createElement("div", {
      key: t.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 13px',
        borderRadius: 13,
        border: `1.5px solid ${current ? t.c : 'var(--border)'}`,
        background: current ? 'var(--paper)' : 'var(--paper-soft)',
        opacity: reached || current ? 1 : 0.7
      }
    }, /*#__PURE__*/React.createElement(TierBadge, {
      tier: t,
      size: 40,
      locked: !reached
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 15
      }
    }, t.name), current && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 9.5,
        letterSpacing: '0.08em',
        color: t.c,
        border: `1px solid ${t.c}`,
        borderRadius: 999,
        padding: '2px 7px',
        textTransform: 'uppercase'
      }
    }, "You")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-faint)',
        marginTop: 2
      }
    }, t.perk)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        fontSize: 12.5,
        color: reached ? 'var(--ink)' : 'var(--ink-faint)'
      }
    }, t.at.toLocaleString('en-IN')), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9.5,
        color: 'var(--ink-ghost)',
        letterSpacing: '0.08em',
        marginTop: 2
      }
    }, "XP")));
  }))));
}

// Leaderboard — weekly / monthly / all-time with podium + ranked list
const MEDALS = ['var(--grail-gold)', '#A6A8AC', '#C08552'];

// When does each board reset? Weekly → next Monday; Monthly → 1st next month;
// All-time & contribution totals are lifetime and never reset.
function resetInfo(mode, period) {
  if (mode !== 'xp' || period === 'all') {
    return {
      label: 'Lifetime total — never resets',
      soon: false
    };
  }
  const now = new Date();
  if (period === 'week') {
    const d = (8 - now.getDay()) % 7 || 7; // days until next Monday
    return {
      label: `Resets Monday · in ${d} day${d > 1 ? 's' : ''}`,
      soon: d <= 1
    };
  }
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const d = Math.ceil((end - now) / 86400000);
  const mn = end.toLocaleString('en-US', {
    month: 'short'
  });
  return {
    label: `Resets ${mn} 1 · in ${d} day${d > 1 ? 's' : ''}`,
    soon: d <= 2
  };
}
function LeaderboardView() {
  const {
    push
  } = useNav();
  const [mode, setMode] = React.useState('xp'); // 'xp' | 'contrib'
  const [period, setPeriod] = React.useState('week'); // xp window
  const [cat, setCat] = React.useState('posts'); // contribution key
  const active = mode === 'xp' ? period : cat;
  const rows = leaderboard(active);
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const myIndex = rows.findIndex(r => r.isMe);
  const me = rows[myIndex];
  const periodLabel = mode === 'xp' ? {
    week: 'this week',
    month: 'this month',
    all: 'all-time'
  }[period] : `in ${CONTRIB_LABELS[cat]}`;
  const unit = mode === 'xp' ? 'XP' : 'pts';
  const catChips = [{
    id: 'posts',
    ...ARCHETYPES.posts
  }, {
    id: 'social',
    ...ARCHETYPES.social
  }, {
    id: 'collection',
    ...ARCHETYPES.collection
  }, {
    id: 'market',
    ...ARCHETYPES.market
  }];
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Leaderboard",
      subtitle: "Top collectors"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 10px',
      position: 'sticky',
      top: 0,
      zIndex: 3,
      background: 'var(--paper)'
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    value: mode,
    onChange: setMode,
    options: [{
      id: 'xp',
      label: 'By XP'
    }, {
      id: 'contrib',
      label: 'By contribution'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      marginTop: 10,
      overflowX: 'auto',
      paddingBottom: 2
    }
  }, mode === 'xp' ? [{
    id: 'week',
    label: 'Weekly'
  }, {
    id: 'month',
    label: 'Monthly'
  }, {
    id: 'all',
    label: 'All-time'
  }].map(o => /*#__PURE__*/React.createElement(FilterChip, {
    key: o.id,
    active: period === o.id,
    onClick: () => setPeriod(o.id)
  }, o.label)) : catChips.map(o => /*#__PURE__*/React.createElement(FilterChip, {
    key: o.id,
    active: cat === o.id,
    color: o.c,
    onClick: () => setCat(o.id),
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: o.icon,
      size: 13,
      stroke: 2.1
    })
  }, o.name))), (() => {
    const ri = resetInfo(mode, period);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 9,
        fontSize: 11.5,
        color: ri.soon ? 'var(--stamp-red)' : 'var(--ink-faint)'
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: Icons.clock,
      size: 13,
      stroke: 2
    }), /*#__PURE__*/React.createElement("span", null, ri.label));
  })()), !(mode === 'xp' && period === 'all') && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '14px 16px 0',
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      padding: '11px 13px',
      borderRadius: 14,
      background: 'var(--grail-gold-soft)',
      border: '1px solid var(--grail-gold)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: '50%',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--grail-gold)',
      color: '#5A3D00'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.gift,
    size: 17,
    stroke: 2.1
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--ink)'
    }
  }, "Win a badge when the season ends"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-soft)',
      marginTop: 1
    }
  }, "Top 3 earn a permanent badge + up to 300 bonus XP toward your rank"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 14,
      padding: '22px 16px 8px'
    }
  }, [top3[1], top3[0], top3[2]].filter(Boolean).map(r => {
    const rank = rows.indexOf(r) + 1;
    const first = rank === 1;
    const medal = MEDALS[rank - 1];
    return /*#__PURE__*/React.createElement("button", {
      key: r.key,
      onClick: () => push({
        name: 'profile',
        user: r.key
      }),
      style: {
        flex: 1,
        maxWidth: 108,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        borderRadius: '50%',
        padding: 3,
        background: medal
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: r.name,
      color: r.color,
      size: first ? 68 : 54
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        bottom: -7,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 23,
        height: 23,
        borderRadius: '50%',
        background: medal,
        color: rank === 1 ? 'var(--ink)' : 'var(--paper)',
        border: '2px solid var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: 11.5
      }
    }, rank)), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 7,
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--ink)',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, r.isMe ? 'You' : r.name.split(' ')[0]), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 2,
        background: mode === 'contrib' ? r.arche.c : r.tier.c
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: 13,
        color: 'var(--ink)'
      }
    }, r.points.toLocaleString('en-IN'))));
  })), myIndex >= 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '12px 16px 6px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '11px 14px',
      borderRadius: 13,
      background: 'var(--ink)',
      color: 'var(--paper)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.trend,
    size: 18
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "You\u2019re ", /*#__PURE__*/React.createElement("b", {
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, "#", myIndex + 1), " ", periodLabel), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 14
    }
  }, me.points.toLocaleString('en-IN'), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      opacity: 0.7
    }
  }, unit))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 0 24px'
    }
  }, rest.map(r => {
    const rank = rows.indexOf(r) + 1;
    return /*#__PURE__*/React.createElement("button", {
      key: r.key,
      onClick: () => push({
        name: 'profile',
        user: r.key
      }),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        background: r.isMe ? 'var(--verified-teal-soft)' : 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        padding: '11px 16px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: 14,
        color: r.isMe ? 'var(--verified-teal)' : 'var(--ink-faint)'
      }
    }, rank), /*#__PURE__*/React.createElement(Avatar, {
      name: r.name,
      color: r.color,
      size: 40
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--ink)'
      }
    }, r.isMe ? 'You' : r.name), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 2,
        background: mode === 'contrib' ? r.arche.c : r.tier.c
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-faint)'
      }
    }, mode === 'contrib' ? r.arche.name : r.tier.name))), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: 14.5,
        color: 'var(--ink)',
        fontFeatureSettings: '"tnum" 1'
      }
    }, r.points.toLocaleString('en-IN')));
  })));
}

// Trophy case — all season badges a member has earned
function BadgesView({
  route
}) {
  const {
    push
  } = useNav();
  const u = route.user === 'you' ? ME : userOf(route.user);
  const isMe = route.user === 'you';
  const bs = badgesOf(u);
  const top = bs[0];
  const totalXp = bs.reduce((s, b) => s + (badgeMeta(b).xp || 0), 0);
  const first = u.name.split(' ')[0];
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Badges",
      subtitle: isMe ? 'Your trophy case' : `${first}’s trophy case`
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, bs.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '40px 24px',
      color: 'var(--ink-faint)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 56,
      height: 56,
      borderRadius: '50%',
      background: 'var(--bone)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--ink-ghost)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.trophy,
    size: 26
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--ink)'
    }
  }, isMe ? 'No badges yet' : 'No badges yet'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      marginTop: 6,
      lineHeight: 1.5
    }
  }, isMe ? 'Finish in a weekly or monthly league to earn your first badge.' : `${first} hasn’t placed in a league yet.`), isMe && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "dark",
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.trophy,
      size: 15
    }),
    onClick: () => push({
      name: 'leaderboard'
    })
  }, "See leaderboard"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '22px 16px',
      borderRadius: 18,
      border: '1px solid var(--border)',
      background: 'var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement(SeasonBadge, {
    b: top,
    size: 76
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 21,
      letterSpacing: '-0.01em',
      marginTop: 13
    }
  }, top.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      marginTop: 3
    }
  }, badgeMeta(top).kindLabel, " \xB7 ", top.period, " \xB7 ", badgeMeta(top).label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 18,
      color: 'var(--ink)'
    }
  }, bs.length), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: 'var(--ink-faint)',
      letterSpacing: '0.06em',
      marginTop: 2,
      textTransform: 'uppercase'
    }
  }, "Badges")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--border)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 18,
      color: 'var(--ink)'
    }
  }, totalXp.toLocaleString('en-IN')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: 'var(--ink-faint)',
      letterSpacing: '0.06em',
      marginTop: 2,
      textTransform: 'uppercase'
    }
  }, "Bonus XP")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "All badges")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
      marginTop: 11
    }
  }, bs.map(b => {
    const m = badgeMeta(b);
    return /*#__PURE__*/React.createElement("div", {
      key: b.id,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '16px 12px',
        borderRadius: 14,
        border: '1px solid var(--border)',
        background: 'var(--paper-soft)'
      }
    }, /*#__PURE__*/React.createElement(SeasonBadge, {
      b: b,
      size: 48
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 700,
        color: 'var(--ink)',
        marginTop: 10
      }
    }, b.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-faint)',
        marginTop: 2
      }
    }, m.kindLabel, " \xB7 ", b.period), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 9,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--verified-teal)'
      }
    }, "+", m.xp, " XP"));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      padding: '14px 15px',
      borderRadius: 14,
      background: 'var(--bone)',
      display: 'flex',
      gap: 11
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.info,
    size: 17,
    style: {
      color: 'var(--ink-mute)',
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-soft)',
      lineHeight: 1.55
    }
  }, "Badges are earned when a weekly or monthly league ends. The top 3 take gold, silver & bronze; everyone in the top 10 earns a finalist badge. Standings reset each cycle \u2014 your badges are permanent.")))));
}

// Scrollable filter chip used in the leaderboard sub-filter
function FilterChip({
  active,
  color,
  icon,
  onClick,
  children
}) {
  const c = color || 'var(--ink)';
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      flexShrink: 0,
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      padding: icon ? '7px 12px 7px 10px' : '7px 14px',
      borderRadius: 999,
      fontSize: 12.5,
      fontWeight: 600,
      border: `1px solid ${active ? c : 'var(--border)'}`,
      background: active ? c : 'var(--paper)',
      color: active ? 'var(--paper)' : 'var(--ink-mute)'
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex'
    }
  }, icon), children);
}
Object.assign(window, {
  TierBadge,
  SeasonBadge,
  BadgeShelf,
  ArchetypeChip,
  FilterChip,
  RewardCard,
  EarnRow,
  RewardsView,
  LeaderboardView,
  BadgesView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/Rewards.jsx", error: String((e && e.message) || e) }); }

// app/data.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// CollectorHub — mock data, aligned to BRD v1.2 §8.1 data model
// Core objects: Item · Listing · Post · Deal
// Globals exported to window at bottom.
// ─────────────────────────────────────────────────────────────

// ── Phase-1 categories (BRD §6.1) ─────────────────────────────
const CATEGORIES = [{
  id: 'figures',
  label: 'Action Figures',
  short: 'Action Figures'
}, {
  id: 'designer',
  label: 'Designer Toys & Blind Boxes',
  short: 'Designer Toys'
}, {
  id: 'kits',
  label: 'Model Kits & Lego',
  short: 'Model Kits'
}, {
  id: 'diecast',
  label: 'Diecast',
  short: 'Diecast'
}];

// ── Users + transaction-linked trust signals (BRD §8.2) ───────
// tier: derived from completed deals + vouches received (no star ratings)
const USERS = {
  aman_toys: {
    handle: 'aman_toys',
    name: 'Aman Iyer',
    city: 'Mumbai',
    joined: "Jan '24",
    color: 'var(--plum)',
    bio: 'Hot Toys obsessive · 1/6 only · in-hand or PO',
    deals: 38,
    response: '~15 min',
    activeListings: 4,
    vouchesReceived: 31,
    vouchesGiven: 12,
    xp: 6850,
    xpWeek: 320,
    xpMonth: 1180,
    contrib: {
      posts: 3100,
      social: 1900,
      collection: 1200,
      market: 650
    },
    seasonBadges: [{
      id: 'aman-may-posts',
      period: 'May',
      kind: 'posts',
      place: 1,
      tier: 'gold',
      title: 'Top Showcaser'
    }, {
      id: 'aman-apr-wk',
      period: 'Apr',
      kind: 'weekly',
      place: 2,
      tier: 'silver',
      title: '#2 · Weekly'
    }],
    followers: 1284,
    following: 312,
    tier: 'Trusted',
    portfolio: 842300,
    verifiedItems: 71,
    interests: ['figures', 'designer']
  },
  rohit_scale: {
    handle: 'rohit.scale',
    name: 'Rohit Menon',
    city: 'Bangalore',
    joined: "Oct '23",
    color: 'var(--stamp-red)',
    bio: 'Anime PVCs · diecast · founder, Indian Toy Maniacs',
    deals: 84,
    response: '~5 min',
    activeListings: 7,
    vouchesReceived: 76,
    vouchesGiven: 24,
    xp: 12420,
    xpWeek: 540,
    xpMonth: 2090,
    contrib: {
      market: 6200,
      social: 3200,
      posts: 2100,
      collection: 920
    },
    seasonBadges: [{
      id: 'vik-may-mo',
      period: 'May',
      kind: 'monthly',
      place: 1,
      tier: 'gold',
      title: '#1 · Monthly'
    }, {
      id: 'vik-may-mkt',
      period: 'May',
      kind: 'market',
      place: 1,
      tier: 'gold',
      title: 'Top Trader'
    }, {
      id: 'vik-apr-mo',
      period: 'Apr',
      kind: 'monthly',
      place: 1,
      tier: 'gold',
      title: '#1 · Monthly'
    }],
    followers: 4102,
    following: 208,
    tier: 'Top Seller',
    portfolio: 1842900,
    verifiedItems: 188,
    interests: ['figures', 'diecast']
  },
  saanvi: {
    handle: 'saanvi.diorama',
    name: 'Saanvi K',
    city: 'Bangalore',
    joined: "Mar '24",
    color: 'var(--verified-teal)',
    bio: 'Lego diorama maker · 18+ kits only',
    deals: 14,
    response: '~1 hr',
    activeListings: 2,
    vouchesReceived: 13,
    vouchesGiven: 9,
    xp: 1580,
    xpWeek: 240,
    xpMonth: 690,
    contrib: {
      posts: 800,
      collection: 500,
      social: 200,
      market: 80
    },
    seasonBadges: [{
      id: 'saanvi-may-wk',
      period: 'May',
      kind: 'weekly',
      place: 'top10',
      tier: 'finalist',
      title: 'Weekly Top 10'
    }],
    followers: 612,
    following: 145,
    tier: 'Verified',
    portfolio: 396000,
    verifiedItems: 39,
    interests: ['kits']
  },
  karan_die: {
    handle: 'karan_die',
    name: 'Karan Bhatia',
    city: 'Delhi',
    joined: "Jun '24",
    color: 'var(--grail-gold)',
    bio: 'Tomica · Hot Wheels · 1/64 forever',
    deals: 19,
    response: '~30 min',
    activeListings: 5,
    vouchesReceived: 16,
    vouchesGiven: 7,
    xp: 2310,
    xpWeek: 150,
    xpMonth: 540,
    contrib: {
      market: 1100,
      social: 600,
      collection: 400,
      posts: 210
    },
    seasonBadges: [{
      id: 'karan-may-mkt',
      period: 'May',
      kind: 'market',
      place: 3,
      tier: 'bronze',
      title: '#3 · Trader'
    }],
    followers: 489,
    following: 271,
    tier: 'Verified',
    portfolio: 184000,
    verifiedItems: 54,
    interests: ['diecast']
  },
  meera: {
    handle: 'meera.figs',
    name: 'Meera Pillai',
    city: 'Chennai',
    joined: "Feb '24",
    color: 'var(--forest)',
    bio: 'Bandai SH Figuarts · MISB collector',
    deals: 28,
    response: '~20 min',
    activeListings: 3,
    vouchesReceived: 24,
    vouchesGiven: 11,
    xp: 5120,
    xpWeek: 410,
    xpMonth: 1320,
    contrib: {
      social: 2600,
      posts: 1300,
      collection: 800,
      market: 420
    },
    seasonBadges: [{
      id: 'meera-may-social',
      period: 'May',
      kind: 'social',
      place: 1,
      tier: 'gold',
      title: 'Top Connector'
    }, {
      id: 'meera-apr-mo',
      period: 'Apr',
      kind: 'monthly',
      place: 3,
      tier: 'bronze',
      title: '#3 · Monthly'
    }],
    followers: 903,
    following: 198,
    tier: 'Trusted',
    portfolio: 612000,
    verifiedItems: 120,
    interests: ['figures']
  },
  vikram: {
    handle: 'vikram.toys',
    name: 'Vikram S',
    city: 'Pune',
    joined: "Sep '23",
    color: 'var(--stamp-red)',
    bio: 'Sideshow · Premium Format · grail hunter',
    deals: 67,
    response: '~10 min',
    activeListings: 6,
    vouchesReceived: 61,
    vouchesGiven: 19,
    xp: 9240,
    xpWeek: 290,
    xpMonth: 1460,
    contrib: {
      collection: 4800,
      market: 2600,
      posts: 1100,
      social: 740
    },
    seasonBadges: [{
      id: 'rohit-may-coll',
      period: 'May',
      kind: 'collection',
      place: 1,
      tier: 'gold',
      title: 'Top Archivist'
    }, {
      id: 'rohit-may-mo',
      period: 'May',
      kind: 'monthly',
      place: 2,
      tier: 'silver',
      title: '#2 · Monthly'
    }, {
      id: 'rohit-mar-coll',
      period: 'Mar',
      kind: 'collection',
      place: 1,
      tier: 'gold',
      title: 'Top Archivist'
    }],
    followers: 2210,
    following: 176,
    tier: 'Top Seller',
    portfolio: 1450000,
    verifiedItems: 165,
    interests: ['figures']
  }
};

// ── Catalogue (BRD §8.3 / §9.4) — what search & scan resolve to ─
const CATALOGUE = [{
  sku: 'MMS601',
  title: 'Hot Toys MMS601 · Iron Man Mark 85',
  brand: 'Hot Toys',
  cat: 'figures',
  scale: '1/6',
  year: '2022',
  tone: 'red',
  est: 21000
}, {
  sku: '10307',
  title: 'LEGO 10307 · Eiffel Tower',
  brand: 'LEGO',
  cat: 'kits',
  scale: '1:300',
  year: '2023',
  tone: 'gold',
  est: 52000
}, {
  sku: 'SHF-GUI',
  title: 'Bandai Goku Ultra Instinct · SH Figuarts',
  brand: 'Bandai',
  cat: 'figures',
  scale: '1/12',
  year: '2025',
  tone: 'gold',
  est: 6800
}, {
  sku: 'TL-R34',
  title: 'Tomica Limited · Skyline GT-R R34',
  brand: 'Tomica',
  cat: 'diecast',
  scale: '1/64',
  year: '2021',
  tone: 'teal',
  est: 5200
}, {
  sku: 'SP-TMWYW',
  title: 'Pop Mart · Skullpanda · Tell Me What You Want',
  brand: 'Pop Mart',
  cat: 'designer',
  scale: '—',
  year: '2024',
  tone: 'plum',
  est: 11000
}, {
  sku: 'SS-PF-BM',
  title: 'Sideshow Premium Format · Batman',
  brand: 'Sideshow',
  cat: 'figures',
  scale: '1/4',
  year: '2018',
  tone: 'ink',
  est: 165000
}, {
  sku: 'MG-RX78',
  title: 'Bandai MG RX-78-2 Gundam Ver.Ka',
  brand: 'Bandai',
  cat: 'kits',
  scale: '1/100',
  year: '2020',
  tone: 'forest',
  est: 4800
}, {
  sku: 'MINIGT-R35',
  title: 'Mini GT · Nissan GT-R R35 Nismo',
  brand: 'Mini GT',
  cat: 'diecast',
  scale: '1/64',
  year: '2023',
  tone: 'teal',
  est: 2400
}];

// ── Seed marketplace listings (BRD §9.8) ─────────────────────
// IMPORTANT: these use the SAME shape as a user-created listing from
// Add an item → "List for sale" — only fields captured in that form.
// No retail/MRP, watcher counts, quantity, or invented copy.
const MARKET_SEED = [{
  id: 's1',
  seller: 'aman_toys',
  posted: '3h',
  mine: false,
  title: 'Hot Toys Iron Man Mark 85 — Endgame',
  brand: 'Hot Toys',
  cat: 'figures',
  tone: 'red',
  photos: ['red', 'ink', 'gold'],
  photoCount: 3,
  scale: '1/6',
  year: '2022',
  desc: 'US import, single owner, never displayed. Comes with the original brown shipper. Magnets all good.',
  price: 18400,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Outer sleeve has light shelf wear, inner box mint.',
  acq: 'inhand',
  trade: true,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's2',
  seller: 'meera',
  posted: '5h',
  mine: false,
  title: 'Bandai Goku Ultra Instinct — S.H.Figuarts',
  brand: 'Bandai',
  cat: 'figures',
  tone: 'gold',
  photos: ['gold', 'teal'],
  photoCount: 2,
  scale: '1/12',
  year: '2025',
  desc: 'BNIB, just arrived. No KOs ever — sealed from the Friday drop.',
  price: 6499,
  sym: '₹',
  currency: 'INR',
  condition: 'MIB',
  condNote: 'Blister sealed, box corners crisp.',
  acq: 'inhand',
  trade: false,
  shipIncl: true,
  returns: false,
  status: 'available',
  verify: 'shown'
}, {
  id: 's3',
  seller: 'vikram',
  posted: '1d',
  mine: false,
  title: 'Sideshow Premium Format — Batman',
  brand: 'Sideshow',
  cat: 'figures',
  tone: 'ink',
  photos: ['ink', 'plum', 'red', 'gold'],
  photoCount: 4,
  scale: '1/4',
  year: '2018',
  desc: 'Single-owner from launch. Never displayed. Numbered /1000, low number. Trades considered for Sideshow Joker or Spider-Man PF.',
  price: 142000,
  sym: '₹',
  currency: 'INR',
  condition: 'BIB',
  condNote: 'Double-boxed with original shipper kept.',
  acq: 'inhand',
  trade: true,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's4',
  seller: 'karan_die',
  posted: '6h',
  mine: false,
  title: 'Tomica Limited Vintage — Skyline GT-R R34',
  brand: 'Tomica',
  cat: 'diecast',
  tone: 'teal',
  photos: ['teal', 'ink'],
  photoCount: 2,
  scale: '1/64',
  year: '2021',
  desc: 'From the Limited Vintage Neo line. Have two, letting one go.',
  price: 4200,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Blister sealed, never opened.',
  acq: 'inhand',
  trade: true,
  shipIncl: false,
  returns: true,
  status: 'available',
  verify: 'verified'
}, {
  id: 's5',
  seller: 'saanvi',
  posted: '8h',
  mine: false,
  title: 'LEGO Icons Eiffel Tower 10307',
  brand: 'LEGO',
  cat: 'kits',
  tone: 'gold',
  photos: ['gold', 'forest'],
  photoCount: 2,
  scale: '—',
  year: '2023',
  desc: 'Box mint, shipper unopened. Pre-ordered through Bangalore distributor.',
  price: 49999,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Factory sealed, no shelf wear.',
  acq: 'inhand',
  trade: false,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's6',
  seller: 'rohit_scale',
  posted: '2h',
  mine: false,
  title: 'Pop Mart Skullpanda — Tell Me What You Want',
  brand: 'Pop Mart',
  cat: 'designer',
  tone: 'plum',
  photos: ['plum'],
  photoCount: 1,
  scale: '—',
  year: '2024',
  desc: 'Full sealed case, 12 figures. Chase odds 1/72. Not splitting.',
  price: 9600,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Sealed case, untouched.',
  acq: 'inhand',
  trade: false,
  shipIncl: true,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's7',
  seller: 'meera',
  posted: '1d',
  mine: false,
  title: 'Threezero MDLX Spider-Man — Pre-order slot',
  brand: 'Threezero',
  cat: 'figures',
  tone: 'red',
  photos: ['red', 'ink'],
  photoCount: 2,
  scale: '1/12',
  year: '2026',
  desc: 'Transferring my pre-order slot at cost. Will arrive sealed to your address from the distributor.',
  price: 7800,
  sym: '₹',
  currency: 'INR',
  condition: 'Pre-order',
  condNote: '',
  acq: 'preorder',
  poDate: '2026-02-15',
  poSeller: 'BBToyStore',
  trade: false,
  shipIncl: true,
  returns: false,
  status: 'available',
  verify: 'claimed'
},
// ── aman_toys additional listings ──
{
  id: 's8',
  seller: 'aman_toys',
  posted: '1d',
  mine: false,
  title: 'Hot Toys Captain America — Endgame',
  brand: 'Hot Toys',
  cat: 'figures',
  tone: 'teal',
  photos: ['teal', 'ink', 'gold'],
  photoCount: 3,
  scale: '1/6',
  year: '2021',
  desc: 'US import, single owner. Perfect tampos, helmet swaps all work. Blue shipper intact.',
  price: 16800,
  sym: '₹',
  currency: 'INR',
  condition: 'MIB',
  condNote: 'Box crisp, all accessories bagged.',
  acq: 'inhand',
  trade: true,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's9',
  seller: 'aman_toys',
  posted: '4d',
  mine: false,
  title: 'Hot Toys Black Widow — Endgame',
  brand: 'Hot Toys',
  cat: 'figures',
  tone: 'ink',
  photos: ['ink', 'plum'],
  photoCount: 2,
  scale: '1/6',
  year: '2022',
  desc: "MISB. All widow's bites included. Letting go to fund next grail.",
  price: 13500,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Outer sleeve pristine.',
  acq: 'inhand',
  trade: false,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's10',
  seller: 'aman_toys',
  posted: '6h',
  mine: false,
  title: 'Hot Toys Thor — Love & Thunder PO slot',
  brand: 'Hot Toys',
  cat: 'figures',
  tone: 'gold',
  photos: ['gold'],
  photoCount: 1,
  scale: '1/6',
  year: '2026',
  desc: 'Transferring PO slot at cost. Ships direct from US distributor to you.',
  price: 22000,
  sym: '₹',
  currency: 'INR',
  condition: 'Pre-order',
  condNote: '',
  acq: 'preorder',
  poDate: '2025-11-10',
  poSeller: 'Sideshow',
  trade: false,
  shipIncl: true,
  returns: false,
  status: 'available',
  verify: 'claimed'
}, {
  id: 's11',
  seller: 'aman_toys',
  posted: '2d',
  mine: false,
  title: 'Hot Toys Thanos — Infinity War',
  brand: 'Hot Toys',
  cat: 'figures',
  tone: 'plum',
  photos: ['plum', 'ink', 'gold'],
  photoCount: 3,
  scale: '1/6',
  year: '2020',
  desc: 'Complete with all 6 Infinity Stone props. Single owner. Gauntlet magnets perfect.',
  price: 24000,
  sym: '₹',
  currency: 'INR',
  condition: 'BIB',
  condNote: 'Box excellent, inner foam perfect.',
  acq: 'inhand',
  trade: true,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
},
// ── rohit_scale additional listings ──
{
  id: 's12',
  seller: 'rohit_scale',
  posted: '2d',
  mine: false,
  title: 'S.H.Figuarts Vegeta Super Saiyan Blue',
  brand: 'Bandai',
  cat: 'figures',
  tone: 'teal',
  photos: ['teal', 'ink'],
  photoCount: 2,
  scale: '1/12',
  year: '2024',
  desc: 'Web exclusive, BNIB. Effect parts all bagged. One of the best Vegeta releases.',
  price: 7400,
  sym: '₹',
  currency: 'INR',
  condition: 'MIB',
  condNote: 'Sealed inner box, blister untouched.',
  acq: 'inhand',
  trade: false,
  shipIncl: true,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's13',
  seller: 'rohit_scale',
  posted: '12h',
  mine: false,
  title: 'Mini GT Nissan Skyline GT-R R32 — Group A',
  brand: 'Mini GT',
  cat: 'diecast',
  tone: 'ink',
  photos: ['ink', 'teal'],
  photoCount: 2,
  scale: '1/64',
  year: '2023',
  desc: 'Sealed blister. Group A livery, one of the best Mini GT releases this year.',
  price: 2100,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Blister unopened.',
  acq: 'inhand',
  trade: true,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's14',
  seller: 'rohit_scale',
  posted: '3d',
  mine: false,
  title: 'S.H.Figuarts Naruto Sage Mode — PO slot',
  brand: 'Bandai',
  cat: 'figures',
  tone: 'gold',
  photos: ['gold'],
  photoCount: 1,
  scale: '1/12',
  year: '2026',
  desc: 'Pre-order slot from Japanese distributor. Transferring at cost + fees.',
  price: 6200,
  sym: '₹',
  currency: 'INR',
  condition: 'Pre-order',
  condNote: '',
  acq: 'preorder',
  poDate: '2026-03-01',
  poSeller: 'AmiAmi',
  trade: false,
  shipIncl: true,
  returns: false,
  status: 'available',
  verify: 'claimed'
}, {
  id: 's15',
  seller: 'rohit_scale',
  posted: '5h',
  mine: false,
  title: 'Pop Mart Labubu — The Monsters Series 2',
  brand: 'Pop Mart',
  cat: 'designer',
  tone: 'plum',
  photos: ['plum', 'red'],
  photoCount: 2,
  scale: '—',
  year: '2025',
  desc: 'Single blind box, sealed. Letting go at a fair price.',
  price: 1200,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Blind box sealed.',
  acq: 'inhand',
  trade: false,
  shipIncl: true,
  returns: false,
  status: 'available',
  verify: 'shown'
},
// ── vikram additional listings ──
{
  id: 's16',
  seller: 'vikram',
  posted: '3d',
  mine: false,
  title: 'Sideshow Spider-Man Premium Format',
  brand: 'Sideshow',
  cat: 'figures',
  tone: 'red',
  photos: ['red', 'ink', 'teal'],
  photoCount: 3,
  scale: '1/4',
  year: '2017',
  desc: 'Numbered, excellent provenance. Light shelf time, never unboxed for display. Shippers intact.',
  price: 118000,
  sym: '₹',
  currency: 'INR',
  condition: 'BIB',
  condNote: 'Both boxes, foam perfect.',
  acq: 'inhand',
  trade: true,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's17',
  seller: 'vikram',
  posted: '1d',
  mine: false,
  title: 'Hot Toys War Machine — Endgame',
  brand: 'Hot Toys',
  cat: 'figures',
  tone: 'ink',
  photos: ['ink', 'gold'],
  photoCount: 2,
  scale: '1/6',
  year: '2021',
  desc: 'Complete. All weapons accessories bagged. Single display — bought for display shelf only.',
  price: 17500,
  sym: '₹',
  currency: 'INR',
  condition: 'MIB',
  condNote: 'Box near mint.',
  acq: 'inhand',
  trade: true,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's18',
  seller: 'vikram',
  posted: '7h',
  mine: false,
  title: 'XM Studios Cyclops — PO slot',
  brand: 'XM Studios',
  cat: 'figures',
  tone: 'gold',
  photos: ['gold'],
  photoCount: 1,
  scale: '1/4',
  year: '2026',
  desc: 'Slot from SG distributor. Low number allocation. Transferring at cost.',
  price: 98000,
  sym: '₹',
  currency: 'INR',
  condition: 'Pre-order',
  condNote: '',
  acq: 'preorder',
  poDate: '2026-01-15',
  poSeller: 'XM Studios SG',
  trade: false,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'claimed'
}, {
  id: 's19',
  seller: 'vikram',
  posted: '4d',
  mine: false,
  title: 'Sideshow Black Panther Premium Format',
  brand: 'Sideshow',
  cat: 'figures',
  tone: 'ink',
  photos: ['ink', 'plum'],
  photoCount: 2,
  scale: '1/4',
  year: '2019',
  desc: 'EX version with interchangeable chest piece. Both shippers, numbered.',
  price: 88000,
  sym: '₹',
  currency: 'INR',
  condition: 'BIB',
  condNote: 'Double-boxed, mint inside.',
  acq: 'inhand',
  trade: true,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
},
// ── meera additional listings ──
{
  id: 's20',
  seller: 'meera',
  posted: '1d',
  mine: false,
  title: 'S.H.Figuarts Goku Black — Rose',
  brand: 'Bandai',
  cat: 'figures',
  tone: 'plum',
  photos: ['plum', 'ink'],
  photoCount: 2,
  scale: '1/12',
  year: '2023',
  desc: 'Web exclusive. Blister sealed, never opened. One of the best DBS Figuarts.',
  price: 8100,
  sym: '₹',
  currency: 'INR',
  condition: 'MIB',
  condNote: 'Blister untouched.',
  acq: 'inhand',
  trade: false,
  shipIncl: true,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's21',
  seller: 'meera',
  posted: '6h',
  mine: false,
  title: 'S.H.Figuarts Android 18 — Dragon Ball Super',
  brand: 'Bandai',
  cat: 'figures',
  tone: 'teal',
  photos: ['teal'],
  photoCount: 1,
  scale: '1/12',
  year: '2024',
  desc: 'BNIB. Sealed from tamashii nations web shop. Effect parts all in.',
  price: 6900,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Outer blister sealed.',
  acq: 'inhand',
  trade: false,
  shipIncl: true,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's22',
  seller: 'meera',
  posted: '3d',
  mine: false,
  title: 'S.H.Figuarts Kefla — PO slot',
  brand: 'Bandai',
  cat: 'figures',
  tone: 'forest',
  photos: ['forest'],
  photoCount: 1,
  scale: '1/12',
  year: '2026',
  desc: 'Tamashii Web Exclusive PO. Transferring at cost + Yahoo Japan fees.',
  price: 7800,
  sym: '₹',
  currency: 'INR',
  condition: 'Pre-order',
  condNote: '',
  acq: 'preorder',
  poDate: '2026-04-20',
  poSeller: 'Tamashii Web',
  trade: false,
  shipIncl: true,
  returns: false,
  status: 'available',
  verify: 'claimed'
}, {
  id: 's23',
  seller: 'meera',
  posted: '2d',
  mine: false,
  title: 'Bandai DX Chogokin RX-78-2 — Final Battle',
  brand: 'Bandai',
  cat: 'figures',
  tone: 'red',
  photos: ['red', 'gold', 'ink'],
  photoCount: 3,
  scale: '1/144',
  year: '2022',
  desc: 'Complete set. All beam parts, shield, sabre. Die-cast weight is unreal. Letting go for space.',
  price: 14500,
  sym: '₹',
  currency: 'INR',
  condition: 'BIB',
  condNote: 'Box has light wear, inside perfect.',
  acq: 'inhand',
  trade: true,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
},
// ── saanvi additional listings ──
{
  id: 's24',
  seller: 'saanvi',
  posted: '2d',
  mine: false,
  title: 'LEGO Titanic 10294',
  brand: 'LEGO',
  cat: 'kits',
  tone: 'ink',
  photos: ['ink', 'teal'],
  photoCount: 2,
  scale: '—',
  year: '2021',
  desc: '9090 pieces. Factory sealed, original receipt available. Stored flat.',
  price: 59999,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Factory sealed.',
  acq: 'inhand',
  trade: false,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's25',
  seller: 'saanvi',
  posted: '4h',
  mine: false,
  title: 'LEGO Icons Botanicals Orchid 10311',
  brand: 'LEGO',
  cat: 'kits',
  tone: 'forest',
  photos: ['forest'],
  photoCount: 1,
  scale: '—',
  year: '2023',
  desc: 'Sealed. Bought extra from LEGO store, letting one go.',
  price: 3999,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Mint box.',
  acq: 'inhand',
  trade: false,
  shipIncl: true,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's26',
  seller: 'saanvi',
  posted: '6d',
  mine: false,
  title: 'LEGO Rivendell 10316 — PO slot',
  brand: 'LEGO',
  cat: 'kits',
  tone: 'gold',
  photos: ['gold'],
  photoCount: 1,
  scale: '—',
  year: '2026',
  desc: 'Pre-ordered via LEGO India. Transferring at MRP. Will ship sealed direct.',
  price: 39999,
  sym: '₹',
  currency: 'INR',
  condition: 'Pre-order',
  condNote: '',
  acq: 'preorder',
  poDate: '2026-02-01',
  poSeller: 'LEGO India',
  trade: false,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'claimed'
}, {
  id: 's27',
  seller: 'saanvi',
  posted: '1d',
  mine: false,
  title: 'LEGO Technic Bugatti Bolide 42151',
  brand: 'LEGO',
  cat: 'kits',
  tone: 'teal',
  photos: ['teal', 'ink'],
  photoCount: 2,
  scale: '—',
  year: '2023',
  desc: 'MISB. Impulse buy, lifestyle changed — letting go.',
  price: 8999,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Box mint.',
  acq: 'inhand',
  trade: false,
  shipIncl: true,
  returns: false,
  status: 'available',
  verify: 'shown'
},
// ── karan_die additional listings ──
{
  id: 's28',
  seller: 'karan_die',
  posted: '1d',
  mine: false,
  title: 'Mini GT Mitsubishi Lancer Evo X — WRC',
  brand: 'Mini GT',
  cat: 'diecast',
  tone: 'red',
  photos: ['red', 'ink'],
  photoCount: 2,
  scale: '1/64',
  year: '2022',
  desc: 'Sealed blister. WRC livery. One of my doubles — letting go.',
  price: 1800,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Blister sealed.',
  acq: 'inhand',
  trade: true,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's29',
  seller: 'karan_die',
  posted: '3h',
  mine: false,
  title: 'Hot Wheels RLC — Porsche 917 LH',
  brand: 'Hot Wheels',
  cat: 'diecast',
  tone: 'gold',
  photos: ['gold'],
  photoCount: 1,
  scale: '1/64',
  year: '2024',
  desc: "RLC exclusive. Sealed card. Didn't double-dip on this livery — letting go.",
  price: 3800,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Card sealed.',
  acq: 'inhand',
  trade: false,
  shipIncl: true,
  returns: false,
  status: 'available',
  verify: 'verified'
}, {
  id: 's30',
  seller: 'karan_die',
  posted: '5d',
  mine: false,
  title: 'Inno64 Honda Civic EK9 Type R — Championship White',
  brand: 'Inno64',
  cat: 'diecast',
  tone: 'ink',
  photos: ['ink', 'teal'],
  photoCount: 2,
  scale: '1/64',
  year: '2023',
  desc: 'Hard to find. Sealed. Accurate tampos, opening bonnet.',
  price: 2600,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Blister sealed.',
  acq: 'inhand',
  trade: true,
  shipIncl: false,
  returns: true,
  status: 'available',
  verify: 'verified'
}, {
  id: 's31',
  seller: 'karan_die',
  posted: '2d',
  mine: false,
  title: 'Mini GT Full Case — Honda NSX NA1 (12 pcs)',
  brand: 'Mini GT',
  cat: 'diecast',
  tone: 'teal',
  photos: ['teal', 'ink', 'gold'],
  photoCount: 3,
  scale: '1/64',
  year: '2024',
  desc: 'Sealed case, 12 units. 3 livery variants, chase possible. Not splitting.',
  price: 21600,
  sym: '₹',
  currency: 'INR',
  condition: 'Sealed',
  condNote: 'Sealed factory case.',
  acq: 'inhand',
  trade: false,
  shipIncl: false,
  returns: false,
  status: 'available',
  verify: 'verified'
}];

// ── My collection — Items (BRD §8.1, v2) ─────────────────────
// status: owned | wishlist | preorder ; verify: claimed | shown | verified
const MY_ITEMS = [{
  id: 'i1',
  sku: 'MMS601',
  status: 'owned',
  verify: 'verified',
  value: 21000,
  listed: false,
  photos: 3
}, {
  id: 'i2',
  sku: 'MG-RX78',
  status: 'owned',
  verify: 'verified',
  value: 4800,
  listed: true,
  photos: 2
}, {
  id: 'i3',
  sku: 'TL-R34',
  status: 'owned',
  verify: 'shown',
  value: 5200,
  listed: false,
  photos: 1
}, {
  id: 'i4',
  sku: 'SS-PF-BM',
  status: 'owned',
  verify: 'claimed',
  value: 165000,
  listed: false,
  photos: 0
}, {
  id: 'i5',
  sku: 'SHF-GUI',
  status: 'preorder',
  verify: 'claimed',
  value: 6800,
  listed: false,
  photos: 0,
  order: 'Ordered 12 May',
  eta: 'Ships ~ 20 Jun',
  etaMonth: 5,
  etaYear: 2026
}, {
  id: 'i6',
  sku: 'MG-RX78',
  status: 'preorder',
  verify: 'claimed',
  value: 4800,
  listed: false,
  photos: 0,
  order: 'Ordered 2 Jun',
  eta: 'Ships ~ 28 Jun',
  etaMonth: 5,
  etaYear: 2026
}, {
  id: 'i7',
  sku: 'SS-PF-BM',
  status: 'preorder',
  verify: 'claimed',
  value: 165000,
  listed: false,
  photos: 0,
  order: 'Ordered 9 Jun',
  eta: 'Ships ~ Sep',
  etaMonth: 8,
  etaYear: 2026
}, {
  id: 'w1',
  sku: 'SP-TMWYW',
  status: 'wishlist',
  verify: 'claimed',
  value: 11000,
  listed: false,
  photos: 0,
  alert: true
}, {
  id: 'w2',
  sku: '10307',
  status: 'wishlist',
  verify: 'claimed',
  value: 52000,
  listed: false,
  photos: 0,
  alert: true
}];

// ── Listings (BRD §8.6) — derived from an owned Item ──────────
// status: available | reserved | sold
const LISTINGS = [{
  id: 'mms601',
  sku: 'MMS601',
  seller: 'aman_toys',
  price: 18400,
  retail: 22000,
  condition: 'MISB · sealed · plastic intact',
  verify: 'verified',
  status: 'available',
  trade: true,
  qty: 1,
  ships: 'Mumbai · pan-India · ₹350',
  photos: 6,
  posted: '3h',
  notes: "US import, single owner, never displayed. Comes with the original brown shipper. Plastic is intact, magnets all good. Trades considered for grail Sideshow pieces — DM if interested.",
  saves: 24,
  watching: 11
}, {
  id: 'lego10307',
  sku: '10307',
  seller: 'saanvi',
  price: 49999,
  retail: 54999,
  condition: 'MISB · factory sealed',
  verify: 'verified',
  status: 'available',
  trade: false,
  qty: 1,
  ships: 'Bangalore · pan-India · ₹600',
  photos: 4,
  posted: '8h',
  notes: "Pre-ordered through Bangalore distributor. Ships first week of June. Box mint, shipper unopened.",
  saves: 87,
  watching: 34
}, {
  id: 'goku-ui',
  sku: 'SHF-GUI',
  seller: 'meera',
  price: 6499,
  retail: 6999,
  condition: 'BNIB · ordered, not yet shipped',
  verify: 'shown',
  status: 'available',
  trade: false,
  qty: 1,
  ships: 'Chennai · pan-India · ₹250',
  photos: 2,
  posted: '5h',
  notes: "Bangalore drop, Friday 6pm IST. One PO slot, willing to transfer at MRP + transfer fee. No KOs ever.",
  saves: 142,
  watching: 56
}, {
  id: 'tomica-r34',
  sku: 'TL-R34',
  seller: 'karan_die',
  price: 4200,
  retail: 5500,
  condition: 'MISB · sealed blister',
  verify: 'verified',
  status: 'available',
  trade: true,
  qty: 1,
  ships: 'Delhi · pan-India · ₹150',
  photos: 3,
  posted: '6h',
  notes: "From the Limited Vintage Neo line. Blister sealed. Have two, letting one go.",
  saves: 32,
  watching: 9
}, {
  id: 'popmart-skull',
  sku: 'SP-TMWYW',
  seller: 'aman_toys',
  price: 9600,
  retail: 12000,
  condition: 'Sealed case · 12 figures',
  verify: 'verified',
  status: 'reserved',
  trade: false,
  qty: 1,
  ships: 'Mumbai · pan-India · ₹400',
  photos: 5,
  posted: '12h',
  notes: "Full sealed case. Chase odds are 1/72. Not splitting.",
  saves: 56,
  watching: 22
}, {
  id: 'sideshow-batman',
  sku: 'SS-PF-BM',
  seller: 'vikram',
  price: 142000,
  retail: 165000,
  condition: 'MISB · double-boxed · original shipper',
  verify: 'verified',
  status: 'available',
  trade: true,
  qty: 1,
  ships: 'Pune · pan-India · pickup recommended',
  photos: 8,
  posted: '1d',
  notes: "Single-owner from launch. Never displayed. Numbered /1000, low number. Trades considered for Sideshow Joker or Spider-Man PF.",
  saves: 412,
  watching: 168
}, {
  id: 'minigt-r35',
  sku: 'MINIGT-R35',
  seller: 'karan_die',
  price: 1900,
  retail: 2400,
  condition: 'MISB · sealed',
  verify: 'verified',
  status: 'available',
  trade: false,
  qty: 2,
  ships: 'Delhi · pan-India · ₹150',
  photos: 2,
  posted: '2h',
  notes: "Nismo livery, sealed. Wishlist match for a few of you — letting two go at a fair price.",
  saves: 18,
  watching: 7
}];

// ── Posts (BRD §8.5) — type: showcase | discussion | review ───
const POSTS = [{
  id: 'p0',
  type: 'showcase',
  user: 'you',
  time: 'just now',
  community: 'itm',
  refSku: 'MMS601',
  tone: 'red',
  cat: 'figures',
  body: "Finally unboxed the Hot Toys Mark 85 — the detail on the nano-particles is unreal. Worth every rupee. 🔥",
  likes: 0,
  comments: 0,
  image: true
}, {
  id: 'p1',
  type: 'showcase',
  user: 'rohit_scale',
  time: '5h',
  community: 'itm',
  refSku: 'SHF-GUI',
  tone: 'gold',
  cat: 'figures',
  body: "Got my hands on the Bandai Goku UI today. PVC is heavier than I expected — the box still smells like fresh tampo print. Display shot for the shelf. 🔧",
  likes: 84,
  comments: 23,
  image: true
}, {
  id: 'p2',
  type: 'discussion',
  user: 'vikram',
  time: '1d',
  community: 'grails',
  cat: 'figures',
  body: "PSA: there's a new Sideshow Joker recast hitting the markets — telltale is the cape stitching pattern. Always ask for an in-hand video before paying. Stay safe out there.",
  likes: 256,
  comments: 67,
  image: false
}, {
  id: 'p3',
  type: 'review',
  user: 'saanvi',
  time: '2d',
  community: 'lego',
  refSku: '10307',
  tone: 'gold',
  cat: 'kits',
  rating: 4,
  body: "Finished the 10307 Eiffel Tower over the weekend — 10,001 pieces, took me three sittings. Repetition in the lattice is real but the final reveal is worth it. Build quality 4/5.",
  likes: 198,
  comments: 41,
  image: true
}, {
  id: 'p4',
  type: 'showcase',
  user: 'meera',
  time: '8h',
  community: 'itm',
  refSku: 'MMS601',
  tone: 'red',
  cat: 'figures',
  body: "Shelf reorg done. The Mark 85 finally has pride of place under the spotlight. In-hand and loving it.",
  likes: 121,
  comments: 18,
  image: true
}, {
  id: 'p5',
  type: 'poll',
  user: 'karan_die',
  time: '4h',
  community: 'jdm',
  cat: 'diecast',
  body: "Group order incoming — which Mini GT case should we pull next? Vote and I'll lock it Friday.",
  likes: 64,
  comments: 12,
  image: false,
  poll: [{
    label: 'Nissan GT-R R35 Nismo',
    votes: 41
  }, {
    label: 'Mazda RX-7 FD (Mazdaspeed)',
    votes: 33
  }, {
    label: 'Lancer Evo X',
    votes: 18
  }]
},
// ── itm posts ──────────────────────────────────────────────
{
  id: 'p6',
  type: 'showcase',
  user: 'aman_toys',
  time: '2h',
  community: 'itm',
  cat: 'figures',
  refSku: 'MMS601',
  tone: 'plum',
  body: "Finally completed the Avengers shelf — all 6 Hot Toys in one frame. Mark 85 anchors the centre. The only problem now is I want to add the War Machine and it won't fit.",
  likes: 214,
  comments: 38,
  image: true
}, {
  id: 'p7',
  type: 'discussion',
  user: 'vikram',
  time: '6h',
  community: 'itm',
  cat: 'figures',
  body: "For those new to 1/6 — start with Hot Toys Movie Masterpiece over Sideshow PF. The MMS line is more consistent QC and secondary market is stronger in India. Happy to answer questions.",
  likes: 142,
  comments: 54,
  image: false
}, {
  id: 'p8',
  type: 'review',
  user: 'meera',
  time: '1d',
  community: 'itm',
  cat: 'figures',
  refSku: 'SHF-GUI',
  tone: 'gold',
  rating: 5,
  body: "SHF Goku Ultra Instinct: the articulation is insane. Every pose I try it nails. The effect parts are translucent and catch the light perfectly. Best Figuarts release since SSGSS Vegeta.",
  likes: 189,
  comments: 31,
  image: true
}, {
  id: 'p9',
  type: 'showcase',
  user: 'rohit_scale',
  time: '3h',
  community: 'itm',
  cat: 'diecast',
  tone: 'teal',
  body: "Mini GT shelf update — 48 cars now. The R32 Group A is the newest addition and it might be my favourite in the collection. 1/64 scale but the detail is absurd.",
  likes: 96,
  comments: 22,
  image: true
}, {
  id: 'p10',
  type: 'discussion',
  user: 'karan_die',
  time: '8h',
  community: 'itm',
  cat: 'diecast',
  body: "Group order for the next Mini GT case closing Friday. We're splitting the NSX case — 4 members confirmed, need 2 more. Comment if you're in, DM for payment details.",
  likes: 67,
  comments: 18,
  image: false
}, {
  id: 'p11',
  type: 'showcase',
  user: 'vikram',
  time: '4d',
  community: 'itm',
  cat: 'figures',
  refSku: 'SS-PF-BM',
  tone: 'ink',
  body: "Sideshow Batman PF finally has a custom light rig. Added a warm amber backlight — completely changes the mood. 9 months of saving, zero regrets.",
  likes: 312,
  comments: 71,
  image: true
}, {
  id: 'p12',
  type: 'review',
  user: 'aman_toys',
  time: '2d',
  community: 'itm',
  cat: 'figures',
  tone: 'ink',
  rating: 4,
  body: "Hot Toys Black Widow Endgame — paint apps on the face are the best I've seen from HT this year. Only complaint: the widow's bites are a bit fiddly. 4/5 overall, strong buy.",
  likes: 134,
  comments: 29,
  image: true
}, {
  id: 'p13',
  type: 'discussion',
  user: 'meera',
  time: '5h',
  community: 'itm',
  cat: 'figures',
  body: "PSA on Tamashii Nations web exclusives: AmiAmi and HLJ are still the most reliable middlemen. TOM has faster shipping but charges a premium. Anyone using a newer agent? Curious.",
  likes: 88,
  comments: 43,
  image: false
}, {
  id: 'p14',
  type: 'showcase',
  user: 'saanvi',
  time: '1d',
  community: 'itm',
  cat: 'kits',
  tone: 'forest',
  body: "LEGO corner of the shelf got an upgrade — added the botanical collection. The Orchid is deceptively complex. Not a figure but it sparks the same joy.",
  likes: 74,
  comments: 16,
  image: true
}, {
  id: 'p15',
  type: 'discussion',
  user: 'rohit_scale',
  time: '3d',
  community: 'itm',
  cat: 'figures',
  body: "What's everyone using for display lighting? I've tried Govee, Philips Hue strips and the Elgato Key Light. Happy to share which worked best for different shelf depths.",
  likes: 156,
  comments: 62,
  image: false
},
// ── lego posts ──────────────────────────────────────────────
{
  id: 'p16',
  type: 'showcase',
  user: 'saanvi',
  time: '1d',
  community: 'lego',
  cat: 'kits',
  tone: 'ink',
  body: "LEGO Titanic done. 9090 pieces over 4 evenings. The split hull is such a clever build technique — photos don't do the size justice. It's 1.3m long.",
  likes: 234,
  comments: 49,
  image: true
}, {
  id: 'p17',
  type: 'discussion',
  user: 'saanvi',
  time: '3h',
  community: 'lego',
  cat: 'kits',
  body: "MOC builders — what brick colours are you struggling to source in India? Trying to compile a list for a Bangalore group order from BrickLink. Dark Bluish Grey and Dark Tan seem hardest.",
  likes: 112,
  comments: 58,
  image: false
}, {
  id: 'p18',
  type: 'review',
  user: 'meera',
  time: '2d',
  community: 'lego',
  cat: 'kits',
  tone: 'forest',
  rating: 5,
  body: "Botanicals Orchid 10311 — this set punches way above its piece count. 608 pieces but it looks premium on any shelf. The stem articulation technique is genuinely clever. Instant 5/5.",
  likes: 167,
  comments: 27,
  image: true
}, {
  id: 'p19',
  type: 'showcase',
  user: 'rohit_scale',
  time: '5d',
  community: 'lego',
  cat: 'kits',
  tone: 'gold',
  body: "Icons Colosseum finally built after 6 months on the shelf. 9036 pieces, nearly 3 days. The cross-section detail is extraordinary. This is peak LEGO architecture.",
  likes: 198,
  comments: 44,
  image: true
}, {
  id: 'p20',
  type: 'discussion',
  user: 'aman_toys',
  time: '4h',
  community: 'lego',
  cat: 'kits',
  body: "Anyone bought from Bricks World or Bangalore Brick Co recently? Prices seem to have gone up post the GST revision. Trying to figure out if ordering direct from LEGO is worth it now.",
  likes: 78,
  comments: 35,
  image: false
}, {
  id: 'p21',
  type: 'showcase',
  user: 'saanvi',
  time: '6h',
  community: 'lego',
  cat: 'kits',
  tone: 'forest',
  body: "City MOC corner: added the new fire station wing. Took 3 weeks of planning the road layout. Micro-scale vehicles are hiding in the parking bays.",
  likes: 143,
  comments: 31,
  image: true
}, {
  id: 'p22',
  type: 'review',
  user: 'vikram',
  time: '3d',
  community: 'lego',
  cat: 'kits',
  tone: 'gold',
  rating: 3,
  body: "Technic Bugatti Bolide — I expected more from the flagship Technic set. The exterior is stunning but the interior mechanisms feel sparse. 3/5. The Sian was a better build experience.",
  likes: 89,
  comments: 52,
  image: true
}, {
  id: 'p23',
  type: 'discussion',
  user: 'karan_die',
  time: '1d',
  community: 'lego',
  cat: 'kits',
  body: "Is anyone interested in a Bangalore LEGO MOC display at Brick Bash? Saanvi is organising and we need 8 entries minimum. MOC or large set both count.",
  likes: 54,
  comments: 19,
  image: false
}, {
  id: 'p24',
  type: 'showcase',
  user: 'saanvi',
  time: '4d',
  community: 'lego',
  cat: 'kits',
  tone: 'gold',
  body: "Rivendell 10316 is everything. 6167 pieces and it still feels too quick to build. The elvish arches technique is something else. Library scene is my favourite micro vignette.",
  likes: 276,
  comments: 68,
  image: true
}, {
  id: 'p25',
  type: 'discussion',
  user: 'meera',
  time: '8h',
  community: 'lego',
  cat: 'kits',
  body: "For storage nerds: the Ikea Kallax with Lego sorting bins has been a game changer. Happy to photograph my setup if anyone wants the measurements for the drawer units.",
  likes: 121,
  comments: 47,
  image: false
},
// ── jdm posts ──────────────────────────────────────────────
{
  id: 'p26',
  type: 'showcase',
  user: 'karan_die',
  time: '4h',
  community: 'jdm',
  cat: 'diecast',
  refSku: 'TL-R34',
  tone: 'teal',
  body: "Tomica Limited Vintage Neo haul arrived. R34 Skyline, R32 Group A and the new FD RX-7 in the same box. The R34 in Bayside Blue is still the benchmark for 1/64 tampos.",
  likes: 178,
  comments: 42,
  image: true
}, {
  id: 'p27',
  type: 'discussion',
  user: 'rohit_scale',
  time: '2h',
  community: 'jdm',
  cat: 'diecast',
  body: "Tomica vs Mini GT in 2025 — the gap has narrowed a lot. Mini GT still wins on livery accuracy but Tomica Premium has better metal weight and opening parts. Fight me.",
  likes: 234,
  comments: 87,
  image: false
}, {
  id: 'p28',
  type: 'review',
  user: 'karan_die',
  time: '1d',
  community: 'jdm',
  cat: 'diecast',
  tone: 'teal',
  rating: 5,
  body: "Inno64 Honda Civic EK9 Type R — the opening bonnet and engine bay detail at 1/64 is absurd. This is why Inno64 has been eating Mini GT's lunch on JDM nameplates. Full 5/5.",
  likes: 156,
  comments: 29,
  image: true
}, {
  id: 'p29',
  type: 'showcase',
  user: 'vikram',
  time: '3d',
  community: 'jdm',
  cat: 'diecast',
  tone: 'gold',
  body: "Diecast corner finally lit. 64 cars across 4 shelves. The Hot Wheels RLC Porsche 917 LH is the current pride of the shelf — that Gulf livery in 1/64 is chef's kiss.",
  likes: 112,
  comments: 24,
  image: true
}, {
  id: 'p30',
  type: 'discussion',
  user: 'aman_toys',
  time: '6h',
  community: 'jdm',
  cat: 'diecast',
  body: "1/64 beginners guide I wish I had: start with Mini GT JDM nameplates, avoid Hot Wheels mainline for display (inconsistent QC), and never pay above ₹3500 for a single unless it's RLC.",
  likes: 189,
  comments: 61,
  image: false
}, {
  id: 'p31',
  type: 'showcase',
  user: 'meera',
  time: '5d',
  community: 'jdm',
  cat: 'diecast',
  tone: 'teal',
  body: "Mini GT JDM wall done. 3×3 acrylic risers, back-lit with Govee. The NSX and R32 are the standouts. Lighting makes such a difference at this scale.",
  likes: 94,
  comments: 18,
  image: true
}, {
  id: 'p32',
  type: 'review',
  user: 'rohit_scale',
  time: '6h',
  community: 'jdm',
  cat: 'diecast',
  tone: 'ink',
  rating: 4,
  body: "Mini GT Nissan R32 Group A: accuracy is excellent, tampos crisp, the livery colours are true. Minor gripe — the wheels feel slightly underscale. But at ₹2100 this is the best value in 1/64 right now. 4/5.",
  likes: 143,
  comments: 33,
  image: true
}, {
  id: 'p33',
  type: 'discussion',
  user: 'karan_die',
  time: '2d',
  community: 'jdm',
  cat: 'diecast',
  body: "RLC vs Premium — is the price jump worth it? The Porsche 917 LH is ₹3800 vs ₹400 mainline. Both are the same tooling but the RLC has real rubber and better paint. For display, always RLC.",
  likes: 132,
  comments: 49,
  image: false
}, {
  id: 'p34',
  type: 'showcase',
  user: 'karan_die',
  time: '8h',
  community: 'jdm',
  cat: 'diecast',
  tone: 'red',
  body: "Group order arrived — NSX case split complete. Everyone got their cars. The chase showed up too — going to the member who called it first. Thanks all for the trust.",
  likes: 87,
  comments: 14,
  image: true
}, {
  id: 'p35',
  type: 'discussion',
  user: 'vikram',
  time: '1d',
  community: 'jdm',
  cat: 'diecast',
  body: "What makes a great 1/64? For me: correct proportions first, then livery accuracy, then texture. A model with perfect proportions but average tampos beats the reverse every time. What's your priority?",
  likes: 168,
  comments: 74,
  image: false
},
// ── kaiju posts ──────────────────────────────────────────────
{
  id: 'p36',
  type: 'showcase',
  user: 'meera',
  time: '3h',
  community: 'kaiju',
  cat: 'designer',
  refSku: 'SP-TMWYW',
  tone: 'plum',
  body: "Pulled a secret chase from the Skullpanda Tell Me What You Want case — 1/72 odds. This is officially the best blind box day of my life. The all-gold colourway is unreal in person.",
  likes: 342,
  comments: 89,
  image: true
}, {
  id: 'p37',
  type: 'discussion',
  user: 'rohit_scale',
  time: '1h',
  community: 'kaiju',
  cat: 'designer',
  body: "Pop Mart drop strategy that actually works: set 3 alarms for 6pm, use mobile data not WiFi, add to cart before the official start time. Your cart holds for 3 mins. Go.",
  likes: 278,
  comments: 112,
  image: false
}, {
  id: 'p38',
  type: 'review',
  user: 'aman_toys',
  time: '2d',
  community: 'kaiju',
  cat: 'designer',
  tone: 'ink',
  rating: 4,
  body: "Bearbrick 400% Kaws Companion: the flocking texture is perfect and the painted details are crisp. Scale is imposing on a shelf. Docked one star only because the feet don't sit perfectly flat. 4/5.",
  likes: 198,
  comments: 43,
  image: true
}, {
  id: 'p39',
  type: 'showcase',
  user: 'meera',
  time: '6d',
  community: 'kaiju',
  cat: 'designer',
  tone: 'plum',
  body: "Blind box haul from the last two weeks: 3 Labubu, 2 Skullpanda, 1 Molly. Hit zero chases but the regular pulls are all great sculpts. The Labubu Monsters are the best series Pop Mart has done.",
  likes: 156,
  comments: 37,
  image: true
}, {
  id: 'p40',
  type: 'discussion',
  user: 'saanvi',
  time: '4h',
  community: 'kaiju',
  cat: 'designer',
  body: "Anyone want to split a Pop Mart case? I'm doing the new Skullpanda Series 3 — 12 boxes, splitting evenly. ₹1,200/box, I'll document the unboxing live on the community. DM if interested.",
  likes: 89,
  comments: 34,
  image: false
}, {
  id: 'p41',
  type: 'showcase',
  user: 'vikram',
  time: '4d',
  community: 'kaiju',
  cat: 'designer',
  tone: 'ink',
  body: "Designer toy corner: Bearbrick 1000% Darth Vader finally has its shelf. At this scale it's genuinely a piece of furniture. The 400% companion looks tiny next to it.",
  likes: 223,
  comments: 51,
  image: true
}, {
  id: 'p42',
  type: 'review',
  user: 'karan_die',
  time: '3d',
  community: 'kaiju',
  cat: 'designer',
  tone: 'plum',
  rating: 5,
  body: "KAWS Companion BFF (OG colourway) — five years later and this is still the best entry point into designer toys. Proportions are iconic. Secondary market has only gone one direction. 5/5.",
  likes: 187,
  comments: 62,
  image: true
}, {
  id: 'p43',
  type: 'discussion',
  user: 'meera',
  time: '1d',
  community: 'kaiju',
  cat: 'designer',
  body: "Chase hunting ethics: if you pull a chase and resell, is ₹8k over retail too much? I say no — 1/72 odds means risk was real. Curious what others think.",
  likes: 134,
  comments: 93,
  image: false
}, {
  id: 'p44',
  type: 'showcase',
  user: 'rohit_scale',
  time: '8h',
  community: 'kaiju',
  cat: 'designer',
  tone: 'plum',
  body: "Unboxed the new Labubu Monsters Series 2 case. 12 boxes, got 7 unique pulls. No chase but the Zombie colourway is surprisingly detailed for a blind box. Happy with this case.",
  likes: 112,
  comments: 28,
  image: true
}, {
  id: 'p45',
  type: 'discussion',
  user: 'aman_toys',
  time: '2d',
  community: 'kaiju',
  cat: 'designer',
  body: "Secondary market for designer toys in India is maturing fast. Skullpanda chases are now ₹15k-18k vs ₹800 retail. Anyone here selling their chases or holding long-term?",
  likes: 167,
  comments: 78,
  image: false
},
// ── grails posts ──────────────────────────────────────────────
{
  id: 'p46',
  type: 'showcase',
  user: 'vikram',
  time: '5h',
  community: 'grails',
  cat: 'figures',
  refSku: 'SS-PF-BM',
  tone: 'ink',
  body: "Six years of hunting, finally mine. Sideshow Batman PF EX edition, low number, double-boxed shipper intact. This community is part of why I kept the faith. Thank you.",
  likes: 428,
  comments: 94,
  image: true
}, {
  id: 'p47',
  type: 'discussion',
  user: 'vikram',
  time: '1d',
  community: 'grails',
  cat: 'figures',
  body: "Authentication checklist for Sideshow PF: check the certificate number against Sideshow's registry (they'll confirm via email), verify cape stitching direction, weigh the base — recasts are always lighter.",
  likes: 312,
  comments: 67,
  image: false
}, {
  id: 'p48',
  type: 'review',
  user: 'aman_toys',
  time: '3d',
  community: 'grails',
  cat: 'figures',
  tone: 'ink',
  rating: 4,
  body: "Prime 1 vs Sideshow at the same price point: Prime 1 wins on sheer detail but Sideshow has better long-term support and resale. For first-time statue buyers I still recommend Sideshow. 4/5 for Prime 1.",
  likes: 234,
  comments: 58,
  image: true
}, {
  id: 'p49',
  type: 'showcase',
  user: 'aman_toys',
  time: '6d',
  community: 'grails',
  cat: 'figures',
  tone: 'red',
  body: "Hot Toys shelf — full MCU lineup. The dedication to getting these all in-hand took 4 years. The Mark 85 and Thanos are the anchors. Display glass installed last month.",
  likes: 356,
  comments: 82,
  image: true
}, {
  id: 'p50',
  type: 'discussion',
  user: 'meera',
  time: '2h',
  community: 'grails',
  cat: 'figures',
  body: "Recast detection thread: the most reliable tell I've found for Sideshow pieces is the cape liner — recasts use a different weave and the silver interior paint is too uniform. Photos available if you want examples.",
  likes: 289,
  comments: 71,
  image: false
}, {
  id: 'p51',
  type: 'showcase',
  user: 'vikram',
  time: '2d',
  community: 'grails',
  cat: 'figures',
  tone: 'red',
  body: "XM Studios Cyclops slot just confirmed. EX edition with light-up visor. Expected Q4. This will be the centrepiece of the X-Men corner. Patience finally rewarded.",
  likes: 178,
  comments: 44,
  image: false
}, {
  id: 'p52',
  type: 'review',
  user: 'vikram',
  time: '4d',
  community: 'grails',
  cat: 'figures',
  tone: 'ink',
  rating: 5,
  body: "Sideshow PF EX vs standard: the EX interchangeable head and bonus accessory are always worth the premium at the time of release. On secondary market the EX holds value 40-60% better. Buy EX if you can.",
  likes: 267,
  comments: 53,
  image: false
}, {
  id: 'p53',
  type: 'discussion',
  user: 'rohit_scale',
  time: '7h',
  community: 'grails',
  cat: 'figures',
  body: "Grail strategy that worked for me: watch the Sideshow retirement list, not the new releases. A retiring PF that's already numbered sells faster on secondary. Bought my Spider-Man PF the week before it retired.",
  likes: 198,
  comments: 61,
  image: false
}, {
  id: 'p54',
  type: 'showcase',
  user: 'vikram',
  time: '1d',
  community: 'grails',
  cat: 'figures',
  tone: 'ink',
  body: "Custom display for the premium format corner — recessed lighting, mirrored back panel. At ₹1.5L+ per piece, the display should match the investment. Total setup cost was ₹18k, worth every rupee.",
  likes: 312,
  comments: 76,
  image: true
}, {
  id: 'p55',
  type: 'discussion',
  user: 'aman_toys',
  time: '3d',
  community: 'grails',
  cat: 'figures',
  body: "Insurance for high-value collectibles in India — anyone have a policy that actually covers statues? Standard home contents doesn't. Heard Tata AIG does a fine art rider but the process is opaque.",
  likes: 143,
  comments: 88,
  image: false
},
// ── mfh posts ──────────────────────────────────────────────
{
  id: 'p56',
  type: 'showcase',
  user: 'aman_toys',
  time: '4h',
  community: 'mfh',
  cat: 'figures',
  tone: 'gold',
  body: "Hot Toys Thor Love & Thunder just arrived. The hair sculpt is the best HT have done since Iron Man. Posting a detailed unboxing video to the community tonight.",
  likes: 67,
  comments: 19,
  image: true
}, {
  id: 'p57',
  type: 'discussion',
  user: 'vikram',
  time: '2d',
  community: 'mfh',
  cat: 'figures',
  body: "Mumbai collector spots worth visiting: Crossword Bandra for LEGO, Hamleys Lower Parel for Bandai, and the Dharavi toy market for vintage finds. Anyone has more to add to the list?",
  likes: 43,
  comments: 28,
  image: false
}, {
  id: 'p58',
  type: 'review',
  user: 'meera',
  time: '1d',
  community: 'mfh',
  cat: 'figures',
  tone: 'red',
  rating: 4,
  body: "Hot Toys Thanos: the face sculpt nails Brolin's likeness. Gauntlet stones are individually lit and the Infinity Gauntlet swappable is a nice touch. Only gripe — base feels cheap for a ₹24k figure. 4/5.",
  likes: 54,
  comments: 14,
  image: true
}, {
  id: 'p59',
  type: 'showcase',
  user: 'aman_toys',
  time: '3d',
  community: 'mfh',
  cat: 'figures',
  refSku: 'MMS601',
  tone: 'red',
  body: "Shelf update — added custom acrylic risers and backlighting this weekend. The Mark 85 is centre stage. The difference lighting makes is night and day. Used Govee T1 strips.",
  likes: 88,
  comments: 21,
  image: true
}, {
  id: 'p60',
  type: 'discussion',
  user: 'rohit_scale',
  time: '6h',
  community: 'mfh',
  cat: 'figures',
  body: "Group buy for the STARS Hot Toys set — need 4 members at ₹6,500 each for a combined order from Mumbai distributor. Saves about ₹1,800 per unit on shipping. DM if you want in.",
  likes: 31,
  comments: 12,
  image: false
}, {
  id: 'p61',
  type: 'showcase',
  user: 'vikram',
  time: '5d',
  community: 'mfh',
  cat: 'figures',
  tone: 'ink',
  body: "New display unit installed — custom glass cabinet with UV protection glass. Finally the Sideshow pieces have proper dust-free display. These pieces deserve the upgrade.",
  likes: 72,
  comments: 17,
  image: true
}, {
  id: 'p62',
  type: 'discussion',
  user: 'aman_toys',
  time: '1d',
  community: 'mfh',
  cat: 'figures',
  body: "Mumbai meetup planning for July — thinking Phoenix Marketcity again but open to suggestions. Last time we had 18 people, aiming for 25+ this time. Confirm availability in comments.",
  likes: 46,
  comments: 34,
  image: false
}, {
  id: 'p63',
  type: 'showcase',
  user: 'meera',
  time: '8h',
  community: 'mfh',
  cat: 'figures',
  tone: 'gold',
  body: "Mumbai haul from last week: Goku UI, Kefla PO confirmed, and stumbled on an old Vegeta Blue at a shop in Andheri for ₹4,200. Good day for the collection.",
  likes: 58,
  comments: 16,
  image: true
}];

// ── Admin / release posts (BRD §10 return loop) ───────────────
const ADMIN_POSTS = [{
  id: 'a1',
  time: '2h',
  cat: 'figures',
  title: 'New release · Bandai Goku Ultra Instinct',
  body: 'POs open Friday 6pm IST. Limited to 1 per account at retail. Tap to set a wishlist alert.',
  sku: 'SHF-GUI',
  tone: 'gold'
}, {
  id: 'a2',
  time: '1d',
  cat: 'kits',
  title: 'Restock · LEGO Icons Eiffel Tower 10307',
  body: 'Back in stock at Indian distributors this week after a long gap.',
  sku: '10307',
  tone: 'gold'
}];

// ── Communities (BRD §8.8) — Facebook-Groups-style ───────────
// privacy: 'public' (anyone joins instantly, posts visible to all)
//        | 'private' (request to join; posts/members hidden until approved)
const COMMUNITIES = [{
  id: 'itm',
  name: 'Indian Toy Maniacs',
  members: 4892,
  founder: 'rohit_scale',
  tone: 'plum',
  cat: 'figures',
  short: 'The OG India figure & diecast community.',
  tag: 'iT',
  joined: true,
  posts: 2140,
  privacy: 'public',
  rules: ['In-hand or clear PO terms only', 'No recasts / KOs', 'Be decent — trades are off-platform, vouch after']
}, {
  id: 'lego',
  name: 'Bricks Bangalore',
  members: 2134,
  founder: 'saanvi',
  tone: 'forest',
  cat: 'kits',
  short: 'Lego AFOLs, MOC builds, scarce sets.',
  tag: 'Bb',
  joined: false,
  posts: 980,
  privacy: 'public',
  rules: ['Original builds welcome', 'Mark sealed vs opened', 'Credit MOC designers']
}, {
  id: 'jdm',
  name: 'JDM Diecast Crew',
  members: 1678,
  founder: 'karan_die',
  tone: 'teal',
  cat: 'diecast',
  short: 'Tomica, Inno64, Mini GT — 1/64 obsessives.',
  tag: 'JD',
  joined: true,
  posts: 1320,
  privacy: 'public',
  rules: ['Scale + brand in every post', 'Photos in natural light preferred']
}, {
  id: 'kaiju',
  name: 'Kaiju & Vinyl',
  members: 934,
  founder: 'meera',
  tone: 'red',
  cat: 'designer',
  short: 'Designer toy drops, blind boxes, soft vinyl.',
  tag: 'Kv',
  joined: false,
  posts: 540,
  privacy: 'public',
  rules: ['Tag blind-box reveals', 'No chase-figure scalping talk']
}, {
  id: 'grails',
  name: 'Grail Hunters India',
  members: 612,
  founder: 'vikram',
  tone: 'ink',
  cat: 'figures',
  short: 'High-end statues, premium format, recast watch.',
  tag: 'Gh',
  joined: false,
  posts: 410,
  privacy: 'private',
  invite: true,
  rules: ['Invite-only', 'Provenance matters — show your shipper', 'Recast tells get pinned']
},
// a community YOU run — so the admin tools are explorable out of the box
{
  id: 'mfh',
  name: 'Mumbai Figure Heads',
  members: 214,
  founder: 'you',
  tone: 'gold',
  cat: 'figures',
  short: 'Mumbai-based 1/6 & statue collectors. Meets, group buys, display nights.',
  tag: 'MF',
  joined: true,
  posts: 96,
  privacy: 'private',
  rules: ['Mumbai collectors first', 'Show in-hand photos', 'No recast talk', 'Be kind — vouch after trades']
}];

// Join requests waiting on an admin (private communities) — handles
const COM_JOIN_REQUESTS = {
  mfh: ['saanvi', 'karan_die', 'meera']
};
// Posts awaiting approval (approval-mode / private communities)
const COM_PENDING_POSTS = {
  mfh: [{
    id: 'pp1',
    author: 'aman_toys',
    type: 'showcase',
    time: '2h',
    text: 'Finally completed my Hot Toys Avengers line-up — full shelf shot. Worth a post here?',
    tone: 'red'
  }, {
    id: 'pp2',
    author: 'vikram',
    type: 'discussion',
    time: '5h',
    text: 'Anyone up for a group buy on the new Prime 1 Batman? Trying to split shipping from the US.',
    tone: 'ink'
  }]
};
// Seed member rosters (admins are merged in by membersOf)
const COM_MEMBERS = {
  mfh: ['you', 'aman_toys', 'rohit_scale', 'vikram', 'meera', 'saanvi', 'karan_die']
};

// ── Events (BRD §8.9 / §9.13) ─────────────────────────────────
// Facebook-style: no tickets/QR. People RSVP Going / Interested.
// status: 'approved' | 'pending' (every event is approved by the app owner)
// going: seed attendee handles (the live "who's going" list)
const EVENTS = [{
  id: 'mumbai4',
  title: 'Mumbai Collector Meet · Vol 4',
  day: 'Sat',
  date: '24',
  month: 'May',
  when: 'Sat · 24 May · 4:00 – 8:00 pm',
  time: '4:00 pm',
  endTime: '8:00 pm',
  where: 'Phoenix Marketcity, Kurla',
  mode: 'In person',
  city: 'Mumbai',
  cats: ['figures', 'diecast'],
  status: 'approved',
  host: 'rohit_scale',
  community: 'itm',
  going: ['rohit_scale', 'aman_toys', 'meera', 'vikram', 'karan_die', 'saanvi'],
  interested: ['meera', 'karan_die'],
  bring: 'Bring up to 3 pieces to display or trade.',
  about: 'Our biggest meet yet. Bring 3 pieces to display or trade. Verified sellers get a table. Group dinner after.'
}, {
  id: 'blr3',
  title: 'Bengaluru Brick Bash · Vol 3',
  day: 'Sun',
  date: '08',
  month: 'Jun',
  when: 'Sun · 08 Jun · 11:00 am – 3:00 pm',
  time: '11:00 am',
  endTime: '3:00 pm',
  where: 'Lalbagh Glass House, Bangalore',
  mode: 'In person',
  city: 'Bangalore',
  cats: ['kits'],
  status: 'approved',
  host: 'saanvi',
  community: 'lego',
  going: ['saanvi', 'rohit_scale', 'aman_toys'],
  interested: ['vikram'],
  bring: 'Bring a MOC to show or spare parts to swap.',
  about: 'MOC showcase + a swap table for spare parts. Family-friendly. Best build wins a sealed set.'
}, {
  id: 'delhi2',
  title: 'Delhi Diecast Showdown',
  day: 'Sat',
  date: '14',
  month: 'Jun',
  when: 'Sat · 14 Jun · 2:00 – 6:00 pm',
  time: '2:00 pm',
  endTime: '6:00 pm',
  where: 'Select Citywalk, Saket',
  mode: 'In person',
  city: 'Delhi',
  cats: ['diecast'],
  status: 'approved',
  host: 'karan_die',
  community: 'jdm',
  going: ['karan_die', 'vikram', 'rohit_scale', 'meera'],
  interested: [],
  bring: 'Bring your 1/64 for the custom-livery contest.',
  about: '1/64 trade tables, a custom-livery contest, and a group order for the next Mini GT case.'
}, {
  id: 'blrcon',
  title: 'South India Toy Convention 2026',
  day: 'Sat',
  date: '28',
  month: 'Jun',
  when: 'Sat 28 – Sun 29 Jun · 10:00 am – 7:00 pm',
  time: '10:00 am',
  endTime: '7:00 pm',
  endDate: '29',
  endMonth: 'Jun',
  multiDay: true,
  where: 'KTPO Trade Centre, Whitefield',
  mode: 'In person',
  city: 'Bangalore',
  cats: ['figures', 'designer', 'kits', 'diecast'],
  status: 'approved',
  host: 'rohit_scale',
  community: 'itm',
  going: ['rohit_scale', 'meera', 'vikram', 'aman_toys', 'karan_die', 'saanvi'],
  interested: ['aman_toys'],
  bring: 'Bring pieces to display or trade. Sign up to join the event community for updates.',
  about: 'Two halls, 40+ seller tables, artist alley and a grail auction. Join the event community for updates and to meet attendees before the day.'
}, {
  id: 'online1',
  title: 'Pop Mart Drop · Online Watch Party',
  day: 'Fri',
  date: '06',
  month: 'Jun',
  when: 'Fri · 06 Jun · 8:00 – 9:30 pm',
  time: '8:00 pm',
  endTime: '9:30 pm',
  where: 'CollectorHub Live (online)',
  mode: 'Online',
  city: 'Online',
  cats: ['designer'],
  status: 'approved',
  host: 'meera',
  community: 'kaiju',
  going: ['meera', 'saanvi', 'aman_toys'],
  interested: ['rohit_scale'],
  bring: 'Bring your wishlist — we’ll call out stock together.',
  about: 'We watch the Skullpanda drop together, call out stock, and split cases. Join the community for the stream link.'
},
// past / archived
{
  id: 'pune1',
  title: 'Pune Collector Mixer · Vol 2',
  day: 'Sun',
  date: '20',
  month: 'Apr',
  when: 'Sun · 20 Apr · 3:00 – 7:00 pm',
  time: '3:00 pm',
  endTime: '7:00 pm',
  where: 'Seasons Mall, Magarpatta',
  mode: 'In person',
  city: 'Pune',
  cats: ['figures'],
  status: 'approved',
  past: true,
  host: 'vikram',
  community: 'itm',
  going: ['vikram', 'rohit_scale', 'aman_toys', 'meera'],
  interested: [],
  bring: 'Bring pieces to display or trade.',
  about: 'A relaxed afternoon of display, trades and chai. Thanks to everyone who came out.'
}];
function event(id, extra) {
  const all = [...(extra || []), ...EVENTS];
  return all.find(e => e.id === id);
}

// ── Deals / trade history (BRD §8.1 Deal) ─────────────────────
const TRADE_HISTORY = [{
  id: 'd1',
  with: 'rohit_scale',
  item: 'Tomica Limited · Mazda RX-7 FD',
  dir: 'Sold',
  when: 'Apr 2026',
  rating: 5
}, {
  id: 'd2',
  with: 'meera',
  item: 'SH Figuarts · Vegeta',
  dir: 'Bought',
  when: 'Mar 2026',
  rating: 5
}, {
  id: 'd3',
  with: 'karan_die',
  item: 'Mini GT · Lancer Evo X',
  dir: 'Traded',
  when: 'Feb 2026',
  rating: 4
}];

// ── Notifications (BRD §8.10) ─────────────────────────────────
const NOTIFICATIONS = [{
  id: 'n1',
  kind: 'wishlist',
  text: 'A Pop Mart Skullpanda you want is now listed for ₹9,600.',
  time: '8m',
  unread: true,
  ref: {
    type: 'listing',
    id: 'popmart-skull'
  }
}, {
  id: 'n2',
  kind: 'deal',
  user: 'rohit_scale',
  text: 'wants to confirm your deal on the Iron Man Mark 85.',
  time: '20m',
  unread: true,
  ref: {
    type: 'chat',
    id: 'rohit_scale'
  }
}, {
  id: 'n3',
  kind: 'vouch',
  user: 'saanvi',
  text: 'left you a trade vouch.',
  time: '1h',
  unread: true,
  ref: {
    type: 'profile',
    id: 'saanvi'
  }
}, {
  id: 'n4',
  kind: 'follow',
  user: 'karan_die',
  text: 'started following you.',
  time: '3h',
  unread: false,
  ref: {
    type: 'profile',
    id: 'karan_die'
  }
}, {
  id: 'n5',
  kind: 'like',
  user: 'meera',
  text: 'and 23 others liked your showcase.',
  time: '5h',
  unread: false,
  ref: {
    type: 'post',
    id: 'p4'
  }
}, {
  id: 'n6',
  kind: 'community',
  text: 'New post in Indian Toy Maniacs — 23 replies.',
  time: '6h',
  unread: false,
  ref: {
    type: 'community',
    id: 'itm'
  }
}, {
  id: 'n7',
  kind: 'event',
  text: 'Mumbai Collector Meet · Vol 4 starts in 3 days.',
  time: '8h',
  unread: false,
  ref: {
    type: 'event',
    id: 'mumbai4'
  }
}, {
  id: 'n8',
  kind: 'preorder',
  text: 'Your Goku UI pre-order ships in ~3 weeks.',
  time: '1d',
  unread: false,
  ref: {
    type: 'item',
    id: 'i5'
  }
}];

// ── Comments for post detail (BRD §9.7) ───────────────────────
const COMMENTS = {
  p1: [{
    user: 'meera',
    time: '4h',
    body: 'The tampo on the gi is so crisp this run. Congrats!'
  }, {
    user: 'karan_die',
    time: '3h',
    body: 'Did you PO or grab in-hand? Looking for one myself.'
  }, {
    user: 'aman_toys',
    time: '2h',
    body: 'Shelf is looking stacked 🔥'
  }],
  p2: [{
    user: 'aman_toys',
    time: '22h',
    body: 'Saved. The stitching tell is the easiest one to check, good shout.'
  }, {
    user: 'saanvi',
    time: '20h',
    body: 'Reported a seller last week for exactly this. Thank you for posting.'
  }],
  p3: [{
    user: 'rohit_scale',
    time: '1d',
    body: 'The lattice repetition broke me on the 10256 too. Worth it though.'
  }],
  p4: [{
    user: 'vikram',
    time: '7h',
    body: 'That spotlight setup is clean. What lighting?'
  }]
};

// ── Direct messages (BRD §8.7 / §9.10) ────────────────────────
const THREADS = {
  rohit_scale: {
    listing: 'mms601',
    messages: [{
      from: 'them',
      text: 'Yo. Still got the Iron Man Mk85 in hand?',
      time: '11:42'
    }, {
      from: 'them',
      text: 'Saw it on your feed — would do ₹18k flat, pickup in Andheri.',
      time: '11:42'
    }]
  },
  karan_die: {
    listing: 'tomica-r34',
    messages: [{
      from: 'them',
      text: 'Open to a trade on the R34? I have a sealed Mini GT R35.',
      time: 'Yesterday'
    }]
  },
  meera: {
    listing: null,
    messages: [{
      from: 'me',
      text: 'Hey! Is the Goku UI PO slot still open?',
      time: 'Mon'
    }, {
      from: 'them',
      text: 'Yep, one slot. MRP + ₹200 transfer. Want it?',
      time: 'Mon'
    }]
  }
};
const INBOX = [{
  user: 'rohit_scale',
  preview: 'would do ₹18k flat, pickup in Andheri.',
  time: '11:42',
  unread: 2,
  listing: 'mms601'
}, {
  user: 'karan_die',
  preview: 'Open to a trade on the R34?',
  time: 'Yest',
  unread: 1,
  listing: 'tomica-r34'
}, {
  user: 'meera',
  preview: 'Yep, one slot. MRP + ₹200 transfer.',
  time: 'Mon',
  unread: 0,
  listing: null
}];

// ── You — the prototype user ──────────────────────────────────
const ME = {
  handle: 'you',
  name: 'You',
  initial: 'Y',
  color: 'var(--ink)',
  city: 'Mumbai',
  joined: "Nov '25",
  bio: 'New here · Hot Toys + Gunpla · building the shelf',
  deals: 6,
  response: '~25 min',
  activeListings: 1,
  vouchesReceived: 12,
  vouchesGiven: 9,
  xp: 1240,
  xpWeek: 180,
  xpMonth: 720,
  contrib: {
    social: 560,
    posts: 340,
    collection: 240,
    market: 100
  },
  seasonBadges: [{
    id: 'you-may-wk',
    period: 'May',
    kind: 'weekly',
    place: 'top10',
    tier: 'finalist',
    title: 'Weekly Top 10'
  }, {
    id: 'you-apr-social',
    period: 'Apr',
    kind: 'social',
    place: 3,
    tier: 'bronze',
    title: '#3 · Connector'
  }],
  followers: 38,
  following: 91,
  tier: 'Verified',
  portfolio: 197000,
  verifiedItems: 3,
  interests: ['figures', 'kits']
};

// ── Standardised condition ladder (§9.9, defined list not free text) ──
const CONDITION_LADDER = ['Sealed / MISB', 'Mint', 'Like new', 'Good', 'Fair', 'For parts'];

// ── Onboarding sub-interests added in v1.2 (§9.2): Scale + Universe ──
const SCALES = ['1/4', '1/6', '1/10', '1/12', '1/64', '1/100', '1:300'];
const UNIVERSES = ['Marvel', 'DC', 'Dragon Ball', 'Star Wars', 'Gundam', 'JDM Cars', 'Pop Mart IP'];

// ── Presence / online status (§9.11) ──────────────────────────
const PRESENCE = {
  aman_toys: 'active 4 min ago',
  rohit_scale: 'Online now',
  saanvi: 'active 1 hr ago',
  karan_die: 'active 22 min ago',
  meera: 'Online now',
  vikram: 'active 8 min ago',
  you: 'Online now'
};
// ── Ownership breakdown by category (§9.11 header stat) ────────
const OWNS = {
  aman_toys: {
    figures: 58,
    designer: 13
  },
  rohit_scale: {
    figures: 96,
    diecast: 92
  },
  saanvi: {
    kits: 39
  },
  karan_die: {
    diecast: 54
  },
  meera: {
    figures: 120
  },
  vikram: {
    figures: 165
  }
};
const OWN_LABELS = {
  figures: 'action figures',
  designer: 'designer toys & blind boxes',
  kits: 'kits & Lego',
  diecast: 'diecast'
};

// ── Community posting mode (§9.12): open | approval ───────────
const COM_POSTMODE = {
  grails: 'approval',
  kaiju: 'approval'
};
// ── Visible admins / mods per community (§9.12) ─────────────
const COM_ADMINS = {
  itm: [{
    handle: 'rohit_scale',
    role: 'Founder'
  }, {
    handle: 'aman_toys',
    role: 'Mod'
  }],
  lego: [{
    handle: 'saanvi',
    role: 'Founder'
  }],
  jdm: [{
    handle: 'karan_die',
    role: 'Founder'
  }, {
    handle: 'vikram',
    role: 'Mod'
  }],
  kaiju: [{
    handle: 'meera',
    role: 'Founder'
  }],
  grails: [{
    handle: 'vikram',
    role: 'Founder'
  }, {
    handle: 'rohit_scale',
    role: 'Mod'
  }],
  mfh: [{
    handle: 'you',
    role: 'Founder'
  }, {
    handle: 'aman_toys',
    role: 'Mod'
  }]
};

// ── Listing seller terms + price-feedback seed (§9.9) ─────────
const LISTING_TERMS = {
  mms601: ['No returns once sold', 'Buyer covers shipping (₹350 pan-India)', 'Pickup welcome in Andheri', 'In-hand video before payment'],
  lego10307: ['Factory-sealed, sold as-is', 'Shipping covered by seller', 'No trades on this one'],
  'tomica-r34': ['No returns once sold', 'Shipping ₹150, buyer pays', 'Open to 1/64 trades'],
  'sideshow-batman': ['Pickup strongly recommended', 'No returns — inspect on collection', 'Insured courier at buyer cost']
};
const DEFAULT_TERMS = ['No returns once sold', 'Shipping at buyer cost', 'Message before you pay'];

// helpers
function cat(sku) {
  return CATALOGUE.find(c => c.sku === sku);
}
function user(h) {
  return USERS[h] || ME;
}
function listing(id) {
  return LISTINGS.find(l => l.id === id) || MARKET_SEED.find(l => l.id === id);
}
function presenceOf(h) {
  return PRESENCE[h] || 'active recently';
}
function termsOf(id) {
  return LISTING_TERMS[id] || DEFAULT_TERMS;
}
// map free-text condition to a standardised ladder rung (§9.9)
function gradeOf(cond) {
  const s = (cond || '').toLowerCase();
  if (s.includes('misb') || s.includes('sealed') || s.includes('factory')) return 'Sealed / MISB';
  if (s.includes('bnib') || s.includes('new')) return 'Like new';
  if (s.includes('mint')) return 'Mint';
  if (s.includes('good')) return 'Good';
  if (s.includes('fair')) return 'Fair';
  if (s.includes('parts')) return 'For parts';
  return 'Mint';
}
function postModeOf(id) {
  return COM_POSTMODE[id] || 'open';
}
function adminsOf(id) {
  const c = COMMUNITIES.find(x => x.id === id);
  return COM_ADMINS[id] || (c ? [{
    handle: c.founder,
    role: 'Founder'
  }] : []);
}
// Roster of member handles for a community — admins first, then seed members, then a sample of users.
function membersOf(id) {
  const admins = adminsOf(id).map(a => a.handle);
  const seed = COM_MEMBERS[id] || [];
  const extra = Object.keys(USERS);
  const all = [...admins, ...seed, ...extra];
  return all.filter((h, i) => all.indexOf(h) === i); // dedupe, preserve order
}
function joinRequestsOf(id) {
  return COM_JOIN_REQUESTS[id] || [];
}
function pendingPostsOf(id) {
  return COM_PENDING_POSTS[id] || [];
}
function roleOf(id, handle) {
  const a = adminsOf(id).find(x => x.handle === handle);
  return a ? a.role : null;
}
// ownership-stats parts, e.g. ['58 action figures', '13 designer toys']
function ownStats(u) {
  let owns;
  if (u.handle === 'you') {
    owns = {};
    MY_ITEMS.filter(i => i.status !== 'wishlist').forEach(i => {
      const c = cat(i.sku);
      if (!c) return;
      owns[c.cat] = (owns[c.cat] || 0) + 1;
    });
  } else owns = OWNS[u.handle] || {};
  return Object.entries(owns).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${OWN_LABELS[k] || k}`);
}

// ── Engagement rewards: Collector XP, tiers & ways to earn ─────
// XP is earned for engagement; tier (rank) is derived from lifetime XP.
const REWARD_TIERS = [{
  id: 'rookie',
  name: 'Rookie',
  at: 0,
  c: 'var(--ink-mute)',
  icon: Icons.box,
  perk: 'Welcome to the shelf'
}, {
  id: 'fan',
  name: 'Fan',
  at: 250,
  c: 'var(--forest)',
  icon: Icons.sparkle,
  perk: 'Profile flair unlocked'
}, {
  id: 'collector',
  name: 'Collector',
  at: 750,
  c: 'var(--verified-teal)',
  icon: Icons.medal,
  perk: 'Early drop alerts'
}, {
  id: 'pro',
  name: 'Pro',
  at: 1800,
  c: 'var(--plum)',
  icon: Icons.gem,
  perk: 'Showcases get featured'
}, {
  id: 'expert',
  name: 'Expert',
  at: 4000,
  c: 'var(--grail-gold-deep)',
  icon: Icons.flame,
  perk: 'Priority verification'
}, {
  id: 'legend',
  name: 'Legend',
  at: 8000,
  c: 'var(--stamp-red)',
  icon: Icons.crown,
  perk: 'Legend badge + spotlight'
}];
// Contributor archetype — derived from a member's contribution MIX (their
// dominant way of adding value), independent of total XP / rank.
const ARCHETYPES = {
  posts: {
    id: 'posts',
    name: 'Showcaser',
    icon: Icons.camera,
    c: 'var(--plum)',
    blurb: 'Shares the most builds & photos'
  },
  social: {
    id: 'social',
    name: 'Connector',
    icon: Icons.heart,
    c: 'var(--stamp-red)',
    blurb: 'Likes, comments & lifts the community'
  },
  collection: {
    id: 'collection',
    name: 'Archivist',
    icon: Icons.gem,
    c: 'var(--verified-teal)',
    blurb: 'Catalogs & verifies the deepest shelf'
  },
  market: {
    id: 'market',
    name: 'Trader',
    icon: Icons.swap,
    c: 'var(--grail-gold-deep)',
    blurb: 'Most active in deals & trades'
  }
};
const CONTRIB_LABELS = {
  posts: 'Showcases',
  social: 'Community',
  collection: 'Collection',
  market: 'Market'
};
function archetypeOf(u) {
  const c = u.contrib || {};
  let best = 'social',
    max = -1;
  Object.keys(c).forEach(k => {
    if (c[k] > max) {
      max = c[k];
      best = k;
    }
  });
  return ARCHETYPES[best];
}
function contribMix(u) {
  const c = u.contrib || {};
  const total = Object.values(c).reduce((a, b) => a + b, 0) || 1;
  return ['posts', 'social', 'collection', 'market'].map(k => ({
    key: k,
    label: CONTRIB_LABELS[k],
    val: c[k] || 0,
    pct: Math.round((c[k] || 0) / total * 100),
    arche: ARCHETYPES[k]
  })).sort((a, b) => b.val - a.val);
}
const EARN_ACTIONS = [{
  id: 'profile',
  label: 'Complete your profile',
  xp: 50,
  icon: Icons.user,
  type: 'once',
  progress: {
    done: 3,
    total: 5
  }
}, {
  id: 'item',
  label: 'Add a verified item',
  xp: 20,
  icon: Icons.box,
  type: 'repeat'
}, {
  id: 'showcase',
  label: 'Post a showcase',
  xp: 15,
  icon: Icons.camera,
  type: 'repeat'
}, {
  id: 'review',
  label: 'Write a review',
  xp: 15,
  icon: Icons.star,
  type: 'repeat'
}, {
  id: 'vouch',
  label: 'Vouch for a collector',
  xp: 10,
  icon: Icons.shield,
  type: 'repeat'
}, {
  id: 'event',
  label: 'RSVP to an event',
  xp: 10,
  icon: Icons.calendar,
  type: 'repeat'
}, {
  id: 'comment',
  label: 'Comment on a post',
  xp: 5,
  icon: Icons.comment,
  type: 'repeat'
}, {
  id: 'like',
  label: 'Like a post',
  xp: 1,
  icon: Icons.heart,
  type: 'repeat'
}, {
  id: 'checkin',
  label: 'Daily check-in',
  xp: 5,
  icon: Icons.zap,
  type: 'daily'
}, {
  id: 'refer',
  label: 'Refer a friend',
  xp: 40,
  icon: Icons.gift,
  type: 'repeat'
}];
function tierIndexOf(xp) {
  let idx = 0;
  REWARD_TIERS.forEach((t, i) => {
    if (xp >= t.at) idx = i;
  });
  return idx;
}
function tierOf(xp) {
  return REWARD_TIERS[tierIndexOf(xp)];
}
function nextTierOf(xp) {
  return REWARD_TIERS[tierIndexOf(xp) + 1] || null;
}

// ── Season badges: granted when a leaderboard cycle ends ───────
// Standings reset every cycle; the badge you earn is permanent (Duolingo-
// league model). Top finishers also bank bonus XP toward their lifetime rank.
const BADGE_TIERS = {
  gold: {
    fill: '#F0C04A',
    ink: '#5A3D00',
    ring: '#CE991C',
    label: '1st place'
  },
  silver: {
    fill: '#C6CCD4',
    ink: '#3D434C',
    ring: '#9BA3AD',
    label: '2nd place'
  },
  bronze: {
    fill: '#D49A66',
    ink: '#4A2C12',
    ring: '#B27B43',
    label: '3rd place'
  },
  finalist: {
    fill: 'var(--bone)',
    ink: 'var(--verified-teal)',
    ring: 'var(--verified-teal)',
    label: 'Top 10'
  }
};
const BADGE_KIND = {
  weekly: {
    icon: Icons.medal,
    label: 'Weekly league'
  },
  monthly: {
    icon: Icons.trophy,
    label: 'Monthly league'
  },
  market: {
    icon: Icons.swap,
    label: 'Trader season'
  },
  social: {
    icon: Icons.heart,
    label: 'Connector season'
  },
  posts: {
    icon: Icons.camera,
    label: 'Showcaser season'
  },
  collection: {
    icon: Icons.gem,
    label: 'Archivist season'
  }
};
// bonus XP banked toward permanent rank for each finishing place
const SEASON_REWARD = {
  gold: 300,
  silver: 200,
  bronze: 120,
  finalist: 50
};
const BADGE_TIER_RANK = {
  gold: 0,
  silver: 1,
  bronze: 2,
  finalist: 3
};
function badgeMeta(b) {
  const t = BADGE_TIERS[b.tier] || BADGE_TIERS.finalist;
  const k = BADGE_KIND[b.kind] || BADGE_KIND.weekly;
  return {
    ...t,
    icon: k.icon,
    kindLabel: k.label,
    xp: SEASON_REWARD[b.tier] || 0
  };
}
function badgesOf(u) {
  return [...(u.seasonBadges || [])].sort((a, b) => BADGE_TIER_RANK[a.tier] - BADGE_TIER_RANK[b.tier]);
}
function topBadge(u) {
  return badgesOf(u)[0] || null;
}
// ranked list for the leaderboard.
// period: 'week' | 'month' | 'all'  → ranks by XP earned in that window
// category: 'posts' | 'social' | 'collection' | 'market' → ranks by that contribution
function leaderboard(period = 'week') {
  const all = [...Object.entries(USERS).map(([key, u]) => ({
    ...u,
    key,
    isMe: false
  })), {
    ...ME,
    key: 'you',
    name: 'You',
    isMe: true
  }];
  const byCategory = ['posts', 'social', 'collection', 'market'].includes(period);
  const pointsOf = u => byCategory ? u.contrib ? u.contrib[period] || 0 : 0 : u[period === 'week' ? 'xpWeek' : period === 'month' ? 'xpMonth' : 'xp'];
  return all.map(u => ({
    key: u.key,
    handle: u.handle,
    name: u.name,
    color: u.color,
    points: pointsOf(u),
    tier: tierOf(u.xp),
    arche: archetypeOf(u),
    isMe: u.isMe
  })).sort((a, b) => b.points - a.points);
}

// ── ISO (In Search Of) seed posts ────────────────────────────
const ISO_POSTS = [{
  id: 'iso0',
  type: 'iso',
  user: 'rohit_scale',
  time: '30m',
  cat: 'figures',
  isoItem: 'Hot Toys MMS604 · Spider-Man (Upgraded Suit)',
  isoBudget: 28000,
  isoCond: 'Sealed',
  isoCity: 'Mumbai',
  body: 'Hunting the upgraded suit Spidey sealed. Reference pic attached — this exact colourway, no alternatives.',
  images: ['data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFhM2E2YyIvPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjEzMCIgcj0iNzAiIGZpbGw9IiNjMDJkMjgiLz48cGF0aCBkPSJNMTQwIDE4MCBRMjAwIDI0MCAyNjAgMTgwIiBzdHJva2U9IiNjMDJkMjgiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIvPjx0ZXh0IHg9IjIwMCIgeT0iMjcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYWFhIiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+UmVmZXJlbmNlIHBob3RvPC90ZXh0Pjwvc3ZnPg=='],
  likes: 18,
  comments: 5
}, {
  id: 'iso1',
  type: 'iso',
  user: 'rohit_scale',
  time: '2h',
  cat: 'figures',
  isoItem: 'Hot Toys MMS460 · Iron Man Mark 46',
  isoBudget: 22000,
  isoCond: 'Sealed',
  isoCity: 'Mumbai',
  body: 'Looking for Mark 46 sealed. Have a swap piece too — DM.',
  likes: 11,
  comments: 4
}, {
  id: 'iso2',
  type: 'iso',
  user: 'meera',
  time: '5h',
  cat: 'figures',
  isoItem: 'SH Figuarts · Dragon Ball Super Broly',
  isoBudget: 5500,
  isoCond: 'Any',
  isoCity: 'Anywhere in India',
  body: 'DB Broly SHF eluded me for 2 years. Any condition, just needs to be OG not KO.',
  likes: 7,
  comments: 2
}, {
  id: 'iso3',
  type: 'iso',
  user: 'karan_die',
  time: '1d',
  cat: 'diecast',
  isoItem: 'Mini GT · Nissan Skyline GT-R R32 · Sonic Blue',
  isoBudget: 1800,
  isoCond: 'Sealed',
  isoCity: 'Delhi',
  body: 'Sealed R32 in Sonic Blue. Open to trade for another 1/64.',
  likes: 5,
  comments: 1
}, {
  id: 'iso4',
  type: 'iso',
  user: 'saanvi',
  time: '3h',
  cat: 'kits',
  isoItem: 'LEGO 75313 · AT-AT UCS (Star Wars)',
  isoBudget: 75000,
  isoCond: 'Sealed',
  isoCity: 'Anywhere in India',
  body: 'Hunting the AT-AT UCS sealed. Budget flexible for the right piece.',
  likes: 14,
  comments: 6
}, {
  id: 'iso5',
  type: 'iso',
  user: 'vikram',
  time: '6h',
  cat: 'figures',
  isoItem: 'Sideshow Premium Format · Batman Begins',
  isoBudget: 45000,
  isoCond: 'MIB',
  isoCity: 'Worldwide',
  body: 'MIB or better. CE version preferred. Will cover international shipping.',
  likes: 9,
  comments: 3
}, {
  id: 'iso6',
  type: 'iso',
  user: 'aman_toys',
  time: '1d',
  cat: 'designer',
  isoItem: 'Pop Mart · Labubu · The Monsters Series 1 (Full Set)',
  isoBudget: 12000,
  isoCond: 'Sealed',
  isoCity: 'Mumbai',
  body: 'Full Series 1 sealed box set — not looking for singles.',
  likes: 18,
  comments: 8
}];
Object.assign(window, {
  CATEGORIES,
  USERS,
  CATALOGUE,
  MY_ITEMS,
  LISTINGS,
  MARKET_SEED,
  POSTS,
  ADMIN_POSTS,
  ISO_POSTS,
  COMMUNITIES,
  EVENTS,
  TRADE_HISTORY,
  NOTIFICATIONS,
  COMMENTS,
  THREADS,
  INBOX,
  ME,
  SCALES,
  UNIVERSES,
  PRESENCE,
  OWNS,
  OWN_LABELS,
  CONDITION_LADDER,
  REWARD_TIERS,
  EARN_ACTIONS,
  ARCHETYPES,
  CONTRIB_LABELS,
  tierOf,
  tierIndexOf,
  nextTierOf,
  leaderboard,
  archetypeOf,
  contribMix,
  BADGE_TIERS,
  BADGE_KIND,
  SEASON_REWARD,
  badgeMeta,
  badgesOf,
  topBadge,
  catOf: cat,
  userOf: user,
  listingOf: listing,
  presenceOf,
  termsOf,
  postModeOf,
  ownStats,
  gradeOf,
  adminsOf,
  eventOf: event,
  membersOf,
  joinRequestsOf,
  pendingPostsOf,
  roleOf
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/data.jsx", error: String((e && e.message) || e) }); }

// app/shared.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// ─────────────────────────────────────────────────────────────
// CollectorHub — shared UI primitives (BRD-aligned)
// Reads tokens from colors_and_type.css. Globals at bottom.
// ─────────────────────────────────────────────────────────────

function Ico({
  d,
  size = 20,
  stroke = 1.75,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, rest), d);
}
const Icons = {
  home: /*#__PURE__*/React.createElement("path", {
    d: "M3 9 12 2l9 7v11a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"
  }),
  bag: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 10a4 4 0 0 1-8 0"
  })),
  users: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m22 11-3 3-2-2"
  })),
  user: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "8",
    r: "5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 21a9 9 0 0 1 18 0"
  })),
  search: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m20 20-3.5-3.5"
  })),
  bell: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10.3 21a1.94 1.94 0 0 0 3.4 0"
  })),
  mail: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "5",
    width: "18",
    height: "14",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m3 7 9 6 9-6"
  })),
  plus: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  })),
  edit: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 20h9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"
  })),
  heart: /*#__PURE__*/React.createElement("path", {
    d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
  }),
  comment: /*#__PURE__*/React.createElement("path", {
    d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"
  }),
  message: /*#__PURE__*/React.createElement("path", {
    d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
  }),
  share: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "5",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "19",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m8.59 13.51 6.83 3.98"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m15.41 6.51-6.82 3.98"
  })),
  bookmark: /*#__PURE__*/React.createElement("path", {
    d: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
  }),
  more: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "12",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "5",
    cy: "12",
    r: "1"
  })),
  back: /*#__PURE__*/React.createElement("path", {
    d: "m15 18-6-6 6-6"
  }),
  chevR: /*#__PURE__*/React.createElement("path", {
    d: "m9 18 6-6-6-6"
  }),
  close: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m6 6 12 12"
  })),
  star: /*#__PURE__*/React.createElement("path", {
    d: "m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
  }),
  shield: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m9 12 2 2 4-4"
  })),
  filter: /*#__PURE__*/React.createElement("path", {
    d: "M22 3H2l8 9.46V19l4 2v-8.54z"
  }),
  pin: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 22s-8-7.58-8-13a8 8 0 0 1 16 0c0 5.42-8 13-8 13z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "9",
    r: "3"
  })),
  calendar: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    width: "18",
    height: "18",
    x: "3",
    y: "4",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 2v4M8 2v4M3 10h18"
  })),
  clock: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 7v5l3 2"
  })),
  trend: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
    points: "22 7 13.5 15.5 8.5 10.5 2 17"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "16 7 22 7 22 13"
  })),
  camera: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "13",
    r: "4"
  })),
  scan: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 12h10"
  })),
  send: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m22 2-7 20-4-9-9-4z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 2 11 13"
  })),
  check: /*#__PURE__*/React.createElement("path", {
    d: "m5 12 5 5L20 7"
  }),
  tag: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "7",
    r: "1.2",
    fill: "currentColor"
  })),
  swap: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M7 16V4M7 4 3 8M7 4l4 4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17 8v12M17 20l4-4M17 20l-4-4"
  })),
  box: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M21 8 12 3 3 8v8l9 5 9-5z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 8l9 5 9-5M12 13v8"
  })),
  gallery: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    width: "18",
    height: "18",
    x: "3",
    y: "3",
    rx: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "9",
    r: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 15-5-5L5 21"
  })),
  settings: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.81 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 3.6V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.4 9H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
  })),
  globe: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"
  })),
  plusCircle: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 8v8M8 12h8"
  })),
  userPlus: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M14 19a6 6 0 0 0-12 0"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "8",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17 9v6M20 12h-6"
  })),
  chart: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 3v18h18"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "7",
    y: "11",
    width: "3",
    height: "6",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "12",
    y: "7",
    width: "3",
    height: "10",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "17",
    y: "13",
    width: "3",
    height: "4",
    rx: "1"
  })),
  grid: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "7",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "7",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "14",
    width: "7",
    height: "7",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "14",
    width: "7",
    height: "7",
    rx: "1"
  })),
  eye: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  })),
  eyeOff: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M9.9 4.2A9.7 9.7 0 0 1 12 4c6.5 0 10 7 10 7a16 16 0 0 1-3 3.6M6.2 6.2A16 16 0 0 0 2 11s3.5 7 10 7a9.7 9.7 0 0 0 3.4-.6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m3 3 18 18M9.5 9.6a3 3 0 0 0 4.2 4.2"
  })),
  ticket: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2v0a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 6v12",
    strokeDasharray: "2 2"
  })),
  info: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 11v5M12 8h.01"
  })),
  zap: /*#__PURE__*/React.createElement("path", {
    d: "M13 2 3 14h7l-1 8 10-12h-7z"
  }),
  trophy: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 9h1.5a2.5 2.5 0 0 0 0-5H18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 22h16"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 2H6v7a6 6 0 0 0 12 0V2z"
  })),
  award: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "8",
    r: "6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"
  })),
  gift: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "8",
    width: "18",
    height: "4",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 8v13M20 12v9H4v-9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"
  })),
  lock: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "11",
    width: "18",
    height: "11",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 11V7a5 5 0 0 1 10 0v4"
  })),
  sparkle: /*#__PURE__*/React.createElement("path", {
    d: "M12 2.5 14 9l6.5 2-6.5 2-2 6.5-2-6.5L3.5 11 10 9z"
  }),
  gem: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 3h12l4 6-10 12L2 9z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 9h20M9 3 6 9l6 12 6-12-3-6M12 3l-3 6h6z"
  })),
  flame: /*#__PURE__*/React.createElement("path", {
    d: "M12 2c1.5 3.5 5 5.5 5 9.5a5 5 0 0 1-10 0c0-1.6.6-2.8 1.4-3.8.3 1 1 1.8 1.9 2C9.5 7.5 10.5 4.5 12 2z"
  }),
  crown: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 7l4 4 5-7 5 7 4-4-1.5 12.5h-15z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4.5 21h15"
  })),
  medal: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "14",
    r: "6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 8.5 6 2H9l2 4M15.5 8.5 18 2h-3l-2 4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 11.5l1 2 2 .3-1.5 1.5.4 2-1.9-1-1.9 1 .4-2L9 13.8l2-.3z"
  })),
  rocket: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 13c-2 1.5-2 5-2 5s3.5 0 5-2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 15c-1-1-1.5-3 0-6 2-4 5-6 11-6 0 6-2 9-6 11-3 1.5-5 1-5 1z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "14.5",
    cy: "9.5",
    r: "1.5"
  })),
  logout: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "16 17 21 12 16 7"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "21",
    y1: "12",
    x2: "9",
    y2: "12"
  })),
  phone: /*#__PURE__*/React.createElement("path", {
    d: "M22 16.9v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12.1a19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 3 1.36h3a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9a16 16 0 0 0 5.91 5.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.81.7A2 2 0 0 1 21 16l.9.9z"
  }),
  doc: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "14 2 14 8 20 8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16",
    y1: "13",
    x2: "8",
    y2: "13"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16",
    y1: "17",
    x2: "8",
    y2: "17"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "10",
    y1: "9",
    x2: "8",
    y2: "9"
  })),
  flag: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "4",
    y1: "22",
    x2: "4",
    y2: "15"
  })),
  trash: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
    points: "3 6 5 6 21 6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 11v6M14 11v6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
  })),
  community: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
  })),
  chevRight: /*#__PURE__*/React.createElement("path", {
    d: "m9 18 6-6-6-6"
  })
};

// palette helper for avatars
const AVATAR_PALETTE = ['var(--stamp-red)', 'var(--plum)', 'var(--verified-teal)', 'var(--forest)', 'var(--grail-gold)', 'var(--ink-mute)'];
function Avatar({
  name = '?',
  color,
  size = 36,
  verified = false,
  photo
}) {
  const initial = (name || '?').slice(0, 1).toUpperCase();
  const bg = color ?? AVATAR_PALETTE[(name || 'x').charCodeAt(0) % AVATAR_PALETTE.length];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: bg,
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: size * 0.4,
      position: 'relative',
      flexShrink: 0,
      letterSpacing: '-0.02em',
      overflow: 'visible',
      backgroundImage: photo ? `url(${photo})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }, !photo && initial, verified && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: -1,
      right: -1,
      width: size * 0.42,
      height: size * 0.42,
      borderRadius: '50%',
      background: 'var(--verified-teal)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid var(--paper)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.check,
    size: size * 0.22,
    stroke: 3.5
  })));
}
function Tag({
  kind = 'default',
  children,
  style
}) {
  const styles = {
    sale: {
      background: 'var(--stamp-red)',
      color: 'var(--paper)'
    },
    po: {
      background: 'var(--grail-gold)',
      color: 'var(--ink)'
    },
    misb: {
      background: 'var(--ink)',
      color: 'var(--paper)'
    },
    sold: {
      background: 'var(--forest)',
      color: 'var(--paper)'
    },
    reserved: {
      background: 'var(--grail-gold-soft)',
      color: 'var(--grail-gold-deep)',
      border: '1px solid var(--grail-gold)'
    },
    vouch: {
      background: 'var(--verified-teal-soft)',
      color: 'var(--verified-teal)',
      border: '1px solid var(--verified-teal)'
    },
    event: {
      background: 'var(--plum-soft)',
      color: 'var(--plum)',
      border: '1px solid var(--plum)'
    },
    default: {
      background: 'var(--bone)',
      color: 'var(--ink)'
    }
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 7px',
      borderRadius: 4,
      lineHeight: 1,
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 10,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      ...styles[kind],
      ...style
    }
  }, children);
}

// Post-type pill (Showcase / Discussion / Review) — BRD §8.5
function PostTypeTag({
  type
}) {
  const map = {
    post: {
      label: 'Post',
      c: '#999999',
      bg: 'rgba(0,0,0,0.06)'
    },
    showcase: {
      label: 'Showcase',
      c: '#2D8F87',
      bg: 'rgba(45,143,135,0.12)'
    },
    discussion: {
      label: 'Discussion',
      c: '#6B3656',
      bg: 'rgba(107,54,86,0.12)'
    },
    review: {
      label: 'Review',
      c: '#C48420',
      bg: 'rgba(196,132,32,0.12)'
    },
    poll: {
      label: 'Poll',
      c: '#FF2442',
      bg: 'rgba(255,36,66,0.10)'
    },
    iso: {
      label: 'ISO',
      c: '#B07724',
      bg: 'rgba(176,119,36,0.13)'
    }
  };
  const m = map[type] || map.post;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 7px',
      borderRadius: 5,
      background: m.bg,
      color: m.c,
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: 10,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }
  }, m.label);
}

// Ownership-verification badge — BRD §8.3 (Claimed / Shown / Verified)
function VerifyBadge({
  tier = 'claimed',
  size = 'sm'
}) {
  const map = {
    verified: {
      label: 'Verified',
      c: 'var(--verified-teal)',
      bg: 'var(--verified-teal-soft)',
      icon: Icons.shield
    },
    shown: {
      label: 'Shown',
      c: 'var(--grail-gold-deep)',
      bg: 'var(--grail-gold-soft)',
      icon: Icons.camera
    },
    claimed: {
      label: 'Claimed',
      c: 'var(--ink-faint)',
      bg: 'var(--bone)',
      icon: Icons.box
    }
  };
  const m = map[tier] || map.claimed;
  const pad = size === 'lg' ? '5px 9px' : '3px 6px';
  const fs = size === 'lg' ? 11 : 10;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: pad,
      borderRadius: 5,
      background: m.bg,
      color: m.c,
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: fs,
      letterSpacing: '0.04em',
      lineHeight: 1,
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: m.icon,
    size: fs + 2,
    stroke: 2
  }), m.label);
}

// Trust tier chip (Top Seller / Trusted / Verified) — BRD §8.2
function TierChip({
  tier
}) {
  const map = {
    'Top Seller': 'var(--stamp-red)',
    'Trusted': 'var(--forest)'
  };
  const c = map[tier];
  if (!c) return null; // base users (incl. former "Verified") show no chip
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 8px',
      borderRadius: 999,
      border: `1px solid ${c}`,
      color: c,
      background: 'transparent',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 10.5,
      letterSpacing: '0.04em',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 11,
    stroke: 2.2
  }), tier);
}

// Status → display label (avoids raw lowercase like "preorder" / "wishlist")
const STATUS_LABEL = {
  available: 'Available',
  sold: 'Sold',
  reserved: 'Reserved',
  preorder: 'Pre-order',
  wishlist: 'Wishlist',
  owned: 'Owned'
};
function statusLabel(s) {
  return STATUS_LABEL[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
}

// Transaction-linked trust signals row — BRD §8.2 PR-05
function TrustSignals({
  u,
  compact = false
}) {
  const items = [{
    v: u.deals,
    l: 'Deals'
  }, {
    v: u.vouchesReceived,
    l: 'Vouches'
  }, {
    v: u.response,
    l: 'Replies'
  }, {
    v: u.joined,
    l: 'Joined'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: compact ? 14 : 0,
      justifyContent: compact ? 'flex-start' : 'space-between'
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      minWidth: compact ? 'auto' : 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 14,
      color: 'var(--ink)',
      fontFeatureSettings: '"tnum" 1'
    }
  }, it.v), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: 'var(--ink-faint)',
      letterSpacing: '0.02em'
    }
  }, it.l))));
}
function Stars({
  n = 0,
  size = 13,
  c = 'var(--grail-gold-deep)'
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 1,
      color: c
    }
  }, [1, 2, 3, 4, 5].map(i => /*#__PURE__*/React.createElement("svg", {
    key: i,
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: i <= n ? 'currentColor' : 'none',
    stroke: "currentColor",
    strokeWidth: 1.6
  }, /*#__PURE__*/React.createElement("path", {
    d: "m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
  }))));
}
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  onClick,
  style,
  disabled
}) {
  const variants = {
    primary: {
      background: 'var(--stamp-red)',
      color: 'var(--paper)',
      border: '1px solid var(--stamp-red)'
    },
    secondary: {
      background: 'var(--paper-soft)',
      color: 'var(--ink)',
      border: '1px solid var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink)',
      border: '1px solid transparent'
    },
    dark: {
      background: 'var(--ink)',
      color: 'var(--paper)',
      border: '1px solid var(--ink)'
    },
    teal: {
      background: 'var(--verified-teal)',
      color: 'var(--paper)',
      border: '1px solid var(--verified-teal)'
    },
    grail: {
      background: 'var(--grail-gold)',
      color: 'var(--ink)',
      border: '1px solid var(--grail-gold-deep)',
      boxShadow: 'var(--shadow-stamp)'
    }
  };
  const sizes = {
    sm: {
      height: 32,
      padding: '0 12px',
      fontSize: 13,
      borderRadius: 8
    },
    md: {
      height: 44,
      padding: '0 18px',
      fontSize: 15,
      borderRadius: 12
    },
    lg: {
      height: 52,
      padding: '0 22px',
      fontSize: 16,
      borderRadius: 14
    },
    block: {
      height: 50,
      padding: '0 20px',
      fontSize: 16,
      borderRadius: 13,
      width: '100%',
      justifyContent: 'center'
    }
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'transform 120ms var(--ease-out), background 120ms',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      ...variants[variant],
      ...sizes[size],
      ...style
    },
    onPointerDown: e => !disabled && (e.currentTarget.style.transform = 'scale(0.97)'),
    onPointerUp: e => e.currentTarget.style.transform = '',
    onPointerLeave: e => e.currentTarget.style.transform = ''
  }, icon, children);
}
function IconButton({
  icon,
  onClick,
  active,
  badge
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      position: 'relative',
      background: active ? 'var(--ink)' : 'transparent',
      color: active ? 'var(--paper)' : 'var(--ink)',
      border: '1px solid ' + (active ? 'var(--ink)' : 'var(--border)'),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      flexShrink: 0
    }
  }, icon, badge ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -3,
      right: -3,
      minWidth: 16,
      height: 16,
      padding: '0 4px',
      borderRadius: 999,
      background: 'var(--stamp-red)',
      color: 'var(--paper)',
      fontSize: 10,
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1.5px solid var(--paper)'
    }
  }, badge) : null);
}
function CategoryChip({
  active,
  children,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onPointerDown: e => e.currentTarget.style.transform = 'scale(0.94)',
    onPointerUp: e => e.currentTarget.style.transform = '',
    onPointerLeave: e => e.currentTarget.style.transform = '',
    style: {
      padding: '7px 14px',
      borderRadius: 999,
      background: active ? 'var(--stamp-red)' : 'var(--paper-soft)',
      color: active ? 'var(--paper)' : 'var(--ink)',
      border: `1px solid ${active ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
      fontFamily: 'var(--font-body)',
      fontWeight: active ? 600 : 500,
      fontSize: 13,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      lineHeight: 1,
      flexShrink: 0,
      transition: 'all 150ms var(--ease-out), transform 80ms'
    }
  }, children);
}

// Segmented control (sort tabs, profile tabs) — paper inset
function Segmented({
  options,
  value,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      background: 'var(--bone)',
      borderRadius: 10,
      padding: 3,
      gap: 2,
      ...style
    }
  }, options.map(o => {
    const active = o.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o.id,
      onClick: () => onChange(o.id),
      style: {
        flex: 1,
        padding: '7px 6px',
        borderRadius: 8,
        border: 'none',
        background: active ? 'var(--paper)' : 'transparent',
        color: active ? 'var(--ink)' : 'var(--ink-faint)',
        fontFamily: 'var(--font-body)',
        fontWeight: active ? 600 : 500,
        fontSize: 13,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        boxShadow: active ? 'var(--shadow-1)' : 'none',
        transition: 'all 120ms'
      }
    }, o.label);
  }));
}
function Stamp({
  children,
  color = 'var(--stamp-red)',
  rotate = 2,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      background: color,
      color: 'var(--paper)',
      padding: '4px 8px',
      borderRadius: 4,
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 11,
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      boxShadow: 'var(--shadow-stamp)',
      transform: `rotate(${rotate}deg)`,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      display: 'inline-block',
      ...style
    }
  }, children);
}

// Product / item photo placeholder (no real photos) — figure silhouette over tone gradient
function ProductPhoto({
  tone = 'red',
  label,
  ratio = '4/3',
  rounded = 10,
  style,
  children
}) {
  const tones = {
    red: 'linear-gradient(135deg, #B73B2E 0%, #842A24 100%)',
    gold: 'linear-gradient(135deg, #E8A33D 0%, #B07724 100%)',
    teal: 'linear-gradient(135deg, #3FA39B 0%, #1F6E68 100%)',
    plum: 'linear-gradient(135deg, #8B4870 0%, #4E2640 100%)',
    forest: 'linear-gradient(135deg, #4A8E5F 0%, #234A30 100%)',
    ink: 'linear-gradient(135deg, #3A332E 0%, #14110F 100%)',
    bone: 'linear-gradient(135deg, #D6CDB9 0%, #B8AFA3 100%)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: ratio,
      width: '100%',
      background: tones[tone] || tones.red,
      borderRadius: rounded,
      position: 'relative',
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      backgroundImage: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.2), transparent 60%)',
      mixBlendMode: 'soft-light'
    }
  }), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 120 90",
    preserveAspectRatio: "xMidYMax meet",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      opacity: 0.3
    }
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: "60",
    cy: "84",
    rx: "22",
    ry: "3",
    fill: "rgba(0,0,0,0.5)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M60 22 q6 0 7 6 t-2 12 q4 4 4 14 l3 18 q1 8 -4 10 l-2 2 -3 -2 q-1 -8 -2 -14 l0 14 -3 4 -3 -4 0 -14 q-1 6 -2 14 l-3 2 -2 -2 q-5 -2 -4 -10 l3 -18 q0 -10 4 -14 q-3 -6 -2 -12 t7 -6 z",
    fill: "rgba(0,0,0,0.55)"
  })), label && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 8,
      left: 10,
      color: 'rgba(244,239,230,0.72)',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.05em'
    }
  }, label), children);
}

// Deterministic pseudo-QR ticket graphic (squares only) — BRD v1.2 §9.13
function QRCode({
  seed = 'ch',
  size = 140,
  fg = 'var(--ink)',
  bg = 'var(--paper)'
}) {
  const N = 21;
  // simple deterministic hash -> bit per cell
  const cells = React.useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = h * 31 + seed.charCodeAt(i) >>> 0;
    const out = [];
    for (let i = 0; i < N * N; i++) {
      h = h * 1103515245 + 12345 >>> 0;
      out.push(h >> 16 & 1);
    }
    return out;
  }, [seed]);
  const isFinder = (r, c) => {
    const inBox = (br, bc) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, N - 7) || inBox(N - 7, 0);
  };
  const finderOn = (r, c) => {
    const local = (br, bc) => {
      const rr = r - br,
        cc = c - bc;
      const edge = rr === 0 || rr === 6 || cc === 0 || cc === 6;
      const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
      return edge || core;
    };
    if (r < 7 && c < 7) return local(0, 0);
    if (r < 7 && c >= N - 7) return local(0, N - 7);
    if (r >= N - 7 && c < 7) return local(N - 7, 0);
    return false;
  };
  const cell = size / N;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      background: bg,
      borderRadius: 8,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    shapeRendering: "crispEdges"
  }, Array.from({
    length: N * N
  }).map((_, idx) => {
    const r = Math.floor(idx / N),
      c = idx % N;
    const on = isFinder(r, c) ? finderOn(r, c) : cells[idx] === 1;
    if (!on) return null;
    return /*#__PURE__*/React.createElement("rect", {
      key: idx,
      x: c * cell,
      y: r * cell,
      width: cell,
      height: cell,
      fill: fg
    });
  })));
}
function Divider({
  dashed = false,
  my = 12
}) {
  return /*#__PURE__*/React.createElement("hr", {
    style: {
      border: 'none',
      borderTop: `1px ${dashed ? 'dashed' : 'solid'} var(--border)`,
      margin: `${my}px 0`
    }
  });
}

// Compact count formatter for social stats — 1284 → 1.3K, 3.45M → 3.4M.
// Keeps the number short so the four stat tiles stay uniform at any size.
function compactNum(n) {
  n = n || 0;
  if (n < 1000) return n.toLocaleString('en-IN');
  if (n < 1000000) {
    const v = n / 1000;
    return (v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v)) + 'K';
  }
  if (n < 1000000000) {
    const v = n / 1000000;
    return (v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v)) + 'M';
  }
  const v = n / 1000000000;
  return (v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v)) + 'B';
}
function Money({
  value,
  currency = '₹',
  strike = false,
  size
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontFeatureSettings: '"tnum" 1',
      fontWeight: 600,
      textDecoration: strike ? 'line-through' : 'none',
      color: strike ? 'var(--ink-faint)' : 'inherit',
      fontSize: size
    }
  }, currency, " ", value.toLocaleString('en-IN'));
}

// Quick-action button used under feed cards
function ActionBtn({
  icon,
  label,
  active,
  activeColor = 'var(--stamp-red)',
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onPointerDown: e => {
      e.currentTarget.style.transform = 'scale(0.82)';
    },
    onPointerUp: e => {
      e.currentTarget.style.transform = '';
    },
    onPointerLeave: e => {
      e.currentTarget.style.transform = '';
    },
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'none',
      border: 'none',
      padding: '4px 2px',
      cursor: 'pointer',
      color: active ? activeColor : 'var(--ink-mute)',
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      fontWeight: 500,
      transition: 'color 150ms, transform 120ms var(--ease-spring)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      transform: active ? 'scale(1)' : 'scale(1)',
      transition: 'transform 200ms var(--ease-spring)'
    }
  }, React.cloneElement(icon, {
    fill: active ? activeColor : 'none'
  })), label != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12
    }
  }, label));
}
Object.assign(window, {
  Ico,
  Icons,
  Avatar,
  Tag,
  PostTypeTag,
  VerifyBadge,
  TierChip,
  TrustSignals,
  Stars,
  statusLabel,
  Button,
  IconButton,
  CategoryChip,
  Segmented,
  Stamp,
  ProductPhoto,
  Divider,
  Money,
  compactNum,
  ActionBtn,
  QRCode
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/shared.jsx", error: String((e && e.message) || e) }); }

// app/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// web/Web.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// CollectorHub — Web shell (Instagram-style)
// Reuses every mobile screen/component. Swaps the chrome only:
//   bottom tab bar  →  left sidebar
//   device frame    →  centered feed column (+ right rail on Home)
// ─────────────────────────────────────────────────────────────

// Same route table as the mobile app (App.jsx)
const WEB_ROUTES = {
  feed: r => /*#__PURE__*/React.createElement(FeedView, null),
  market: r => /*#__PURE__*/React.createElement(MarketView, null),
  community: r => /*#__PURE__*/React.createElement(CommunityView, null),
  events: r => /*#__PURE__*/React.createElement(EventsView, null),
  profile: r => /*#__PURE__*/React.createElement(ProfileView, {
    route: r
  }),
  follows: r => /*#__PURE__*/React.createElement(FollowList, {
    route: r
  }),
  listing: r => /*#__PURE__*/React.createElement(ListingView, {
    route: r
  }),
  post: r => /*#__PURE__*/React.createElement(PostDetail, {
    route: r
  }),
  item: r => /*#__PURE__*/React.createElement(ItemDetail, {
    route: r
  }),
  'add-item': r => /*#__PURE__*/React.createElement(AddItemView, {
    route: r
  }),
  sell: r => /*#__PURE__*/React.createElement(SellView, {
    route: r
  }),
  'community-detail': r => /*#__PURE__*/React.createElement(CommunityDetail, {
    route: r
  }),
  event: r => /*#__PURE__*/React.createElement(EventDetail, {
    route: r
  }),
  inbox: r => /*#__PURE__*/React.createElement(InboxView, null),
  chat: r => /*#__PURE__*/React.createElement(ChatView, {
    route: r
  })
};

// ── Left sidebar ──────────────────────────────────────────────
function NavItem({
  icon,
  label,
  active,
  badge,
  onClick,
  avatar
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    className: "ch-nav",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      width: '100%',
      textAlign: 'left',
      border: 'none',
      cursor: 'pointer',
      borderRadius: 12,
      padding: '11px 12px',
      background: hover ? 'var(--bone)' : 'transparent',
      color: 'var(--ink)',
      fontFamily: 'var(--font-body)',
      transition: 'background 120ms'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'flex',
      flexShrink: 0
    }
  }, avatar || /*#__PURE__*/React.createElement(Ico, {
    d: icon,
    size: 25,
    stroke: active ? 2.4 : 1.8
  }), badge ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -5,
      right: -6,
      minWidth: 17,
      height: 17,
      padding: '0 4px',
      borderRadius: 999,
      background: 'var(--stamp-red)',
      color: 'var(--paper)',
      fontSize: 10,
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1.5px solid var(--paper)'
    }
  }, badge) : null), /*#__PURE__*/React.createElement("span", {
    className: "ch-nav-label",
    style: {
      fontSize: 16,
      fontWeight: active ? 700 : 500,
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap'
    }
  }, label));
}
function WebSidebar() {
  const {
    tab,
    switchTab,
    overlay,
    setOverlay
  } = useNav();
  const {
    readNotifs
  } = useAppState();
  const unread = NOTIFICATIONS.filter(n => n.unread && !readNotifs[n.id]).length;
  const onTab = id => tab === id && !overlay;
  return /*#__PURE__*/React.createElement("nav", {
    className: "ch-sidebar",
    style: {
      flexShrink: 0,
      height: '100vh',
      boxSizing: 'border-box',
      borderRight: '1px solid var(--border)',
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      padding: '26px 14px 22px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => switchTab('feed'),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      padding: '6px 12px 4px',
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(SealMark, {
    size: 30
  }), /*#__PURE__*/React.createElement("span", {
    className: "ch-nav-label",
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 23,
      letterSpacing: '-0.035em',
      color: 'var(--ink)'
    }
  }, "CollectorHub")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(NavItem, {
    icon: Icons.home,
    label: "Home",
    active: onTab('feed'),
    onClick: () => switchTab('feed')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: Icons.search,
    label: "Search",
    active: overlay && overlay.name === 'search',
    onClick: () => setOverlay({
      name: 'search'
    })
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: Icons.bag,
    label: "Market",
    active: onTab('market'),
    onClick: () => switchTab('market')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: Icons.users,
    label: "Community",
    active: onTab('community'),
    onClick: () => switchTab('community')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: Icons.calendar,
    label: "Events",
    active: onTab('events'),
    onClick: () => switchTab('events')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: Icons.bell,
    label: "Notifications",
    badge: unread || null,
    active: overlay && overlay.name === 'notifications',
    onClick: () => setOverlay({
      name: 'notifications'
    })
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: Icons.plusCircle,
    label: "Create",
    onClick: () => setOverlay({
      name: 'compose'
    })
  }), /*#__PURE__*/React.createElement(NavItem, {
    label: "Profile",
    active: onTab('me'),
    onClick: () => switchTab('me'),
    avatar: /*#__PURE__*/React.createElement(Avatar, {
      name: ME.name,
      color: ME.color,
      size: 26
    })
  })), /*#__PURE__*/React.createElement(NavItem, {
    icon: Icons.settings,
    label: "Settings",
    onClick: () => {
      if (window.chReset) window.chReset();
    }
  }));
}

// ── Right rail (Home only) ────────────────────────────────────
function RailFollow({
  handle
}) {
  const {
    followed,
    toggleFollow
  } = useAppState();
  const {
    push,
    flashToast
  } = useNav();
  const u = userOf(handle);
  const following = followed[handle];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'profile',
      user: handle
    }),
    style: {
      border: 'none',
      background: 'none',
      padding: 0,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: u.name,
    color: u.color,
    size: 42,
    verified: u.tier === 'Top Seller' || u.tier === 'Trusted'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: 'var(--ink)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, "@", u.handle), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, u.tier, " \xB7 ", u.deals, " deals")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      toggleFollow(handle);
      flashToast(following ? `Unfollowed @${u.handle}` : `Following @${u.handle}`);
    },
    style: {
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      flexShrink: 0,
      color: following ? 'var(--ink-faint)' : 'var(--stamp-red)',
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: 12.5
    }
  }, following ? 'Following' : 'Follow'));
}
function WebRightRail() {
  const {
    push
  } = useNav();
  const {
    followed
  } = useAppState();
  const suggestions = Object.keys(USERS).filter(h => !followed[h]).slice(0, 4);
  return /*#__PURE__*/React.createElement("aside", {
    className: "ch-rail",
    style: {
      width: 320,
      flexShrink: 0,
      paddingTop: 28,
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'profile',
      user: 'you'
    }),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      width: '100%',
      textAlign: 'left',
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      padding: '0 4px 22px'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: ME.name,
    color: ME.color,
    size: 50
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, "@", ME.handle), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)'
    }
  }, ME.name, " \xB7 ", ME.tier))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 6px 14px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: 'var(--ink-mute)'
    }
  }, "Suggested collectors"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, "See all")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: '0 6px'
    }
  }, suggestions.map(h => /*#__PURE__*/React.createElement(RailFollow, {
    key: h,
    handle: h
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-ghost)',
      lineHeight: 1.7,
      padding: '28px 6px 0'
    }
  }, "About \xB7 Help \xB7 Press \xB7 API \xB7 Communities \xB7 Events \xB7 Privacy \xB7 Terms", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      letterSpacing: '0.04em'
    }
  }, "\xA9 2026 CollectorHub")));
}

// ── Router (same stack model as the mobile app) ───────────────
function WebRouter() {
  const {
    tab,
    stacks,
    overlay
  } = useNav();
  const stack = stacks[tab];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden'
    }
  }, stack.map((route, i) => /*#__PURE__*/React.createElement("div", {
    key: tab + '-' + i + '-' + route.name,
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: i,
      visibility: i === stack.length - 1 ? 'visible' : 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StackedScreen, {
    depth: i
  }, (WEB_ROUTES[route.name] || WEB_ROUTES.feed)(route)))), overlay && overlay.name === 'compose' && /*#__PURE__*/React.createElement(ComposeOverlay, {
    community: overlay.community
  }), overlay && overlay.name === 'search' && /*#__PURE__*/React.createElement(SearchOverlay, null), overlay && overlay.name === 'notifications' && /*#__PURE__*/React.createElement(NotificationsOverlay, null), overlay && overlay.name === 'share' && /*#__PURE__*/React.createElement(ShareSheet, {
    label: overlay.label
  }), /*#__PURE__*/React.createElement(Toast, null));
}

// On the Home tab (root, no overlay) show the right rail beside the column.
// The middle column is ONE consistent width across every tab, sitting flush
// against the sidebar (Instagram-style).
const WEB_COL_W = 680;
function WebStage() {
  const {
    tab,
    stacks,
    overlay
  } = useNav();
  const stack = stacks[tab];
  const showRail = tab === 'feed' && stack.length === 1 && !overlay;
  return /*#__PURE__*/React.createElement("main", {
    className: "ch-main",
    style: {
      flex: 1,
      minWidth: 0,
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ch-content",
    style: {
      display: 'flex',
      gap: 32,
      height: '100vh',
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ch-col",
    style: {
      width: WEB_COL_W,
      flexShrink: 0,
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      borderRight: '1px solid var(--border)',
      background: 'var(--paper)'
    }
  }, /*#__PURE__*/React.createElement(WebRouter, null)), showRail && /*#__PURE__*/React.createElement(WebRightRail, null)));
}
function WebApp() {
  return /*#__PURE__*/React.createElement(AppStateProvider, null, /*#__PURE__*/React.createElement(NavProvider, null, /*#__PURE__*/React.createElement("div", {
    className: "ch-shell",
    style: {
      display: 'flex',
      width: '100%',
      minHeight: '100vh',
      background: 'var(--bone)',
      color: 'var(--ink)'
    }
  }, /*#__PURE__*/React.createElement(WebSidebar, null), /*#__PURE__*/React.createElement(WebStage, null))));
}
ReactDOM.createRoot(document.getElementById('web-mount')).render(/*#__PURE__*/React.createElement(WebApp, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "web/Web.jsx", error: String((e && e.message) || e) }); }

})();
