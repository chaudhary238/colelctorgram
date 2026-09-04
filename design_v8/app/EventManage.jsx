// ─────────────────────────────────────────────────────────────
// Manage your event — host dashboard (BRD §9.13)
// Approval state · Going / Interested guest lists · share · cancel.
// No tickets / QR — Facebook-style RSVP.
// ─────────────────────────────────────────────────────────────

function EventManageView({ route }) {
  const { pop, push, flashToast, setOverlay } = useNav();
  const { userEvents, userCommunities, approveEvent, cancelEvent, updateEvent } = useAppState();
  const ev = (userEvents || []).find(e => e.id === route.id) || EVENTS.find(e => e.id === route.id);
  if (!ev) return <Screen nav={false} header={<DetailHeader title="Manage event"/>}><EmptyNote>Event not found.</EmptyNote></Screen>;
  const [editOpen, setEditOpen] = React.useState(false);

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
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 5 }}>Only you can see this event until Scorred approves it. We review for safety and accuracy — usually within a day.</div>
            </div>
          </div>

          <div style={{ background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, overflow: 'hidden', margin: '16px 0' }}>
            <DetailRow icon={Icons.calendar} title={ev.when} sub={ev.city}/>
            <DetailRow icon={Icons.pin} title={ev.where} sub="Venue" last={!com}/>
            {com && <DetailRow icon={Icons.comment} title={com.name} sub="Bound community" last/>}
          </div>

          {com && (
            <button onClick={() => push({ name: 'community-detail', id: com.id })} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', marginBottom: 16, padding: 13, cursor: 'pointer',
              background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 13 }}>
              <Ico d={Icons.settings} size={19}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Manage {com.name}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(244,239,230,0.7)' }}>Edit details, rules and members while you wait</div>
              </div>
              <Ico d={Icons.back} size={18} stroke={2} style={{ transform: 'rotate(180deg)', opacity: 0.7 }}/>
            </button>
          )}

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
      {editOpen && <EditEventSheet ev={ev} onSave={patch => { updateEvent(ev.id, patch); flashToast('Event updated'); }} onClose={() => setEditOpen(false)}/>}
      <div style={{ padding: '16px' }}>
        {/* live banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', background: 'var(--forest-soft)', border: '1px solid var(--forest)', borderRadius: 12, marginBottom: 16 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--forest)' }}/>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--forest)' }}>Live &amp; public</span>
          <button onClick={() => push({ name: 'event', id: ev.id })} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>View public page →</button>
        </div>

        <Button variant="secondary" size="block" style={{ marginBottom: 18 }} icon={<Ico d={Icons.edit} size={16}/>} onClick={() => setEditOpen(true)}>Edit event details</Button>

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
          {!muted && null}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>@{u.handle} · {placeLabel(u)}</div>
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

// Edit event details — mirrors the create-event fields
function EditEventSheet({ ev, onSave, onClose }) {
  const evfs = (bad) => ({ width: '100%', boxSizing: 'border-box', height: 46, padding: '0 13px', borderRadius: 11,
    border: `1px solid ${bad ? 'var(--stamp-red)' : 'var(--border-strong)'}`, background: 'var(--paper-soft)',
    fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink)', outline: 'none' });
  const [title, setTitle] = React.useState(ev.title);
  const [cover, setCover] = React.useState(ev.cover || null);
  const [cats, setCats] = React.useState(ev.cats || (ev.cat ? [ev.cat] : []));
  const toggleCat = (id) => setCats(cs => cs.includes(id) ? cs.filter(c => c !== id) : [...cs, id]);
  const [time, setTime] = React.useState(ev.time || '');
  const [endTime, setEndTime] = React.useState(ev.endTime || '');
  const [city, setCity] = React.useState(ev.city || '');
  const [country, setCountry] = React.useState(ev.country || '');
  const [venue, setVenue] = React.useState(ev.venue || ev.where || '');
  const [address, setAddress] = React.useState(ev.address || '');
  const [about, setAbout] = React.useState(ev.about || '');
  const [ticketLink, setTicketLink] = React.useState(ev.ticketLink || '');
  const [contact, setContact] = React.useState(ev.contact || '');
  const [pricing, setPricing] = React.useState(ev.pricing && ev.pricing.type === 'paid' ? 'paid' : 'free');
  const [price, setPrice] = React.useState(ev.pricing && ev.pricing.amount ? String(ev.pricing.amount) : '');
  const [priceCur, setPriceCur] = React.useState((ev.pricing && ev.pricing.currency) || 'INR');
  const fileRef = React.useRef(null);
  const onCover = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => setCover(r.result); r.readAsDataURL(f); };

  const save = () => {
    if (!title.trim() || !venue.trim() || !about.trim() || !city) { return; }
    onSave({
      title: title.trim(), cover: cover || undefined, cats,
      time: time.trim(), endTime: endTime.trim() || undefined,
      when: `${ev.day} \u00b7 ${ev.date} ${ev.month}${time.trim() ? ` \u00b7 ${formatTime12(time.trim())}${endTime.trim() ? ` \u2013 ${formatTime12(endTime.trim())}` : ''}` : ''}`,
      city, country, where: address.trim() ? `${venue.trim()} — ${address.trim()}` : venue.trim(), venue: venue.trim(), address: address.trim() || undefined, about: about.trim(),
      ticketLink: ticketLink.trim() || undefined, contact: contact.trim() || undefined,
      pricing: pricing === 'paid' ? { type: 'paid', amount: Number(price) || 0, currency: priceCur } : { type: 'free' },
    });
    onClose();
  };

  return (
    <OverlayShell title="Edit event" onClose={onClose} trailing={<Button size="sm" variant="primary" onClick={save}>Save</Button>}>
      <div style={{ padding: 16 }}>
        <SectionLabel>Cover photo</SectionLabel>
        <input ref={fileRef} type="file" accept="image/*" onChange={onCover} style={{ display: 'none' }}/>
        <button onClick={() => fileRef.current && fileRef.current.click()} style={{ position: 'relative', width: '100%', height: 96, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border-strong)', padding: 0, background: 'var(--paper-soft)', margin: '10px 0 20px' }}>
          {cover ? <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--ink-mute)' }}>
              <Ico d={Icons.camera} size={19}/><span style={{ fontSize: 12.5, fontWeight: 600 }}>Add a cover photo</span>
            </div>
          )}
        </button>

        <SectionLabel>Event title</SectionLabel>
        <input value={title} onChange={e => setTitle(e.target.value)} style={{ ...evfs(false), margin: '10px 0 20px' }}/>

        <SectionLabel>Categories</SectionLabel>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '10px 0 20px' }}>
          {CATEGORIES.map(c => {
            const on = cats.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggleCat(c.id)} style={{
                display: 'inline-flex', alignItems: 'center', padding: '7px 13px', borderRadius: 999,
                background: on ? 'var(--ink)' : 'var(--paper-soft)', color: on ? 'var(--paper)' : 'var(--ink)',
                border: `1px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1,
              }}>{c.chipLabel || c.label}</button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <SectionLabel>Start time</SectionLabel>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...evfs(false), fontFamily: 'var(--font-mono)', fontSize: 14, marginTop: 10 }}/>
          </div>
          <div style={{ flex: 1 }}>
            <SectionLabel>End time</SectionLabel>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ ...evfs(false), fontFamily: 'var(--font-mono)', fontSize: 14, marginTop: 10 }}/>
          </div>
        </div>

        <SectionLabel>City</SectionLabel>
        <div style={{ margin: '10px 0 20px' }}><CityPicker value={city} country={country} onChange={(c, ct) => { setCity(c); setCountry(ct); }}/></div>

        <SectionLabel>Venue name</SectionLabel>
        <input value={venue} onChange={e => setVenue(e.target.value)} style={{ ...evfs(false), margin: '10px 0 20px' }}/>

        <SectionLabel>Address details</SectionLabel>
        <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} style={{ ...evfs(false), height: 'auto', padding: '11px 13px', lineHeight: 1.5, resize: 'none', margin: '10px 0 20px' }}/>

        <SectionLabel>Description</SectionLabel>
        <textarea value={about} onChange={e => setAbout(e.target.value)} rows={3} style={{ ...evfs(false), height: 'auto', padding: '11px 13px', lineHeight: 1.5, resize: 'none', margin: '10px 0 20px' }}/>

        <SectionLabel>Entry</SectionLabel>
        <div style={{ margin: '10px 0 12px' }}><Segmented value={pricing} onChange={setPricing} options={[{ id: 'free', label: 'Free' }, { id: 'paid', label: 'Paid' }]}/></div>
        {pricing === 'paid' && <div style={{ marginBottom: 20 }}><MoneyField value={price} onChange={setPrice} cur={priceCur} onCur={setPriceCur} placeholder="e.g. 500"/></div>}

        <SectionLabel>Ticket link</SectionLabel>
        <input value={ticketLink} onChange={e => setTicketLink(e.target.value)} style={{ ...evfs(false), margin: '10px 0 20px' }}/>

        <SectionLabel>Contact details</SectionLabel>
        <input value={contact} onChange={e => setContact(e.target.value)} style={{ ...evfs(false), marginTop: 10 }}/>
      </div>
    </OverlayShell>
  );
}

Object.assign(window, { EventManageView, ManageStat, GuestRow, EditEventSheet });
