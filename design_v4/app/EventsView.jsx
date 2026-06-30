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
  const isGoing = (e) => rsvp[e.id] === 'going' || rsvp[e.id] === 'interested' || (e.going || []).includes('you') || (e.interested || []).includes('you');
  const upcoming = events.filter(e => !e.past);
  const past     = events.filter(e =>  e.past);
  const hosting  = (userEvents || []);
  const goingList = events.filter(isGoing);

  // sort upcoming so my-city in-person events come first
  const sortedUpcoming = [...upcoming].sort((a, b) => {
    const aCity = a.city.toLowerCase() === myCity ? 0 : 1;
    const bCity = b.city.toLowerCase() === myCity ? 0 : 1;
    return aCity - bCity;
  });
  const cityCount = upcoming.filter(e => e.city.toLowerCase() === myCity).length;

  const list = tab === 'upcoming' ? sortedUpcoming : tab === 'past' ? past : hosting;

  const [evCats, setEvCats] = React.useState([]);
  const toggleEvCat = id => setEvCats(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id]);
  const catMatch = (ev) => evCats.length === 0 || (ev.cats && ev.cats.some(c => evCats.includes(c)));

  const [q, setQ] = React.useState('');
  const qMatch = (ev) => !q || ev.title.toLowerCase().includes(q.toLowerCase()) || ev.city.toLowerCase().includes(q.toLowerCase());

  return (
    <Screen header={<AppBar title="Events"/>}>
      <div style={{ position: 'sticky', top: 0, zIndex: 4, background: 'var(--paper)', borderBottom: '1px solid var(--slate-200)', padding: '12px 16px 10px' }}>
        {/* row 1: search + list button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px',
            borderRadius: 12, border: '1px solid var(--slate-200)', background: 'var(--card-surface)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <Ico d={Icons.search} size={16} style={{ color: 'var(--slate-400)', flexShrink: 0 }}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search events…"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)' }}/>
            {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--slate-400)', display: 'flex', alignItems: 'center' }}><Ico d={Icons.close} size={14} stroke={2}/></button>}
          </div>
          <button onClick={() => push({ name: 'create-event' })} style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 13px',
            borderRadius: 12, border: 'none', background: 'var(--slate-900)', color: 'var(--paper)',
            cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
            flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            <Ico d={Icons.plus} size={15} stroke={2.2}/>List an event
          </button>
        </div>
        {/* row 2: tab segmented */}
        <Segmented
          options={[{ id: 'upcoming', label: 'Upcoming' }, { id: 'going', label: 'Going' }, { id: 'past', label: 'Past' }, { id: 'hosting', label: 'My Events' }]}
          value={tab} onChange={v => { setTab(v); setEvCats([]); }}/>
        {(tab === 'upcoming' || tab === 'past') && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 10, paddingBottom: 2 }}>
            {CATEGORIES.map(c => <CategoryChip key={c.id} active={evCats.includes(c.id)} onClick={() => toggleEvCat(c.id)}>{c.chipLabel}</CategoryChip>)}
            {evCats.length > 0 && <button onClick={() => setEvCats([])} style={{ background: 'none', border: 'none', padding: '4px 2px', cursor: 'pointer', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5 }}>Clear</button>}
          </div>
        )}
      </div>

      {tab === 'upcoming' && (() => {
        const filteredUpcoming = sortedUpcoming.filter(e => qMatch(e) && catMatch(e));
        return (
          <>
            {filteredUpcoming.length > 0 && (
              <div style={{ padding: '14px 16px 0' }}>
                <SectionLabel>{q ? `Results for "${q}"` : cityCount > 0 ? `Next up in ${ME.city}` : 'Next up'}</SectionLabel>
                <FeaturedEvent ev={filteredUpcoming[0]} onOpen={() => push({ name: 'event', id: filteredUpcoming[0].id })}/>
              </div>
            )}
            {!q && cityCount === 0 && (
              <div style={{ margin: '14px 16px 0', display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', background: 'var(--slate-100)', border: '1px solid var(--slate-200)', borderRadius: 13 }}>
                <Ico d={Icons.pin} size={16} style={{ color: 'var(--ink-faint)', flexShrink: 0, marginTop: 1 }}/>
                <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>No events in <b>{ME.city}</b> yet — showing events from nearby cities. <button onClick={() => push({ name: 'create-event' })} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--stamp-red)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>List one →</button></span>
              </div>
            )}
            <div style={{ padding: '20px 16px 0' }}>
              {filteredUpcoming.length > 1 && <IconLabel icon={Icons.calendar} style={{ marginBottom: 10 }}>All upcoming</IconLabel>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 10 }}>
                {filteredUpcoming.slice(1).map(ev => <EventCard key={ev.id} ev={ev} onOpen={() => push({ name: 'event', id: ev.id })}/>)}
                {filteredUpcoming.length === 0 && <EmptyNote>{q ? `No events match "${q}".` : "No upcoming events for now."}</EmptyNote>}
              </div>
            </div>
            <div style={{ padding: '12px 16px 28px' }}>
              <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-faint)' }}>Events are reviewed by CollectorHub before going live.</div>
            </div>
          </>
        );
      })()}

      {tab === 'going' && (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {goingList.filter(qMatch).map(ev => <EventCard key={ev.id} ev={ev} onOpen={() => push({ name: 'event', id: ev.id })}/>)}
            {goingList.filter(qMatch).length === 0 && <EmptyNote>{q ? 'No events match your search.' : "You haven't RSVP'd to any events yet."}</EmptyNote>}
          </div>
        </div>
      )}

      {tab === 'past' && (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {past.filter(e => qMatch(e) && catMatch(e)).map(ev => <EventCard key={ev.id} ev={ev} onOpen={() => push({ name: 'event', id: ev.id })}/>)}
            {past.filter(e => qMatch(e) && catMatch(e)).length === 0 && <EmptyNote>{q ? 'No events match your search.' : evCats.length ? 'No past events in this category.' : 'No past events yet.'}</EmptyNote>}
          </div>
        </div>
      )}

      {tab === 'hosting' && (
        <div style={{ padding: '16px' }}>
          <button onClick={() => push({ name: 'create-event' })} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 46,
            borderRadius: 14, background: 'var(--slate-900)', color: 'var(--paper)', border: 'none',
            cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14.5, marginBottom: 16,
          }}>
            <Ico d={Icons.plus} size={18}/>List an event
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {hosting.map(ev => (
              <button key={ev.id} onClick={() => push({ name: 'event-manage', id: ev.id })} style={{
                display: 'flex', gap: 12, width: '100%', textAlign: 'left', alignItems: 'center',
                background: 'var(--card-surface)', border: '1px solid var(--slate-200)', borderRadius: 16, padding: 14, cursor: 'pointer',
                boxShadow: 'var(--card-shadow)',
              }}>
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
