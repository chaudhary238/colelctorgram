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
  const { addEvent, addCommunity, userCommunities, eventCommunityDraft, clearEventCommunityDraft } = useAppState();
  const fileRef = React.useRef(null);

  const [cover, setCover] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [cats, setCats] = React.useState([]);             // multi-select
  const [mode, setMode] = React.useState('In person');
  const [date, setDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');       // optional — multi-day events
  const [time, setTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [venue, setVenue] = React.useState('');
  const [city, setCity] = React.useState(ME.city || '');
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

  const online = mode === 'Online';

  const miss = {
    title: !title.trim(), cats: cats.length === 0, date: !date, time: !time.trim(),
    venue: !venue.trim(), city: !online && !city.trim(), about: !about.trim(),
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
    if (invalid) { setTried(true); flashToast('Fill the required fields marked *'); return; }
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
      when: whenRange, where: venue.trim(), city: online ? 'Online' : city.trim(),
      about: about.trim(), bring: bring.trim() || undefined,
      host: 'you', community: communityId, status: 'pending', going: [], interested: [],
      cover: cover || undefined,
    });
    pop();
    flashToast('Submitted for approval — find it under “Hosting”');
  };

  return (
    <Screen nav={false} header={<DetailHeader title="Host an event" subtitle="Reviewed before it goes live"
      trailing={<Button size="sm" variant="dark" onClick={submit} style={invalid ? { opacity: 0.5 } : null}>Submit</Button>}/>}
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
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mumbai Collector Meet · Vol 5" style={evFieldStyle(tried && miss.title)}/>

        {/* multi-category */}
        <EvLbl req miss={tried && miss.cats} hint="pick one or more">Categories</EvLbl>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => {
            const on = cats.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggleCat(c.id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
                background: on ? 'var(--ink)' : 'var(--paper-soft)', color: on ? 'var(--paper)' : 'var(--ink)',
                border: `1px solid ${on ? 'var(--ink)' : (tried && miss.cats ? 'var(--stamp-red)' : 'var(--border-strong)')}`,
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, lineHeight: 1 }}>
                {on && <Ico d={Icons.check} size={13} stroke={2.6}/>}{c.short}
              </button>
            );
          })}
        </div>

        <EvLbl req>Format</EvLbl>
        <Segmented value={mode} onChange={setMode} options={[{ id: 'In person', label: 'In person' }, { id: 'Online', label: 'Online' }]}/>

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

        <EvLbl req miss={tried && miss.venue}>{online ? 'Stream / link name' : 'Venue'}</EvLbl>
        <input value={venue} onChange={e => setVenue(e.target.value)} placeholder={online ? 'e.g. CollectorHub Live' : 'e.g. Phoenix Marketcity, Kurla'} style={evFieldStyle(tried && miss.venue)}/>

        {!online && (
          <>
            <EvLbl req miss={tried && miss.city}>City</EvLbl>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai" style={evFieldStyle(tried && miss.city)}/>
          </>
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
