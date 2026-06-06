// ─────────────────────────────────────────────────────────────
// Feed (Home) — BRD §9.3
// Personalised stream: posts, admin/releases, listings, events.
// Sort (For You / Latest / Top) + filter (post type / source).
// ─────────────────────────────────────────────────────────────

function FeedView() {
  const { posts } = useAppState();
  const [sort, setSort] = React.useState('foryou');
  const [filter, setFilter] = React.useState('all');

  // Build the mixed feed (order is the "ranking")
  const stream = React.useMemo(() => {
    const base = [
      ...posts.map(p => ({ t: 'post', post: p })),
      { t: 'listing', id: 'mms601' },
      { t: 'post', post: POSTS[0] },
      { t: 'admin', post: ADMIN_POSTS[0] },
      { t: 'event', id: 'mumbai4' },
      { t: 'post', post: POSTS[4] },
      { t: 'listing', id: 'lego10307' },
      { t: 'post', post: POSTS[3] },
      { t: 'post', post: POSTS[1] },
      { t: 'listing', id: 'minigt-r35' },
      { t: 'post', post: POSTS[2] },
      { t: 'admin', post: ADMIN_POSTS[1] },
      { t: 'listing', id: 'tomica-r34' },
    ];
    let s = base;
    if (sort === 'latest') s = [...base].reverse();
    if (filter === 'hidelistings') s = s.filter(x => x.t !== 'listing');
    if (filter === 'posts') s = s.filter(x => x.t === 'post');
    if (filter === 'following') s = s.filter(x => x.t === 'post' || x.t === 'listing');
    return s;
  }, [posts, sort, filter]);

  return (
    <Screen header={<AppBar title="CollectorHub" wordmark/>}>
      {/* sort + filter bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 4, background: 'var(--paper)', borderBottom: '1px solid var(--border)', padding: '10px 16px' }}>
        <Segmented
          options={[{ id: 'foryou', label: 'For You' }, { id: 'latest', label: 'Latest' }, { id: 'top', label: 'Top' }]}
          value={sort} onChange={setSort}/>
        <div style={{ display: 'flex', gap: 7, marginTop: 10, overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'following', label: 'Following' },
            { id: 'posts', label: 'Discussions' },
            { id: 'hidelistings', label: 'Hide listings' },
          ].map(f => <CategoryChip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</CategoryChip>)}
        </div>
      </div>

      {stream.map((x, i) => {
        if (x.t === 'post')    return <PostCard key={x.post.id || i} post={x.post} showFollow/>;
        if (x.t === 'admin')   return <AdminCard key={x.post.id} post={x.post}/>;
        if (x.t === 'listing') return <ListingFeedCard key={x.id + i} id={x.id}/>;
        if (x.t === 'event')   return <FeedEventCard key={x.id} id={x.id}/>;
        return null;
      })}

      <div style={{ padding: '24px 16px 32px', textAlign: 'center', color: 'var(--ink-ghost)', fontSize: 12.5 }}>
        You’re all caught up · tuned to {ME.interests.length} interests
      </div>
    </Screen>
  );
}

// event surfaced as a feed card — BRD §8.4 FE-03
function FeedEventCard({ id }) {
  const { push } = useNav();
  const ev = EVENTS.find(e => e.id === id);
  return (
    <div style={{ background: 'var(--paper)', borderBottom: '8px solid var(--bone)', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <Ico d={Icons.calendar} size={16} stroke={2} style={{ color: 'var(--plum)' }}/>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--plum)' }}>Event near you</span>
      </div>
      <EventCard ev={ev} onOpen={() => push({ name: 'event', id })}/>
    </div>
  );
}

Object.assign(window, { FeedView });
