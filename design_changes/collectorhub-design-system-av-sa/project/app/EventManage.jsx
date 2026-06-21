// ─────────────────────────────────────────────────────────────
// Manage your event — host dashboard (BRD §9.13)
// Approval state · Going / Interested guest lists · share · cancel.
// No tickets / QR — Facebook-style RSVP.
// ─────────────────────────────────────────────────────────────

function EventManageView({ route }) {
  const { pop, push, flashToast, setOverlay } = useNav();
  const { userEvents, userCommunities, approveEvent, cancelEvent } = useAppState();
  const ev = (userEvents || []).find(e => e.id === route.id) || EVENTS.find(e => e.id === route.id);
  if (!ev) return <Screen nav={false} header={<DetailHeader title="Manage event"/>}><EmptyNote>Event not found.</EmptyNote></Screen>;

  const com = COMMUNITIES.find(c => c.id === ev.community) || (userCommunities || []).find(c => c.id === ev.community);
  const pending = ev.status === 'pending';
  const goers = ev.going || [];
  const interestedList = ev.interested || [];
  const cats = ev.cats || (ev.cat ? [ev.cat] : []);
  const catLabel = (id) => (CATEGORIES.find(c => c.id === id) || {}).short || id;

  // PENDING — approval gate (demo: simulate the app owner approving)
  if (pending) {
    return (
      <Screen nav={false} header={<DetailHeader title="Pending approval" subtitle={ev.title}/>}>
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16, background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)', borderRadius: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: 'var(--grail-gold)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico d={Icons.clock} size={20}/></div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--grail-gold-deep)' }}>Waiting for review</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 5 }}>Only you can see this event until CollectorHub approves it. We review for safety and accuracy — usually within a day.</div>
            </div>
          </div>

          <div style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, overflow: 'hidden', margin: '16px 0' }}>
            <DetailRow icon={Icons.calendar} title={ev.when} sub={ev.city}/>
            <DetailRow icon={ev.mode === 'Online' ? Icons.globe : Icons.pin} title={ev.where} sub={ev.mode}/>
            <DetailRow icon={Icons.tag} title={cats.map(catLabel).join(' · ') || '—'} sub={com ? `Community: ${com.name}` : 'No community'} last/>
          </div>

          {/* demo affordance */}
          <Button variant="grail" size="block" icon={<Ico d={Icons.shield} size={18}/>} onClick={() => { approveEvent(ev.id); flashToast('Approved — your event is now live'); }}>
            Simulate app-owner approval
          </Button>
          <Button variant="secondary" size="block" style={{ marginTop: 10, color: 'var(--stamp-red)', borderColor: 'var(--stamp-red)' }}
            icon={<Ico d={Icons.close} size={16} stroke={2.4}/>} onClick={() => { cancelEvent(ev.id); pop(); flashToast('Event withdrawn'); }}>
            Withdraw event
          </Button>
        </div>
      </Screen>
    );
  }

  // APPROVED — host dashboard
  return (
    <Screen nav={false} header={<DetailHeader title="Manage event" subtitle={ev.title}
      trailing={<IconButton icon={<Ico d={Icons.share} size={17}/>} onClick={() => setOverlay({ name: 'share', label: ev.title })}/>}/>}>
      <div style={{ padding: '16px' }}>
        {/* live banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', background: 'var(--forest-soft)', border: '1px solid var(--forest)', borderRadius: 12, marginBottom: 16 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--forest)' }}/>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--forest)' }}>Live &amp; public</span>
          <button onClick={() => push({ name: 'event', id: ev.id })} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>View public page →</button>
        </div>

        {/* stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <ManageStat n={goers.length} l="Going" accent="var(--forest)"/>
          <ManageStat n={interestedList.length} l="Interested" accent="var(--grail-gold-deep)"/>
          <ManageStat n={com ? com.members : '—'} l="Community" accent="var(--ink)"/>
        </div>

        {/* post update to community */}
        {com && (
          <button onClick={() => push({ name: 'community-detail', id: com.id })} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', marginBottom: 18, padding: 13, cursor: 'pointer',
            background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 13 }}>
            <Ico d={Icons.comment} size={19}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Post an update</div>
              <div style={{ fontSize: 12.5, color: 'rgba(244,239,230,0.7)' }}>Reach attendees in {com.name}</div>
            </div>
            <Ico d={Icons.back} size={18} stroke={2} style={{ transform: 'rotate(180deg)', opacity: 0.7 }}/>
          </button>
        )}

        {/* going list */}
        <SectionLabel>Going · {goers.length}</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '10px 0 18px' }}>
          {goers.map(h => <GuestRow key={h} handle={h} onOpen={() => push({ name: 'profile', user: h })}/>)}
          {goers.length === 0 && <EmptyNote>No one’s RSVP’d “going” yet. Share your event to spread the word.</EmptyNote>}
        </div>

        {/* interested list */}
        {interestedList.length > 0 && (
          <>
            <SectionLabel>Interested · {interestedList.length}</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '10px 0 18px' }}>
              {interestedList.map(h => <GuestRow key={h} handle={h} muted onOpen={() => push({ name: 'profile', user: h })}/>)}
            </div>
          </>
        )}

        {/* cancel */}
        <Button variant="secondary" size="block" style={{ marginTop: 4, color: 'var(--stamp-red)', borderColor: 'var(--stamp-red)' }}
          icon={<Ico d={Icons.close} size={16} stroke={2.4}/>} onClick={() => { cancelEvent(ev.id); pop(); flashToast('Event cancelled — attendees notified'); }}>
          Cancel event
        </Button>
      </div>
    </Screen>
  );
}

function GuestRow({ handle, muted, onOpen }) {
  const u = userOf(handle);
  return (
    <button onClick={onOpen} style={{
      display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', padding: 10, cursor: 'pointer',
      borderRadius: 12, background: 'var(--paper-soft)', border: '1px solid var(--border)' }}>
      <Avatar name={u.name} color={u.color} size={38} verified={!muted && u.tier !== 'Verified'}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</span>
          {!muted && <TierChip tier={u.tier}/>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>@{u.handle} · {u.city}</div>
      </div>
      <Ico d={Icons.back} size={17} stroke={2} style={{ transform: 'rotate(180deg)', color: 'var(--ink-faint)' }}/>
    </button>
  );
}

function ManageStat({ n, l, accent }) {
  return (
    <div style={{ flex: 1, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, padding: '12px 10px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22, color: accent, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: 5 }}>{l}</div>
    </div>
  );
}

Object.assign(window, { EventManageView, ManageStat, GuestRow });
