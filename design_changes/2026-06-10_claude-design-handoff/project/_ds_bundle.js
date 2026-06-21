/* @ds-bundle: {"format":3,"namespace":"CollectorHubDesignSystemRC_293274","components":[],"sourceHashes":{"app/AddToCollection.jsx":"6348945946a6","app/App.jsx":"708b3ded5536","app/Cards.jsx":"2c92d36924e5","app/Chat.jsx":"b27233d51b15","app/Chrome.jsx":"b5f2d3eb4fb9","app/CommunityDetail.jsx":"5a9b567e0014","app/CommunityView.jsx":"99f015fbe356","app/EventDetail.jsx":"444c6b947071","app/EventsView.jsx":"ca2419e165a3","app/FeedView.jsx":"3cba6b0bf7aa","app/IOSFrame.jsx":"d67eb3ffe562","app/ItemDetail.jsx":"1e54b3a42472","app/ListingView.jsx":"11155534c599","app/MarketView.jsx":"cbd573097816","app/Nav.jsx":"d7efcde6f490","app/Onboarding.jsx":"b343ddcad468","app/Overlays.jsx":"c1edbe9c4dbe","app/PostDetail.jsx":"02ed0b7a1d04","app/ProfileView.jsx":"8792909439be","app/data.jsx":"963d52c8f03e","app/shared.jsx":"fa47553f9549","app/tweaks-panel.jsx":"6591467622ed","web/Web.jsx":"9440fb51746e"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CollectorHubDesignSystemRC_293274 = window.CollectorHubDesignSystemRC_293274 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

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
    }, "Add to ", status))
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
  }), overlay && overlay.name === 'search' && /*#__PURE__*/React.createElement(SearchOverlay, null), overlay && overlay.name === 'notifications' && /*#__PURE__*/React.createElement(NotificationsOverlay, null), /*#__PURE__*/React.createElement(Toast, null));
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
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 14,
      color: 'var(--ink)'
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
  const {
    push
  } = useNav();
  const {
    hearted,
    saved,
    toggleHeart,
    toggleSave,
    flashToast
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
      borderBottom: '8px solid var(--bone)'
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
  }, post.type === 'review' && item && /*#__PURE__*/React.createElement("div", {
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
  }, "reviewing ", item.brand)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      lineHeight: 1.55,
      color: 'var(--ink-soft)'
    }
  }, post.body))), post.image && item && /*#__PURE__*/React.createElement("div", {
    onClick: open,
    style: {
      cursor: 'pointer',
      padding: '12px 16px 0'
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: post.tone,
    ratio: "3/2",
    label: item.sku
  })), post.type === 'poll' && post.poll && /*#__PURE__*/React.createElement(PollBlock, {
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
    onClick: () => flashToast('Link copied to clipboard')
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
  })), showComments && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border)',
      padding: '12px 16px 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13
    }
  }, [...baseComments, ...extra].map((cm, i) => {
    const cu = userOf(cm.user);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        gap: 9
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: cm.user === 'you' ? 'You' : cu.name,
      color: cm.user === 'you' ? 'var(--ink)' : cu.color,
      size: 30
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
        fontSize: 13,
        fontWeight: 600
      }
    }, cm.user === 'you' ? 'You' : cu.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--ink-faint)'
      }
    }, cm.time)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: 'var(--ink-soft)',
        lineHeight: 1.45,
        marginTop: 1
      }
    }, cm.body)));
  }), commentCount === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)'
    }
  }, "No comments yet \u2014 say something.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      alignItems: 'center',
      marginTop: 13
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "You",
    color: "var(--ink)",
    size: 30
  }), /*#__PURE__*/React.createElement("input", {
    value: draft,
    onChange: e => setDraft(e.target.value),
    onKeyDown: e => e.key === 'Enter' && addComment(),
    placeholder: "Add a comment\u2026",
    style: {
      flex: 1,
      height: 38,
      padding: '0 13px',
      borderRadius: 999,
      border: '1px solid var(--border-strong)',
      background: 'var(--paper-soft)',
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--ink)',
      outline: 'none'
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.send,
      size: 17
    }),
    active: !!draft.trim(),
    onClick: addComment
  }))));
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
    variant: "grail",
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.bell,
      size: 15
    }),
    onClick: () => flashToast('Wishlist alert set — we’ll ping you when it lists')
  }, "Notify me"))), item && /*#__PURE__*/React.createElement("button", {
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
  id
}) {
  const {
    push
  } = useNav();
  const {
    saved,
    toggleSave
  } = useAppState();
  const l = listingOf(id);
  const c = catOf(l.sku);
  const seller = userOf(l.seller);
  const isSaved = saved[id];
  const status = l.status;
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'listing',
      id
    }),
    style: {
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 14,
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
  })), status !== 'available' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 8,
      left: 8
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: status === 'sold' ? 'sold' : 'reserved'
  }, status)), l.trade && status === 'available' && /*#__PURE__*/React.createElement("div", {
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
      gap: 5,
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
    value: l.price
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
      gap: 5,
      fontSize: 11,
      color: 'var(--ink-faint)'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: seller.name,
    color: seller.color,
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, seller.rating, "\u2605 \xB7 ", seller.deals, " deals"))));
}

// ── Event card — BRD §9.13 ────────────────────────────────────
function EventCard({
  ev,
  onOpen
}) {
  const {
    interested
  } = useAppState();
  const going = interested[ev.id];
  return /*#__PURE__*/React.createElement("button", {
    onClick: onOpen,
    style: {
      display: 'flex',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      alignItems: 'stretch',
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: 12,
      cursor: 'pointer'
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
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: ev.mode === 'Online' ? 'vouch' : 'event'
  }, ev.mode), going && /*#__PURE__*/React.createElement(Tag, {
    kind: "sold"
  }, "Going")), /*#__PURE__*/React.createElement("div", {
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
  }), ev.when, " \xB7 ", ev.interested, " interested")));
}

// ── Community card — BRD §9.12 ────────────────────────────────
function CommunityCard({
  com,
  onOpen
}) {
  const {
    joined,
    toggleJoin,
    flashToast
  } = {
    ...useAppState(),
    ...useNav()
  };
  const isJoined = joined[com.id];
  const tones = {
    plum: 'var(--plum)',
    forest: 'var(--forest)',
    teal: 'var(--verified-teal)',
    red: 'var(--stamp-red)',
    ink: 'var(--ink)'
  };
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
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 14.5,
      color: 'var(--ink)'
    }
  }, com.name), com.invite && /*#__PURE__*/React.createElement(Tag, {
    kind: "reserved"
  }, "Invite")), /*#__PURE__*/React.createElement("div", {
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
  }, com.members.toLocaleString('en-IN'), " members")), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: isJoined ? 'secondary' : 'dark',
    onClick: () => {
      toggleJoin(com.id);
      flashToast(isJoined ? `Left ${com.name}` : `Joined ${com.name}`);
    }
  }, isJoined ? 'Joined' : com.invite ? 'Request' : 'Join'));
}
Object.assign(window, {
  AuthorLine,
  PostCard,
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
        fontWeight: 600
      }
    }, u.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-faint)',
        marginLeft: 'auto'
      }
    }, c.time)), l && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-faint)',
        fontFamily: 'var(--font-mono)',
        margin: '2px 0'
      }
    }, "re: ", catOf(l.sku).sku), /*#__PURE__*/React.createElement("div", {
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
  const dealState = deals[handle];
  const [makePublic, setMakePublic] = React.useState(false); // opt-in public thread (v1.2 §9.10)
  const [draft, setDraft] = React.useState(route.intent === 'trade' ? `Hi! Would you trade the ${l ? catOf(l.sku).brand : 'item'}? I can offer a sealed piece.` : route.intent === 'buy' && l ? `Hi! Is the ${catOf(l.sku).brand} still available?` : '');
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
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    bodyRef: bodyRef,
    bg: "var(--bone)",
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: u.name,
      subtitle: makePublic ? 'Public thread · visible to all' : `${u.rating}★ · ${u.deals} deals · ${u.response}`,
      trailing: /*#__PURE__*/React.createElement(IconButton, {
        icon: /*#__PURE__*/React.createElement(Ico, {
          d: makePublic ? Icons.eye : Icons.more,
          size: 18
        }),
        onClick: () => flashToast('Block · report')
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
        color: 'var(--ink-mute)'
      }
    }, "Rate this trade:"), /*#__PURE__*/React.createElement(Stars, {
      n: 5,
      size: 18
    }), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "teal",
      style: {
        marginLeft: 'auto'
      },
      onClick: () => flashToast('Trade vouch left for @' + u.handle)
    }, "Leave vouch"))), /*#__PURE__*/React.createElement("div", {
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
      onClick: () => flashToast('Attach item · photo · offer')
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
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      margin: '12px 14px 0',
      padding: '11px 13px',
      background: makePublic ? 'var(--verified-teal-soft)' : 'var(--paper)',
      border: `1px solid ${makePublic ? 'var(--verified-teal)' : 'var(--border)'}`,
      borderRadius: 13
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: makePublic ? Icons.eye : Icons.eyeOff,
    size: 18,
    style: {
      color: makePublic ? 'var(--verified-teal)' : 'var(--ink-faint)',
      flexShrink: 0
    }
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
  }, makePublic ? 'Public thread' : 'Make thread public'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      lineHeight: 1.4
    }
  }, makePublic ? 'Anyone can read this Q&A on the listing. No private info shared.' : 'Let other buyers see your questions & the seller’s answers.')), /*#__PURE__*/React.createElement(Toggle, {
    on: makePublic,
    onClick: () => {
      setMakePublic(v => !v);
      flashToast(makePublic ? 'Thread is private again' : 'Thread is now public · both of you must opt in');
    }
  })), l && /*#__PURE__*/React.createElement("button", {
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
    tone: catOf(l.sku).tone,
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
  }, catOf(l.sku).title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: l.price
  }), " \xB7 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-faint)'
    }
  }, l.condition.split('·')[0]))), /*#__PURE__*/React.createElement(VerifyBadge, {
    tier: l.verify
  })), /*#__PURE__*/React.createElement("div", {
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
  }, "First time trading with @", u.handle, "? Deals complete off-platform \u2014 check trust signals & ask for an in-hand video."));
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
  wordmark = false
}) {
  const {
    setOverlay,
    push
  } = useNav();
  const {
    readNotifs
  } = useAppState();
  const unread = NOTIFICATIONS.filter(n => n.unread && !readNotifs[n.id]).length;
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
  }))));
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
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '5px 0 2px',
        border: 'none',
        background: 'transparent',
        color: active ? 'var(--ink)' : 'var(--ink-faint)',
        fontWeight: active ? 600 : 500,
        fontSize: 10,
        cursor: 'pointer',
        position: 'relative',
        fontFamily: 'var(--font-body)'
      }
    }, active && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: -8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 22,
        height: 3,
        background: 'var(--stamp-red)',
        borderRadius: '0 0 4px 4px'
      }
    }), /*#__PURE__*/React.createElement(Ico, {
      d: t.icon,
      size: 23,
      stroke: active ? 2 : 1.75
    }), t.label);
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
// Community detail — BRD §9.12
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
    toggleJoin
  } = useAppState();
  const com = COMMUNITIES.find(c => c.id === route.id);
  const isJoined = joined[com.id];
  const founder = userOf(com.founder);
  const [tab, setTab] = React.useState('posts');
  const [accepted, setAccepted] = React.useState(false); // guidelines gate (v1.2 §9.12)
  const postMode = postModeOf(com.id);
  const admins = adminsOf(com.id);
  const tones = {
    plum: 'var(--plum)',
    forest: 'var(--forest)',
    teal: 'var(--verified-teal)',
    red: 'var(--stamp-red)',
    ink: 'var(--ink)'
  };
  const posts = POSTS.filter(p => p.community === com.id);
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
      onClick: () => flashToast('Invite link copied')
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 132,
      background: tones[com.tone],
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
      background: tones[com.tone],
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
      paddingBottom: 4
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: isJoined ? 'secondary' : 'dark',
    style: {
      float: 'right'
    },
    onClick: () => {
      toggleJoin(com.id);
      flashToast(isJoined ? `Left ${com.name}` : `Joined ${com.name}`);
    }
  }, isJoined ? 'Joined' : com.invite ? 'Request invite' : 'Join'))), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 23,
      letterSpacing: '-0.025em',
      margin: '12px 0 4px'
    }
  }, com.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--ink-mute)',
      lineHeight: 1.5
    }
  }, com.short), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      marginTop: 10,
      fontSize: 12.5,
      color: 'var(--ink-faint)'
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
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
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
  }, postMode === 'approval' ? 'Posts reviewed by admins' : 'Open posting'))), /*#__PURE__*/React.createElement("div", {
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
    value: tab,
    onChange: setTab,
    options: [{
      id: 'posts',
      label: 'Posts'
    }, {
      id: 'about',
      label: 'Rules & info'
    }]
  })), tab === 'posts' ? /*#__PURE__*/React.createElement("div", null, isJoined && (accepted ? /*#__PURE__*/React.createElement("button", {
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
  }, postMode === 'approval' ? `Suggest a post to ${com.name}…` : `Share something with ${com.name}…`)) :
  /*#__PURE__*/
  /* guidelines-accept gate (v1.2 §9.12) */
  React.createElement("div", {
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
  }, "Accept & continue")))), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '8px 0 0'
    }
  }, posts.map(p => /*#__PURE__*/React.createElement(PostCard, {
    key: p.id,
    post: p
  })), posts.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, "Quiet so far \u2014 be the first to post."))) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Community rules"), /*#__PURE__*/React.createElement("div", {
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
  }, r)))), isJoined && !accepted && /*#__PURE__*/React.createElement(Button, {
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
  }), "You\u2019ve accepted these guidelines."), /*#__PURE__*/React.createElement("div", {
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
    const au = userOf(a.handle);
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
    }, au.name), /*#__PURE__*/React.createElement(TierChip, {
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
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  }));
}
Object.assign(window, {
  CommunityDetail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/CommunityDetail.jsx", error: String((e && e.message) || e) }); }

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
    joined
  } = useAppState();
  const [cat, setCat] = React.useState('all');
  const joinedList = COMMUNITIES.filter(c => joined[c.id]);
  let discover = COMMUNITIES.filter(c => !joined[c.id]);
  if (cat !== 'all') discover = discover.filter(c => c.cat === cat);
  return /*#__PURE__*/React.createElement(Screen, {
    header: /*#__PURE__*/React.createElement(AppBar, {
      title: "Community"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 0'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOverlay({
      name: 'search'
    }),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      width: '100%',
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
  }), "Find a community\u2026")), joinedList.length > 0 && /*#__PURE__*/React.createElement("div", {
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
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement(CategoryChip, {
    active: cat === 'all',
    onClick: () => setCat('all')
  }, "All"), CATEGORIES.map(c => /*#__PURE__*/React.createElement(CategoryChip, {
    key: c.id,
    active: cat === c.id,
    onClick: () => setCat(c.id)
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
  })), discover.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, "You\u2019ve joined everything in this category."))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 16px 28px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => flashToast('Community request sent for review'),
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: '100%',
      height: 46,
      borderRadius: 12,
      border: '1px dashed var(--border-strong)',
      background: 'transparent',
      color: 'var(--ink-mute)',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.plusCircle,
    size: 18
  }), "Request a new community")));
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

// app/EventDetail.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Event detail — BRD §9.13
// ─────────────────────────────────────────────────────────────

function EventDetail({
  route
}) {
  const {
    push,
    flashToast
  } = useNav();
  const {
    interested,
    toggleInterested
  } = useAppState();
  const ev = EVENTS.find(e => e.id === route.id);
  const com = COMMUNITIES.find(c => c.id === ev.community);
  const host = userOf(ev.host);
  const going = interested[ev.id];
  const [ticket, setTicket] = React.useState(false); // free QR ticket (v1.2 §9.13)
  const ticketCode = `CH-${ev.id.toUpperCase()}-${(ME.handle || 'you').slice(0, 4).toUpperCase()}-0142`;
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: null,
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--paper)',
        padding: '12px 16px 30px',
        display: 'flex',
        gap: 10,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        fontSize: 15
      }
    }, ev.interested + (going ? 1 : 0)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-faint)'
      }
    }, "interested")), ticket ? /*#__PURE__*/React.createElement(Button, {
      variant: "teal",
      size: "lg",
      style: {
        flex: 2,
        justifyContent: 'center'
      },
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.ticket,
        size: 18
      }),
      onClick: () => flashToast('Show this QR at the door — entry is free')
    }, "View ticket") : /*#__PURE__*/React.createElement(Button, {
      variant: going ? 'primary' : 'secondary',
      size: "lg",
      style: {
        flex: 2,
        justifyContent: 'center'
      },
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.ticket,
        size: 18
      }),
      onClick: () => {
        setTicket(true);
        if (!going) toggleInterested(ev.id);
        flashToast('Free ticket booked · QR code added');
      }
    }, "Get free ticket"))
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
      onClick: () => flashToast('Event link copied')
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
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
  }, /*#__PURE__*/React.createElement(Tag, {
    kind: ev.mode === 'Online' ? 'vouch' : 'event',
    style: {
      marginBottom: 6
    }
  }, ev.mode), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 22,
      letterSpacing: '-0.02em',
      lineHeight: 1.1
    }
  }, ev.title)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, ticket && /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border)',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 18,
      background: 'var(--paper)',
      boxShadow: 'var(--shadow-1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--ink)',
      color: 'var(--paper)',
      padding: '11px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.ticket,
    size: 17
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 14,
      letterSpacing: '0.02em'
    }
  }, "FREE ENTRY TICKET"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      opacity: 0.7
    }
  }, "\xD7 1")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      padding: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(QRCode, {
    seed: ticketCode,
    size: 118
  }), /*#__PURE__*/React.createElement("div", {
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
      lineHeight: 1.15
    }
  }, ev.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      marginTop: 4
    }
  }, ev.month, " ", ev.date, " \xB7 ", ev.when.split('·')[1] || ev.when), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)'
    }
  }, ev.where), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--ink-mute)',
      marginTop: 8,
      letterSpacing: '0.04em'
    }
  }, ticketCode))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px dashed var(--border-strong)',
      padding: '9px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      background: 'var(--paper-soft)'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.info,
    size: 13,
    style: {
      color: 'var(--ink-faint)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-faint)'
    }
  }, "Scanned at the door. No payment \u2014 tickets are always free in Phase 1."))), /*#__PURE__*/React.createElement("div", {
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
    sub: "Add to calendar"
  }), /*#__PURE__*/React.createElement(DetailRow, {
    icon: ev.mode === 'Online' ? Icons.globe : Icons.pin,
    title: ev.where,
    sub: ev.city,
    last: true
  })), /*#__PURE__*/React.createElement(SectionLabel, null, "About"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.6,
      color: 'var(--ink-soft)',
      margin: '10px 0 18px'
    }
  }, ev.about), com && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionLabel, null, "Hosted by"), /*#__PURE__*/React.createElement("button", {
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
    verified: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, ev.title.includes('Online') ? host.name : com.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)'
    }
  }, "Organised by @", host.handle)), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 18,
    stroke: 2,
    style: {
      transform: 'rotate(180deg)',
      color: 'var(--ink-faint)'
    }
  })))));
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

// app/EventsView.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Events — BRD §9.13
// Upcoming events list (admin + user-created), interested/save.
// ─────────────────────────────────────────────────────────────

function EventsView() {
  const {
    push,
    flashToast
  } = useNav();
  const [scope, setScope] = React.useState('all');
  let list = EVENTS;
  if (scope === 'person') list = EVENTS.filter(e => e.mode === 'In person');
  if (scope === 'online') list = EVENTS.filter(e => e.mode === 'Online');
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
  }, /*#__PURE__*/React.createElement(Segmented, {
    options: [{
      id: 'all',
      label: 'All'
    }, {
      id: 'person',
      label: 'In person'
    }, {
      id: 'online',
      label: 'Online'
    }],
    value: scope,
    onChange: setScope
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 0'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Next up"), /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'event',
      id: list[0].id
    }),
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
    tone: "plum",
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
    kind: list[0].mode === 'Online' ? 'vouch' : 'event'
  }, list[0].mode)), /*#__PURE__*/React.createElement("div", {
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
  }, list[0].title), /*#__PURE__*/React.createElement("div", {
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
  }), list[0].when))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 16px 0'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Upcoming"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 11,
      marginTop: 10
    }
  }, list.slice(1).map(ev => /*#__PURE__*/React.createElement(EventCard, {
    key: ev.id,
    ev: ev,
    onOpen: () => push({
      name: 'event',
      id: ev.id
    })
  })), list.length <= 1 && /*#__PURE__*/React.createElement(EmptyNote, null, "No more events in this view. Try \u201CAll\u201D."))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 16px 28px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => flashToast('Event submitted for approval'),
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: '100%',
      height: 46,
      borderRadius: 12,
      border: '1px dashed var(--border-strong)',
      background: 'transparent',
      color: 'var(--ink-mute)',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.plusCircle,
    size: 18
  }), "Create an event"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 11.5,
      color: 'var(--ink-faint)',
      marginTop: 8
    }
  }, "User events are reviewed before they go live.")));
}
Object.assign(window, {
  EventsView
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
  }, mine.status), mine && mine.listed && /*#__PURE__*/React.createElement(Tag, {
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
    flashToast
  } = useNav();
  const {
    saved,
    toggleSave,
    listingStatus
  } = useAppState();
  const l = listingOf(route.id);
  const c = catOf(l.sku);
  const seller = userOf(l.seller);
  const status = listingStatus[l.id] || l.status;
  const isSaved = saved[l.id];
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
      onClick: () => flashToast('Link copied')
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
  }, status)))), /*#__PURE__*/React.createElement("div", {
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
  }, t))))), /*#__PURE__*/React.createElement(SectionLabel, null, "Seller"), /*#__PURE__*/React.createElement("button", {
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
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 15
    }
  }, seller.name), /*#__PURE__*/React.createElement(TierChip, {
    tier: seller.tier
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      marginTop: 1
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
  }, /*#__PURE__*/React.createElement("b", null, "Safe trading:"), " deals complete off-platform in Phase 1. CollectorHub doesn\u2019t hold payments. Always check trust signals, ask for an in-hand video, and never pay before you\u2019ve verified the seller."))));
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
  SpecRow,
  Stepper
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/ListingView.jsx", error: String((e && e.message) || e) }); }

// app/MarketView.jsx
try { (() => {
// ─────────────────────────────────────────────────────────────
// Marketplace (Browse) — BRD §9.8
// Grid of listings, search entry, category + filters, sort.
// ─────────────────────────────────────────────────────────────

function MarketView() {
  const {
    setOverlay
  } = useNav();
  const [cat, setCat] = React.useState('all');
  const [sort, setSort] = React.useState('new');
  const [tradeOnly, setTradeOnly] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const list = React.useMemo(() => {
    let l = LISTINGS.filter(x => x.status !== 'sold');
    if (cat !== 'all') l = l.filter(x => catOf(x.sku).cat === cat);
    if (tradeOnly) l = l.filter(x => x.trade);
    if (sort === 'low') l = [...l].sort((a, b) => a.price - b.price);
    if (sort === 'high') l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [cat, sort, tradeOnly]);
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
      borderBottom: '1px solid var(--border)',
      padding: '10px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
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
  }), "Search items, brands, sellers\u2026"), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.filter,
      size: 18
    }),
    active: showFilters || tradeOnly,
    onClick: () => setShowFilters(v => !v)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      marginTop: 10,
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement(CategoryChip, {
    active: cat === 'all',
    onClick: () => setCat('all')
  }, "All"), CATEGORIES.map(c => /*#__PURE__*/React.createElement(CategoryChip, {
    key: c.id,
    active: cat === c.id,
    onClick: () => setCat(c.id)
  }, c.short))), showFilters && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    style: {
      flex: 1
    },
    options: [{
      id: 'new',
      label: 'Newest'
    }, {
      id: 'low',
      label: 'Price ↑'
    }, {
      id: 'high',
      label: 'Price ↓'
    }],
    value: sort,
    onChange: setSort
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setTradeOnly(v => !v),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      height: 34,
      padding: '0 12px',
      borderRadius: 9,
      border: `1px solid ${tradeOnly ? 'var(--ink)' : 'var(--border-strong)'}`,
      background: tradeOnly ? 'var(--ink)' : 'var(--paper-soft)',
      color: tradeOnly ? 'var(--paper)' : 'var(--ink)',
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: 13,
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.swap,
    size: 15
  }), "Trade"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCat('diecast');
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: 'calc(100% - 32px)',
      margin: '12px 16px 0',
      background: 'var(--verified-teal-soft)',
      border: '1px solid var(--verified-teal)',
      borderRadius: 12,
      padding: '10px 12px',
      cursor: 'pointer',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      background: 'var(--verified-teal)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.bell,
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--verified-teal)'
    }
  }, "2 wishlist matches just listed"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-mute)'
    }
  }, "A Skullpanda case & a Mini GT R35 you want are live now.")), /*#__PURE__*/React.createElement(Ico, {
    d: Icons.back,
    size: 16,
    stroke: 2,
    style: {
      transform: 'rotate(180deg)',
      color: 'var(--verified-teal)'
    }
  })), /*#__PURE__*/React.createElement("div", {
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
  }, list.length, " LISTINGS"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-faint)'
    }
  }, "tuned to your interests")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      padding: '0 16px 28px'
    }
  }, list.map(l => /*#__PURE__*/React.createElement(MarketCard, {
    key: l.id,
    id: l.id
  })), list.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1',
      textAlign: 'center',
      padding: '40px 0',
      color: 'var(--ink-faint)'
    }
  }, "No results \u2014 try broadening your filters.")));
}
Object.assign(window, {
  MarketView
});
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
    jdm: true
  });
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
  const [posts, setPosts] = React.useState([]); // user-created posts (prepended to feed)

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
  const toggleInterested = id => setInterested(r => ({
    ...r,
    [id]: !r[id]
  }));
  const toggleWish = id => setWishAlerts(w => ({
    ...w,
    [id]: !w[id]
  }));
  const markNotifsRead = () => setReadNotifs(NOTIFICATIONS.reduce((a, n) => (a[n.id] = true, a), {}));
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
  const value = {
    hearted,
    saved,
    followed,
    joined,
    interested,
    wishAlerts,
    readNotifs,
    threads,
    deals,
    listingStatus,
    posts,
    toggleHeart,
    toggleSave,
    toggleFollow,
    toggleJoin,
    toggleInterested,
    toggleWish,
    markNotifsRead,
    sendMessage,
    requestDeal,
    confirmDeal,
    setListing,
    addPost
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
    flashToast
  } = useNav();
  const {
    addPost
  } = useAppState();
  const [kind, setKind] = React.useState(null); // null = choose Post vs Listing first
  const [type, setType] = React.useState(null); // pick a type FIRST (v1.2)
  const [body, setBody] = React.useState('');
  const [withImage, setWithImage] = React.useState(false);
  const [refSku, setRefSku] = React.useState('MMS601');
  const [com, setCom] = React.useState(community || '');
  const [choices, setChoices] = React.useState(['', '']);
  const item = catOf(refSku);
  const pollValid = choices.filter(c => c.trim()).length >= 2;
  const canPost = type === 'poll' ? body.trim() && pollValid : true;
  const pick = t => {
    setType(t);
    setWithImage(t === 'showcase' || t === 'review');
  };
  const publish = () => {
    if (type === 'poll' && !pollValid) {
      flashToast('A poll needs at least two choices');
      return;
    }
    const poll = type === 'poll' ? choices.filter(c => c.trim()).map(l => ({
      label: l,
      votes: 0
    })) : null;
    addPost({
      type,
      body: body.trim() || 'Just added this to the shelf.',
      user: 'you',
      community: com || null,
      refSku: type !== 'poll' && withImage ? refSku : null,
      tone: item.tone,
      image: type !== 'poll' && withImage,
      cat: item.cat,
      poll
    });
    setOverlay(null);
    flashToast(type === 'poll' ? 'Poll posted to your feed' : 'Posted to your feed');
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
      label: 'Create a Listing',
      desc: 'List an item for sale on the marketplace.',
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
      onClick: () => setKind(o.id),
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

  // ── Stage 1: choose a post type first ──
  if (!type) {
    const TYPES = [{
      id: 'showcase',
      label: 'Showcase',
      desc: 'Show off a piece from your collection.',
      c: 'var(--verified-teal)',
      icon: Icons.camera
    }, {
      id: 'discussion',
      label: 'Discussion',
      desc: 'Ask the community a question.',
      c: 'var(--plum)',
      icon: Icons.comment
    }, {
      id: 'review',
      label: 'Review',
      desc: 'Rate & review an item you own.',
      c: 'var(--grail-gold-deep)',
      icon: Icons.star
    }, {
      id: 'poll',
      label: 'Poll',
      desc: 'Put a question to a vote.',
      c: 'var(--stamp-red)',
      icon: Icons.chart
    }];
    return /*#__PURE__*/React.createElement(OverlayShell, {
      title: "Create a Post",
      onBack: () => setKind(null),
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
    }, "What are you posting? Selling isn\u2019t here \u2014 list from an item."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, TYPES.map(t => /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => pick(t.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        background: 'var(--paper-soft)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 44,
        height: 44,
        borderRadius: 11,
        background: t.c,
        color: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: t.icon,
      size: 21
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 16,
        letterSpacing: '-0.01em'
      }
    }, t.label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-faint)',
        marginTop: 1
      }
    }, t.desc)), /*#__PURE__*/React.createElement(Ico, {
      d: Icons.back,
      size: 18,
      stroke: 2,
      style: {
        transform: 'rotate(180deg)',
        color: 'var(--ink-faint)'
      }
    }))))));
  }
  const typeLabel = {
    showcase: 'Showcase',
    discussion: 'Discussion',
    review: 'Review',
    poll: 'Poll'
  }[type];

  // ── Stage 2: compose ──
  return /*#__PURE__*/React.createElement(OverlayShell, {
    title: "Create a Post",
    onBack: () => setType(null),
    onClose: () => setOverlay(null),
    trailing: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "primary",
      onClick: publish,
      disabled: !canPost
    }, "Post")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(PostTypeTag, {
    type: type === 'poll' ? 'discussion' : type
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16
    }
  }, typeLabel), /*#__PURE__*/React.createElement("button", {
    onClick: () => setType(null),
    style: {
      marginLeft: 'auto',
      background: 'none',
      border: 'none',
      color: 'var(--stamp-red)',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 13,
      cursor: 'pointer'
    }
  }, "Change type")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "You",
    color: "var(--ink)",
    size: 38
  }), /*#__PURE__*/React.createElement("textarea", {
    autoFocus: true,
    value: body,
    onChange: e => setBody(e.target.value),
    rows: type === 'poll' ? 2 : 4,
    placeholder: type === 'poll' ? 'Ask your question…' : type === 'discussion' ? 'What’s on your mind?' : 'Say something about it…',
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      resize: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      lineHeight: 1.5,
      color: 'var(--ink)',
      paddingTop: 7
    }
  })), type === 'poll' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
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
  }, "A poll needs at least two choices.")), type !== 'poll' && /*#__PURE__*/React.createElement(React.Fragment, null, withImage && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: item.tone,
    ratio: "3/2",
    label: item.sku
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setWithImage(false),
    style: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: '50%',
      border: 'none',
      background: 'rgba(20,17,15,0.6)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.close,
    size: 15
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Reference an item")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 10,
      overflowX: 'auto',
      paddingBottom: 2
    }
  }, CATALOGUE.slice(0, 6).map(c => /*#__PURE__*/React.createElement("button", {
    key: c.sku,
    onClick: () => {
      setRefSku(c.sku);
      setWithImage(true);
    },
    style: {
      width: 58,
      flexShrink: 0,
      border: refSku === c.sku ? '2px solid var(--stamp-red)' : '2px solid transparent',
      borderRadius: 10,
      overflow: 'hidden',
      cursor: 'pointer',
      padding: 0,
      background: 'none'
    }
  }, /*#__PURE__*/React.createElement(ProductPhoto, {
    tone: c.tone,
    ratio: "1/1",
    rounded: 8
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(ComposeTool, {
    icon: Icons.gallery,
    label: "Photo",
    onClick: () => setWithImage(true)
  }), /*#__PURE__*/React.createElement(ComposeTool, {
    icon: Icons.camera,
    label: "Camera"
  }), /*#__PURE__*/React.createElement(ComposeTool, {
    icon: Icons.tag,
    label: "Tag"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
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
  const showItems = scope === 'all' || scope === 'items';
  const showPeople = scope === 'all' || scope === 'people';
  const showComs = scope === 'all' || scope === 'communities';
  const showEvs = scope === 'all' || scope === 'events';
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
    placeholder: "Items, people, communities, events\u2026",
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
  }, [{
    id: 'all',
    label: 'All'
  }, {
    id: 'items',
    label: 'Items'
  }, {
    id: 'people',
    label: 'People'
  }, {
    id: 'communities',
    label: 'Communities'
  }, {
    id: 'events',
    label: 'Events'
  }].map(s => /*#__PURE__*/React.createElement(CategoryChip, {
    key: s.id,
    active: scope === s.id,
    onClick: () => setScope(s.id)
  }, s.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '8px 16px 24px'
    }
  }, showItems && items.length > 0 && /*#__PURE__*/React.createElement(ResGroup, {
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
    sub: `@${u.handle} · ${u.deals} deals · ${u.rating}★`
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
    markNotifsRead
  } = useAppState();
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
  const unreadIn = cat => NOTIFICATIONS.filter(n => n.unread && !readNotifs[n.id] && (cat.kinds ? cat.kinds.includes(n.kind) : !CLAIMED_KINDS.includes(n.kind))).length;
  const activeCat = NOTIF_CATS.find(c => c.id === active);
  // filtered by category when one is active; otherwise the full activity feed
  const shown = activeCat ? NOTIFICATIONS.filter(n => activeCat.kinds ? activeCat.kinds.includes(n.kind) : !CLAIMED_KINDS.includes(n.kind)) : NOTIFICATIONS;
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
Object.assign(window, {
  OverlayShell,
  ComposeOverlay,
  ComposeTool,
  SearchOverlay,
  NotificationsOverlay,
  ResGroup,
  ResRow
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
    flashToast
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
  const [draft, setDraft] = React.useState('');
  const [extra, setExtra] = React.useState([]);
  return /*#__PURE__*/React.createElement(Screen, {
    nav: false,
    header: /*#__PURE__*/React.createElement(DetailHeader, {
      title: "Post"
    }),
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        background: 'var(--paper)',
        padding: '10px 14px 30px',
        display: 'flex',
        gap: 9,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "You",
      color: "var(--ink)",
      size: 32
    }), /*#__PURE__*/React.createElement("input", {
      value: draft,
      onChange: e => setDraft(e.target.value),
      placeholder: "Add a comment\u2026",
      style: {
        flex: 1,
        height: 40,
        padding: '0 14px',
        borderRadius: 999,
        border: '1px solid var(--border-strong)',
        background: 'var(--paper-soft)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'var(--ink)',
        outline: 'none'
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Ico, {
        d: Icons.send,
        size: 18
      }),
      active: !!draft.trim(),
      onClick: () => {
        if (draft.trim()) {
          setExtra(x => [...x, {
            user: 'you',
            time: 'now',
            body: draft.trim()
          }]);
          setDraft('');
        }
      }
    }))
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
    label: comments.length + extra.length
  }), /*#__PURE__*/React.createElement(ActionBtn, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.share,
      size: 20
    }),
    onClick: () => flashToast('Link copied')
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
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 16px 24px'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, comments.length + extra.length, " comments"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, [...comments, ...extra].map((cm, i) => {
    const cu = userOf(cm.user);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: cm.user === 'you' ? 'You' : cu.name,
      color: cm.user === 'you' ? 'var(--ink)' : cu.color,
      size: 34
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13.5,
        fontWeight: 600
      }
    }, cm.user === 'you' ? 'You' : cu.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-faint)'
      }
    }, cm.time)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--ink-soft)',
        lineHeight: 1.5,
        marginTop: 2
      }
    }, cm.body)));
  }))));
}
Object.assign(window, {
  PostDetail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/PostDetail.jsx", error: String((e && e.message) || e) }); }

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
  const u = isMe ? ME : userOf(handle);
  const {
    push,
    pop,
    flashToast,
    setOverlay
  } = useNav();
  const {
    followed,
    toggleFollow,
    joined
  } = useAppState();
  const [tab, setTab] = React.useState('collection');
  const isFollowing = followed[handle];
  const myItems = MY_ITEMS;
  const myCommunities = COMMUNITIES.filter(c => joined[c.id]);
  const myPosts = isMe ? POSTS.filter(p => p.user === 'meera').slice(0, 0) : POSTS.filter(p => p.user === handle);
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
      onClick: () => flashToast('Report / block')
    })
  });
  return /*#__PURE__*/React.createElement(Screen, {
    header: header,
    nav: isMe
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 16px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: u.name,
    color: u.color,
    size: 68
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      paddingTop: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 21,
      letterSpacing: '-0.02em'
    }
  }, u.name), /*#__PURE__*/React.createElement(TierChip, {
    tier: u.tier
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--ink-faint)'
    }
  }, "@", u.handle, " \xB7 ", u.city)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: presenceOf(u.handle) === 'Online now' ? 'var(--forest)' : 'var(--ink-ghost)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: presenceOf(u.handle) === 'Online now' ? 'var(--forest)' : 'var(--ink-faint)',
      fontWeight: presenceOf(u.handle) === 'Online now' ? 600 : 400
    }
  }, presenceOf(u.handle))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    n: u.followers,
    l: "followers",
    onClick: () => push({
      name: 'follows',
      user: u.handle,
      mode: 'followers'
    })
  }), /*#__PURE__*/React.createElement(Stat, {
    n: u.following,
    l: "following",
    onClick: () => push({
      name: 'follows',
      user: u.handle,
      mode: 'following'
    })
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--ink-soft)',
      lineHeight: 1.5,
      marginTop: 12
    }
  }, u.bio), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '4px 8px',
      marginTop: 10,
      fontSize: 12.5,
      color: 'var(--ink-mute)'
    }
  }, ownStats(u).map((s, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-ghost)'
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink)',
      fontFamily: 'var(--font-mono)'
    }
  }, s.split(' ')[0]), " ", s.split(' ').slice(1).join(' ')))), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-ghost)'
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, "portfolio ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink)'
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: u.portfolio
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--paper-soft)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '14px 16px',
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(TrustSignals, {
    u: u
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      marginTop: 14
    }
  }, isMe ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
    variant: "dark",
    style: {
      flex: 1,
      justifyContent: 'center'
    },
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.edit,
      size: 16
    }),
    onClick: () => flashToast('Edit profile & interests')
  }, "Edit profile"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.plusCircle,
      size: 17
    }),
    onClick: () => push({
      name: 'add-item'
    })
  }, "Add item"), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.settings,
      size: 18
    }),
    onClick: () => {
      if (window.chReset) window.chReset();
    }
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
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
    variant: "primary",
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
  }, "Message"), /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Ico, {
      d: Icons.shield,
      size: 18
    }),
    onClick: () => flashToast('Trade vouch needs a confirmed deal first')
  })))), /*#__PURE__*/React.createElement("div", {
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
    }]
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
  }, myPosts.map(p => /*#__PURE__*/React.createElement(PostCard, {
    key: p.id,
    post: p
  }))) : /*#__PURE__*/React.createElement(EmptyNote, null, isMe ? 'You haven’t posted yet. Tap + to showcase a piece.' : 'No posts yet.')), tab === 'communities' && /*#__PURE__*/React.createElement("div", {
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
  })), myCommunities.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, "Not in any community yet.")), tab === 'trades' && /*#__PURE__*/React.createElement(TradesTab, null)));
}
function Stat({
  n,
  l,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 5,
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: onClick ? 'pointer' : 'default'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 15,
      fontFeatureSettings: '"tnum" 1',
      color: 'var(--ink)'
    }
  }, n.toLocaleString('en-IN')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)'
    }
  }, l));
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
  const owned = items.filter(i => i.status !== 'wishlist');
  const ownedValue = items.filter(i => i.status === 'owned').reduce((s, i) => s + i.value, 0);
  const filtered = items.filter(i => i.status === seg);
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
    label: "Portfolio value",
    value: ownedValue,
    accent: "var(--stamp-red)"
  }), /*#__PURE__*/React.createElement(ValueCard, {
    label: "Items owned",
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

// Chart view — value & count by type (BRD v1.2 §9.5)
function PortfolioChart({
  items
}) {
  const byCat = {};
  items.forEach(i => {
    const c = catOf(i.sku);
    const k = c ? c.cat : 'other';
    byCat[k] = byCat[k] || {
      count: 0,
      value: 0
    };
    byCat[k].count++;
    byCat[k].value += i.value;
  });
  const rows = Object.entries(byCat).sort((a, b) => b[1].value - a[1].value);
  const max = Math.max(1, ...rows.map(([, v]) => v.value));
  const tones = {
    figures: 'var(--stamp-red)',
    designer: 'var(--plum)',
    kits: 'var(--forest)',
    diecast: 'var(--verified-teal)',
    other: 'var(--ink-mute)'
  };
  const labels = {
    figures: 'Action Figures',
    designer: 'Designer Toys',
    kits: 'Kits & Lego',
    diecast: 'Diecast',
    other: 'Other'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: '4px 2px'
    }
  }, rows.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, labels[k] || k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-faint)',
      fontFamily: 'var(--font-mono)'
    }
  }, v.count, " \xB7 ", /*#__PURE__*/React.createElement(Money, {
    value: v.value
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 12,
      borderRadius: 999,
      background: 'var(--bone)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: Math.max(6, Math.round(v.value / max * 100)) + '%',
      background: tones[k] || 'var(--ink)',
      borderRadius: 999,
      transition: 'width 320ms var(--ease-out)'
    }
  })))), rows.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, "No items to chart yet."));
}

// Calendar view — pre-order timeline (BRD v1.2 §9.5)
function PortfolioCalendar({
  items
}) {
  const pos = items.filter(i => i.status === 'preorder');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, pos.map(it => {
    const c = catOf(it.sku);
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
        width: 46,
        height: 46,
        borderRadius: 10,
        background: 'var(--grail-gold-soft)',
        color: 'var(--grail-gold-deep)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Ico, {
      d: Icons.calendar,
      size: 20
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
        fontSize: 12,
        color: 'var(--ink-faint)',
        marginTop: 2,
        fontFamily: 'var(--font-mono)'
      }
    }, it.order || 'Ordered', " \xB7 ", it.eta || 'ETA TBD')), /*#__PURE__*/React.createElement(Tag, {
      kind: "po"
    }, "PO"));
  }), pos.length === 0 && /*#__PURE__*/React.createElement(EmptyNote, null, "No pre-orders on the calendar."));
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
    push
  } = useNav();
  const c = catOf(item.sku);
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => push({
      name: 'item',
      sku: item.sku
    }),
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
  }, "PO"))), /*#__PURE__*/React.createElement("div", {
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
    }, /*#__PURE__*/React.createElement(Stars, {
      n: d.rating,
      size: 12
    }), /*#__PURE__*/React.createElement(Tag, {
      kind: "vouch",
      style: {
        fontSize: 9
      }
    }, "Vouched")));
  }));
}
Object.assign(window, {
  ProfileView,
  FollowList,
  CollectionTab,
  PortfolioChart,
  PortfolioCalendar,
  PortfolioCollage,
  ItemTile,
  TradesTab
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/ProfileView.jsx", error: String((e && e.message) || e) }); }

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
  short: 'Figures'
}, {
  id: 'designer',
  label: 'Designer Toys',
  short: 'Designer'
}, {
  id: 'kits',
  label: 'Model Kits & Lego',
  short: 'Kits & Lego'
}, {
  id: 'diecast',
  label: 'Diecast',
  short: 'Diecast'
}];

// ── Users + transaction-linked trust signals (BRD §8.2) ───────
// tier: derived from verified ownership + completed deals + ratings
const USERS = {
  aman_toys: {
    handle: 'aman_toys',
    name: 'Aman Iyer',
    city: 'Mumbai',
    joined: "Jan '24",
    color: 'var(--plum)',
    bio: 'Hot Toys obsessive · 1/6 only · in-hand or PO',
    deals: 38,
    rating: 4.9,
    ratingCount: 41,
    response: '~15 min',
    activeListings: 4,
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
    rating: 4.8,
    ratingCount: 96,
    response: '~5 min',
    activeListings: 7,
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
    rating: 5.0,
    ratingCount: 14,
    response: '~1 hr',
    activeListings: 2,
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
    rating: 4.7,
    ratingCount: 22,
    response: '~30 min',
    activeListings: 5,
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
    rating: 4.9,
    ratingCount: 30,
    response: '~20 min',
    activeListings: 3,
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
    rating: 4.9,
    ratingCount: 71,
    response: '~10 min',
    activeListings: 6,
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

// ── My collection — Items (BRD §8.1) ──────────────────────────
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
  eta: 'Ships ~ 20 Jun'
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

// ── Communities (BRD §8.8) ────────────────────────────────────
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
  invite: true,
  rules: ['Invite-only', 'Provenance matters — show your shipper', 'Recast tells get pinned']
}];

// ── Events (BRD §8.9) ─────────────────────────────────────────
const EVENTS = [{
  id: 'mumbai4',
  title: 'Mumbai Collector Meet · Vol 4',
  day: 'Sat',
  date: '24',
  month: 'May',
  when: 'Sat · 24 May · 4:00 pm',
  where: 'Phoenix Marketcity, Kurla',
  mode: 'In person',
  city: 'Mumbai',
  cat: 'figures',
  interested: 184,
  community: 'itm',
  host: 'rohit_scale',
  about: 'Our biggest meet yet. Bring 3 pieces to display or trade. Verified sellers get a table. Group dinner after.'
}, {
  id: 'blr3',
  title: 'Bengaluru Brick Bash · Vol 3',
  day: 'Sun',
  date: '08',
  month: 'Jun',
  when: 'Sun · 08 Jun · 11:00 am',
  where: 'Lalbagh Glass House, Bangalore',
  mode: 'In person',
  city: 'Bangalore',
  cat: 'kits',
  interested: 97,
  community: 'lego',
  host: 'saanvi',
  about: 'MOC showcase + a swap table for spare parts. Family-friendly. Best build wins a sealed set.'
}, {
  id: 'delhi2',
  title: 'Delhi Diecast Showdown',
  day: 'Sat',
  date: '14',
  month: 'Jun',
  when: 'Sat · 14 Jun · 2:00 pm',
  where: 'Select Citywalk, Saket',
  mode: 'In person',
  city: 'Delhi',
  cat: 'diecast',
  interested: 62,
  community: 'jdm',
  host: 'karan_die',
  about: '1/64 trade tables, a custom-livery contest, and a group order for the next Mini GT case.'
}, {
  id: 'online1',
  title: 'Online · Pop Mart Drop Watch Party',
  day: 'Fri',
  date: '06',
  month: 'Jun',
  when: 'Fri · 06 Jun · 8:00 pm',
  where: 'CollectorHub Live (online)',
  mode: 'Online',
  city: 'Online',
  cat: 'designer',
  interested: 240,
  community: 'kaiju',
  host: 'meera',
  about: 'We watch the Skullpanda drop together, call out stock, and split cases. Bring your wishlist.'
}];

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
  text: 'left you a trade vouch ★★★★★.',
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
  rating: 4.8,
  ratingCount: 6,
  response: '~25 min',
  activeListings: 1,
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
  designer: 'designer toys',
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
  return LISTINGS.find(l => l.id === id);
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
Object.assign(window, {
  CATEGORIES,
  USERS,
  CATALOGUE,
  MY_ITEMS,
  LISTINGS,
  POSTS,
  ADMIN_POSTS,
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
  catOf: cat,
  userOf: user,
  listingOf: listing,
  presenceOf,
  termsOf,
  postModeOf,
  ownStats,
  gradeOf,
  adminsOf
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
  }))
};

// palette helper for avatars
const AVATAR_PALETTE = ['var(--stamp-red)', 'var(--plum)', 'var(--verified-teal)', 'var(--forest)', 'var(--grail-gold)', 'var(--ink-mute)'];
function Avatar({
  name = '?',
  color,
  size = 36,
  verified = false
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
      letterSpacing: '-0.02em'
    }
  }, initial, verified && /*#__PURE__*/React.createElement("div", {
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
    showcase: {
      label: 'Showcase',
      c: 'var(--verified-teal)'
    },
    discussion: {
      label: 'Discussion',
      c: 'var(--plum)'
    },
    review: {
      label: 'Review',
      c: 'var(--grail-gold-deep)'
    }
  };
  const m = map[type] || map.showcase;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 10,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: m.c
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: m.c
    }
  }), m.label);
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
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(Ico, {
    d: Icons.shield,
    size: 11,
    stroke: 2.2
  }), tier);
}

// Transaction-linked trust signals row — BRD §8.2 PR-05
function TrustSignals({
  u,
  compact = false
}) {
  const items = [{
    v: u.deals,
    l: 'deals'
  }, {
    v: u.rating + '★',
    l: `${u.ratingCount} ratings`
  }, {
    v: u.response,
    l: 'replies'
  }, {
    v: u.joined,
    l: 'joined'
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
    style: {
      padding: '7px 14px',
      borderRadius: 999,
      background: active ? 'var(--ink)' : 'var(--paper-soft)',
      color: active ? 'var(--paper)' : 'var(--ink)',
      border: `1px solid ${active ? 'var(--ink)' : 'var(--border-strong)'}`,
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: 13,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      lineHeight: 1,
      flexShrink: 0
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
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex'
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
  Button,
  IconButton,
  CategoryChip,
  Segmented,
  Stamp,
  ProductPhoto,
  Divider,
  Money,
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
  }), overlay && overlay.name === 'search' && /*#__PURE__*/React.createElement(SearchOverlay, null), overlay && overlay.name === 'notifications' && /*#__PURE__*/React.createElement(NotificationsOverlay, null), /*#__PURE__*/React.createElement(Toast, null));
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
