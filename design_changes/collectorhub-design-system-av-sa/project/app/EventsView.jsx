// ─────────────────────────────────────────────────────────────
// Events — list, tabs (Upcoming / Past / Hosting), host CTA  (BRD §9.13)
// Facebook-style RSVP (Going / Interested). No tickets.
// ─────────────────────────────────────────────────────────────

// shared helpers (used by EventDetail / EventCard / Manage too)
function allEvents(userEvents) {
  // approved user events join the public list; newest user events first
  const mine = (userEvents || []).filter(e => e.status === 'approved');
  const ids = new Set(mine.map(e => e.id));
  return [...mine, ...EVENTS.filter(e => !ids.has(e.id))];
}
function amGoing(id, rsvp) { return rsvp && rsvp[id] === 'going'; }
function goingCount(ev, rsvp) {
  const base = (ev.going || []).length;
  return base + (amGoing(ev.id, rsvp) && !(ev.going || []).includes('you') ? 1 : 0);
}

function EventsView() {
  const { push, flashToast } = useNav();
  const { userEvents, rsvp } = useAppState();
  const [tab, setTab] = React.useState('upcoming');

  const myCity = (ME.city || '').toLowerCase();
  const events = allEvents(userEvents);
  const upcoming = events.filter(e => !e.past);
  const past = events.filter(e => e.past);
  const hosting = (userEvents || []);

  // sort upcoming so my-city in-person events come first
  const sortedUpcoming = [...upcoming].sort((a, b) => {
    const aCity = a.city.toLowerCase() === myCity ? 0 : 1;
    const bCity = b.city.toLowerCase() === myCity ? 0 : 1;
    return aCity - bCity;
  });
  const cityCount = upcoming.filter(e => e.city.toLowerCase() === myCity).length;

  const list = tab === 'upcoming' ? sortedUpcoming : tab === 'past' ? past : hosting;

  return (
    <Screen header={<AppBar title="Events"/>}>
      <div style={{ position: 'sticky', top: 0, zIndex: 4, background: 'var(--paper)', borderBottom: '1px solid var(--border)', padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Segmented
              options={[{ id: 'upcoming', label: 'Upcoming' }, { id: 'past', label: 'Past' }, { id: 'hosting', label: 'My Events' }]}
              value={tab} onChange={setTab}/>
          </div>
          <button onClick={() => push({ name: 'create-event' })} style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 13px',
            borderRadius: 10, border: 'none', background: 'var(--ink)', color: 'var(--paper)',
            cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
            flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            <Ico d={Icons.plus} size={15} stroke={2.2}/>List an event
          </button>
        </div>
      </div>

      {tab === 'upcoming' && (
        <>
          {/* featured next event */}
          {sortedUpcoming.length > 0 && (
            <div style={{ padding: '14px 16px 0' }}>
              <SectionLabel>{cityCount > 0 ? `Next up in ${ME.city}` : 'Next up'}</SectionLabel>
              <FeaturedEvent ev={sortedUpcoming[0]} onOpen={() => push({ name: 'event', id: sortedUpcoming[0].id })}/>
            </div>
          )}

          {cityCount === 0 && (
            <div style={{ margin: '14px 16px 0', display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', background: 'var(--bone)', border: '1px solid var(--border)', borderRadius: 13 }}>
              <Ico d={Icons.pin} size={16} style={{ color: 'var(--ink-faint)', flexShrink: 0, marginTop: 1 }}/>
              <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>No events in <b>{ME.city}</b> yet — showing national &amp; online events. <button onClick={() => push({ name: 'create-event' })} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--stamp-red)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>List one →</button></span>
            </div>
          )}

          <div style={{ padding: '20px 16px 0' }}>
            <SectionLabel>All upcoming</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 10 }}>
              {sortedUpcoming.slice(1).map(ev => <EventCard key={ev.id} ev={ev} onOpen={() => push({ name: 'event', id: ev.id })}/>)}
              {sortedUpcoming.length <= 1 && <EmptyNote>That’s every upcoming event for now.</EmptyNote>}
            </div>
          </div>

          <div style={{ padding: '12px 16px 28px' }}>
            <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-faint)' }}>
              Events are reviewed by CollectorHub before going live.
            </div>
          </div>
        </>
      )}

      {tab === 'past' && (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {past.map(ev => <EventCard key={ev.id} ev={ev} onOpen={() => push({ name: 'event', id: ev.id })}/>)}
            {past.length === 0 && <EmptyNote>No past events yet.</EmptyNote>}
          </div>
        </div>
      )}

      {tab === 'hosting' && (
        <div style={{ padding: '16px' }}>
          <button onClick={() => push({ name: 'create-event' })} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 46,
            borderRadius: 12, background: 'var(--ink)', color: 'var(--paper)', border: 'none',
            cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14.5, marginBottom: 16,
          }}>
            <Ico d={Icons.plus} size={18}/>List an event
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {hosting.map(ev => (
              <button key={ev.id} onClick={() => push({ name: 'event-manage', id: ev.id })} style={{
                display: 'flex', gap: 12, width: '100%', textAlign: 'left', alignItems: 'center',
                background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14, padding: 12, cursor: 'pointer' }}>
                <div style={{ width: 50, height: 50, borderRadius: 11, flexShrink: 0, background: ev.status === 'pending' ? 'var(--grail-gold-soft)' : 'var(--ink)', color: ev.status === 'pending' ? 'var(--grail-gold-deep)' : 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ev.month}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, lineHeight: 1 }}>{ev.date}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.25 }}>{ev.title}</div>
                  <div style={{ marginTop: 5 }}>
                    {ev.status === 'pending'
                      ? <Tag kind="po">Pending approval</Tag>
                      : <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{(ev.going || []).length} going · tap to manage</span>}
                  </div>
                </div>
                <Ico d={Icons.back} size={18} stroke={2} style={{ transform: 'rotate(180deg)', color: 'var(--ink-faint)' }}/>
              </button>
            ))}
            {hosting.length === 0 && <EmptyNote>You’re not hosting any events yet. Tap “List an event”.</EmptyNote>}
          </div>
        </div>
      )}
    </Screen>
  );
}

function FeaturedEvent({ ev, onOpen }) {
  const com = COMMUNITIES.find(c => c.id === ev.community);
  return (
    <button onClick={onOpen} style={{
      display: 'block', width: '100%', textAlign: 'left', marginTop: 10, padding: 0, border: 'none',
      borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: 'var(--ink)',
    }}>
      <div style={{ position: 'relative' }}>
        <ProductPhoto tone={com ? com.tone : 'plum'} ratio="2/1" rounded={0}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(20,17,15,0.88) 100%)' }}/>
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
          <Tag kind={ev.mode === 'Online' ? 'vouch' : 'event'}>{ev.mode}</Tag>
        </div>
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, color: 'var(--paper)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{ev.title}</div>
          <div style={{ fontSize: 13, color: 'rgba(244,239,230,0.85)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ico d={Icons.calendar} size={14} stroke={2}/>{ev.when} · {ev.city}
          </div>
        </div>
      </div>
    </button>
  );
}

Object.assign(window, { EventsView, FeaturedEvent, allEvents, amGoing, goingCount });
