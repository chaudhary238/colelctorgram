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
  const [priceFilter, setPriceFilter] = React.useState('all'); // all | free | paid
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [draftEvCats, setDraftEvCats] = React.useState([]);
  const [draftPriceFilter, setDraftPriceFilter] = React.useState('all');
  const [rsvpFilter, setRsvpFilter] = React.useState('all'); // all | going | interested
  const [draftRsvpFilter, setDraftRsvpFilter] = React.useState('all');

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
  const toggleDraftEvCat = id => setDraftEvCats(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id]);
  const priceMatch = (ev) => priceFilter === 'all' || (priceFilter === 'free' ? (!ev.pricing || ev.pricing.type !== 'paid') : (ev.pricing && ev.pricing.type === 'paid'));
  const rsvpMatch = (ev) => rsvpFilter === 'all' || (rsvpFilter === 'going' ? rsvp[ev.id] === 'going' : rsvp[ev.id] === 'interested');
  const catMatch = (ev) => evCats.length === 0 || (ev.cats && ev.cats.some(c => evCats.includes(c)));
  const activeFilterCount = evCats.length + (priceFilter !== 'all' ? 1 : 0) + (rsvpFilter !== 'all' ? 1 : 0);
  const openSheet = () => { setDraftEvCats(evCats); setDraftPriceFilter(priceFilter); setDraftRsvpFilter(rsvpFilter); setSheetOpen(true); };
  const applySheet = () => { setEvCats(draftEvCats); setPriceFilter(draftPriceFilter); setRsvpFilter(draftRsvpFilter); setSheetOpen(false); };
  const clearSheet = () => { setDraftEvCats([]); setDraftPriceFilter('all'); setDraftRsvpFilter('all'); };

  const [q, setQ] = React.useState('');
  const qMatch = (ev) => !q || ev.title.toLowerCase().includes(q.toLowerCase()) || ev.city.toLowerCase().includes(q.toLowerCase());

  return (
    <Screen nav={false} header={<DetailHeader title="Events"/>}>
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
            <button onClick={openSheet} aria-label={`Filters${activeFilterCount ? ` · ${activeFilterCount} active` : ''}`} style={{
              display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, padding: 0,
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeFilterCount ? 'var(--stamp-red)' : 'var(--slate-400)' }}>
              <Ico d={Icons.filter} size={17} stroke={2}/>
              {activeFilterCount > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{activeFilterCount}</span>}
            </button>
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
          value={tab} onChange={v => { setTab(v); setEvCats([]); setPriceFilter('all'); }}/>
        {(tab === 'upcoming' || tab === 'past') && evCats.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 10, paddingBottom: 2 }}>
            {evCats.map(id => <CategoryChip key={id} active onClick={() => toggleEvCat(id)}>{(CATEGORIES.find(c => c.id === id) || {}).chipLabel}</CategoryChip>)}
            <button onClick={() => setEvCats([])} style={{ background: 'none', border: 'none', padding: '4px 2px', cursor: 'pointer', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5 }}>Clear</button>
          </div>
        )}
      </div>

      {tab === 'upcoming' && (() => {
        const filteredUpcoming = sortedUpcoming.filter(e => qMatch(e) && catMatch(e) && priceMatch(e) && rsvpMatch(e));
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
              <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-faint)' }}>Events are reviewed by Scorred before going live.</div>
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
            {past.filter(e => qMatch(e) && catMatch(e) && priceMatch(e) && rsvpMatch(e)).map(ev => <EventCard key={ev.id} ev={ev} onOpen={() => push({ name: 'event', id: ev.id })}/>)}
            {past.filter(e => qMatch(e) && catMatch(e) && priceMatch(e) && rsvpMatch(e)).length === 0 && <EmptyNote>{q ? 'No events match your search.' : evCats.length ? 'No past events in this category.' : 'No past events yet.'}</EmptyNote>}
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
              <div key={ev.id} style={{ position: 'relative' }}>
                <EventCard ev={ev} onOpen={() => push({ name: ev.status === 'pending' ? 'event-manage' : 'event', id: ev.id })}/>
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  {ev.status === 'pending' ? <Tag kind="po">Pending approval</Tag> : <Badge variant="secondary">Hosting</Badge>}
                </div>
              </div>
            ))}
            {hosting.length === 0 && <EmptyNote>You’re not hosting any events yet. Tap “List an event”.</EmptyNote>}
          </div>
        </div>
      )}

      {sheetOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 140, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={() => setSheetOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}/>
          <div style={{ position: 'relative', width: '100%', maxHeight: '78%', overflowY: 'auto', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '10px 18px 20px', boxShadow: 'var(--shadow-4)', animation: 'fadeIn 140ms ease' }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--border-strong)', margin: '4px auto 14px' }}/>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Filters</div>
              <button onClick={clearSheet} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }}>Clear</button>
            </div>
            <SectionLabel>RSVP</SectionLabel>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
              <FilterChip active={draftRsvpFilter === 'all'} onClick={() => setDraftRsvpFilter('all')}>All</FilterChip>
              <FilterChip active={draftRsvpFilter === 'going'} onClick={() => setDraftRsvpFilter('going')}>Going</FilterChip>
              <FilterChip active={draftRsvpFilter === 'interested'} onClick={() => setDraftRsvpFilter('interested')} icon={<Ico d={Icons.star} size={13} fill={draftRsvpFilter === 'interested' ? 'currentColor' : 'none'}/>}>Interested</FilterChip>
            </div>

            <div style={{ marginTop: 20 }}><SectionLabel>Price</SectionLabel></div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
              <FilterChip active={draftPriceFilter === 'all'} onClick={() => setDraftPriceFilter('all')}>All</FilterChip>
              <FilterChip active={draftPriceFilter === 'free'} onClick={() => setDraftPriceFilter('free')}>Free</FilterChip>
              <FilterChip active={draftPriceFilter === 'paid'} onClick={() => setDraftPriceFilter('paid')}>Paid</FilterChip>
            </div>
            <div style={{ marginTop: 20 }}><SectionLabel>Category</SectionLabel></div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
              {CATEGORIES.map(c => (
                <FilterChip key={c.id} active={draftEvCats.includes(c.id)} onClick={() => toggleDraftEvCat(c.id)}>{c.chipLabel}</FilterChip>
              ))}
            </div>
            <Button variant="dark" size="block" style={{ marginTop: 22 }} onClick={applySheet}>Apply filters</Button>
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
