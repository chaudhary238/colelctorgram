// ─────────────────────────────────────────────────────────────
// ProfileSettings — SettingsView, BlockedUsersView
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// SettingsView — industry-standard app settings
// ─────────────────────────────────────────────────────────────
function SettingsView() {
  const { pop, push, flashToast } = useNav();

  // Notification toggles
  const [notifs, setNotifs] = React.useState({
    followers: true, messages: true, listingActivity: true,
    tradeRequests: true, eventReminders: true, communityActivity: false,
    priceDrops: true, newListings: false,
  });
  const toggleNotif = k => setNotifs(s => ({ ...s, [k]: !s[k] }));

  // Privacy
  const [collectionVis, setCollectionVis] = React.useState('public');
  const [messagingPref, setMessagingPref] = React.useState('followers');
  const [wishlistVis, setWishlistVis]     = React.useState('followers');
  const [showOnline, setShowOnline]       = React.useState(true);

  // Trading
  const [acceptTrades, setAcceptTrades]   = React.useState(true);
  const [shippingRange, setShippingRange] = React.useState('india');
  const [showPhone, setShowPhone]         = React.useState(false);

  // UI helpers
  const SectionHeader = ({ children }) => (
    <div style={{ padding: '20px 16px 7px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
      {children}
    </div>
  );

  const Row = ({ icon, label, sub, trailing, onClick, danger }) => (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px',
      borderBottom: '1px solid var(--border)', cursor: onClick ? 'pointer' : 'default',
      background: 'var(--paper)',
    }}>
      {icon && (
        <div style={{ width: 34, height: 34, borderRadius: 9, background: danger ? '#FEE2E2' : 'var(--paper-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: danger ? 'var(--stamp-red)' : 'var(--ink-soft)' }}>
          <Ico d={icon} size={17} stroke={1.8}/>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 500, color: danger ? 'var(--stamp-red)' : 'var(--ink)', lineHeight: 1.2 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, lineHeight: 1.3 }}>{sub}</div>}
      </div>
      {trailing}
      {onClick && !trailing && <Ico d={Icons.chevRight} size={16} style={{ color: 'var(--ink-ghost)', flexShrink: 0 }}/>}
    </div>
  );

  const Toggle = ({ on, onToggle }) => (
    <div onClick={onToggle} style={{
      width: 44, height: 26, borderRadius: 13, flexShrink: 0, cursor: 'pointer', position: 'relative',
      background: on ? 'var(--ink)' : 'var(--border-strong)', transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%',
        background: 'var(--paper)', transition: 'left 0.18s', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
      }}/>
    </div>
  );

  const RadioGroup = ({ value, onChange, options }) => (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          padding: '5px 11px', borderRadius: 8, border: `1px solid ${value === o.id ? 'var(--ink)' : 'var(--border-strong)'}`,
          background: value === o.id ? 'var(--ink)' : 'var(--paper-soft)',
          color: value === o.id ? 'var(--paper)' : 'var(--ink)',
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>{o.label}</button>
      ))}
    </div>
  );

  return (
    <Screen nav={false} header={
      <DetailHeader title="Settings" onBack={pop}/>
    }>
      <div style={{ paddingBottom: 40 }}>

        {/* ── Account ─────────────────────────────────── */}
        <SectionHeader>Account</SectionHeader>
        <Row icon={Icons.edit}    label="Edit profile"  onClick={() => push({ name: 'edit-profile' })}/>
        <Row icon={Icons.user}    label="Edit avatar"   onClick={() => push({ name: 'edit-avatar'  })}/>
        <Row icon={Icons.shield}  label="Verified badge" sub="Tier: Shown · 3 vouches" onClick={() => push({ name: 'vouch-request' })}/>

        {/* ── Notifications ───────────────────────────── */}
        <SectionHeader>Notifications</SectionHeader>
        <Row icon={Icons.user}   label="New followers"        trailing={<Toggle on={notifs.followers}        onToggle={() => toggleNotif('followers')}/>}/>
        <Row icon={Icons.message} label="Messages"            trailing={<Toggle on={notifs.messages}         onToggle={() => toggleNotif('messages')}/>}/>
        <Row icon={Icons.heart}  label="Listing saves & watches" trailing={<Toggle on={notifs.listingActivity}  onToggle={() => toggleNotif('listingActivity')}/>}/>
        <Row icon={Icons.swap}   label="Trade requests"       trailing={<Toggle on={notifs.tradeRequests}    onToggle={() => toggleNotif('tradeRequests')}/>}/>
        <Row icon={Icons.calendar} label="Event reminders"   trailing={<Toggle on={notifs.eventReminders}   onToggle={() => toggleNotif('eventReminders')}/>}/>
        <Row icon={Icons.community} label="Community activity" trailing={<Toggle on={notifs.communityActivity} onToggle={() => toggleNotif('communityActivity')}/>}/>
        <Row icon={Icons.tag}    label="Price drops on saved" trailing={<Toggle on={notifs.priceDrops}       onToggle={() => toggleNotif('priceDrops')}/>}/>
        <Row icon={Icons.bag}    label="New listings matching wishlist" trailing={<Toggle on={notifs.newListings}  onToggle={() => toggleNotif('newListings')}/>}/>

        {/* ── Privacy & Safety ────────────────────────── */}
        <SectionHeader>Privacy &amp; Safety</SectionHeader>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--paper)' }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 9, color: 'var(--ink)' }}>Who can see my collection</div>
          <RadioGroup value={collectionVis} onChange={setCollectionVis} options={[
            { id: 'public', label: 'Everyone' }, { id: 'followers', label: 'Followers' }, { id: 'private', label: 'Only me' },
          ]}/>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--paper)' }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 9, color: 'var(--ink)' }}>Who can message me</div>
          <RadioGroup value={messagingPref} onChange={setMessagingPref} options={[
            { id: 'everyone', label: 'Everyone' }, { id: 'followers', label: 'Followers' }, { id: 'none', label: 'No one' },
          ]}/>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--paper)' }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 9, color: 'var(--ink)' }}>Who can see my wishlist</div>
          <RadioGroup value={wishlistVis} onChange={setWishlistVis} options={[
            { id: 'public', label: 'Everyone' }, { id: 'followers', label: 'Followers' }, { id: 'private', label: 'Only me' },
          ]}/>
        </div>
        <Row icon={Icons.eye} label="Show online status" trailing={<Toggle on={showOnline} onToggle={() => setShowOnline(v => !v)}/>}/>
        <Row icon={Icons.close} label="Blocked users" sub="Manage users you have blocked" onClick={() => push({ name: 'blocked-users' })}/>

        {/* ── Support ─────────────────────────────────── */}
        <SectionHeader>Support</SectionHeader>
        <Row icon={Icons.info}    label="Help centre"      onClick={() => flashToast('Help centre — coming soon')}/>
        <Row icon={Icons.flag}    label="Report a bug"     onClick={() => flashToast('Bug report — coming soon')}/>
        <Row icon={Icons.doc}     label="Terms of service" onClick={() => flashToast('Terms of service — coming soon')}/>
        <Row icon={Icons.shield}  label="Privacy policy"   onClick={() => flashToast('Privacy policy — coming soon')}/>
        <Row icon={Icons.star}    label="Rate the app"     onClick={() => flashToast('Thanks for the love! ⭐')}/>

        {/* ── Account actions ─────────────────────────── */}
        <SectionHeader>Account</SectionHeader>
        <Row icon={Icons.logout}  label="Log out" danger onClick={() => { if (window.chReset) window.chReset(); }}/>
        <Row icon={Icons.trash}   label="Delete account" danger sub="This cannot be undone" onClick={() => flashToast('Please contact support to delete your account.')}/>

        <div style={{ textAlign: 'center', padding: '22px 16px 4px', fontSize: 11.5, color: 'var(--ink-ghost)' }}>
          CollectorHub · v0.9.1 (prototype)
        </div>

      </div>
    </Screen>
  );
}

// ── Blocked users screen ─────────────────────────────
function BlockedUsersView() {
  const { pop, flashToast } = useNav();
  // For the prototype we use a local list seeded empty.
  const [blocked, setBlocked] = React.useState([]);
  const unblock = (handle) => {
    setBlocked(b => b.filter(h => h !== handle));
    flashToast(`@${handle} unblocked`);
  };
  return (
    <Screen nav={false} header={<DetailHeader title="Blocked users" onBack={pop}/>}>
      {blocked.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '72px 32px', textAlign: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--paper-soft)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)' }}>
            <Ico d={Icons.close} size={24}/>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>No blocked users</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', lineHeight: 1.55, maxWidth: 260 }}>
            Users you block won't be able to see your profile, listings or messages.
          </div>
        </div>
      ) : (
        <div style={{ paddingBottom: 24 }}>
          {blocked.map(handle => {
            const u = userOf(handle) || { name: handle, handle, color: 'var(--ink-mute)' };
            return (
              <div key={handle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <Avatar name={u.name} color={u.color} size={44}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>@{u.handle}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => unblock(handle)}>Unblock</Button>
              </div>
            );
          })}
        </div>
      )}
    </Screen>
  );
}

Object.assign(window, { SettingsView, BlockedUsersView });
