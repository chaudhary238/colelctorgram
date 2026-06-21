// ─────────────────────────────────────────────────────────────
// Create a community — app-wide flow (BRD §8.8 CM-04)
// Used from the Community tab AND when a host creates a community for
// their event (route.forEvent → binds back to the event on submit).
// Communities are reviewed before they go public.
// ─────────────────────────────────────────────────────────────

function ccFieldStyle(bad) {
  return { width: '100%', boxSizing: 'border-box', height: 46, padding: '0 13px', borderRadius: 11,
    border: `1px solid ${bad ? 'var(--stamp-red)' : 'var(--border-strong)'}`, background: 'var(--paper-soft)',
    fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink)', outline: 'none' };
}
function CCLbl({ children, req, miss, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9, marginTop: 20 }}>
      <SectionLabel>{children}</SectionLabel>
      {req && <span style={{ color: miss ? 'var(--stamp-red)' : 'var(--ink-ghost)', fontSize: 13, fontWeight: 700 }}>*</span>}
      {hint && !miss && <span style={{ fontSize: 11, color: 'var(--ink-ghost)', marginLeft: 'auto' }}>{hint}</span>}
      {miss && <span style={{ fontSize: 11, color: 'var(--stamp-red)', marginLeft: 'auto', fontWeight: 600 }}>Required</span>}
    </div>
  );
}
function CCRadioRow({ title, sub, on, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'flex-start', gap: 11, width: '100%', textAlign: 'left', cursor: 'pointer', padding: '12px 13px', borderRadius: 12,
      border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`, background: on ? 'var(--bone)' : 'var(--paper-soft)' }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}` }}>
        {on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ink)' }}/>}
      </span>
      <span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{title}</span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, lineHeight: 1.4 }}>{sub}</span>
      </span>
    </button>
  );
}

function CreateCommunityView({ route }) {
  const { pop, push, flashToast } = useNav();
  const { addCommunity, bindEventCommunity } = useAppState();
  const forEvent = route && route.forEvent;   // event id when launched from the event flow

  const [name, setName] = React.useState((route && route.prefillName) || '');
  const [cats, setCats] = React.useState((route && route.prefillCat) ? [route.prefillCat] : []);
  const toggleCat = (id) => setCats(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id]);
  const [desc, setDesc] = React.useState('');
  const [privacy, setPrivacy] = React.useState('public');   // public | invite
  const [posting, setPosting] = React.useState('open');     // open | approval
  const [rules, setRules] = React.useState('');
  const [tried, setTried] = React.useState(false);

  const miss = { name: !name.trim(), desc: !desc.trim() };
  const invalid = miss.name || miss.desc;

  const setRule = (i, v) => setRules(rs => rs.map((r, idx) => idx === i ? v : r));

  const submit = () => {
    if (invalid) { setTried(true); flashToast('Add a name and a short description'); return; }
    const id = (forEvent ? 'c-' : 'com-') + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 14) + '-' + Date.now().toString().slice(-4);
    const tone = ['plum', 'forest', 'teal', 'red', 'ink', 'gold'][Math.floor(Math.random() * 6)];
    const com = {
      id, name: name.trim(), tag: (name.trim().replace(/[^A-Za-z]/g, '').slice(0, 2) || 'CH').toUpperCase(),
      tone, cat: cats[0] || 'figures', cats: cats.slice(), short: desc.trim(), members: 1, posts: 0, founder: 'you',
      invite: privacy === 'invite', postMode: posting,
      rules: rules.trim() ? rules.split('\n').map(r => r.trim()).filter(Boolean) : ['Be decent — keep it collector-friendly', 'Trades are off-platform; vouch after'],
      forEvent: forEvent || undefined,
    };
    addCommunity(com);
    if (forEvent) {
      bindEventCommunity(id);
      pop();
      flashToast('Community created — bound to your event');
    } else {
      pop();
      flashToast('Community submitted — live after a quick review');
    }
  };

  return (
    <Screen nav={false} header={<DetailHeader title={forEvent ? 'Community for your event' : 'Create a community'} subtitle={forEvent ? 'Attendees can talk, network & post' : 'Reviewed before it goes public'}
      trailing={<Button size="sm" variant="dark" onClick={submit} style={invalid ? { opacity: 0.5 } : null}>{forEvent ? 'Done' : 'Submit'}</Button>}/>}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '11px 16px 30px' }}>
          <Button variant="dark" size="block" icon={<Ico d={forEvent ? Icons.check : Icons.shield} size={18}/>} onClick={submit} style={invalid ? { opacity: 0.5 } : null}>
            {forEvent ? 'Create & bind to event' : 'Submit for review'}
          </Button>
          {!forEvent && <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>CollectorHub reviews new communities before they're public.</div>}
        </div>
      }>
      <div style={{ padding: '4px 16px 16px' }}>
        <CCLbl req miss={tried && miss.name}>Community name</CCLbl>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mumbai Figure Heads" style={ccFieldStyle(tried && miss.name)}/>

        <CCLbl req>Category <span style={{ fontWeight: 400, color: 'var(--ink-faint)' }}>(pick one or more)</span></CCLbl>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {CATEGORIES.map(c => {
            const on = cats.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggleCat(c.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px',
                borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                border: `1.5px solid ${on ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
                background: on ? 'rgba(255,36,66,0.06)' : 'var(--paper-soft)',
                transition: 'all 150ms',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: on ? 'var(--stamp-red)' : 'var(--bone)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 150ms',
                }}>
                  <Ico d={c.id === 'figures' ? Icons.user : c.id === 'designer' ? Icons.star : c.id === 'kits' ? Icons.box : Icons.tag}
                    size={16} style={{ color: on ? 'var(--paper)' : 'var(--ink-faint)' }}/>
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: on ? 700 : 500, fontSize: 13,
                  color: on ? 'var(--stamp-red)' : 'var(--ink)', lineHeight: 1.3 }}>{c.label}</span>
              </button>
            );
          })}
        </div>

        <CCLbl req miss={tried && miss.desc}>Short description</CCLbl>
        <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 140))} rows={2} placeholder="What this community is about — one line."
          style={{ ...ccFieldStyle(tried && miss.desc), height: 'auto', padding: '11px 13px', lineHeight: 1.5, resize: 'none' }}/>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', textAlign: 'right', margin: '5px 2px 0' }}>{desc.length}/140</div>

        <CCLbl req>Who can join</CCLbl>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CCRadioRow title="Public" sub="Anyone can find and join" on={privacy === 'public'} onClick={() => setPrivacy('public')}/>
          <CCRadioRow title="Invite-only" sub="People join by approval or invite" on={privacy === 'invite'} onClick={() => setPrivacy('invite')}/>
        </div>

        <CCLbl req>Who can post</CCLbl>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CCRadioRow title="Anyone can post" sub="Members post freely" on={posting === 'open'} onClick={() => setPosting('open')}/>
          <CCRadioRow title="Admin-approved" sub="Posts are reviewed before they show" on={posting === 'approval'} onClick={() => setPosting('approval')}/>
        </div>

        <CCLbl hint="optional">Community rules &amp; terms</CCLbl>
        <textarea value={rules} onChange={e => setRules(e.target.value)} rows={7}
          placeholder={`1. Be respectful — no harassment or hate speech.\n2. No spam or self-promotion without context.\n3. Trades are off-platform — always vouch after a deal.\n4. Verified photos only for listings...`}
          style={{ ...ccFieldStyle(false), height: 'auto', padding: '12px 13px', lineHeight: 1.6, resize: 'vertical', minHeight: 160, fontFamily: 'var(--font-body)', fontSize: 13.5 }}/>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '6px 2px 0', lineHeight: 1.5 }}>One rule per line. You can edit rules and manage members after the community goes live.</div>

      </div>
    </Screen>
  );
}

Object.assign(window, { CreateCommunityView });
