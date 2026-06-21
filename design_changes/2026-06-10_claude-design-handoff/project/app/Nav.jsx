// ─────────────────────────────────────────────────────────────
// CollectorHub — Navigation + App state (5-tab IA, BRD §9)
// ─────────────────────────────────────────────────────────────

const NavContext = React.createContext(null);
const useNav = () => React.useContext(NavContext);
const StateContext = React.createContext(null);
const useAppState = () => React.useContext(StateContext);

const TAB_ROOTS = {
  feed:      { name: 'feed' },
  market:    { name: 'market' },
  community: { name: 'community' },
  events:    { name: 'events' },
  me:        { name: 'profile', user: 'you', isMe: true },
};

function NavProvider({ children }) {
  const [tab, setTab] = React.useState('feed');
  const [stacks, setStacks] = React.useState({
    feed:      [TAB_ROOTS.feed],
    market:    [TAB_ROOTS.market],
    community: [TAB_ROOTS.community],
    events:    [TAB_ROOTS.events],
    me:        [TAB_ROOTS.me],
  });
  // overlay: { name: 'compose'|'search'|'notifications', ... } | null
  const [overlay, setOverlay] = React.useState(null);
  const [toast, setToast] = React.useState(null);

  const push = React.useCallback((route) => {
    setStacks(s => ({ ...s, [tab]: [...s[tab], route] }));
  }, [tab]);

  const pop = React.useCallback(() => {
    setStacks(s => {
      const cur = s[tab];
      if (cur.length <= 1) return s;
      return { ...s, [tab]: cur.slice(0, -1) };
    });
  }, [tab]);

  const switchTab = React.useCallback((t) => {
    setOverlay(null);
    if (t === tab) setStacks(s => ({ ...s, [tab]: [s[tab][0]] }));
    else setTab(t);
  }, [tab]);

  const flashToast = React.useCallback((text) => {
    const id = Date.now();
    setToast({ id, text });
    setTimeout(() => setToast(t => (t && t.id === id ? null : t)), 2400);
  }, []);

  const value = { tab, stacks, push, pop, switchTab, overlay, setOverlay, toast, flashToast };
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

function AppStateProvider({ children }) {
  const [hearted, setHearted]   = React.useState({ p2: true });
  const [saved, setSaved]       = React.useState({ 'sideshow-batman': true });
  const [followed, setFollowed] = React.useState({ rohit_scale: true, vikram: true });
  const [joined, setJoined]     = React.useState({ itm: true, jdm: true });
  const [interested, setInterested] = React.useState({ mumbai4: true });
  const [wishAlerts, setWishAlerts] = React.useState({ w1: true, w2: true });
  const [readNotifs, setReadNotifs] = React.useState({});
  const [threads, setThreads]   = React.useState(() => JSON.parse(JSON.stringify(THREADS)));
  const [deals, setDeals]       = React.useState({});   // chat handle -> 'requested'|'confirmed'
  const [listingStatus, setListingStatus] = React.useState({}); // listing id -> status override
  const [posts, setPosts]       = React.useState([]);   // user-created posts (prepended to feed)

  const toggleHeart  = (id) => setHearted(h => ({ ...h, [id]: !h[id] }));
  const toggleSave   = (id) => setSaved(s => ({ ...s, [id]: !s[id] }));
  const toggleFollow = (h)  => setFollowed(f => ({ ...f, [h]: !f[h] }));
  const toggleJoin   = (id) => setJoined(j => ({ ...j, [id]: !j[id] }));
  const toggleInterested = (id) => setInterested(r => ({ ...r, [id]: !r[id] }));
  const toggleWish   = (id) => setWishAlerts(w => ({ ...w, [id]: !w[id] }));
  const markNotifsRead = () => setReadNotifs(NOTIFICATIONS.reduce((a, n) => (a[n.id] = true, a), {}));

  const sendMessage = (handle, text) => setThreads(t => {
    const cur = t[handle] || { listing: null, messages: [] };
    return { ...t, [handle]: { ...cur, messages: [...cur.messages, { from: 'me', text, time: 'now' }] } };
  });
  const requestDeal = (handle) => setDeals(d => ({ ...d, [handle]: 'requested' }));
  const confirmDeal = (handle) => setDeals(d => ({ ...d, [handle]: 'confirmed' }));
  const setListing  = (id, status) => setListingStatus(s => ({ ...s, [id]: status }));
  const addPost     = (post) => setPosts(p => [{ ...post, id: 'u' + Date.now(), mine: true, time: 'now', likes: 0, comments: 0 }, ...p]);

  const value = {
    hearted, saved, followed, joined, interested, wishAlerts, readNotifs, threads, deals, listingStatus, posts,
    toggleHeart, toggleSave, toggleFollow, toggleJoin, toggleInterested, toggleWish,
    markNotifsRead, sendMessage, requestDeal, confirmDeal, setListing, addPost,
  };
  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}

// Animated stacked screen wrapper
function StackedScreen({ children, depth }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'var(--paper)',
      display: 'flex', flexDirection: 'column',
      animation: depth > 0 ? 'slideInRight 240ms cubic-bezier(0.22,1,0.36,1)' : 'fadeIn 160ms',
    }}>{children}</div>
  );
}

function Toast() {
  const { toast } = useNav();
  if (!toast) return null;
  return (
    <div key={toast.id} style={{
      position: 'absolute', bottom: 104, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--ink)', color: 'var(--paper)', padding: '11px 18px', borderRadius: 999,
      fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow-3)',
      animation: 'pop 240ms var(--ease-spring)', zIndex: 200, whiteSpace: 'nowrap', maxWidth: 340,
      fontFamily: 'var(--font-body)',
    }}>{toast.text}</div>
  );
}

Object.assign(window, {
  NavContext, useNav, StateContext, useAppState,
  NavProvider, AppStateProvider, StackedScreen, Toast,
});
