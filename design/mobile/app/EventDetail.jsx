// ─────────────────────────────────────────────────────────────
// Event detail — BRD §9.13
// ─────────────────────────────────────────────────────────────

function EventDetail({ route }) {
  const { push, flashToast } = useNav();
  const { interested, toggleInterested } = useAppState();
  const ev = EVENTS.find(e => e.id === route.id);
  const com = COMMUNITIES.find(c => c.id === ev.community);
  const host = userOf(ev.host);
  const going = interested[ev.id];
  const [ticket, setTicket] = React.useState(false); // free QR ticket (v1.2 §9.13)
  const ticketCode = `CH-${ev.id.toUpperCase()}-${(ME.handle || 'you').slice(0, 4).toUpperCase()}-0142`;

  return (
    <Screen nav={false} header={null}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15 }}>{ev.interested + (going ? 1 : 0)}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>interested</div>
          </div>
          {ticket ? (
            <Button variant="teal" size="lg" style={{ flex: 2, justifyContent: 'center' }} icon={<Ico d={Icons.ticket} size={18}/>}
              onClick={() => flashToast('Show this QR at the door — entry is free')}>View ticket</Button>
          ) : (
            <Button variant={going ? 'primary' : 'secondary'} size="lg" style={{ flex: 2, justifyContent: 'center' }}
              icon={<Ico d={Icons.ticket} size={18}/>}
              onClick={() => { setTicket(true); if (!going) toggleInterested(ev.id); flashToast('Free ticket booked · QR code added'); }}>
              Get free ticket
            </Button>
          )}
        </div>
      }>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
          <DetailHeader transparent trailing={<IconButton icon={<Ico d={Icons.share} size={17}/>} onClick={() => flashToast('Event link copied')}/>}/>
        </div>
        <div>
          <div style={{ position: 'relative' }}>
            <ProductPhoto tone={com ? com.tone : 'plum'} ratio="3/2" rounded={0}/>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(20,17,15,0.8) 100%)' }}/>
            <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ width: 64, borderRadius: 12, background: 'var(--paper)', color: 'var(--ink)', textAlign: 'center', padding: '8px 0', flexShrink: 0, boxShadow: 'var(--shadow-2)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--stamp-red)' }}>{ev.month}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, lineHeight: 1 }}>{ev.date}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{ev.day}</div>
              </div>
              <div style={{ flex: 1, color: 'var(--paper)' }}>
                <Tag kind={ev.mode === 'Online' ? 'vouch' : 'event'} style={{ marginBottom: 6 }}>{ev.mode}</Tag>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{ev.title}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* free QR ticket — BRD v1.2 §9.13 */}
        {ticket && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 18, background: 'var(--paper)', boxShadow: 'var(--shadow-1)' }}>
            <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 9 }}>
              <Ico d={Icons.ticket} size={17}/>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, letterSpacing: '0.02em' }}>FREE ENTRY TICKET</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.7 }}>× 1</span>
            </div>
            <div style={{ display: 'flex', gap: 16, padding: 16, alignItems: 'center' }}>
              <QRCode seed={ticketCode} size={118}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{ev.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 4 }}>{ev.month} {ev.date} · {ev.when.split('·')[1] || ev.when}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{ev.where}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', marginTop: 8, letterSpacing: '0.04em' }}>{ticketCode}</div>
              </div>
            </div>
            <div style={{ borderTop: '1px dashed var(--border-strong)', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 7, background: 'var(--paper-soft)' }}>
              <Ico d={Icons.info} size={13} style={{ color: 'var(--ink-faint)' }}/>
              <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>Scanned at the door. No payment — tickets are always free in Phase 1.</span>
            </div>
          </div>
        )}

        <div style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, overflow: 'hidden', marginBottom: 18 }}>
          <DetailRow icon={Icons.calendar} title={ev.when} sub="Add to calendar"/>
          <DetailRow icon={ev.mode === 'Online' ? Icons.globe : Icons.pin} title={ev.where} sub={ev.city} last/>
        </div>

        <SectionLabel>About</SectionLabel>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-soft)', margin: '10px 0 18px' }}>{ev.about}</div>

        {com && (
          <>
            <SectionLabel>Hosted by</SectionLabel>
            <button onClick={() => push({ name: 'community-detail', id: com.id })} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', marginTop: 10, padding: 12, cursor: 'pointer',
              background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13 }}>
              <Avatar name={host.name} color={host.color} size={40} verified/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{ev.title.includes('Online') ? host.name : com.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>Organised by @{host.handle}</div>
              </div>
              <Ico d={Icons.back} size={18} stroke={2} style={{ transform: 'rotate(180deg)', color: 'var(--ink-faint)' }}/>
            </button>
          </>
        )}
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
