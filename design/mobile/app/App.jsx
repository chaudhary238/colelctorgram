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
  listing:          (r) => <ListingView route={r}/>,
  post:             (r) => <PostDetail route={r}/>,
  item:             (r) => <ItemDetail route={r}/>,
  'add-item':       (r) => <AddItemView route={r}/>,
  sell:             (r) => <SellView route={r}/>,
  'community-detail':(r) => <CommunityDetail route={r}/>,
  event:            (r) => <EventDetail route={r}/>,
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
      {overlay && overlay.name === 'compose' && <ComposeOverlay community={overlay.community}/>}
      {overlay && overlay.name === 'search' && <SearchOverlay/>}
      {overlay && overlay.name === 'notifications' && <NotificationsOverlay/>}

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
