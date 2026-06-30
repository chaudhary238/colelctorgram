// ─────────────────────────────────────────────────────────────
// Feed (Home) — BRD §9.3
// Personalised stream: posts, admin/releases, listings, events.
// Sort (For You / Latest / Top) + filter (post type / source).
// ─────────────────────────────────────────────────────────────

function FeedView() {
  const { posts } = useAppState();
  const [sort, setSort] = React.useState('foryou'); // foryou | latest | following
  const [tag, setTag] = React.useState('All');
  const tagBar = React.useRef(null);
  const drag = React.useRef({ down: false, startX: 0, startScroll: 0, moved: false });
  const onDown = (e) => { const el = tagBar.current; if (!el) return; drag.current = { down: true, startX: e.pageX, startScroll: el.scrollLeft, moved: false }; };
  const onMove = (e) => {
    const el = tagBar.current; if (!el || !drag.current.down) return;
    const dx = e.pageX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - dx;
  };
  const endDrag = () => { drag.current.down = false; };
  const [customOpen, setCustomOpen] = React.useState(false);
  // which categories the "Your Feed" view shows
  const [feedCats, setFeedCats] = React.useState(() => {
    const init = {}; CATEGORIES.forEach(c => init[c.id] = ME.interests.includes(c.id)); return init;
  });
  const [draftCats, setDraftCats] = React.useState(feedCats);
  // hide listing cards from the feed — on by default (collectors who want posts-only)
  const [hideListings, setHideListings] = React.useState(true);
  const [draftHide, setDraftHide] = React.useState(true);
  const activeCats = CATEGORIES.filter(c => feedCats[c.id]).map(c => c.id);

  const openCustomise = () => { setDraftCats(feedCats); setDraftHide(hideListings); setCustomOpen(true); };
  const saveCustomise = () => { setFeedCats(draftCats); setHideListings(draftHide); setCustomOpen(false); };
  const allOn = CATEGORIES.every(c => draftCats[c.id]);
  const toggleAll = () => { const v = !allOn; const n = {}; CATEGORIES.forEach(c => n[c.id] = v); setDraftCats(n); };

  // Build the mixed feed (order is the "ranking")
  const stream = React.useMemo(() => {
    const base = [
      ...posts.map(p => ({ t: 'post', post: p, tags: ['#NewDrops'] })),
      { t: 'listing', id: 'mms601', cat: 'figures', tags: ['#HotToys', '#NewDrops', '#Marvel'] },
      { t: 'post', post: POSTS[0], tags: ['#Grails', '#HotToys', '#Marvel'] },
      { t: 'admin', post: ADMIN_POSTS[0], tags: ['#NewDrops', '#Restock'] },
      { t: 'event', id: 'mumbai4', tags: ['#Meetups'] },
      { t: 'post', post: POSTS[4], tags: ['#Gunpla', '#Sealed'] },
      { t: 'listing', id: 'lego10307', cat: 'kits', tags: ['#Grails', '#Sealed'] },
      { t: 'post', post: POSTS[3], tags: ['#HotToys', '#PopMart'] },
      { t: 'post', post: POSTS[1], tags: ['#Gunpla', '#NewDrops'] },
      { t: 'listing', id: 'minigt-r35', cat: 'diecast', tags: ['#Diecast', '#NewDrops', '#Restock'] },
      { t: 'post', post: POSTS[2], tags: ['#Grails', '#PopMart'] },
      { t: 'admin', post: ADMIN_POSTS[1], tags: ['#HotToys', '#Restock'] },
      { t: 'listing', id: 'tomica-r34', cat: 'diecast', tags: ['#Diecast'] },
      { t: 'listing', id: 's32', cat: 'tcg', tags: ['#TCG', '#Sealed', '#NewDrops'] },
    ];
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

  const HASHTAGS = ['All', '#NewDrops', '#Grails', '#HotToys', '#Gunpla', '#Diecast', '#PopMart', '#TCG', '#Sealed', '#Marvel', '#Restock', '#Meetups'];

  const TABS = [
    { id: 'foryou', label: 'For You', icon: Icons.sliders, caret: true },
    { id: 'latest', label: 'Explore', icon: Icons.globe },
    { id: 'following', label: 'Following', icon: Icons.userPlus },
  ];

  return (
    <Screen header={<AppBar title="CollectorHub" wordmark/>}>
      {/* feed tabs: Your Feed (customisable) · Latest · Following */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--paper)', borderBottom: '1px solid var(--slate-200)', padding: '12px 16px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--slate-100)', borderRadius: 14, padding: 4 }}>
            {TABS.map(t => {
              const on = sort === t.id;
              return (
                <button key={t.id} onClick={() => {
                  if (t.id === 'foryou' && on) { customOpen ? setCustomOpen(false) : openCustomise(); }
                  else { setSort(t.id); setCustomOpen(false); }
                }} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  border: 'none', cursor: 'pointer', borderRadius: 10, padding: '8px 6px',
                  background: on ? 'var(--paper)' : 'transparent',
                  color: on ? 'var(--ink)' : 'var(--slate-500)',
                  fontFamily: 'var(--font-body)', fontWeight: on ? 700 : 500, fontSize: 13.5,
                  boxShadow: on ? 'var(--shadow-2)' : 'none', transition: 'all 130ms', whiteSpace: 'nowrap' }}>
                  <Ico d={t.icon} size={16} stroke={on ? 2.3 : 1.9}/>
                  {t.label}
                  {t.caret && <Ico d="M6 9l6 6 6-6" size={13} stroke={2.4} style={{ transform: customOpen ? 'rotate(180deg)' : 'none', transition: 'transform 160ms', marginLeft: -1 }}/>}
                </button>
              );
            })}
          </div>

          {/* Customise your feed — popover */}
          {customOpen && (
            <>
              <div onClick={() => setCustomOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }}/>
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 31, width: 'min(320px, 100%)',
                background: 'var(--paper)', border: '1px solid var(--slate-200)', borderRadius: 20,
                boxShadow: 'var(--shadow-4)', padding: '18px 18px 16px', animation: 'fadeIn 140ms ease' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16.5, letterSpacing: '-0.01em', color: 'var(--ink)' }}>Customize feed</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 2, marginBottom: 12 }}>Pick the categories you want to see.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {CATEGORIES.map(c => {
                    const on = draftCats[c.id];
                    return (
                      <button key={c.id} onClick={() => setDraftCats(s => ({ ...s, [c.id]: !s[c.id] }))} style={{
                        display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left',
                        border: 'none', background: 'none', cursor: 'pointer', padding: '9px 4px', borderRadius: 9 }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                          border: `1.5px solid ${on ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
                          background: on ? 'var(--stamp-red)' : 'transparent', color: 'var(--paper)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}>
                          {on && <Ico d={Icons.check} size={15} stroke={3}/>}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{c.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* feed-wide options */}
                <div style={{ height: 1, background: 'var(--border)', margin: '10px 4px 4px' }}/>
                <button onClick={() => setDraftHide(v => !v)} style={{
                  display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left',
                  border: 'none', background: 'none', cursor: 'pointer', padding: '9px 4px', borderRadius: 9 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                    border: `1.5px solid ${draftHide ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
                    background: draftHide ? 'var(--stamp-red)' : 'transparent', color: 'var(--paper)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}>
                    {draftHide && <Ico d={Icons.check} size={15} stroke={3}/>}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>Remove Listing posts</span>
                    <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>Hide marketplace listings from your feed</span>
                  </span>
                </button>
                <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
                  <button onClick={toggleAll} style={{
                    flex: 1, borderRadius: 11, border: '1px solid var(--border-strong)', background: 'var(--paper)',
                    color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, padding: '11px 0', cursor: 'pointer' }}>
                    {allOn ? 'Clear all' : 'Select all'}</button>
                  <button onClick={saveCustomise} style={{
                    flex: 1.4, borderRadius: 11, border: 'none', background: 'var(--stamp-red)',
                    color: 'var(--paper)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, padding: '11px 0', cursor: 'pointer' }}>
                    Save</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* hashtag slider + filter icon */}
        <div style={{ position: 'relative', margin: '10px -14px 0' }}>
          <div ref={tagBar}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={endDrag} onMouseLeave={endDrag}
            className="ch-tagbar"
            style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', margin: 0, padding: '1px 14px 2px 14px', cursor: 'grab', userSelect: 'none' }}>
            {HASHTAGS.map(h => {
              const on = tag === h;
              const all = h === 'All';
              return (
                <button key={h} onClick={() => { if (!drag.current.moved) setTag(h); }} draggable={false} style={{
                  flexShrink: 0, cursor: 'pointer', borderRadius: 999, padding: '8px 16px',
                  border: `1px solid ${on ? (all ? 'var(--stamp-red)' : 'var(--slate-800)') : (all ? 'var(--slate-200)' : 'var(--rose-tint-border)')}`,
                  background: on ? (all ? 'var(--stamp-red)' : 'var(--slate-800)') : (all ? 'var(--card-surface)' : 'var(--rose-tint-bg)'),
                  color: on ? 'var(--paper)' : (all ? 'var(--slate-500)' : 'var(--rose-tint-text)'),
                  fontFamily: 'var(--font-body)', fontWeight: on ? 700 : 500, fontSize: 13, letterSpacing: '-0.01em',
                  transition: 'background 120ms, color 120ms, border-color 120ms', whiteSpace: 'nowrap' }}>{h}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* feed stream — floating cards on --canvas bg */}
      <div style={{ paddingTop: 8 }}>
      {stream.map((x, i) => {
        if (x.t === 'post')    return <PostCard key={x.post.id || i} post={x.post} showFollow/>;
        if (x.t === 'admin')   return <AdminCard key={x.post.id} post={x.post}/>;
        if (x.t === 'listing') return <ListingFeedCard key={x.id + i} id={x.id}/>;
        if (x.t === 'event')   return <FeedEventCard key={x.id} id={x.id}/>;
        return null;
      })}
      </div>

      {stream.length === 0 && (
        <div style={{ padding: '52px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>No posts under {tag}</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', marginTop: 5 }}>Try another hashtag or tap All.</div>
        </div>
      )}

      <div style={{ padding: '24px 16px 40px', textAlign: 'center', color: 'var(--slate-400)', fontSize: 12, letterSpacing: '0.02em' }}>
        You’re all caught up{sort === 'foryou' ? ` · tuned to ${activeCats.length || CATEGORIES.length} ${(activeCats.length || CATEGORIES.length) === 1 ? 'category' : 'categories'}` : ''}
      </div>
    </Screen>
  );
}

// event surfaced as a feed card — BRD §8.4 FE-03
function FeedEventCard({ id }) {
  const { push } = useNav();
  const ev = EVENTS.find(e => e.id === id);
  return (
    <div style={{ background: 'var(--card-surface)', borderRadius: 20, margin: '0 14px 12px', padding: '14px 18px', boxShadow: 'var(--card-shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <Ico d={Icons.calendar} size={16} stroke={2} style={{ color: 'var(--plum)' }}/>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--plum)' }}>Event near you</span>
      </div>
      <EventCard ev={ev} onOpen={() => push({ name: 'event', id })}/>
    </div>
  );
}

Object.assign(window, { FeedView });
