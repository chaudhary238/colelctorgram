// ─────────────────────────────────────────────────────────────
// Events — BRD §9.13
// Upcoming events list (admin + user-created), interested/save.
// ─────────────────────────────────────────────────────────────

function EventsView() {
  const { push, flashToast } = useNav();
  const [scope, setScope] = React.useState('all');

  let list = EVENTS;
  if (scope === 'person') list = EVENTS.filter(e => e.mode === 'In person');
  if (scope === 'online') list = EVENTS.filter(e => e.mode === 'Online');

  return (
    <Screen header={<AppBar title="Events"/>}>
      <div style={{ position: 'sticky', top: 0, zIndex: 4, background: 'var(--paper)', borderBottom: '1px solid var(--border)', padding: '10px 16px' }}>
        <Segmented
          options={[{ id: 'all', label: 'All' }, { id: 'person', label: 'In person' }, { id: 'online', label: 'Online' }]}
          value={scope} onChange={setScope}/>
      </div>

      {/* featured next event */}
      <div style={{ padding: '14px 16px 0' }}>
        <SectionLabel>Next up</SectionLabel>
        <button onClick={() => push({ name: 'event', id: list[0].id })} style={{
          display: 'block', width: '100%', textAlign: 'left', marginTop: 10, padding: 0, border: 'none',
          borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: 'var(--ink)',
        }}>
          <div style={{ position: 'relative' }}>
            <ProductPhoto tone="plum" ratio="2/1" rounded={0}/>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(20,17,15,0.88) 100%)' }}/>
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
              <Tag kind={list[0].mode === 'Online' ? 'vouch' : 'event'}>{list[0].mode}</Tag>
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, color: 'var(--paper)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{list[0].title}</div>
              <div style={{ fontSize: 13, color: 'rgba(244,239,230,0.85)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ico d={Icons.calendar} size={14} stroke={2}/>{list[0].when}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* list */}
      <div style={{ padding: '20px 16px 0' }}>
        <SectionLabel>Upcoming</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 10 }}>
          {list.slice(1).map(ev => <EventCard key={ev.id} ev={ev} onOpen={() => push({ name: 'event', id: ev.id })}/>)}
          {list.length <= 1 && <EmptyNote>No more events in this view. Try “All”.</EmptyNote>}
        </div>
      </div>

      {/* create event — BRD §8.9 EV-02 */}
      <div style={{ padding: '20px 16px 28px' }}>
        <button onClick={() => flashToast('Event submitted for approval')} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 46,
          borderRadius: 12, border: '1px dashed var(--border-strong)', background: 'transparent',
          color: 'var(--ink-mute)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
        }}>
          <Ico d={Icons.plusCircle} size={18}/>Create an event
        </button>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>
          User events are reviewed before they go live.
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { EventsView });
