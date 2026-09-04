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
  database:  { name: 'explore' },
  me:        { name: 'profile', user: 'you', isMe: true },
};

function NavProvider({ children }) {
  const [tab, setTab] = React.useState('feed');
  const [stacks, setStacks] = React.useState({
    feed:      [TAB_ROOTS.feed],
    market:    [TAB_ROOTS.market],
    community: [TAB_ROOTS.community],
    database:  [TAB_ROOTS.database],
    me:        [TAB_ROOTS.me],
  });
  // overlay: { name: 'compose'|'search'|'notifications', ... } | null
  const [overlay, setOverlay] = React.useState(null);
  const [toast, setToast] = React.useState(null);

  const push = React.useCallback((route) => {
    setStacks(s => ({ ...s, [tab]: [...s[tab], route] }));
  }, [tab]);

  const pop = React.useCallback((levels = 1) => {
    const topRoute = stacks[tab][stacks[tab].length - 1];
    if (topRoute?._returnOverlay) setOverlay(topRoute._returnOverlay);
    setStacks(s => {
      const cur = s[tab];
      const n = Math.max(1, Math.min(Number(levels) || 1, cur.length - 1));
      if (cur.length <= 1) return s;
      return { ...s, [tab]: cur.slice(0, cur.length - n) };
    });
  }, [tab, stacks]);

  const switchTab = React.useCallback((t) => {
    setOverlay(null);
    if (t === tab) setStacks(s => ({ ...s, [tab]: [s[tab][0]] }));
    else setTab(t);
  }, [tab]);

  // Toast takes an optional second line — used to teach the XP rule at the moment it's earned.
  const flashToast = React.useCallback((text, sub) => {
    const id = Date.now();
    setToast({ id, text, sub });
    setTimeout(() => setToast(t => (t && t.id === id ? null : t)), sub ? 3200 : 2400);
  }, []);

  const value = { tab, stacks, push, pop, switchTab, overlay, setOverlay, toast, flashToast };
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

function AppStateProvider({ children, initialProfile }) {
  const [hearted, setHearted]   = React.useState({ p2: true });
  const [saved, setSaved]       = React.useState({ 'sideshow-batman': true });
  const [followed, setFollowed] = React.useState({ rohit_scale: true, vikram: true });
  const [joined, setJoined]     = React.useState({ itm: true, jdm: true, mfh: true });
  const [comRequested, setComRequested] = React.useState({}); // private communities I've requested to join
  const [guidelinesAccepted, setGuidelinesAccepted] = React.useState({}); // communityId -> true, persists across visits
  const [interested, setInterested] = React.useState({ mumbai4: true });
  const [readNotifs, setReadNotifs] = React.useState({});
  const [threads, setThreads]   = React.useState(() => JSON.parse(JSON.stringify(THREADS)));
  const [deals, setDeals]       = React.useState({});   // chat handle -> 'requested'|'confirmed'
  const [listingStatus, setListingStatus] = React.useState({}); // listing id -> status override
  // Unlisting archives the terms instead of dropping them, so Relist is one tap and not a re-typed form.
  const [archivedListings, setArchivedListings] = React.useState({}); // listing id -> snapshot
  // Edits to a seeded listing can't mutate the seed array — the override is merged wherever it's read.
  const [listingPatch, setListingPatch] = React.useState({});         // listing id -> edited fields
  const [posts, setPosts]       = React.useState(() => [
    { id: 'demo-share1', type: 'listing-share', user: 'aman_toys', listingId: 'mms601', caption: 'Finally letting this one go — mint, sealed, comes with the original shipper. Priced to move fast.', time: '2h', likes: 24, comments: 3 },
    ...(typeof ISO_POSTS !== 'undefined' ? ISO_POSTS.slice(0, 3) : []),
  ]);   // seeded with ISO posts + user-created posts
  const [userListings, setUserListings] = React.useState([]); // user-created market listings
  // Seeded from onboarding's answers, which are collected before this provider exists.
  const [profile, setProfile]   = React.useState(initialProfile || {});  // overrides on ME (edit profile / avatar)
  const [vouched, setVouched]   = React.useState({});  // handle -> { rel, note } (vouches you've given)
  const [userEvents, setUserEvents] = React.useState([]); // events you host (pending/approved)
  const [rsvp, setRsvp]         = React.useState({});  // eventId -> 'going' | 'interested'
  const [userCommunities, setUserCommunities] = React.useState([]); // communities created via event hosting
  const [communityRoleOverrides, setCommunityRoleOverrides] = React.useState({}); // comId -> { handle -> role|null }
  const [communityRemoved, setCommunityRemoved] = React.useState({}); // comId -> { handle: true }
  const [communityRemovalReasons, setCommunityRemovalReasons] = React.useState({}); // comId -> { handle: reason }
  const [removedCommunityPosts, setRemovedCommunityPosts] = React.useState({}); // postId -> true (admin-removed)
  const [removedPostReasons, setRemovedPostReasons] = React.useState({}); // postId -> reason
  const [eventCommunityDraft, setEventCommunityDraft] = React.useState(null); // id handed back from create-community
  const [eventDraft, setEventDraft] = React.useState(null); // in-progress "list an event" form, survives a detour to create-community
  const [reminders, setReminders] = React.useState({}); // eventId -> true
  const [removedSkus, setRemovedSkus] = React.useState({});
  // Keyed by item id where we have one, sku otherwise — MY_ITEMS holds several copies of the
  // same sku (owned + pre-ordered), so a sku-only key would remove all of them at once.
  const removeItem = (key) => setRemovedSkus(r => ({ ...r, [key]: true }));
  const [liveNotifs, setLiveNotifs] = React.useState([]); // runtime notifications added by user actions
  const [dbWishlist, setDbWishlist] = React.useState({}); // sku -> true (wishlisted from Explore Database)
  const [dbRatings, setDbRatings] = React.useState({}); // sku -> 1-5 (my rating)
  // "Is this price fair?" — my vote per listing, plus the running tally shown to the seller.
  const [priceVotes, setPriceVotes] = React.useState({});   // listingId -> 'low' | 'fair' | 'high'
  const [priceTally, setPriceTally] = React.useState({});   // listingId -> { low, fair, high }
  const [catalogueVersion, setCatalogueVersion] = React.useState(0); // bump to rerender after addToCatalogue mutation
  // Quick-add: a tap on a DB item lands the row instantly with condition/price still blank.
  const [userItems, setUserItems] = React.useState([]);
  const [itemInfo, setItemInfo] = React.useState({}); // item id -> patch filled in later (cond, value, eta, total, deposit)
  const [xp, setXp] = React.useState(1240);
  const awardXp = (n) => setXp(x => x + n);
  const quickAddItem = (sku, status) => {
    const id = 'q' + Date.now();
    setUserItems(p => p.find(i => i.sku === sku && i.status === (status || 'owned')) ? p : [...p, {
      id, sku, status: status || 'owned', verify: 'claimed',
      value: 0, listed: false, photos: 0, cond: '', quickAdded: true,
    }]);
    setRemovedSkus(r => { const c = { ...r }; delete c[sku]; return c; });
    awardXp(5);
  };
  // Deliberate second copy — same sku, different condition/purpose (resale, backup, gift).
  // Distinct from quickAddItem, which silently no-ops on a duplicate sku to stop accidental
  // re-adds; this always creates a new row because the user explicitly asked for one.
  const addAnotherCopy = (sku, status) => {
    const id = 'q' + Date.now();
    setUserItems(p => [...p, { id, sku, status: status || 'owned', verify: 'claimed', value: 0, listed: false, photos: 0, cond: '', quickAdded: true }]);
    awardXp(5);
    return id;
  };
  // Patches are keyed by item id so filling one copy never overwrites another copy of the same sku.
  const saveItemInfo = (id, patch) => { setItemInfo(m => ({ ...m, [id]: { ...(m[id] || {}), ...patch } })); awardXp(20); };
  // Used by the full add-to-collection form (condition/price/PO details already known up front) —
  // quickAddItem+saveItemInfo is a two-step dance built for the empty quick-add case.
  const addFullItem = (item) => { setUserItems(p => [...p, item]); awardXp(25); };
  // Status changes (Owned ⇄ Pre-order) are corrections, not completions — no XP.
  const setItemStatus = (id, status) => setItemInfo(m => ({ ...m, [id]: { ...(m[id] || {}), status } }));

  const toggleHeart  = (id) => setHearted(h => ({ ...h, [id]: !h[id] }));
  const toggleSave   = (id) => setSaved(s => ({ ...s, [id]: !s[id] }));
  const toggleFollow = (h)  => setFollowed(f => ({ ...f, [h]: !f[h] }));
  const toggleJoin   = (id) => setJoined(j => ({ ...j, [id]: !j[id] }));
  const requestJoin  = (id) => setComRequested(r => ({ ...r, [id]: true }));
  const cancelRequest = (id) => setComRequested(r => { const c = { ...r }; delete c[id]; return c; });
  const acceptGuidelines = (id) => setGuidelinesAccepted(g => ({ ...g, [id]: true }));
  const toggleInterested = (id) => setInterested(r => ({ ...r, [id]: !r[id] }));
  const addNotif = (n) => setLiveNotifs(p => [{ ...n, id: 'ln' + Date.now(), unread: true, time: 'just now' }, ...p]);
  // Voting is anonymous to the seller, but they are told a vote landed — the notification
  // never names the voter or their choice, only that the split moved.
  const castPriceVote = (listing, choice) => {
    const id = listing.id;
    setPriceVotes(v => {
      const prev = v[id];
      if (prev === choice) return v;
      setPriceTally(t => {
        const base = t[id] || { low: 0, fair: 0, high: 0 };
        const next = { ...base };
        if (choice) next[choice] = (next[choice] || 0) + 1;
        if (prev) next[prev] = Math.max(0, (next[prev] || 0) - 1);
        return { ...t, [id]: next };
      });
      if (choice && !prev && (listing.seller === 'you' || listing.mine)) {
        addNotif({ kind: 'market', user: 'you', text: `Someone voted on your price for ${listing.title || listing.sku} — see the split`, ref: { type: 'listing', id } });
      }
      const next = { ...v };
      if (choice) next[id] = choice; else delete next[id];
      return next;
    });
  };
  const markNotifsRead = () => setReadNotifs(r => {
    const all = { ...r };
    NOTIFICATIONS.forEach(n => { all[n.id] = true; });
    liveNotifs.forEach(n => { all[n.id] = true; });
    return all;
  });

  const sendMessage = (handle, text) => setThreads(t => {
    const cur = t[handle] || { listing: null, messages: [] };
    return { ...t, [handle]: { ...cur, messages: [...cur.messages, { from: 'me', text, time: 'now' }] } };
  });
  const requestDeal = (handle) => setDeals(d => ({ ...d, [handle]: 'requested' }));
  const confirmDeal = (handle) => setDeals(d => ({ ...d, [handle]: 'confirmed' }));
  const setListing  = (id, status) => setListingStatus(s => ({ ...s, [id]: status }));
  const [unlisted, setUnlisted] = React.useState({}); // listing id -> true (pulled from the market)
  const unlistListing = (id, snapshot) => {
    if (snapshot) setArchivedListings(a => ({ ...a, [id]: { ...snapshot } }));
    setUnlisted(u => ({ ...u, [id]: true }));
    setUserListings(p => p.filter(l => l.id !== id));
  };
  // Same id back on the market, so watchers, Q&A and price votes survive an unlist.
  const relistListing = (id) => {
    const snap = archivedListings[id];
    setUnlisted(u => { const c = { ...u }; delete c[id]; return c; });
    setListingStatus(s => ({ ...s, [id]: 'available' }));
    if (snap) setUserListings(p => p.some(l => l.id === id) ? p : [{ ...snap, status: 'available', posted: 'now' }, ...p]);
  };
  // Editing must never mint a second listing — patch in place and keep an override for seeded rows.
  const updateListing = (id, patch) => {
    setUserListings(p => p.map(l => l.id === id ? { ...l, ...patch } : l));
    setListingPatch(m => ({ ...m, [id]: { ...(m[id] || {}), ...patch } }));
  };
  // Sold is a flag on the copy, not a removal: it stays in Owned, greyed, out of portfolio value.
  const setItemSold = (id, sold) => setItemInfo(m => ({ ...m, [id]: { ...(m[id] || {}), sold: !!sold } }));
  const addPost     = (post) => setPosts(p => [{ ...post, id: 'u' + Date.now(), mine: true, time: 'now', likes: 0, comments: 0,
    status: post.community && postModeOf(post.community) === 'approval' ? 'pending' : 'approved' }, ...p]);
  const addListing  = (l) => setUserListings(p => [{ ...l, posted: 'now' }, ...p]);
  const updateProfile = (patch) => setProfile(p => ({ ...p, ...patch }));
  const addVouch    = (handle, data) => setVouched(v => ({ ...v, [handle]: data }));
  const removeVouch = (handle) => setVouched(v => { const c = { ...v }; delete c[handle]; return c; });
  const addEvent    = (ev) => setUserEvents(p => [{ ...ev }, ...p]);
  const updateEvent = (id, patch) => setUserEvents(p => p.map(e => e.id === id ? { ...e, ...patch } : e));
  const approveEvent = (id) => setUserEvents(p => p.map(e => e.id === id ? { ...e, status: 'approved' } : e));
  const cancelEvent = (id) => setUserEvents(p => p.filter(e => e.id !== id));
  const setEventRsvp = (id, status) => setRsvp(r => ({ ...r, [id]: r[id] === status ? undefined : status }));
  const addCommunity = (com) => setUserCommunities(p => [{ ...com, status: 'pending' }, ...p]);
  const approveCommunityDemo = (id) => setUserCommunities(p => p.map(c => c.id === id ? { ...c, status: 'approved' } : c));
  const setCommunityRole = (comId, handle, role) => setCommunityRoleOverrides(o => ({ ...o, [comId]: { ...(o[comId] || {}), [handle]: role } }));
  const removeCommunityMember = (comId, handle, reason) => {
    setCommunityRemoved(r => ({ ...r, [comId]: { ...(r[comId] || {}), [handle]: true } }));
    setCommunityRemovalReasons(r => ({ ...r, [comId]: { ...(r[comId] || {}), [handle]: reason || '' } }));
  };
  const removeCommunityPost = (id, reason) => { setRemovedCommunityPosts(p => ({ ...p, [id]: true })); setRemovedPostReasons(r => ({ ...r, [id]: reason || '' })); };
  const approveUserPost = (id) => setPosts(p => p.map(x => x.id === id ? { ...x, status: 'approved' } : x));
  const declineUserPost = (id, reason) => setPosts(p => p.map(x => x.id === id ? { ...x, status: 'declined', declineReason: reason || '' } : x));
  const dismissPendingPost = (id) => setPosts(p => p.filter(x => x.id !== id));
  const bindEventCommunity = (id) => setEventCommunityDraft(id);
  const clearEventCommunityDraft = () => setEventCommunityDraft(null);
  const toggleReminder = (id) => setReminders(r => ({ ...r, [id]: !r[id] }));
  const toggleDbWishlist = (sku) => setDbWishlist(w => ({ ...w, [sku]: !w[sku] }));
  const rateDbItem = (sku, stars) => setDbRatings(r => ({ ...r, [sku]: stars }));
  const contributeToCatalogue = (entry) => { addToCatalogue(entry); setCatalogueVersion(v => v + 1); };

  const value = {
    hearted, saved, followed, joined, comRequested, guidelinesAccepted, interested, readNotifs, threads, deals, listingStatus, unlisted, archivedListings, listingPatch, posts, userListings, profile, vouched,
    userEvents, rsvp, userCommunities, eventCommunityDraft, eventDraft, setEventDraft, reminders, liveNotifs, removedSkus, dbWishlist, dbRatings, catalogueVersion,
    communityRoleOverrides, communityRemoved, communityRemovalReasons, removedCommunityPosts, removedPostReasons,
    setCommunityRole, removeCommunityMember, removeCommunityPost, approveCommunityDemo, approveUserPost, declineUserPost, dismissPendingPost,
    userItems, itemInfo, xp, priceVotes, priceTally,
    toggleHeart, toggleSave, toggleFollow, toggleJoin, requestJoin, cancelRequest, acceptGuidelines, toggleInterested,
    markNotifsRead, addNotif, sendMessage, requestDeal, confirmDeal, setListing, unlistListing, relistListing, updateListing, setItemSold, addPost, addListing, updateProfile, addVouch, removeVouch,
    addEvent, updateEvent, approveEvent, cancelEvent, setEventRsvp, addCommunity, bindEventCommunity, clearEventCommunityDraft, toggleReminder, removeItem,
    toggleDbWishlist, rateDbItem, contributeToCatalogue,
    quickAddItem, saveItemInfo, addFullItem, addAnotherCopy, awardXp, setItemStatus, castPriceVote,
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
      background: 'var(--ink)', color: 'var(--paper)', padding: toast.sub ? '10px 18px 11px' : '11px 18px',
      borderRadius: toast.sub ? 16 : 999,
      fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow-3)',
      animation: 'pop 240ms var(--ease-spring)', zIndex: 200, whiteSpace: 'nowrap', maxWidth: 340,
      fontFamily: 'var(--font-body)', textAlign: toast.sub ? 'left' : 'center',
    }}>
      <div style={{ fontWeight: toast.sub ? 600 : 500 }}>{toast.text}</div>
      {toast.sub && <div style={{ fontSize: 11.5, fontWeight: 500, opacity: 0.72, marginTop: 2 }}>{toast.sub}</div>}
    </div>
  );
}

Object.assign(window, {
  NavContext, useNav, StateContext, useAppState,
  NavProvider, AppStateProvider, StackedScreen, Toast,
});
