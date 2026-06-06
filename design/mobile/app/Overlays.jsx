// ─────────────────────────────────────────────────────────────
// Overlays — Compose (§9.6), Search (§9.15), Notifications (§9.14)
// Rendered above everything; dismiss via close.
// ─────────────────────────────────────────────────────────────

function OverlayShell({ children, onClose, title, trailing }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, background: 'var(--paper)', display: 'flex', flexDirection: 'column', animation: 'sheetUp 240ms cubic-bezier(0.22,1,0.36,1)' }}>
      <div style={{ flexShrink: 0, paddingTop: 52, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 12px', minHeight: 40 }}>
          <button onClick={onClose} aria-label="Close" style={{ width: 38, height: 38, borderRadius: 11, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Ico d={Icons.close} size={20}/>
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
function ComposeOverlay({ community }) {
  const { setOverlay, flashToast } = useNav();
  const { addPost } = useAppState();
  const [type, setType] = React.useState(null); // pick a type FIRST (v1.2)
  const [body, setBody] = React.useState('');
  const [withImage, setWithImage] = React.useState(false);
  const [refSku, setRefSku] = React.useState('MMS601');
  const [com, setCom] = React.useState(community || '');
  const [choices, setChoices] = React.useState(['', '']);
  const item = catOf(refSku);

  const pollValid = choices.filter(c => c.trim()).length >= 2;
  const canPost = type === 'poll' ? (body.trim() && pollValid) : true;

  const pick = (t) => { setType(t); setWithImage(t === 'showcase' || t === 'review'); };

  const publish = () => {
    if (type === 'poll' && !pollValid) { flashToast('A poll needs at least two choices'); return; }
    const poll = type === 'poll' ? choices.filter(c => c.trim()).map(l => ({ label: l, votes: 0 })) : null;
    addPost({
      type, body: body.trim() || 'Just added this to the shelf.', user: 'you', community: com || null,
      refSku: (type !== 'poll' && withImage) ? refSku : null, tone: item.tone,
      image: type !== 'poll' && withImage, cat: item.cat, poll,
    });
    setOverlay(null);
    flashToast(type === 'poll' ? 'Poll posted to your feed' : 'Posted to your feed');
  };

  // ── Stage 1: choose a post type first ──
  if (!type) {
    const TYPES = [
      { id: 'showcase', label: 'Showcase', desc: 'Show off a piece from your collection.', c: 'var(--verified-teal)', icon: Icons.camera },
      { id: 'discussion', label: 'Discussion', desc: 'Ask the community a question.', c: 'var(--plum)', icon: Icons.comment },
      { id: 'review', label: 'Review', desc: 'Rate & review an item you own.', c: 'var(--grail-gold-deep)', icon: Icons.star },
      { id: 'poll', label: 'Poll', desc: 'Put a question to a vote.', c: 'var(--stamp-red)', icon: Icons.chart },
    ];
    return (
      <OverlayShell title="New post" onClose={() => setOverlay(null)}>
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: 13.5, color: 'var(--ink-mute)', margin: '0 2px 14px' }}>What are you posting? Selling isn’t here — list from an item.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TYPES.map(t => (
              <button key={t.id} onClick={() => pick(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left', cursor: 'pointer',
                background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: t.c, color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ico d={t.icon} size={21}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>{t.label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 1 }}>{t.desc}</div>
                </div>
                <Ico d={Icons.back} size={18} stroke={2} style={{ transform: 'rotate(180deg)', color: 'var(--ink-faint)' }}/>
              </button>
            ))}
          </div>
        </div>
      </OverlayShell>
    );
  }

  const typeLabel = { showcase: 'Showcase', discussion: 'Discussion', review: 'Review', poll: 'Poll' }[type];

  // ── Stage 2: compose ──
  return (
    <OverlayShell title="New post" onClose={() => setOverlay(null)}
      trailing={<Button size="sm" variant="primary" onClick={publish} disabled={!canPost}>Post</Button>}>
      <div style={{ padding: '16px' }}>
        {/* chosen type + change */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <PostTypeTag type={type === 'poll' ? 'discussion' : type}/>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{typeLabel}</span>
          <button onClick={() => setType(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Change type</button>
        </div>

        {/* single compose surface — text + optional image (no text/image toggle) */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Avatar name="You" color="var(--ink)" size={38}/>
          <textarea autoFocus value={body} onChange={e => setBody(e.target.value)} rows={type === 'poll' ? 2 : 4}
            placeholder={type === 'poll' ? 'Ask your question…' : type === 'discussion' ? 'What’s on your mind?' : 'Say something about it…'}
            style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.5, color: 'var(--ink)', paddingTop: 7 }}/>
        </div>

        {/* poll choices */}
        {type === 'poll' && (
          <div style={{ marginTop: 8 }}>
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
              <button onClick={() => setChoices(cs => [...cs, ''])} style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', padding: 0 }}>
                <Ico d={Icons.plusCircle} size={17}/>Add choice
              </button>
            )}
            {!pollValid && <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>A poll needs at least two choices.</div>}
          </div>
        )}

        {/* image + reference (non-poll) */}
        {type !== 'poll' && <>
          {withImage && (
            <div style={{ marginTop: 8, position: 'relative' }}>
              <ProductPhoto tone={item.tone} ratio="3/2" label={item.sku}/>
              <button onClick={() => setWithImage(false)} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(20,17,15,0.6)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Ico d={Icons.close} size={15}/>
              </button>
            </div>
          )}

          <div style={{ marginTop: 18 }}><SectionLabel>Reference an item</SectionLabel></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
            {CATALOGUE.slice(0, 6).map(c => (
              <button key={c.sku} onClick={() => { setRefSku(c.sku); setWithImage(true); }} style={{
                width: 58, flexShrink: 0, border: refSku === c.sku ? '2px solid var(--stamp-red)' : '2px solid transparent', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', padding: 0, background: 'none' }}>
                <ProductPhoto tone={c.tone} ratio="1/1" rounded={8}/>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <ComposeTool icon={Icons.gallery} label="Photo" onClick={() => setWithImage(true)}/>
            <ComposeTool icon={Icons.camera} label="Camera"/>
            <ComposeTool icon={Icons.tag} label="Tag"/>
          </div>
        </>}

        {/* post to community */}
        <div style={{ marginTop: 18 }}><SectionLabel>Post to</SectionLabel></div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
          <CategoryChip active={com === ''} onClick={() => setCom('')}>Your feed</CategoryChip>
          {COMMUNITIES.filter(c => c.joined).map(c => <CategoryChip key={c.id} active={com === c.id} onClick={() => setCom(c.id)}>{c.name}</CategoryChip>)}
        </div>
      </div>
    </OverlayShell>
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
  const [q, setQ] = React.useState('');
  const [scope, setScope] = React.useState('all');
  const go = (route) => { setOverlay(null); setTimeout(() => push(route), 10); };

  const ql = q.toLowerCase();
  const items = CATALOGUE.filter(c => !ql || (c.title + c.brand).toLowerCase().includes(ql));
  const people = Object.values(USERS).filter(u => !ql || (u.name + u.handle).toLowerCase().includes(ql));
  const coms = COMMUNITIES.filter(c => !ql || c.name.toLowerCase().includes(ql));
  const evs = EVENTS.filter(e => !ql || e.title.toLowerCase().includes(ql));

  const showItems = scope === 'all' || scope === 'items';
  const showPeople = scope === 'all' || scope === 'people';
  const showComs = scope === 'all' || scope === 'communities';
  const showEvs = scope === 'all' || scope === 'events';

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, background: 'var(--paper)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 160ms' }}>
      <div style={{ flexShrink: 0, paddingTop: 52, borderBottom: '1px solid var(--border)', padding: '52px 14px 12px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, height: 42, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)' }}>
            <Ico d={Icons.search} size={18} style={{ color: 'var(--ink-faint)' }}/>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Items, people, communities, events…"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink)' }}/>
          </div>
          <button onClick={() => setOverlay(null)} style={{ background: 'none', border: 'none', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 12, overflowX: 'auto' }}>
          {[{ id: 'all', label: 'All' }, { id: 'items', label: 'Items' }, { id: 'people', label: 'People' }, { id: 'communities', label: 'Communities' }, { id: 'events', label: 'Events' }].map(s =>
            <CategoryChip key={s.id} active={scope === s.id} onClick={() => setScope(s.id)}>{s.label}</CategoryChip>)}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 24px' }}>
        {showItems && items.length > 0 && <ResGroup label="Catalogue items">
          {items.slice(0, 4).map(c => (
            <ResRow key={c.sku} onClick={() => go({ name: 'item', sku: c.sku })}
              media={<div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden' }}><ProductPhoto tone={c.tone} ratio="1/1" rounded={8}/></div>}
              title={c.title} sub={`${c.sku} · ${c.brand}`} action={<Ico d={Icons.plusCircle} size={20} style={{ color: 'var(--stamp-red)' }}/>}/>
          ))}
        </ResGroup>}
        {showPeople && people.length > 0 && <ResGroup label="People">
          {people.slice(0, 4).map(u => (
            <ResRow key={u.handle} onClick={() => go({ name: 'profile', user: u.handle })}
              media={<Avatar name={u.name} color={u.color} size={40} verified={u.tier !== 'Verified'}/>}
              title={u.name} sub={`@${u.handle} · ${u.deals} deals · ${u.rating}★`}/>
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
function NotificationsOverlay() {
  const { setOverlay, push } = useNav();
  const { readNotifs, markNotifsRead } = useAppState();
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

  const kindMeta = {
    wishlist:  { icon: Icons.bell, c: 'var(--verified-teal)' },
    deal:      { icon: Icons.swap, c: 'var(--stamp-red)' },
    vouch:     { icon: Icons.shield, c: 'var(--forest)' },
    follow:    { icon: Icons.user, c: 'var(--plum)' },
    like:      { icon: Icons.heart, c: 'var(--stamp-red)' },
    community: { icon: Icons.users, c: 'var(--ink-mute)' },
    event:     { icon: Icons.calendar, c: 'var(--plum)' },
    preorder:  { icon: Icons.clock, c: 'var(--grail-gold-deep)' },
  };

  return (
    <OverlayShell title="Notifications" onClose={() => setOverlay(null)}
      trailing={<button onClick={() => push({ name: 'inbox' }) === undefined && setOverlay(null)} style={{ display: 'none' }}/>}>
      {/* messages shortcut */}
      <button onClick={() => { setOverlay(null); setTimeout(() => push({ name: 'inbox' }), 10); }} style={{
        display: 'flex', alignItems: 'center', gap: 12, width: 'calc(100% - 32px)', margin: '14px 16px 4px',
        background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 13, padding: '12px 14px', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(244,239,230,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ico d={Icons.message} size={18}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Messages</div>
          <div style={{ fontSize: 12, color: 'rgba(244,239,230,0.65)' }}>3 conversations · 3 unread</div>
        </div>
        <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, background: 'var(--stamp-red)', color: 'var(--paper)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
      </button>

      <div style={{ padding: '10px 16px 24px' }}>
        {NOTIFICATIONS.map(n => {
          const m = kindMeta[n.kind] || kindMeta.community;
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
      </div>
    </OverlayShell>
  );
}

Object.assign(window, { OverlayShell, ComposeOverlay, ComposeTool, SearchOverlay, NotificationsOverlay, ResGroup, ResRow });
