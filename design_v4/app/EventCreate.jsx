// ─────────────────────────────────────────────────────────────
// Host an event — create flow (BRD §9.13 EV-02)
// Facebook-style: no tickets. Multi-category, start + end time.
// Binds to a NEW community (you become admin) or an EXISTING one you own.
// Submits for app-owner approval.
// ─────────────────────────────────────────────────────────────

const EV_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EV_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  if (isNaN(d)) return null;
  return { date: String(d.getDate()).padStart(2, '0'), month: EV_MONTHS[d.getMonth()], day: EV_DAYS[d.getDay()] };
}
function slugify(s) { return (s || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 14); }

// Pincode → canonical city resolver (BRD: dedup Bangalore/Bengaluru, Gurgaon/Gurugram, …)
// System derives the city from the PIN so a typed spelling can never split one city into two.
const PIN_AREAS = {
  '400070': { city: 'Mumbai', area: 'Kurla' },     '400050': { city: 'Mumbai', area: 'Bandra West' },
  '560038': { city: 'Bengaluru', area: 'Indiranagar' }, '560001': { city: 'Bengaluru', area: 'MG Road' },
  '110001': { city: 'New Delhi', area: 'Connaught Place' }, '122002': { city: 'Gurugram', area: 'DLF Phase 1' },
  '201301': { city: 'Noida', area: 'Sector 18' },  '600001': { city: 'Chennai', area: 'Parrys' },
  '500001': { city: 'Hyderabad', area: 'Abids' },  '700001': { city: 'Kolkata', area: 'B.B.D. Bagh' },
  '411001': { city: 'Pune', area: 'Camp' },        '380001': { city: 'Ahmedabad', area: 'Lal Darwaja' },
  '302001': { city: 'Jaipur', area: 'M.I. Road' },
};
const PIN_PREFIX = {
  '400': 'Mumbai', '401': 'Mumbai', '560': 'Bengaluru', '561': 'Bengaluru', '562': 'Bengaluru',
  '110': 'New Delhi', '122': 'Gurugram', '201': 'Noida', '600': 'Chennai', '500': 'Hyderabad',
  '700': 'Kolkata', '411': 'Pune', '412': 'Pune', '380': 'Ahmedabad', '302': 'Jaipur',
};
const PIN_ZONE = { '1': 'New Delhi', '2': 'Lucknow', '3': 'Jaipur', '4': 'Mumbai', '5': 'Hyderabad', '6': 'Chennai', '7': 'Kolkata', '8': 'Patna' };
function resolvePincode(pin) {
  if (!/^\d{6}$/.test(pin)) return null;
  if (PIN_AREAS[pin]) return PIN_AREAS[pin];
  if (PIN_PREFIX[pin.slice(0, 3)]) return { city: PIN_PREFIX[pin.slice(0, 3)], area: null };
  const z = PIN_ZONE[pin[0]];
  return z ? { city: z, area: null } : null;
}

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

function EventCreateView() {
  const { pop, push, flashToast } = useNav();
  const { addEvent, addCommunity, userCommunities, userEvents, eventCommunityDraft, clearEventCommunityDraft } = useAppState();
  const fileRef = React.useRef(null);

  const [cover, setCover] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [cats, setCats] = React.useState([]);             // multi-select
  const mode = 'In person';                               // physical events only
  const [date, setDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');       // optional — multi-day events
  const [time, setTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [venue, setVenue] = React.useState('');
  const [pincode, setPincode] = React.useState('');
  const [about, setAbout] = React.useState('');
  const [bring, setBring] = React.useState('');
  const [comMode, setComMode] = React.useState('none');   // none | create | existing
  const [existingCom, setExistingCom] = React.useState('');
  const [createdCom, setCreatedCom] = React.useState(null); // community made via the create flow
  const [tried, setTried] = React.useState(false);

  // existing-community option: only communities YOU own (founder === 'you')
  const ownedComs = [...(userCommunities || []), ...COMMUNITIES].filter(c => c.founder === 'you');

  // when the create-community screen hands a community back, bind it here
  React.useEffect(() => {
    if (eventCommunityDraft) {
      const com = (userCommunities || []).find(c => c.id === eventCommunityDraft);
      if (com) { setCreatedCom(com); setComMode('create'); }
      clearEventCommunityDraft();
    }
  }, [eventCommunityDraft]);

  const resolved = resolvePincode(pincode);
  const norm = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const existingEv = title.trim() ? allEvents(userEvents).find(e => norm(e.title) === norm(title)) : null;
  const dupTitle = !!existingEv;

  const miss = {
    title: !title.trim(), dup: dupTitle, cats: cats.length === 0, date: !date, time: !time.trim(),
    venue: !venue.trim(), pincode: !resolved, about: !about.trim(),
    endDate: endDate && date && endDate < date,
    community: comMode === 'existing' ? !existingCom : (comMode === 'create' ? !createdCom : false),
  };
  const invalid = Object.values(miss).some(Boolean);

  const toggleCat = (id) => setCats(cs => cs.includes(id) ? cs.filter(c => c !== id) : [...cs, id]);

  const onCover = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader(); r.onload = () => setCover(r.result); r.readAsDataURL(f);
  };

  const launchCreateCommunity = () => push({ name: 'create-community', forEvent: 'draft', prefillName: title.trim(), prefillCat: cats[0] || 'figures' });

  const submit = () => {
    if (invalid) { setTried(true); flashToast(dupTitle ? 'An event with this name already exists' : 'Fill the required fields marked *'); return; }
    const pd = parseDate(date) || { date: '01', month: 'Jan', day: 'Mon' };
    const ped = endDate ? parseDate(endDate) : null;
    const id = slugify(title) + '-' + Date.now().toString().slice(-4);

    const communityId = comMode === 'existing' ? existingCom : (comMode === 'create' && createdCom ? createdCom.id : null);

    // date / time display string
    const sameDay = !ped || (ped.date === pd.date && ped.month === pd.month);
    const dateStr = sameDay ? `${pd.day} · ${pd.date} ${pd.month}` : `${pd.date} ${pd.month} – ${ped.date} ${ped.month}`;
    const timeStr = `${time.trim()}${endTime.trim() ? ` – ${endTime.trim()}` : ''}`;
    const whenRange = `${dateStr} · ${timeStr}`;

    addEvent({
      id, title: title.trim(), cats, mode,
      date: pd.date, month: pd.month, day: pd.day,
      endDate: ped ? ped.date : undefined, endMonth: ped ? ped.month : undefined,
      multiDay: !sameDay,
      time: time.trim(), endTime: endTime.trim() || undefined,
      when: whenRange, where: venue.trim(), city: resolved ? resolved.city : '', pincode,
      about: about.trim(), bring: bring.trim() || undefined,
      host: 'you', community: communityId, status: 'pending', going: [], interested: [],
      cover: cover || undefined,
    });
    pop();
    flashToast('Submitted for approval — find it under “Hosting”');
  };

  return (
    <Screen nav={false} header={<DetailHeader title="List an event" subtitle="Reviewed before it goes live"/>}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '11px 16px 30px' }}>
          <Button variant="dark" size="block" icon={<Ico d={Icons.shield} size={18}/>} onClick={submit} style={invalid ? { opacity: 0.5 } : null}>Submit for approval</Button>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>CollectorHub reviews every event before it’s public.</div>
        </div>
      }>
      <div style={{ padding: '4px 16px 16px' }}>
        {/* cover */}
        <EvLbl hint="optional">Cover photo</EvLbl>
        <input ref={fileRef} type="file" accept="image/*" onChange={onCover} style={{ display: 'none' }}/>
        <button onClick={() => fileRef.current && fileRef.current.click()} style={{ position: 'relative', width: '100%', aspectRatio: '2 / 1', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border-strong)', padding: 0, background: 'var(--paper-soft)' }}>
          {cover ? <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--ink-mute)' }}>
              <Ico d={Icons.camera} size={24}/><span style={{ fontSize: 12.5, fontWeight: 600 }}>Add a cover photo</span>
            </div>
          )}
        </button>

        <EvLbl req miss={tried && miss.title}>Event title</EvLbl>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mumbai Collector Meet · Vol 5" style={evFieldStyle((tried && miss.title) || dupTitle)}/>
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
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...evFieldStyle(tried && miss.date), fontFamily: 'var(--font-mono)', fontSize: 13 }}/>
          </div>
          <div style={{ flex: 1 }}>
            <EvLbl miss={tried && miss.endDate} hint="optional">End date</EvLbl>
            <input type="date" value={endDate} min={date || undefined} onChange={e => setEndDate(e.target.value)} style={{ ...evFieldStyle(tried && miss.endDate), fontFamily: 'var(--font-mono)', fontSize: 13 }}/>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <EvLbl req miss={tried && miss.time}>Start time</EvLbl>
            <input value={time} onChange={e => setTime(e.target.value)} placeholder="e.g. 4:00 pm" style={evFieldStyle(tried && miss.time)}/>
          </div>
          <div style={{ flex: 1 }}>
            <EvLbl hint="optional">End time</EvLbl>
            <input value={endTime} onChange={e => setEndTime(e.target.value)} placeholder="e.g. 8:00 pm" style={evFieldStyle(false)}/>
          </div>
        </div>

        <EvLbl req miss={tried && miss.venue}>Venue</EvLbl>
        <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Phoenix Marketcity, Kurla" style={evFieldStyle(tried && miss.venue)}/>

        <EvLbl req miss={tried && miss.pincode} hint="6-digit PIN">Location pincode</EvLbl>
        <input value={pincode} onChange={e => setPincode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} inputMode="numeric" placeholder="e.g. 560038"
          style={{ ...evFieldStyle(tried && miss.pincode), fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}/>
        {resolved ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', background: 'var(--verified-teal-soft)', border: '1px solid var(--verified-teal)', borderRadius: 12 }}>
              <Ico d={Icons.pin} size={17} style={{ color: 'var(--verified-teal)', flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>{resolved.city}{resolved.area ? <span style={{ fontWeight: 500, color: 'var(--ink-faint)' }}> · {resolved.area}</span> : null}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', marginTop: 1 }}>CITY SET FROM PIN {pincode}</div>
              </div>
            </div>
            {/* exact-spot preview — host pins the venue on the map */}
            <div style={{ position: 'relative', marginTop: 10, aspectRatio: '5 / 2', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-strong)',
              background: 'repeating-linear-gradient(45deg, var(--paper-soft), var(--paper-soft) 9px, var(--bone) 9px, var(--bone) 18px)' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50% 50% 50% 0', background: 'var(--stamp-red)', transform: 'rotate(-45deg)', boxShadow: 'var(--shadow-2)' }}/>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--ink-mute)', textTransform: 'uppercase' }}>Drag the pin to the exact spot</span>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '7px 2px 0', lineHeight: 1.5 }}>Attendees get directions to this pin. Spelling never splits a city — the PIN sets it.</div>
          </div>
        ) : pincode.length === 6 ? (
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 10, padding: '10px 13px', background: 'var(--stamp-red-soft)', border: '1px solid var(--stamp-red)', borderRadius: 12, fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
            <Ico d={Icons.info} size={15} style={{ color: 'var(--stamp-red-deep)', flexShrink: 0, marginTop: 1 }}/>
            We couldn’t match that PIN. Check the 6 digits and try again.
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '7px 2px 0', lineHeight: 1.5 }}>We set the city from your PIN — so Bengaluru/Bangalore can’t split into duplicate cities.</div>
        )}

        <EvLbl req miss={tried && miss.about}>Description</EvLbl>
        <textarea value={about} onChange={e => setAbout(e.target.value)} rows={3} placeholder="What’s happening, who it’s for, what to expect…"
          style={{ ...evFieldStyle(tried && miss.about), height: 'auto', padding: '11px 13px', lineHeight: 1.5, resize: 'none' }}/>

        <EvLbl hint="optional">What to bring</EvLbl>
        <input value={bring} onChange={e => setBring(e.target.value)} placeholder="e.g. Up to 3 pieces to display or trade" style={evFieldStyle(false)}/>

        {/* community — OPTIONAL */}
        <EvLbl hint="optional">Event community</EvLbl>
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', margin: '-2px 2px 10px', lineHeight: 1.5 }}>A space for attendees to talk, network and post. Totally optional.</div>
        <Segmented value={comMode} onChange={setComMode} options={[{ id: 'none', label: 'None' }, { id: 'create', label: 'Create new' }, { id: 'existing', label: 'Use mine' }]}/>

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
                    <button key={c.id} onClick={() => setExistingCom(c.id)} style={{
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
