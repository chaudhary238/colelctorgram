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
  'add-listing':    (r) => <AddListingView route={r}/>,
  'explore':        (r) => <ExploreView route={r}/>,
  'explore-item':   (r) => <ExploreItemDetail route={r}/>,
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
      {overlay && overlay.name === 'compose' && <ComposeOverlay community={overlay.community} kind={overlay.kind}/>}
      {overlay && overlay.name === 'search' && <SearchOverlay/>}
      {overlay && overlay.name === 'notifications' && <NotificationsOverlay/>}
      {overlay && overlay.name === 'share' && <ShareSheet label={overlay.label}/>}

      <Toast/>
    </div>
  );
}

function App() {
  return (
    <AppStateProvider>
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
  const enter = () => setEntered(true);
  // expose a reset so the Profile gear can replay onboarding
  window.chReset = () => setEntered(false);
  return entered ? <App/> : <OnboardingFlow onEnter={enter}/>;
}

ReactDOM.createRoot(document.getElementById('phone-mount')).render(
  <IOSDevice><Root/></IOSDevice>
);
