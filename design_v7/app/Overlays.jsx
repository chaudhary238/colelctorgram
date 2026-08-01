// ─────────────────────────────────────────────────────────────
// Overlays — Compose (§9.6), Search (§9.15), Notifications (§9.14)
// Rendered above everything; dismiss via close.
// ─────────────────────────────────────────────────────────────

function OverlayShell({ children, onClose, onBack, title, trailing }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, background: 'var(--paper)', display: 'flex', flexDirection: 'column', animation: 'sheetUp 240ms cubic-bezier(0.22,1,0.36,1)' }}>
      <div style={{ flexShrink: 0, paddingTop: window.CH_WEB ? 14 : 52, borderBottom: '1px solid var(--slate-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 12px', minHeight: 40 }}>
          <button onClick={onBack || onClose} aria-label={onBack ? 'Back' : 'Close'} style={{ width: 38, height: 38, borderRadius: 11, border: '1px solid var(--slate-200)', background: 'transparent', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Ico d={onBack ? Icons.back : Icons.close} size={20}/>
          </button>
          <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em' }}>{title}</div>
          {trailing}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>{children}</div>
    </div>
  );
}

// ── Compose / Post composer — BRD §9.6 (v1.2: type-first + Poll) ──
function ComposeOverlay({ community, kind: initialKind }) {
  const { setOverlay, flashToast, push, switchTab } = useNav();
  const { addPost } = useAppState();
  const [kind, setKind] = React.useState(initialKind || null); // null = choose Post vs Listing first
  const [type, setType] = React.useState('post'); // post | poll | review (single-window switch)
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [images, setImages] = React.useState([]); // [{ url, tone }]
  const imgInputRef = React.useRef();
  const [tags, setTags] = React.useState([]);
  const [tagInput, setTagInput] = React.useState('');
  const [showEmoji, setShowEmoji] = React.useState(false);
  const [postTo, setPostTo] = React.useState(community ? [community] : ['feed']);
  const togglePostTo = id => setPostTo(ps => ps.includes(id) ? (ps.length > 1 ? ps.filter(p => p !== id) : ps) : [...ps, id]);
  const [showPostTo, setShowPostTo] = React.useState(false);
  const [cats, setCats] = React.useState([]);
  const toggleCat = (id) => setCats(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id]);
  const [choices, setChoices] = React.useState(['', '']);
  const [rating, setRating] = React.useState(0);

  const [isoItem, setIsoItem]     = React.useState('');
  const [isoBudget, setIsoBudget] = React.useState('');
  const [isoConds, setIsoConds]   = React.useState(['any']);
  const toggleIsoCond = v => { if (v === 'any') { setIsoConds(['any']); return; } setIsoConds(cs => { const base = cs.filter(x => x !== 'any' && x !== v); return cs.includes(v) ? (base.length ? base : ['any']) : [...cs.filter(x => x !== 'any'), v]; }); };

  const BODY_MAX = 600;
  const POST_TONES = ['ink', 'red', 'teal', 'gold', 'plum', 'forest'];
  const EMOJIS = ['😍', '🔥', '🤩', '😎', '🥹', '👀', '🙌', '👏', '💎', '🏆', '📦', '🚀', '✨', '❤️', '🤝', '💰', '🫡', '🧩', '🎯', '😱'];
  const pollValid = choices.filter(c => c.trim()).length >= 2;
  const canPost =
    type === 'poll'   ? (body.trim() && pollValid) :
    type === 'review' ? (rating > 0 && (title.trim() || body.trim())) :
    type === 'iso'    ? (isoItem.trim().length > 0 && images.length > 0) :
                        (title.trim() || body.trim() || images.length > 0);

  const addImg = () => { if (images.length >= 6) return; imgInputRef.current && imgInputRef.current.click(); };
  const rmImg  = (i) => setImages(im => im.filter((_, j) => j !== i));
  const handleImgFiles = (e) => {
    Array.from(e.target.files || []).slice(0, 6 - images.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setImages(im => im.length < 6 ? [...im, { url: ev.target.result, tone: POST_TONES[im.length % POST_TONES.length] }] : im);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  const addTag = (t) => { const v = (t != null ? t : tagInput).replace(/[^a-zA-Z0-9]/g, ''); if (v && tags.length < 8 && !tags.includes(v)) setTags(ts => [...ts, v]); setTagInput(''); };
  const rmTag  = (t) => setTags(ts => ts.filter(x => x !== t));
  const addEmoji = (e) => setBody(b => (b + e).slice(0, BODY_MAX));

  const publish = () => {
    if (type === 'poll' && !pollValid) { flashToast('A poll needs at least two choices'); return; }
    if (type === 'review' && !rating) { flashToast('Add a star rating'); return; }
    if (type === 'iso' && images.length === 0) { flashToast('Add at least one reference photo'); return; }
    const poll = type === 'poll' ? choices.filter(c => c.trim()).map(l => ({ label: l, votes: 0 })) : null;
    addPost(type === 'iso' ? {
      type: 'iso', isoItem: isoItem.trim(), body: body.trim() || null, user: 'you',
      community: postTo.find(p => p !== 'feed') || null, isoBudget: isoBudget ? Number(isoBudget) : null,
      isoCond: isoConds.filter(c => c !== 'any').join(',') || 'any', image: images.length > 0,
      images: images.length > 0 ? images.map(i => i.url || i) : undefined,
      tone: (images[0] && images[0].tone) || 'gold', tags: tags.slice(), cats, cat: cats[0] || null,
    } : {
      type, title: title.trim() || null, body: body.trim(), user: 'you', community: postTo.find(p => p !== 'feed') || null,
      images: images.map(i => i.url || i), imageCount: images.length, image: images.length > 0,
      tone: (images[0] && images[0].tone) || 'ink',
      tags: tags.slice(), rating: type === 'review' ? rating : null, cats, cat: cats[0] || null, poll,
    });
    setOverlay(null);
    flashToast(type === 'poll' ? 'Poll posted · +25 XP' : type === 'review' ? 'Review posted · +15 XP' : type === 'iso' ? 'ISO posted · +25 XP — collectors will reach out!' : 'Posted to your feed · +25 XP');
  };

  // ── Stage 0: choose what to create — Post or Listing ──
  if (!kind) {
    const OPTIONS = [
      { id: 'post',    label: 'Create a Post', desc: 'Showcase, ask, review or poll the community.', c: 'var(--plum)', bg: 'oklch(96% 0.02 300)', icon: Icons.edit },
      { id: 'listing', label: 'Add an item',    desc: 'Browse the database — add it there if it’s missing.', c: 'var(--stamp-red)', bg: 'var(--stamp-red-soft)', icon: Icons.tag },
    ];
    return (
      <OverlayShell title="Create" onClose={() => setOverlay(null)}>
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: 13.5, color: 'var(--ink-mute)', margin: '0 2px 14px' }}>What would you like to create?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {OPTIONS.map(o => (
              <button key={o.id} onClick={() => {
                if (o.id === 'listing') { setOverlay(null); setTimeout(() => switchTab('database'), 10); }
                else setKind(o.id);
              }} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%', textAlign: 'left', cursor: 'pointer',
                background: o.bg, border: '1.5px solid ' + o.c, borderRadius: 16, padding: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: o.c, color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ico d={o.icon} size={22}/>
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{o.label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.45 }}>{o.desc}</div>
                </div>
                <Ico d={Icons.back} size={18} stroke={2} style={{ transform: 'rotate(180deg)', color: o.c, flexShrink: 0, marginTop: 4 }}/>
              </button>
            ))}
          </div>
        </div>
      </OverlayShell>
    );
  }

  // ── Listing flow — to be designed; placeholder for now ──
  if (kind === 'listing') {
    return (
      <OverlayShell title="Create a Listing" onBack={() => setKind(null)} onClose={() => setOverlay(null)}>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--stamp-red)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Ico d={Icons.tag} size={28}/>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.01em', color: 'var(--ink)' }}>Listing composer</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', marginTop: 6, maxWidth: 280, marginInline: 'auto', lineHeight: 1.5 }}>We’ll design this flow next — list an item with photos, price and condition.</div>
        </div>
      </OverlayShell>
    );
  }

  // ── Post composer — single window, switch type at the top ──
  const TYPES = [
    { id: 'post',   label: 'Post' },
    { id: 'iso',    label: 'ISO' },
    { id: 'poll',   label: 'Poll' },
    { id: 'review', label: 'Review' },
  ];
  const placeholder = type === 'poll'
    ? 'Ask your question…'
    : type === 'review'
      ? 'What did you think? Build, value, would you buy again…'
      : type === 'iso'
        ? 'Variant, colourway, condition notes…'
        : 'What’s on your mind? Use # to tag topics.';

  return (
    <OverlayShell title="Create a post" onBack={initialKind ? () => setOverlay(null) : () => setKind(null)} onClose={() => setOverlay(null)}
      trailing={<Button size="sm" variant="primary" onClick={publish} disabled={!canPost} style={!canPost ? { opacity: 0.5 } : null}>Post</Button>}>
      <div style={{ padding: '14px 16px 24px' }}>
        {/* type switch — side by side */}
        <Segmented value={type} onChange={setType} options={TYPES}/>

        {/* author + audience (tap to change where it's posted) */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
          <Avatar name="You" color="var(--ink)" size={34}/>
          <button onClick={() => setShowPostTo(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--paper-soft)', border: '1px solid var(--border-strong)', borderRadius: 999, padding: '5px 10px 5px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{postTo.includes('feed') && postTo.length === 1 ? 'Your feed' : postTo.includes('feed') ? `Feed + ${postTo.length - 1} more` : `${postTo.length} ${postTo.length === 1 ? 'community' : 'communities'}`}</span>
            <Ico d={Icons.chevR} size={12} stroke={2.4} style={{ transform: 'rotate(90deg)' }}/>
          </button>
        </div>
        {showPostTo && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8, border: '1px solid var(--border-strong)', borderRadius: 12, overflow: 'hidden', background: 'var(--paper-soft)' }}>
            {[{ id: 'feed', name: 'Your feed' }, ...COMMUNITIES.filter(c => c.joined)].map((c, i) => (
              <button key={c.id} onClick={() => togglePostTo(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, height: 40, padding: '0 12px', border: 'none', borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', textAlign: 'left' }}>
                <span style={{ width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${postTo.includes(c.id) ? 'var(--stamp-red)' : 'var(--border-strong)'}`, background: postTo.includes(c.id) ? 'var(--stamp-red)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {postTo.includes(c.id) && <Ico d={Icons.check} size={11} stroke={3} style={{ color: 'var(--paper)' }}/>}
                </span>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* title */}
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder={type === 'poll' ? 'Poll title (optional)' : 'Add a title'}
          style={{ width: '100%', boxSizing: 'border-box', marginTop: 10, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em', color: 'var(--ink)' }}/>

        {/* review stars */}
        {type === 'review' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 2px' }}>
            <StarPicker value={rating} onChange={setRating}/>
            <span style={{ fontSize: 12.5, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{rating ? `${rating} / 5` : 'Tap to rate'}</span>
          </div>
        )}

        {/* body */}
        <textarea value={body} onChange={e => setBody(e.target.value.slice(0, BODY_MAX))} rows={type === 'poll' ? 2 : 3} placeholder={placeholder}
          style={{ width: '100%', boxSizing: 'border-box', marginTop: 6, border: 'none', outline: 'none', resize: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 15.5, lineHeight: 1.5, color: 'var(--ink)' }}/>

        {/* hashtags — all types */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', marginTop: 4, paddingBottom: 2 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-faint)', flexShrink: 0 }}>Tags</span>
            {tags.map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 6px 5px 10px', flexShrink: 0, borderRadius: 999, background: 'var(--ink)', color: 'var(--paper)', fontSize: 12, fontWeight: 600 }}>
                #{t}
                <button onClick={() => rmTag(t)} aria-label="Remove tag" style={{ width: 16, height: 16, borderRadius: '50%', border: 'none', background: 'rgba(244,239,230,0.2)', color: 'var(--paper)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ico d={Icons.close} size={9} stroke={3}/></button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6, height: 32, padding: '0 11px', borderRadius: 9, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, color: 'var(--ink-faint)' }}>#</span>
          <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addTag(); } }}
            placeholder="Add a custom tag" style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)' }}/>
          {tagInput.trim() && <button onClick={() => addTag()} style={{ background: 'none', border: 'none', color: 'var(--stamp-red)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', padding: 0 }}>Add</button>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <button onClick={() => setShowEmoji(v => !v)} aria-label="Add emoji" style={{ display: 'flex', alignItems: 'center', gap: 5, height: 28, padding: '0 9px', borderRadius: 8, border: `1px solid ${showEmoji ? 'var(--ink)' : 'var(--border-strong)'}`, background: showEmoji ? 'var(--bone)' : 'var(--paper-soft)', color: 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12.5 }}>
            <span style={{ fontSize: 14 }}>😊</span>Emoji
          </button>
          {type !== 'poll' && (
            <button onClick={addImg} disabled={images.length >= 6} aria-label="Add photo" style={{ display: 'flex', alignItems: 'center', gap: 5, height: 28, padding: '0 9px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', color: 'var(--ink)', cursor: images.length >= 6 ? 'default' : 'pointer', opacity: images.length >= 6 ? 0.5 : 1, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12.5 }}>
              <Ico d={Icons.camera} size={14}/>Photo{type === 'iso' && images.length === 0 ? ' *' : ''}{images.length > 0 ? ` (${images.length})` : ''}
            </button>
          )}
          <div style={{ flex: 1 }}/>
          <span style={{ fontSize: 11, color: body.length > BODY_MAX - 60 ? 'var(--stamp-red)' : 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>{body.length}/{BODY_MAX}</span>
        </div>
        {showEmoji && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8, padding: 10, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 12 }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => addEmoji(e)} style={{ width: 38, height: 38, borderRadius: 9, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}
                onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bone)'} onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>{e}</button>
            ))}
          </div>
        )}

        {/* ISO / Wanted form */}
        {type === 'iso' && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <SectionLabel>What are you looking for? *</SectionLabel>
              <input value={isoItem} onChange={e => setIsoItem(e.target.value)} placeholder="e.g. Hot Toys Iron Man Mark III"
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 8, height: 44, padding: '0 13px', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink)', outline: 'none' }}/>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <SectionLabel>Max budget</SectionLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, height: 44, padding: '0 13px', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)' }}>
                  <span style={{ fontSize: 15, color: 'var(--ink-faint)' }}>&#8377;</span>
                  <input type="number" value={isoBudget} onChange={e => setIsoBudget(e.target.value)} placeholder="Any"
                    style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 14.5, color: 'var(--ink)', width: 0 }}/>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <SectionLabel>Condition</SectionLabel>
                <select value={isoConds[0] || 'any'} onChange={e => setIsoConds([e.target.value])}
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 8, height: 44, padding: '0 13px', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', outline: 'none', appearance: 'none', WebkitAppearance: 'none' }}>
                  {['Any', 'Sealed', 'MIB', 'BIB', 'Loose'].map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
        {type === 'poll' && (
          <div style={{ marginTop: 6 }}>
            <SectionLabel>Choices</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {choices.map((ch, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input value={ch} onChange={e => setChoices(cs => cs.map((c, j) => j === i ? e.target.value : c))} placeholder={`Choice ${i + 1}`}
                    style={{ flex: 1, height: 42, padding: '0 13px', borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink)', outline: 'none' }}/>
                  {choices.length > 2 && (
                    <button onClick={() => setChoices(cs => cs.filter((_, j) => j !== i))} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Ico d={Icons.close} size={16}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {choices.length < 5 && (
              <button onClick={() => setChoices(cs => [...cs, ''])} style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}>
                <Ico d={Icons.plusCircle} size={17}/>Add choice
              </button>
            )}
            {!pollValid && <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>A poll needs at least two choices.</div>}
          </div>
        )}

        {/* images — Post, Review & ISO (compact strip, only shown once photos are added) */}
        {type !== 'poll' && (
          <input ref={imgInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImgFiles}/>
        )}
        {type !== 'poll' && images.length > 0 && (
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', marginTop: 8, paddingBottom: 2 }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: 'relative', width: 60, height: 60, flexShrink: 0, borderRadius: 10, overflow: 'visible' }}>
                {img.url
                  ? <img src={img.url} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, display: 'block' }}/>
                  : <ProductPhoto tone={img.tone || img} ratio="1/1" rounded={10}/>}
                <button onClick={() => rmImg(i)} aria-label="Remove" style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', cursor: 'pointer', background: 'var(--ink)', color: 'var(--paper)', border: '2px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico d={Icons.close} size={9} stroke={3}/></button>
              </div>
            ))}
          </div>
        )}

        {/* category — all types, standard app chip style */}
        <div style={{ marginTop: 10 }}><SectionLabel>Category</SectionLabel></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>
          {CATEGORIES.map(c => <CategoryChip key={c.id} active={cats.includes(c.id)} onClick={() => toggleCat(c.id)}>{c.chipLabel}</CategoryChip>)}
        </div>

      </div>
    </OverlayShell>
  );
}

// 1–5 interactive star picker (review composer)
function StarPicker({ value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n === value ? 0 : n)} aria-label={`${n} star`} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', lineHeight: 0 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill={n <= value ? 'var(--grail-gold-deep)' : 'none'} stroke={n <= value ? 'var(--grail-gold-deep)' : 'var(--border-strong)'} strokeWidth={1.6}>
            <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

function ComposeTool({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', color: 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13 }}>
      <Ico d={icon} size={17}/>{label}
    </button>
  );
}

// ── Search (global) — BRD §9.15 ───────────────────────────────
function SearchOverlay() {
  const { setOverlay, push } = useNav();
  const { posts: userPosts } = useAppState();
  const [q, setQ] = React.useState('');
  const [scope, setScope] = React.useState('all');
  const go = (route) => { setOverlay(null); setTimeout(() => push({ ...route, _returnOverlay: { name: 'search' } }), 10); };

  const ql = q.toLowerCase();
  const items = CATALOGUE.filter(c => !ql || (c.title + c.brand).toLowerCase().includes(ql));
  const people = Object.values(USERS).filter(u => !ql || (u.name + u.handle).toLowerCase().includes(ql));
  const coms = COMMUNITIES.filter(c => !ql || c.name.toLowerCase().includes(ql));
  const evs = EVENTS.filter(e => !ql || e.title.toLowerCase().includes(ql));
  const allPosts = [...(userPosts || []), ...POSTS, ...(typeof ISO_POSTS !== 'undefined' ? ISO_POSTS : [])];
  const posts = allPosts.filter(p => !ql ||
    (p.body || '').toLowerCase().includes(ql) ||
    (p.isoItem || '').toLowerCase().includes(ql) ||
    (p.user || '').toLowerCase().includes(ql) ||
    (p.community || '').toLowerCase().includes(ql)
  );

  const showItems  = scope === 'all' || scope === 'items';
  const showPeople = scope === 'all' || scope === 'people';
  const showComs   = scope === 'all' || scope === 'communities';
  const showEvs    = scope === 'all' || scope === 'events';
  const showPosts  = scope === 'all' || scope === 'posts';

  const SCOPES = [
    { id: 'all',         label: 'All' },
    { id: 'items',       label: 'Items' },
    { id: 'posts',       label: 'Posts' },
    { id: 'people',      label: 'People' },
    { id: 'communities', label: 'Communities' },
    { id: 'events',      label: 'Events' },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, background: 'var(--paper)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 160ms' }}>
      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--slate-200)', padding: window.CH_WEB ? '16px 14px 12px' : '52px 14px 12px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, height: 46, padding: '0 14px', borderRadius: 14, border: '1px solid var(--slate-200)', background: 'var(--card-surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <Ico d={Icons.search} size={18} style={{ color: 'var(--slate-400)', flexShrink: 0 }}/>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Items, posts, people, communities…"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink)' }}/>
          </div>
          <button onClick={() => setOverlay(null)} style={{ background: 'none', border: 'none', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 12, overflowX: 'auto' }}>
          {SCOPES.map(s =>
            <CategoryChip key={s.id} active={scope === s.id} onClick={() => setScope(s.id)}>{s.label}</CategoryChip>)}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 24px' }}>
        {/* ── Trending section (empty query) ── */}
        {!q && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--slate-400)', marginBottom: 12 }}>Trending now</div>
            {[
              { rank: 1, term: 'Transformers G1',    count: '18.4K posts', hot: true  },
              { rank: 2, term: 'Hot Wheels RLC',      count: '12.1K posts', hot: true  },
              { rank: 3, term: 'PSA 10 Pokémon',      count: '9.7K posts',  hot: false },
              { rank: 4, term: 'Jordan 1 OG Chicago', count: '8.3K posts',  hot: false },
              { rank: 5, term: 'Bandai MG Gundam',    count: '6.2K posts',  hot: false },
            ].map(t => (
              <button key={t.rank} onClick={() => setQ(t.term)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                background: 'var(--card-surface)', border: '1px solid var(--slate-200)', borderRadius: 13,
                padding: '11px 14px', marginBottom: 7, cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)', transition: 'transform 120ms, box-shadow 120ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: 'var(--stamp-red)', width: 26, flexShrink: 0, textAlign: 'right' }}>{t.rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--s900)', lineHeight: 1.2 }}>{t.term}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--slate-400)', marginTop: 2 }}>{t.count}</div>
                </div>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{t.hot ? '🔥' : '📈'}</span>
              </button>
            ))}
          </div>
        )}
        {showPosts && posts.length > 0 && <ResGroup label="Posts">
          {posts.slice(0, 5).map(p => {
            const u = p.user === 'you' ? ME : (USERS[p.user] || ME);
            const com = p.community ? COMMUNITIES.find(c => c.id === p.community) : null;
            const snippet = (p.isoItem || p.body || '').slice(0, 72) + ((p.isoItem || p.body || '').length > 72 ? '…' : '');
            return (
              <ResRow key={p.id} onClick={() => go({ name: 'post', id: p.id })}
                media={<Avatar name={u.name} color={u.color} size={40}/>}
                title={snippet || '(no text)'}
                sub={`@${u.handle}${com ? ' · ' + com.name : ''}`}/>
            );
          })}
        </ResGroup>}
        {showItems && items.length > 0 && <ResGroup label="Scorred DB">
          {items.slice(0, 4).map(c => (
            <ResRow key={c.sku} onClick={() => go({ name: 'item', sku: c.sku })}
              media={<div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden' }}><ProductPhoto tone={c.tone} ratio="1/1" rounded={8}/></div>}
              title={c.title}
              sub={c.intelBy && c.intelBy !== 'you'
                ? <span>Intel by <span style={{ color: 'var(--verified-teal)', cursor: 'pointer', fontWeight: 600 }}
                    onClick={e => { e.stopPropagation(); go({ name: 'profile', user: c.intelBy }); }}>@{c.intelBy.replace('_','.')}</span> · {c.brand}</span>
                : c.intelBy === 'you' ? `DB Contribution by @you · ${c.brand}` : `${c.sku} · ${c.brand}`}
              action={null}/>
          ))}
        </ResGroup>}
        {showPeople && people.length > 0 && <ResGroup label="People">
          {people.slice(0, 4).map(u => (
            <ResRow key={u.handle} onClick={() => go({ name: 'profile', user: u.handle })}
              media={<Avatar name={u.name} color={u.color} size={40} verified={u.tier !== 'Verified'}/>}
              title={u.name} sub={`@${u.handle} · ${u.deals} deals · ${u.vouchesReceived} vouches`}/>
          ))}
        </ResGroup>}
        {showComs && coms.length > 0 && <ResGroup label="Communities">
          {coms.slice(0, 4).map(c => (
            <ResRow key={c.id} onClick={() => go({ name: 'community-detail', id: c.id })}
              media={<div style={{ width: 40, height: 40, borderRadius: 9, background: 'var(--ink)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15 }}>{c.tag}</div>}
              title={c.name} sub={`${c.members.toLocaleString('en-IN')} members`}/>
          ))}
        </ResGroup>}
        {showEvs && evs.length > 0 && <ResGroup label="Events">
          {evs.slice(0, 4).map(e => (
            <ResRow key={e.id} onClick={() => go({ name: 'event', id: e.id })}
              media={<div style={{ width: 40, height: 40, borderRadius: 9, background: 'var(--plum)', color: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 8, fontWeight: 700 }}>{e.month}</span><span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>{e.date}</span></div>}
              title={e.title} sub={e.when}/>
          ))}
        </ResGroup>}
      </div>
    </div>
  );
}

function ResGroup({ label, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}
function ResRow({ media, title, sub, action, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer' }}>
      {media}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{sub}</div>
      </div>
      {action}
    </button>
  );
}

// ── Notifications centre — BRD §9.14 ──────────────────────────
// Notification categories — 4 explicit types + 1 generic catch-all (§9.14).
// `kinds: null` marks the catch-all: it collects anything not matched above.
const NOTIF_CATS = [
  { id: 'likes',   label: 'Likes',   icon: Icons.heart,   c: 'var(--stamp-red)',       kinds: ['like'] },
  { id: 'follows', label: 'Follows', icon: Icons.user,    c: 'var(--plum)',            kinds: ['follow'] },
  { id: 'replies', label: 'Replies', icon: Icons.comment, c: 'var(--verified-teal)',   kinds: ['community'] },
  { id: 'vouches', label: 'Vouch',   icon: Icons.shield,  c: 'var(--forest)',          kinds: ['vouch'] },
  { id: 'other',   label: 'Other',   icon: Icons.grid,    c: 'var(--grail-gold-deep)', kinds: null },
];
// every kind explicitly claimed by a category → the rest fall into "Other"
const CLAIMED_KINDS = NOTIF_CATS.filter(c => c.kinds).flatMap(c => c.kinds);
const catOfKind = (kind) => NOTIF_CATS.find(c => c.kinds && c.kinds.includes(kind))
  || NOTIF_CATS.find(c => c.kinds === null);

function NotificationsOverlay() {
  const { setOverlay, push } = useNav();
  const { readNotifs, markNotifsRead, liveNotifs } = useAppState();
  const allNotifs = React.useMemo(() => [...(liveNotifs || []), ...NOTIFICATIONS], [liveNotifs]);
  const [active, setActive] = React.useState(null); // null = all activity; else a category id
  const [seg, setSeg] = React.useState('activity'); // activity | dms
  const msgUnread = INBOX.reduce((s, m) => s + m.unread, 0);
  React.useEffect(() => { markNotifsRead(); }, []);

  const go = (ref) => {
    setOverlay(null);
    if (!ref) return;
    setTimeout(() => {
      if (ref.type === 'listing') push({ name: 'listing', id: ref.id });
      else if (ref.type === 'chat') push({ name: 'chat', user: ref.id });
      else if (ref.type === 'profile') push({ name: 'profile', user: ref.id });
      else if (ref.type === 'post') push({ name: 'post', id: ref.id });
      else if (ref.type === 'community') push({ name: 'community-detail', id: ref.id });
      else if (ref.type === 'event') push({ name: 'event', id: ref.id });
      else if (ref.type === 'item') push({ name: 'item', sku: 'SHF-GUI' });
    }, 10);
  };
  const openChat = (handle) => { setOverlay(null); setTimeout(() => push({ name: 'chat', user: handle }), 10); };

  // unread count per category
  const unreadIn = (cat) => allNotifs.filter(n =>
    n.unread && !readNotifs[n.id] && (cat.kinds ? cat.kinds.includes(n.kind) : !CLAIMED_KINDS.includes(n.kind))
  ).length;

  const activeCat = NOTIF_CATS.find(c => c.id === active);
  // filtered by category when one is active; otherwise the full activity feed
  const shown = activeCat
    ? allNotifs.filter(n => activeCat.kinds ? activeCat.kinds.includes(n.kind) : !CLAIMED_KINDS.includes(n.kind))
    : allNotifs;

  const refCode = (slug) => slug ? slug.toUpperCase().replace(/-/g, '') : null;

  return (
    <OverlayShell title="Activity" onClose={() => setOverlay(null)}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

        {/* ── segments: Activity / DMs ── */}
        <div style={{ flexShrink: 0, display: 'flex', gap: 7, padding: '12px 16px 0' }}>
          {[{ id: 'activity', label: 'Activity', n: allNotifs.filter(n => n.unread && !readNotifs[n.id]).length },
            { id: 'dms', label: 'Messages', n: msgUnread }].map(s => (
            <CategoryChip key={s.id} active={seg === s.id} onClick={() => setSeg(s.id)}>{s.label}{s.n ? ` ${s.n}` : ''}</CategoryChip>
          ))}
        </div>

        {seg === 'dms' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '10px 16px 20px' }}>
            {INBOX.map(c => {
              const u = userOf(c.user);
              return (
                <button key={c.user} onClick={() => openChat(c.user)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: 'none', border: 'none', borderBottom: '1px solid var(--border)', padding: '13px 0' }}>
                  <Avatar name={u.name} color={u.color} size={42}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{u.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{c.preview}</div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{c.time}</div>
                    {c.unread > 0 && <div style={{ marginTop: 5, minWidth: 18, height: 18, borderRadius: 999, background: 'var(--stamp-red)', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{c.unread}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {seg === 'activity' && <React.Fragment>
        {/* ── category cards: 4 types + 1 generic catch-all ── */}
        <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 9, padding: '14px 16px 12px' }}>
          {NOTIF_CATS.map(cat => {
            const on = active === cat.id;
            const count = unreadIn(cat);
            return (
              <button key={cat.id} onClick={() => setActive(on ? null : cat.id)} aria-label={cat.label} style={{
                position: 'relative', aspectRatio: '1 / 1', borderRadius: 15, cursor: 'pointer',
                border: `1.5px solid ${on ? cat.c : 'var(--border)'}`,
                background: on ? cat.c : 'var(--paper-soft)',
                color: on ? 'var(--paper)' : cat.c,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: on ? 'none' : 'var(--shadow-1)', transition: 'all 130ms' }}>
                <Ico d={cat.icon} size={23} stroke={2}/>
                {count > 0 && (
                  <span style={{
                    position: 'absolute', top: -6, right: -6, minWidth: 19, height: 19, padding: '0 5px',
                    borderRadius: 999, background: on ? 'var(--paper)' : cat.c, color: on ? cat.c : 'var(--paper)',
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--paper)' }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── activity feed — all notifications, or filtered by the selected category ── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '6px 18px 4px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: activeCat ? activeCat.c : 'var(--ink-faint)', textTransform: 'uppercase' }}>
              {activeCat ? `Recent ${activeCat.label}` : 'All activity'}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            {activeCat && (
              <button onClick={() => setActive(null)} aria-label="Clear filter" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--ink-faint)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                <Ico d={Icons.close} size={13} stroke={2.5}/> Clear
              </button>
            )}
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '6px 16px 20px' }}>
            {shown.map(n => {
              const m = catOfKind(n.kind);
              const u = n.user ? userOf(n.user) : null;
              return (
                <button key={n.id} onClick={() => go(n.ref)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: 'none', border: 'none', borderBottom: '1px solid var(--border)', padding: '13px 0' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {u ? <Avatar name={u.name} color={u.color} size={42}/> :
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--bone)', color: m.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico d={m.icon} size={20}/></div>}
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 19, height: 19, borderRadius: '50%', background: m.c, color: 'var(--paper)', border: '2px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ico d={m.icon} size={10} stroke={2.5}/>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                    <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                      {u && <b style={{ color: 'var(--ink)', fontWeight: 600 }}>@{u.handle} </b>}{n.text}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 3 }}>{n.time}</div>
                  </div>
                  {n.unread && !readNotifs[n.id] && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--stamp-red)', flexShrink: 0, marginTop: 6 }}/>}
                </button>
              );
            })}
            {shown.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13.5, padding: '40px 0' }}>Nothing here yet.</div>
            )}
          </div>
        </div>
        </React.Fragment>}
      </div>
    </OverlayShell>
  );
}

// ── Share sheet — industry-standard targets (bottom sheet) ────
function ShareSheet({ label }) {
  const { setOverlay, flashToast } = useNav();
  const what = label || 'this';
  const close = () => setOverlay(null);
  const send = (name) => { close(); flashToast(name === 'Copy link' ? 'Link copied to clipboard' : `Shared to ${name}`); };

  // brand glyphs (simple inline marks)
  const wa = <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 0 16 8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 0 1 12 4zm-2.5 4c-.2 0-.5 0-.7.4-.3.3-1 .9-1 2.3s1 2.6 1.2 2.8c.2.2 2 3 4.8 4.1 2.4 1 2.9.8 3.4.8.5-.1 1.6-.7 1.9-1.4.2-.7.2-1.2.1-1.4-.1-.1-.3-.2-.6-.4l-2-1c-.3-.1-.5-.2-.7.1l-.7.9c-.1.2-.3.2-.5.1-.3-.1-1.2-.5-2.2-1.4-.8-.7-1.4-1.6-1.5-1.8-.1-.3 0-.4.1-.5l.4-.5c.2-.2.2-.3.3-.5l.2-.4c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5z"/></svg>;
  const tg = <Ico d={Icons.send} size={22} style={{ color: '#fff', transform: 'rotate(-12deg)' }}/>;
  const targets = [
    { name: 'WhatsApp', bg: '#25D366', el: wa },
    { name: 'Instagram', bg: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)', el: <Ico d={Icons.camera} size={21} style={{ color: '#fff' }}/> },
    { name: 'Facebook', bg: '#1877F2', el: <span style={{ color: '#fff', fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 22 }}>f</span> },
    { name: 'X', bg: '#000', el: <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>𝕏</span> },
    { name: 'Telegram', bg: '#229ED9', el: tg },
    { name: 'Email', bg: 'var(--ink-mute)', el: <Ico d={Icons.mail} size={21} style={{ color: '#fff' }}/> },
  ];

  return (
    <div onClick={close} style={{ position: 'absolute', inset: 0, zIndex: 130, background: 'rgba(20,17,15,0.45)', display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 160ms' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '10px 18px 30px', animation: 'sheetUp 240ms cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 14px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>Share {what}</span>
          <button onClick={close} aria-label="Close" style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink-mute)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico d={Icons.close} size={17}/></button>
        </div>

        {/* targets */}
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6 }}>
          {targets.map(t => (
            <button key={t.name} onClick={() => send(t.name)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, width: 60 }}>
              <span style={{ width: 54, height: 54, borderRadius: '50%', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.el}</span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 500 }}>{t.name}</span>
            </button>
          ))}
        </div>

        {/* copy link */}
        <button onClick={() => send('Copy link')} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', marginTop: 18, padding: '13px 14px', borderRadius: 13, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', cursor: 'pointer' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)', flexShrink: 0 }}><Ico d={Icons.share} size={18}/></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Copy link</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>scorred.app/s/9f2a1</div>
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--stamp-red)' }}>Copy</span>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { OverlayShell, ComposeOverlay, ComposeTool, SearchOverlay, NotificationsOverlay, ResGroup, ResRow, ShareSheet, StarPicker });
