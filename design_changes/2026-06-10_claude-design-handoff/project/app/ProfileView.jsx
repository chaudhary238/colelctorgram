// ─────────────────────────────────────────────────────────────
// Profile (own & others) — BRD §9.11
// Header + trust signals + tabs: Posts / Collection / Communities / Trades
// ─────────────────────────────────────────────────────────────

function ProfileView({ route }) {
  const handle = route.user;
  const isMe = !!route.isMe || handle === 'you';
  const u = isMe ? ME : userOf(handle);
  const { push, pop, flashToast, setOverlay } = useNav();
  const { followed, toggleFollow, joined } = useAppState();
  const [tab, setTab] = React.useState('collection');
  const isFollowing = followed[handle];

  const myItems = MY_ITEMS;
  const myCommunities = COMMUNITIES.filter(c => joined[c.id]);
  const myPosts = isMe ? POSTS.filter(p => p.user === 'meera').slice(0, 0) : POSTS.filter(p => p.user === handle);

  const header = isMe
    ? <AppBar title="Profile"/>
    : <DetailHeader title={u.name} subtitle={'@' + u.handle}
        trailing={<IconButton icon={<Ico d={Icons.more} size={18}/>} onClick={() => flashToast('Report / block')}/>}/>;

  return (
    <Screen header={header} nav={isMe}>
      {/* identity header */}
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <Avatar name={u.name} color={u.color} size={68}/>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 21, letterSpacing: '-0.02em' }}>{u.name}</span>
              <TierChip tier={u.tier}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>@{u.handle} · {u.city}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: presenceOf(u.handle) === 'Online now' ? 'var(--forest)' : 'var(--ink-ghost)' }}/>
              <span style={{ fontSize: 12, color: presenceOf(u.handle) === 'Online now' ? 'var(--forest)' : 'var(--ink-faint)', fontWeight: presenceOf(u.handle) === 'Online now' ? 600 : 400 }}>{presenceOf(u.handle)}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <Stat n={u.followers} l="followers" onClick={() => push({ name: 'follows', user: u.handle, mode: 'followers' })}/>
              <Stat n={u.following} l="following" onClick={() => push({ name: 'follows', user: u.handle, mode: 'following' })}/>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 12 }}>{u.bio}</div>

        {/* ownership stats — BRD v1.2 §9.11 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', marginTop: 10, fontSize: 12.5, color: 'var(--ink-mute)' }}>
          {ownStats(u).map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: 'var(--ink-ghost)' }}>·</span>}
              <span><b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{s.split(' ')[0]}</b> {s.split(' ').slice(1).join(' ')}</span>
            </React.Fragment>
          ))}
          <span style={{ color: 'var(--ink-ghost)' }}>·</span>
          <span>portfolio <b style={{ color: 'var(--ink)' }}><Money value={u.portfolio}/></b></span>
        </div>

        {/* trust signals — BRD §8.2 PR-05 */}
        <div style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginTop: 14 }}>
          <TrustSignals u={u}/>
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
          {isMe ? (
            <>
              <Button variant="dark" style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.edit} size={16}/>}
                onClick={() => flashToast('Edit profile & interests')}>Edit profile</Button>
              <Button variant="secondary" icon={<Ico d={Icons.plusCircle} size={17}/>}
                onClick={() => push({ name: 'add-item' })}>Add item</Button>
              <IconButton icon={<Ico d={Icons.settings} size={18}/>} onClick={() => { if (window.chReset) window.chReset(); }}/>
            </>
          ) : (
            <>
              <Button variant={isFollowing ? 'secondary' : 'dark'} style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { toggleFollow(handle); flashToast(isFollowing ? `Unfollowed @${u.handle}` : `Following @${u.handle}`); }}>
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button variant="primary" style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.message} size={16}/>}
                onClick={() => push({ name: 'chat', user: handle })}>Message</Button>
              <IconButton icon={<Ico d={Icons.shield} size={18}/>} onClick={() => flashToast('Trade vouch needs a confirmed deal first')}/>
            </>
          )}
        </div>
      </div>

      {/* tabs */}
      <div style={{ position: 'sticky', top: 0, zIndex: 3, background: 'var(--paper)', padding: '16px 16px 10px', marginTop: 8, borderBottom: '1px solid var(--border)' }}>
        <Segmented value={tab} onChange={setTab}
          options={[{ id: 'collection', label: 'Collection' }, { id: 'posts', label: 'Posts' }, { id: 'communities', label: 'Communities' }, { id: 'trades', label: 'Trades' }]}/>
      </div>

      <div style={{ padding: '14px 16px 28px' }}>
        {tab === 'collection' && <CollectionTab items={myItems} u={u} isMe={isMe}/>}
        {tab === 'posts' && (
          myPosts.length
            ? <div style={{ margin: '0 -16px' }}>{myPosts.map(p => <PostCard key={p.id} post={p}/>)}</div>
            : <EmptyNote>{isMe ? 'You haven’t posted yet. Tap + to showcase a piece.' : 'No posts yet.'}</EmptyNote>
        )}
        {tab === 'communities' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myCommunities.map(c => <CommunityCard key={c.id} com={c} onOpen={() => push({ name: 'community-detail', id: c.id })}/>)}
            {myCommunities.length === 0 && <EmptyNote>Not in any community yet.</EmptyNote>}
          </div>
        )}
        {tab === 'trades' && <TradesTab/>}
      </div>
    </Screen>
  );
}

function Stat({ n, l, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'baseline', gap: 5, background: 'none', border: 'none', padding: 0, cursor: onClick ? 'pointer' : 'default' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, fontFeatureSettings: '"tnum" 1', color: 'var(--ink)' }}>{n.toLocaleString('en-IN')}</span>
      <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{l}</span>
    </button>
  );
}

// Followers / Following list (BRD v1.2 §9.11) — tappable counts open this
function FollowList({ route }) {
  const { push } = useNav();
  const { followed, toggleFollow, flashToast } = { ...useAppState(), ...useNav() };
  const subject = route.user === 'you' ? ME : userOf(route.user);
  const mode = route.mode || 'followers';
  // build a plausible list from the user directory
  const people = Object.values(USERS).filter(u => u.handle !== route.user);
  const count = mode === 'followers' ? subject.followers : subject.following;
  return (
    <Screen nav={false} header={<DetailHeader title={mode === 'followers' ? 'Followers' : 'Following'} subtitle={`@${subject.handle} · ${count.toLocaleString('en-IN')}`}/>}>
      <div style={{ padding: '8px 0 24px' }}>
        {people.map(u => {
          const isFollowing = followed[u.handle];
          return (
            <div key={u.handle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => push({ name: 'profile', user: u.handle })} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <Avatar name={u.name} color={u.color} size={44}/>
              </button>
              <button onClick={() => push({ name: 'profile', user: u.handle })} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: presenceOf(u.handle) === 'Online now' ? 'var(--forest)' : 'transparent' }}/>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>@{u.handle} · {u.deals} deals</div>
              </button>
              <Button size="sm" variant={isFollowing ? 'secondary' : 'dark'}
                onClick={() => { toggleFollow(u.handle); flashToast(isFollowing ? `Unfollowed @${u.handle}` : `Following @${u.handle}`); }}>
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

// Collection portfolio tab — grid + chart / calendar / collage views (BRD v1.2 §9.5)
function CollectionTab({ items, u, isMe }) {
  const [seg, setSeg] = React.useState('owned');
  const [view, setView] = React.useState('grid');
  // per-view visibility (BRD v1.2 §9.5) — owner sets each view public/private
  const [vis, setVis] = React.useState({ grid: 'public', chart: 'public', calendar: 'public', collage: 'private' });
  const { flashToast } = useNav();

  const owned = items.filter(i => i.status !== 'wishlist');
  const ownedValue = items.filter(i => i.status === 'owned').reduce((s, i) => s + i.value, 0);
  const filtered = items.filter(i => i.status === seg);

  const views = [
    { id: 'grid', icon: Icons.grid, label: 'Grid' },
    { id: 'chart', icon: Icons.chart, label: 'Chart' },
    { id: 'calendar', icon: Icons.calendar, label: 'Calendar' },
    { id: 'collage', icon: Icons.gallery, label: 'Collage' },
  ];
  const isPrivate = vis[view] === 'private';
  const hiddenFromViewer = !isMe && isPrivate;

  return (
    <div>
      {/* portfolio value */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <ValueCard label="Portfolio value" value={ownedValue} accent="var(--stamp-red)"/>
        <ValueCard label="Items owned" value={owned.length} plain accent="var(--ink)"/>
      </div>

      {/* view switcher + per-view visibility */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, flex: 1, overflowX: 'auto' }}>
          {views.map(v => {
            const on = view === v.id;
            return (
              <button key={v.id} onClick={() => setView(v.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
                background: on ? 'var(--ink)' : 'var(--paper-soft)', color: on ? 'var(--paper)' : 'var(--ink)',
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12.5, whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                <Ico d={v.icon} size={15} stroke={on ? 2 : 1.75}/>{v.label}
              </button>
            );
          })}
        </div>
        {isMe && (
          <button onClick={() => { setVis(s => ({ ...s, [view]: isPrivate ? 'public' : 'private' })); flashToast(`${views.find(v => v.id === view).label} view ${isPrivate ? 'now public' : 'now private'}`); }}
            title="Toggle who can see this view" style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
              border: '1px solid var(--border-strong)', background: isPrivate ? 'var(--bone)' : 'var(--paper-soft)',
              color: isPrivate ? 'var(--ink-faint)' : 'var(--verified-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Ico d={isPrivate ? Icons.eyeOff : Icons.eye} size={18}/>
          </button>
        )}
      </div>

      {hiddenFromViewer ? (
        <div style={{ textAlign: 'center', padding: '34px 0', color: 'var(--ink-faint)' }}>
          <Ico d={Icons.eyeOff} size={26} style={{ color: 'var(--ink-ghost)' }}/>
          <div style={{ fontSize: 13.5, marginTop: 8 }}>This view is private.</div>
        </div>
      ) : <>
        {isMe && isPrivate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 12 }}>
            <Ico d={Icons.eyeOff} size={14}/> Only you can see this view.
          </div>
        )}

        {view === 'grid' && <>
          <Segmented value={seg} onChange={setSeg}
            options={[{ id: 'owned', label: 'Owned' }, { id: 'wishlist', label: 'Wishlist' }, { id: 'preorder', label: 'Pre-order' }]}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginTop: 14 }}>
            {filtered.map(it => <ItemTile key={it.id} item={it} isMe={isMe}/>)}
          </div>
          {filtered.length === 0 && <EmptyNote>{isMe ? 'Nothing here yet — add from the catalogue.' : 'Private or empty.'}</EmptyNote>}
        </>}

        {view === 'chart' && <PortfolioChart items={owned}/>}
        {view === 'calendar' && <PortfolioCalendar items={items}/>}
        {view === 'collage' && <PortfolioCollage items={owned}/>}
      </>}
    </div>
  );
}

// Chart view — value & count by type (BRD v1.2 §9.5)
function PortfolioChart({ items }) {
  const byCat = {};
  items.forEach(i => { const c = catOf(i.sku); const k = c ? c.cat : 'other'; (byCat[k] = byCat[k] || { count: 0, value: 0 }); byCat[k].count++; byCat[k].value += i.value; });
  const rows = Object.entries(byCat).sort((a, b) => b[1].value - a[1].value);
  const max = Math.max(1, ...rows.map(([, v]) => v.value));
  const tones = { figures: 'var(--stamp-red)', designer: 'var(--plum)', kits: 'var(--forest)', diecast: 'var(--verified-teal)', other: 'var(--ink-mute)' };
  const labels = { figures: 'Action Figures', designer: 'Designer Toys', kits: 'Kits & Lego', diecast: 'Diecast', other: 'Other' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 2px' }}>
      {rows.map(([k, v]) => (
        <div key={k}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{labels[k] || k}</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{v.count} · <Money value={v.value}/></span>
          </div>
          <div style={{ height: 12, borderRadius: 999, background: 'var(--bone)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: Math.max(6, Math.round((v.value / max) * 100)) + '%', background: tones[k] || 'var(--ink)', borderRadius: 999, transition: 'width 320ms var(--ease-out)' }}/>
          </div>
        </div>
      ))}
      {rows.length === 0 && <EmptyNote>No items to chart yet.</EmptyNote>}
    </div>
  );
}

// Calendar view — pre-order timeline (BRD v1.2 §9.5)
function PortfolioCalendar({ items }) {
  const pos = items.filter(i => i.status === 'preorder');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {pos.map(it => {
        const c = catOf(it.sku);
        return (
          <div key={it.id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, padding: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 10, background: 'var(--grail-gold-soft)', color: 'var(--grail-gold-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico d={Icons.calendar} size={20}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{it.order || 'Ordered'} · {it.eta || 'ETA TBD'}</div>
            </div>
            <Tag kind="po">PO</Tag>
          </div>
        );
      })}
      {pos.length === 0 && <EmptyNote>No pre-orders on the calendar.</EmptyNote>}
    </div>
  );
}

// Collage view — showcase wall (BRD v1.2 §9.5)
function PortfolioCollage({ items }) {
  const { push } = useNav();
  if (items.length === 0) return <EmptyNote>Nothing to show off yet.</EmptyNote>;
  return (
    <div style={{ columnCount: 2, columnGap: 8 }}>
      {items.map((it, i) => {
        const c = catOf(it.sku);
        const ratio = ['3/4', '1/1', '4/5', '1/1'][i % 4];
        return (
          <button key={it.id} onClick={() => push({ name: 'item', sku: it.sku })} style={{
            width: '100%', marginBottom: 8, padding: 0, border: 'none', borderRadius: 12, overflow: 'hidden',
            cursor: 'pointer', display: 'inline-block', breakInside: 'avoid', position: 'relative',
          }}>
            <ProductPhoto tone={c.tone} ratio={ratio} rounded={12} label={c.brand}/>
          </button>
        );
      })}
    </div>
  );
}

function ValueCard({ label, value, accent, plain }) {
  return (
    <div style={{ flex: 1, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, padding: '12px 14px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 19, color: accent, fontFeatureSettings: '"tnum" 1' }}>
        {plain ? value : <Money value={value}/>}
      </div>
    </div>
  );
}

function ItemTile({ item, isMe }) {
  const { push } = useNav();
  const c = catOf(item.sku);
  return (
    <button onClick={() => push({ name: 'item', sku: item.sku })} style={{
      background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, overflow: 'hidden',
      cursor: 'pointer', textAlign: 'left', padding: 0, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'relative' }}>
        <ProductPhoto tone={c.tone} ratio="1/1" rounded={0}/>
        <div style={{ position: 'absolute', top: 7, left: 7 }}><VerifyBadge tier={item.verify}/></div>
        {item.listed && <div style={{ position: 'absolute', top: 7, right: 7 }}><Tag kind="sale">Listed</Tag></div>}
        {item.status === 'preorder' && <div style={{ position: 'absolute', bottom: 7, left: 7 }}><Tag kind="po">PO</Tag></div>}
      </div>
      <div style={{ padding: '8px 9px 10px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25, color: 'var(--ink)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 31 }}>{c.title}</div>
        <div style={{ fontSize: 12.5, marginTop: 5, color: 'var(--ink-mute)' }}><Money value={item.value}/></div>
      </div>
    </button>
  );
}

function TradesTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {TRADE_HISTORY.map((d, i) => {
        const u = userOf(d.with);
        return (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < TRADE_HISTORY.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <Avatar name={u.name} color={u.color} size={40}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{d.dir} · {d.item}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>with @{u.handle} · {d.when}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
              <Stars n={d.rating} size={12}/>
              <Tag kind="vouch" style={{ fontSize: 9 }}>Vouched</Tag>
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { ProfileView, FollowList, CollectionTab, PortfolioChart, PortfolioCalendar, PortfolioCollage, ItemTile, TradesTab });
