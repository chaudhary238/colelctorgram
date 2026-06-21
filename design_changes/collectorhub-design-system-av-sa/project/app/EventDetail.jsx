// ─────────────────────────────────────────────────────────────
// Event detail — Facebook-style. Going / Interested RSVP, guest list,
// bound community, reminders, share, host controls.  (BRD §9.13)
// No tickets, no QR — RSVP only.
// ─────────────────────────────────────────────────────────────

function EventDetail({ route }) {
  const { push, flashToast, setOverlay } = useNav();
  const { userEvents, userCommunities, rsvp, reminders, profile, setEventRsvp, toggleReminder } = useAppState();

  const ev = allEvents(userEvents).find(e => e.id === route.id) || (userEvents || []).find(e => e.id === route.id);
  if (!ev) return <Screen nav={false} header={<DetailHeader title="Event"/>}><EmptyNote>This event isn’t available.</EmptyNote></Screen>;

  const com = COMMUNITIES.find(c => c.id === ev.community) || (userCommunities || []).find(c => c.id === ev.community);
  const host = userOf(ev.host);
  const isHost = ev.host === 'you';
  const myStatus = rsvp[ev.id];                 // 'going' | 'interested' | undefined
  const remind = !!reminders[ev.id];

  // guest lists = seed handles + you (per your RSVP)
  const goers = [...(ev.going || [])];
  const interestedList = [...(ev.interested || [])];
  if (myStatus === 'going' && !goers.includes('you')) goers.push('you');
  if (myStatus === 'interested' && !interestedList.includes('you')) interestedList.push('you');
  const count = goers.length;
  const intCount = interestedList.length;

  const tones = { plum: 'var(--plum)', forest: 'var(--forest)', teal: 'var(--verified-teal)', red: 'var(--stamp-red)', ink: 'var(--ink)', gold: 'var(--grail-gold)' };
  const cats = ev.cats || (ev.cat ? [ev.cat] : []);
  const catLabel = (id) => (CATEGORIES.find(c => c.id === id) || {}).short || id;

  const footer = ev.past ? (
    <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '14px 16px 30px', textAlign: 'center', fontSize: 13, color: 'var(--ink-faint)' }}>
      This event has ended.
    </div>
  ) : isHost ? (
    <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px' }}>
      <Button variant="dark" size="block" icon={<Ico d={Icons.settings} size={18}/>} onClick={() => push({ name: 'event-manage', id: ev.id })}>Manage your event</Button>
    </div>
  ) : (
    <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 28px' }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => { setEventRsvp(ev.id, 'going'); flashToast(myStatus === 'going' ? 'Removed your RSVP' : 'You’re going — added to the guest list'); }} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 50, borderRadius: 13, cursor: 'pointer',
          border: `1.5px solid ${myStatus === 'going' ? 'var(--forest)' : 'var(--ink)'}`,
          background: myStatus === 'going' ? 'var(--forest)' : 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15 }}>
          <Ico d={myStatus === 'going' ? Icons.check : Icons.users} size={18} stroke={2.2}/>{myStatus === 'going' ? 'Going' : 'Going'}
        </button>
        <button onClick={() => { setEventRsvp(ev.id, 'interested'); flashToast(myStatus === 'interested' ? 'Removed your RSVP' : 'Marked interested — you’ll get updates'); }} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 50, borderRadius: 13, cursor: 'pointer',
          border: `1.5px solid ${myStatus === 'interested' ? 'var(--grail-gold-deep)' : 'var(--border-strong)'}`,
          background: myStatus === 'interested' ? 'var(--grail-gold-soft)' : 'var(--paper-soft)',
          color: myStatus === 'interested' ? 'var(--grail-gold-deep)' : 'var(--ink)',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15 }}>
          <Ico d={Icons.star} size={18} fill={myStatus === 'interested' ? 'var(--grail-gold-deep)' : 'none'}/>Interested
        </button>
      </div>
      {com && (
        <button onClick={() => push({ name: 'community-detail', id: com.id })} style={{
          width: '100%', marginTop: 10, height: 40, borderRadius: 11, cursor: 'pointer', border: '1px solid var(--border-strong)', background: 'transparent',
          color: 'var(--ink-soft)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Ico d={Icons.comment} size={16}/>Open event community
        </button>
      )}
    </div>
  );

  return (
    <Screen nav={false} header={null} footer={footer}>
      {/* hero */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
          <DetailHeader transparent trailing={
            <div style={{ display: 'flex', gap: 8 }}>
              {!ev.past && !isHost && <IconButton icon={<Ico d={Icons.bell} size={17} fill={remind ? 'var(--paper)' : 'none'}/>} onClick={() => { toggleReminder(ev.id); flashToast(remind ? 'Reminder off' : 'We’ll remind you before it starts'); }}/>}
              <IconButton icon={<Ico d={Icons.share} size={17}/>} onClick={() => setOverlay({ name: 'share', label: ev.title })}/>
            </div>
          }/>
        </div>
        <div style={{ position: 'relative' }}>
          {ev.cover ? <img src={ev.cover} alt="" style={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', display: 'block' }}/> : <ProductPhoto tone={com ? com.tone : 'plum'} ratio="3/2" rounded={0}/>}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(20,17,15,0.8) 100%)' }}/>
          <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ width: 64, borderRadius: 12, background: 'var(--paper)', color: 'var(--ink)', textAlign: 'center', padding: '8px 0', flexShrink: 0, boxShadow: 'var(--shadow-2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--stamp-red)' }}>{ev.month}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, lineHeight: 1 }}>{ev.date}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{ev.day}</div>
            </div>
            <div style={{ flex: 1, color: 'var(--paper)' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                <Tag kind={ev.mode === 'Online' ? 'vouch' : 'event'}>{ev.mode}</Tag>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{ev.title}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* RSVP summary strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '11px 14px', background: myStatus === 'going' ? 'var(--forest-soft)' : 'var(--paper-soft)', border: `1px solid ${myStatus === 'going' ? 'var(--forest)' : 'var(--border)'}`, borderRadius: 12 }}>
          <Ico d={Icons.users} size={17} style={{ color: myStatus === 'going' ? 'var(--forest)' : 'var(--ink-mute)' }}/>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{count} going</span>
          <span style={{ color: 'var(--ink-ghost)' }}>·</span>
          <span style={{ fontSize: 13.5, color: 'var(--ink-faint)' }}>{intCount} interested</span>
          {myStatus && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: myStatus === 'going' ? 'var(--forest)' : 'var(--grail-gold-deep)' }}>You’re {myStatus}</span>}
        </div>

        {/* details */}
        <div style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, overflow: 'hidden', marginBottom: 18 }}>
          <DetailRow icon={Icons.calendar} title={ev.when} sub={remind ? 'Reminder on' : (ev.past ? 'Ended' : 'Tap the bell to get reminded')}/>
          <DetailRow icon={ev.mode === 'Online' ? Icons.globe : Icons.pin} title={ev.where} sub={ev.city}/>
          {cats.length > 0 && <DetailRow icon={Icons.tag} title={cats.map(catLabel).join(' · ')} sub={cats.length > 1 ? 'Categories' : 'Category'} last={!ev.bring}/>}
          {ev.bring && <DetailRow icon={Icons.bag} title={ev.bring} sub="What to bring" last/>}
        </div>

        {/* guest list */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionLabel>Who’s going</SectionLabel>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)' }}>{count}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0 14px' }}>
          {goers.slice(0, 10).map(h => {
            const gu = h === 'you' ? { ...ME, name: 'You' } : userOf(h);
            return (
              <button key={h} onClick={() => h !== 'you' && push({ name: 'profile', user: h })} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '5px 11px 5px 5px', borderRadius: 999,
                background: h === 'you' ? 'var(--forest-soft)' : 'var(--paper-soft)', border: `1px solid ${h === 'you' ? 'var(--forest)' : 'var(--border)'}`, cursor: h === 'you' ? 'default' : 'pointer' }}>
                <Avatar name={gu.name} color={gu.color} photo={h === 'you' ? (profile || {}).photo : undefined} size={22}/>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{h === 'you' ? 'You' : gu.name.split(' ')[0]}</span>
              </button>
            );
          })}
          {count === 0 && <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>Be the first to RSVP.</span>}
          {count > 10 && <span style={{ alignSelf: 'center', fontSize: 12.5, color: 'var(--ink-faint)' }}>+{count - 10} more</span>}
        </div>
        {intCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>Interested</span>
            <div style={{ display: 'flex' }}>
              {interestedList.slice(0, 6).map((h, i) => {
                const gu = h === 'you' ? { ...ME, name: 'You' } : userOf(h);
                return <div key={h} style={{ marginLeft: i ? -8 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px var(--paper)' }}><Avatar name={gu.name} color={gu.color} photo={h === 'you' ? (profile || {}).photo : undefined} size={26}/></div>;
              })}
            </div>
            {intCount > 6 && <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>+{intCount - 6}</span>}
          </div>
        )}

        {/* about */}
        <SectionLabel>About</SectionLabel>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-soft)', margin: '10px 0 18px' }}>{ev.about}</div>

        {/* bound community */}
        {com && (
          <>
            <SectionLabel>Event community</SectionLabel>
            <button onClick={() => push({ name: 'community-detail', id: com.id })} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', margin: '10px 0 18px', padding: 13, cursor: 'pointer',
              background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: tones[com.tone] || 'var(--plum)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>{com.tag}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{com.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>Talk, network &amp; post with attendees</div>
              </div>
              <Ico d={Icons.back} size={18} stroke={2} style={{ transform: 'rotate(180deg)', color: 'var(--ink-faint)' }}/>
            </button>
          </>
        )}

        {/* hosted by */}
        <SectionLabel>Hosted by</SectionLabel>
        <button onClick={() => push({ name: 'profile', user: ev.host })} style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', marginTop: 10, padding: 12, cursor: 'pointer',
          background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13 }}>
          <Avatar name={host.name} color={host.color} size={40} verified={host.tier !== 'Verified'}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{isHost ? 'You' : host.name}</span>{!isHost && <TierChip tier={host.tier}/>}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>@{host.handle} · {host.city}</div>
          </div>
          <Ico d={Icons.back} size={18} stroke={2} style={{ transform: 'rotate(180deg)', color: 'var(--ink-faint)' }}/>
        </button>
      </div>
    </Screen>
  );
}

function DetailRow({ icon, title, sub, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bone)', color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ico d={icon} size={17}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{sub}</div>
      </div>
    </div>
  );
}

Object.assign(window, { EventDetail, DetailRow });
