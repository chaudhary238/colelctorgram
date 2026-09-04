// ─────────────────────────────────────────────────────────────
// Host an event — create flow (BRD §9.13 EV-02)
// Facebook-style: no tickets required, RSVP or ticket link. Multi-category, start + end time.
// Binds to a NEW community (you become admin) or an EXISTING one you own.
// Submits for app-owner approval. Form state persists across a detour to
// "create a community" so navigating back never loses what was typed.
// ─────────────────────────────────────────────────────────────

const EV_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EV_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  if (isNaN(d)) return null;
  return { date: String(d.getDate()).padStart(2, '0'), month: EV_MONTHS[d.getMonth()], day: EV_DAYS[d.getDay()] };
}
function formatTime12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return t;
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}
function slugify(s) { return (s || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 14); }

function evFieldStyle(bad) {
  return { width: '100%', boxSizing: 'border-box', height: 46, padding: '0 13px', borderRadius: 11,
    border: `1px solid ${bad ? 'var(--stamp-red)' : 'var(--border-strong)'}`, background: 'var(--paper-soft)',
    fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink)', outline: 'none' };
}
function EvLbl({ children, req, miss, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9, marginTop: 20 }}>
      <SectionLabel>{children}</SectionLabel>
      {req && <span style={{ color: miss ? 'var(--stamp-red)' : 'var(--ink-ghost)', fontSize: 13, fontWeight: 700 }}>*</span>}
      {hint && !miss && <span style={{ fontSize: 11, color: 'var(--ink-ghost)', marginLeft: 'auto' }}>{hint}</span>}
      {miss && <span style={{ fontSize: 11, color: 'var(--stamp-red)', marginLeft: 'auto', fontWeight: 600 }}>Required</span>}
    </div>
  );
}

const EVENT_DRAFT_DEFAULTS = {
  cover: null, title: '', cats: [], date: '', endDate: '', time: '', endTime: '',
  city: '', country: '', venue: '', address: '', about: '', ticketLink: '', contact: '',
  pricing: 'free', price: '', priceCur: 'INR',
  comMode: 'none', existingCom: '', createdCom: null,
};

function EventCreateView() {
  const { pop, push, flashToast } = useNav();
  const { addEvent, userCommunities, userEvents, eventCommunityDraft, clearEventCommunityDraft, eventDraft, setEventDraft } = useAppState();
  const fileRef = React.useRef(null);

  const [form, setForm] = React.useState(() => ({ ...EVENT_DRAFT_DEFAULTS, ...(eventDraft || {}) }));
  const set = (patch) => setForm(f => ({ ...f, ...patch }));
  // persist continuously so a detour to "create a community" (which unmounts this screen) can restore it
  React.useEffect(() => { setEventDraft(form); }, [form]);

  const { cover, title, cats, date, endDate, time, endTime, city, country, venue, address, about, ticketLink, contact, pricing, price, priceCur, comMode, existingCom, createdCom } = form;
  const [tried, setTried] = React.useState(false);

  // existing-community option: only communities YOU own (founder === 'you')
  const ownedComs = [...(userCommunities || []), ...COMMUNITIES].filter(c => c.founder === 'you');

  // when the create-community screen hands a community back, bind it here
  React.useEffect(() => {
    if (eventCommunityDraft) {
      const com = (userCommunities || []).find(c => c.id === eventCommunityDraft);
      if (com) set({ createdCom: com, comMode: 'create' });
      clearEventCommunityDraft();
    }
  }, [eventCommunityDraft]);

  const norm = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const existingEv = title.trim() ? allEvents(userEvents).find(e => norm(e.title) === norm(title)) : null;
  const dupTitle = !!existingEv;

  const miss = {
    title: !title.trim(), dup: dupTitle, cats: cats.length === 0, date: !date, time: !time.trim(),
    city: !city, venue: !venue.trim(), about: !about.trim(),
    endDate: endDate && date && endDate < date,
    community: comMode === 'existing' ? !existingCom : (comMode === 'create' ? !createdCom : false),
    price: pricing === 'paid' && !(Number(price) > 0),
  };
  const invalid = Object.values(miss).some(Boolean);

  const toggleCat = (id) => set({ cats: cats.includes(id) ? cats.filter(c => c !== id) : [...cats, id] });

  const onCover = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader(); r.onload = () => set({ cover: r.result }); r.readAsDataURL(f);
  };

  const launchCreateCommunity = () => push({ name: 'create-community', forEvent: 'draft', prefillName: title.trim(), prefillCat: cats[0] || 'figures' });

  const submit = () => {
    if (invalid) { setTried(true); flashToast(dupTitle ? 'An event with this name already exists' : 'Fill the required fields marked *'); return; }
    const pd = parseDate(date) || { date: '01', month: 'Jan', day: 'Mon' };
    const ped = endDate ? parseDate(endDate) : null;
    const id = slugify(title) + '-' + Date.now().toString().slice(-4);

    const communityId = comMode === 'existing' ? existingCom : (comMode === 'create' && createdCom ? createdCom.id : null);

    const sameDay = !ped || (ped.date === pd.date && ped.month === pd.month);
    const dateStr = sameDay ? `${pd.day} · ${pd.date} ${pd.month}` : `${pd.date} ${pd.month} – ${ped.date} ${ped.month}`;
    const timeStr = `${formatTime12(time.trim())}${endTime.trim() ? ` – ${formatTime12(endTime.trim())}` : ''}`;
    const whenRange = `${dateStr} · ${timeStr}`;

    addEvent({
      id, title: title.trim(), cats, mode: 'In person',
      date: pd.date, month: pd.month, day: pd.day,
      endDate: ped ? ped.date : undefined, endMonth: ped ? ped.month : undefined,
      multiDay: !sameDay,
      time: time.trim(), endTime: endTime.trim() || undefined,
      when: whenRange, where: address.trim() ? `${venue.trim()} — ${address.trim()}` : venue.trim(), venue: venue.trim(), address: address.trim() || undefined, city, country,
      about: about.trim(),
      ticketLink: ticketLink.trim() || undefined, contact: contact.trim() || undefined,
      pricing: pricing === 'paid' ? { type: 'paid', amount: Number(price), currency: priceCur } : { type: 'free' },
      host: 'you', community: communityId, status: 'pending', going: [], interested: [],
      cover: cover || undefined,
    });
    setEventDraft(null);
    pop();
    flashToast('Submitted for approval — find it under “Hosting”');
  };

  return (
    <Screen nav={false} header={<DetailHeader title="List an event" subtitle="Reviewed before it goes live"/>}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '11px 16px 30px' }}>
          <Button variant="dark" size="block" icon={<Ico d={Icons.shield} size={18}/>} onClick={submit} style={invalid ? { opacity: 0.5 } : null}>Submit for approval</Button>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>Scorred reviews every event before it’s public.</div>
        </div>
      }>
      <div style={{ padding: '4px 16px 16px' }}>
        {/* cover */}
        <EvLbl hint="optional">Cover photo</EvLbl>
        <input ref={fileRef} type="file" accept="image/*" onChange={onCover} style={{ display: 'none' }}/>
        <button onClick={() => fileRef.current && fileRef.current.click()} style={{ position: 'relative', width: '100%', height: 96, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border-strong)', padding: 0, background: 'var(--paper-soft)' }}>
          {cover ? <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--ink-mute)' }}>
              <Ico d={Icons.camera} size={19}/><span style={{ fontSize: 12.5, fontWeight: 600 }}>Add a cover photo</span>
            </div>
          )}
        </button>

        <EvLbl req miss={tried && miss.title}>Event title</EvLbl>
        <input value={title} onChange={e => set({ title: e.target.value })} placeholder="e.g. Mumbai Collector Meet · Vol 5" style={evFieldStyle((tried && miss.title) || dupTitle)}/>
        {dupTitle && (
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', margin: '8px 2px 0', fontSize: 12, color: 'var(--stamp-red-deep)', lineHeight: 1.45 }}>
            <Ico d={Icons.info} size={14} style={{ flexShrink: 0, marginTop: 1 }}/>
            <span>“{existingEv.title}” already exists. Use a more specific name (add a volume, date or city).</span>
          </div>
        )}

        {/* multi-category — card grid matching CreateCommunity */}
        <EvLbl req miss={tried && miss.cats} hint="pick one or more">Categories</EvLbl>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => {
            const on = cats.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggleCat(c.id)} style={{
                display: 'inline-flex', alignItems: 'center', padding: '7px 13px', borderRadius: 999,
                background: on ? 'var(--ink)' : 'var(--paper-soft)', color: on ? 'var(--paper)' : 'var(--ink)',
                border: `1px solid ${on ? 'var(--ink)' : (tried && miss.cats ? 'var(--stamp-red)' : 'var(--border-strong)')}`,
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1,
              }}>{c.chipLabel || c.label}</button>
            );
          })}
        </div>

        {/* date + start + end */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <EvLbl req miss={tried && miss.date}>Start date</EvLbl>
            <input type="date" value={date} onChange={e => set({ date: e.target.value })} style={{ ...evFieldStyle(tried && miss.date), fontFamily: 'var(--font-mono)', fontSize: 13 }}/>
          </div>
          <div style={{ flex: 1 }}>
            <EvLbl miss={tried && miss.endDate} hint="optional">End date</EvLbl>
            <input type="date" value={endDate} min={date || undefined} onChange={e => set({ endDate: e.target.value })} style={{ ...evFieldStyle(tried && miss.endDate), fontFamily: 'var(--font-mono)', fontSize: 13 }}/>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <EvLbl req miss={tried && miss.time}>Start time</EvLbl>
            <input type="time" value={time} onChange={e => set({ time: e.target.value })} style={{ ...evFieldStyle(tried && miss.time), fontFamily: 'var(--font-mono)', fontSize: 14 }}/>
          </div>
          <div style={{ flex: 1 }}>
            <EvLbl hint="optional">End time</EvLbl>
            <input type="time" value={endTime} onChange={e => set({ endTime: e.target.value })} style={{ ...evFieldStyle(false), fontFamily: 'var(--font-mono)', fontSize: 14 }}/>
          </div>
        </div>

        <EvLbl req miss={tried && miss.city}>City</EvLbl>
        <CityPicker value={city} country={country} onChange={(c, ct) => set({ city: c, country: ct })}/>

        <EvLbl req miss={tried && miss.venue}>Venue name</EvLbl>
        <input value={venue} onChange={e => set({ venue: e.target.value })} placeholder="e.g. Phoenix Marketcity, LBS Marg, Kurla West"
          style={evFieldStyle(tried && miss.venue)}/>

        <EvLbl hint="optional">Address details</EvLbl>
        <textarea value={address} onChange={e => set({ address: e.target.value })} rows={2} placeholder="e.g. 3rd floor atrium, near the food court"
          style={{ ...evFieldStyle(false), height: 'auto', padding: '11px 13px', lineHeight: 1.5, resize: 'none' }}/>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '7px 2px 0', lineHeight: 1.5 }}>Attendees see this exact address once they RSVP.</div>

        <EvLbl req miss={tried && miss.about}>Description</EvLbl>
        <textarea value={about} onChange={e => set({ about: e.target.value })} rows={3} placeholder="What’s happening, who it’s for, what to expect…"
          style={{ ...evFieldStyle(tried && miss.about), height: 'auto', padding: '11px 13px', lineHeight: 1.5, resize: 'none' }}/>

        {/* pricing */}
        <EvLbl req>Entry</EvLbl>
        <Segmented value={pricing} onChange={v => set({ pricing: v })} options={[{ id: 'free', label: 'Free' }, { id: 'paid', label: 'Paid' }]}/>
        {pricing === 'paid' && (
          <div style={{ marginTop: 11 }}>
            <MoneyField value={price} onChange={v => set({ price: v })} cur={priceCur} onCur={v => set({ priceCur: v })} bad={tried && miss.price} placeholder="e.g. 500"/>
            {tried && miss.price && <div style={{ fontSize: 11.5, color: 'var(--stamp-red)', marginTop: 6 }}>Add a ticket price.</div>}
          </div>
        )}

        <EvLbl hint="optional">Ticket link</EvLbl>
        <input value={ticketLink} onChange={e => set({ ticketLink: e.target.value })} placeholder="e.g. https://in.bookmyshow.com/…" style={evFieldStyle(false)}/>

        <EvLbl hint="optional">Contact details</EvLbl>
        <input value={contact} onChange={e => set({ contact: e.target.value })} placeholder="Phone, email or WhatsApp for questions" style={evFieldStyle(false)}/>

        {/* community — OPTIONAL */}
        <EvLbl hint="optional">Event community</EvLbl>
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', margin: '-2px 2px 10px', lineHeight: 1.5 }}>A space for attendees to talk, network and post. Totally optional.</div>
        <Segmented value={comMode} onChange={v => set({ comMode: v })} options={[{ id: 'none', label: 'None' }, { id: 'create', label: 'Create new' }, { id: 'existing', label: 'Use mine' }]}/>

        {comMode === 'none' && (
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 11, padding: 13, background: 'var(--bone)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            <Ico d={Icons.info} size={15} style={{ flexShrink: 0, marginTop: 1, color: 'var(--ink-faint)' }}/>
            No community — attendees just RSVP. You can add one later.
          </div>
        )}

        {comMode === 'create' && (
          <div style={{ marginTop: 11 }}>
            {createdCom ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 12, background: 'var(--verified-teal-soft)', border: '1px solid var(--verified-teal)', borderRadius: 13 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: 'var(--verified-teal)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>{createdCom.tag}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{createdCom.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>New community · you’re the admin</div>
                </div>
                <button onClick={launchCreateCommunity} style={{ background: 'none', border: 'none', color: 'var(--stamp-red)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 4 }}>Edit</button>
              </div>
            ) : (
              <button onClick={launchCreateCommunity} style={{
                display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', cursor: 'pointer', padding: 13, borderRadius: 13,
                border: `1px dashed ${tried && miss.community ? 'var(--stamp-red)' : 'var(--border-strong)'}`, background: 'var(--paper-soft)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: 'var(--ink)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico d={Icons.plus} size={19}/></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Set up the community</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>Name, privacy, posting &amp; rules</div>
                </div>
                <Ico d={Icons.back} size={18} stroke={2} style={{ transform: 'rotate(180deg)', color: 'var(--ink-faint)' }}/>
              </button>
            )}
          </div>
        )}

        {comMode === 'existing' && (
          <div style={{ marginTop: 11 }}>
            {ownedComs.length === 0 ? (
              <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: 13, background: 'var(--bone)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                <Ico d={Icons.info} size={15} style={{ flexShrink: 0, marginTop: 1, color: 'var(--ink-faint)' }}/>
                You don’t admin any communities yet. Pick <b>Create new</b> to start one.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ownedComs.map(c => {
                  const on = existingCom === c.id;
                  return (
                    <button key={c.id} onClick={() => set({ existingCom: c.id })} style={{
                      display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', cursor: 'pointer', padding: 11, borderRadius: 12,
                      border: `1.5px solid ${on ? 'var(--ink)' : (tried && miss.community ? 'var(--stamp-red)' : 'var(--border-strong)')}`, background: on ? 'var(--bone)' : 'var(--paper-soft)' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: 'var(--ink)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>{c.tag}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>You’re the admin</div>
                      </div>
                      {on && <Ico d={Icons.check} size={17} stroke={2.6} style={{ color: 'var(--ink)' }}/>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Screen>
  );
}

Object.assign(window, { EventCreateView, parseDate, slugify });
