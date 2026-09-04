// ─────────────────────────────────────────────────────────────
// CollectorHub — App shell + router
// ─────────────────────────────────────────────────────────────

const ROUTES = {
  feed:             (r) => <FeedView/>,
  market:           (r) => <MarketView/>,
  community:        (r) => <CommunityView/>,
  events:           (r) => <EventsView/>,
  profile:          (r) => <ProfileView route={r}/>,
  follows:          (r) => <FollowList route={r}/>,
  vouches:          (r) => <VouchList route={r}/>,
  vouch:            (r) => <VouchView route={r}/>,
  rewards:          (r) => <RewardsView route={r}/>,
  leaderboard:      (r) => <LeaderboardView route={r}/>,
  refer:            (r) => <ReferView route={r}/>,
  badges:           (r) => <BadgesView route={r}/>,
  listing:          (r) => <ListingView route={r}/>,
  'item-listings':  (r) => <ItemListingsView route={r}/>,
  post:             (r) => <PostDetail route={r}/>,
  item:             (r) => <ItemDetail route={r}/>,
  'add-item':       (r) => <AddItemView route={r}/>,
  'complete-items': (r) => <CompleteItemsView route={r}/>,
  'add-listing':    (r) => <AddListingView route={r}/>,
  'explore':        (r) => <ExploreView route={r}/>,
  'explore-item':   (r) => <ItemDetail route={r}/>,
  'db-people':      (r) => <DbPeopleList route={r}/>,
  'add-to-db':      (r) => <AddToDbView route={r}/>,
  'add-iso':         (r) => <ISOFormView/>,
  'edit-profile':   (r) => <EditProfileView/>,
  'edit-avatar':    (r) => <EditAvatarView/>,
  sell:             (r) => <SellView route={r}/>,
  settings:          (r) => { const S = window.SettingsView; return S ? <S/> : null; },
  'vouch-request':   (r) => <VouchRequestView/>,
  'blocked-users':   (r) => { const B = window.BlockedUsersView; return B ? <B/> : null; },
  'community-detail':(r) => <CommunityDetail route={r}/>,
  'community-manage':(r) => <CommunityManageView route={r}/>,
  'create-community':(r) => <CreateCommunityView route={r}/>,
  event:            (r) => <EventDetail route={r}/>,
  'create-event':   (r) => <EventCreateView route={r}/>,
  'event-manage':   (r) => <EventManageView route={r}/>,
  inbox:            (r) => <InboxView/>,
  chat:             (r) => <ChatView route={r}/>,
};

function Router() {
  const { tab, stacks, overlay } = useNav();
  const stack = stacks[tab];

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* render the stack — each layer absolutely positioned, top is visible */}
      {stack.map((route, i) => (
        <div key={tab + '-' + i + '-' + route.name} style={{
          position: 'absolute', inset: 0, zIndex: i,
          visibility: i === stack.length - 1 ? 'visible' : 'hidden',
        }}>
          <StackedScreen depth={i}>
            {(ROUTES[route.name] || ROUTES.feed)(route)}
          </StackedScreen>
        </div>
      ))}

      {/* overlays */}
      {overlay && overlay.name === 'compose' && <ComposeOverlay community={overlay.community} kind={overlay.kind} type={overlay.type}/>}
      {overlay && overlay.name === 'search' && <SearchOverlay/>}
      {overlay && overlay.name === 'notifications' && <NotificationsOverlay seg={overlay.seg}/>}
      {overlay && overlay.name === 'share' && <ShareSheet label={overlay.label}/>}
      {overlay && overlay.name === 'share-to-feed' && <ShareToFeedSheet listingId={overlay.listingId}/>}

      <Toast/>
    </div>
  );
}

function App({ initialProfile }) {
  return (
    <AppStateProvider initialProfile={initialProfile}>
      <NavProvider>
        <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--paper)' }}>
          <Router/>
        </div>
      </NavProvider>
    </AppStateProvider>
  );
}

function Root() {
  const [entered, setEntered] = React.useState(false);
  // Onboarding renders as a SIBLING of <App/>, so it is outside AppStateProvider and cannot call
  // useAppState(). It hands its collected profile up through onEnter, and we seed the provider
  // with it — the provider mounts only after `entered` flips, so anything written from inside
  // onboarding would otherwise be discarded.
  const [initialProfile, setInitialProfile] = React.useState(null);
  // Only a plain patch object seeds the profile: the guest and log-in paths call this same
  // callback with a click event or an email string.
  const enter = (patch) => {
    if (patch && typeof patch === 'object' && !patch.nativeEvent && !patch.target) setInitialProfile(patch);
    setEntered(true);
  };
  // expose a reset so the Profile gear can replay onboarding
  window.chReset = () => setEntered(false);
  return entered ? <App initialProfile={initialProfile}/> : <OnboardingFlow onEnter={enter}/>;
}

ReactDOM.createRoot(document.getElementById('phone-mount')).render(
  <IOSDevice><Root/></IOSDevice>
);
