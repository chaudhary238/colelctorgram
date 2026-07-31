// ─────────────────────────────────────────────────────────────
// Onboarding flow — Splash & Auth (§9.1) + Interest selection (§9.2)
// Renders full-screen inside the device until the user enters the app.
// ─────────────────────────────────────────────────────────────

const SUBINTERESTS = {
  figures:  ['Hot Toys', 'SH Figuarts', 'Sideshow', 'Marvel Legends', 'McFarlane', 'Premium Format'],
  designer: ['Pop Mart', 'Skullpanda', 'Labubu', 'KAWS', 'Soft vinyl', 'Sonny Angel'],
  kits:     ['LEGO', 'Gunpla', 'MOC builds', 'Bandai', 'Scale models'],
  diecast:  ['Tomica', 'Mini GT', 'Hot Wheels', 'Inno64', 'Kyosho'],
  tcg:      ['Pokémon', 'One Piece TCG', 'Magic: The Gathering', 'Yu-Gi-Oh!', 'Dragon Ball Super TCG', 'Digimon TCG'],
};

// ── Splash ────────────────────────────────────────────────────
function Splash({ onStart, onLogin, onGuest }) {
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', background: 'var(--paper)', display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @keyframes scr-fade-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scr-pop {
          0%   { opacity: 0; transform: scale(0.72) rotate(-6deg); }
          70%  { transform: scale(1.08) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .scr-pop    { animation: scr-pop     0.55s cubic-bezier(.34,1.56,.64,1) both; }
        .scr-fu-1   { animation: scr-fade-up 0.5s 0.3s ease both; }
        .scr-fu-2   { animation: scr-fade-up 0.5s 0.45s ease both; }
        .scr-fu-3   { animation: scr-fade-up 0.5s 0.6s ease both; }
        .scr-fu-4   { animation: scr-fade-up 0.5s 0.72s ease both; }
      `}</style>

      {/* Ambient bg glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle at 50% 38%, rgba(196,18,48,0.10), transparent 60%), radial-gradient(circle at 85% 90%, rgba(20,17,15,0.04), transparent 50%)' }}/>

{/* Centre content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', position: 'relative', padding: '0 32px', gap: 14 }}>

        <div className="scr-pop" style={{ display: 'flex', justifyContent: 'center' }}>
          <SealMark size={96}/>
        </div>

        <div className="scr-fu-1" style={{ display: 'flex', justifyContent: 'center' }}>
          <ScorredWordmark fontSize={38} textColor="var(--ink)" redColor="var(--stamp-red)"/>
        </div>

        <p className="scr-fu-2" style={{ fontSize: 15.5, color: 'var(--ink-mute)', lineHeight: 1.55,
          margin: 0, maxWidth: 264, textAlign: 'center' }}>
          Track, trade &amp; network — Score every grail on India's #1 collectibles platform.
        </p>
      </div>

      {/* Buttons — flush to bottom, no extra gap */}
      <div className="scr-fu-3" style={{ position: 'relative', padding: '0 24px 44px',
        display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button variant="primary" size="block" onClick={onStart}>Create account</Button>
        <Button variant="secondary" size="block" onClick={onLogin}>I already have an account</Button>
      </div>
    </div>
  );
}

// ── Auth (email + social) ─────────────────────────────────────
function Auth({ mode, onBack, onDone, onSocial }) {
  const [m, setM] = React.useState(mode);
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [refCode, setRefCode] = React.useState('');
  const signup = m === 'signup';
  const [sent, setSent] = React.useState(false);

  if (m === 'forgot') {
    return (
      <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', background: 'var(--paper)', display: 'flex', flexDirection: 'column', paddingTop: 52 }}>
        <div style={{ padding: '8px 14px' }}>
          <button onClick={() => { setM('login'); setSent(false); }} style={{ width: 38, height: 38, borderRadius: 11, border: '1px solid var(--slate-200)', background: 'transparent', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Ico d={Icons.back} size={20}/>
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 24px 32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, letterSpacing: '-0.03em', margin: '0 0 6px' }}>Reset password</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-mute)', margin: '0 0 28px', lineHeight: 1.5 }}>Enter your email and we’ll send you a link to reset your password.</p>
          {!sent ? (
            <React.Fragment>
              <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com"/>
              <div style={{ marginTop: 22 }}>
                <Button variant="primary" size="block" onClick={() => { if (email.trim()) setSent(true); }} style={!email.trim() ? { opacity: 0.5 } : null}>Send reset link</Button>
              </div>
            </React.Fragment>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 24, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--forest-soft)', border: '1px solid var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ico d={Icons.mail} size={28} style={{ color: 'var(--forest)' }}/>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>Check your inbox</div>
                <div style={{ fontSize: 14, color: 'var(--ink-mute)', marginTop: 6, lineHeight: 1.55 }}>We sent a reset link to <strong>{email}</strong>. It expires in 15 minutes.</div>
              </div>
              <button onClick={() => { setM('login'); setSent(false); }} style={{ background: 'none', border: 'none', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: 0 }}>Back to log in</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', background: 'var(--paper)', display: 'flex', flexDirection: 'column', paddingTop: 52 }}>
      <div style={{ padding: '8px 14px' }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 11, border: '1px solid var(--slate-200)', background: 'transparent', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Ico d={Icons.back} size={20}/>
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 24px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          {signup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-mute)', margin: '0 0 26px' }}>
          {signup ? 'Build your collection and start trading.' : 'Log in to pick up where you left off.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com"/>
          <AuthField label="Password" type="password" value={pw} onChange={setPw} placeholder="••••••••"/>
          {signup && (
            <div>
              <AuthField label="Referral code (optional)" type="text" value={refCode} onChange={setRefCode} placeholder="e.g. SCOR-RAJ123"/>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 5 }}>Have a friend's code? Both of you earn bonus XP.</div>
            </div>
          )}
        </div>
        {!signup && <div style={{ textAlign: 'right', marginTop: 10 }}><button onClick={() => { setM('forgot'); setSent(false); }} style={{ fontSize: 13, color: 'var(--stamp-red)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}>Forgot password?</button></div>}

        <div style={{ marginTop: 22 }}>
          <Button variant="primary" size="block" onClick={() => onDone(email)}>{signup ? 'Continue' : 'Log in'}</Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--slate-200)' }}/>
          <span style={{ fontSize: 12, color: 'var(--slate-400)' }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: 'var(--slate-200)' }}/>
        </div>
        <div style={{ display: 'flex', gap: 11 }}>
          <SocialBtn label="Google" onClick={onSocial}/>
          <SocialBtn label="Apple" onClick={onSocial}/>
        </div>

        <div style={{ textAlign: 'center', marginTop: 26, fontSize: 13.5, color: 'var(--ink-mute)' }}>
          {signup ? 'Already have an account? ' : 'New to Scorred? '}
          <button onClick={() => setM(signup ? 'login' : 'signup')} style={{ background: 'none', border: 'none', color: 'var(--stamp-red)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', padding: 0 }}>
            {signup ? 'Log in' : 'Sign up'}
          </button>
        </div>
        {signup && <p style={{ fontSize: 11.5, color: 'var(--ink-faint)', textAlign: 'center', lineHeight: 1.5, marginTop: 18 }}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>}
      </div>
    </div>
  );
}

function AuthField({ label, type, value, onChange, placeholder }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.02em' }}>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ display: 'block', width: '100%', boxSizing: 'border-box', height: 48, marginTop: 7, padding: '0 14px',
          borderRadius: 12, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)',
          fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink)', outline: 'none' }}/>
    </label>
  );
}

function SocialBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, height: 48, borderRadius: 12, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14.5, cursor: 'pointer' }}>{label}</button>
  );
}

// ── Interest onboarding wizard (§9.2) ─────────────────────────
function Onboard({ onFinish }) {
  const [step, setStep] = React.useState(0); // 0 profile · 1 categories · 2 communities
  const [cats, setCats] = React.useState({});
  const [joins, setJoins] = React.useState({ itm: true });
  const [name, setName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [age, setAge] = React.useState(24);

  // @handle — auto-suggested from display name; uniqueness checked live
  const takenHandlesOnboard = React.useMemo(() =>
    new Set(Object.values(USERS || {}).map(u => (u.handle || '').toLowerCase()))
  , []);
  const [handle, setHandle]               = React.useState('');
  const [handleStatus, setHandleStatus]   = React.useState('');
  const [handleManual, setHandleManual]   = React.useState(false); // true once user edits the field

  const checkHandle = React.useCallback((v) => {
    if (!v || v.length < 3) { setHandleStatus('invalid'); return; }
    if (!/^[a-z0-9_]+$/.test(v)) { setHandleStatus('invalid'); return; }
    if (takenHandlesOnboard.has(v.toLowerCase())) { setHandleStatus('taken'); return; }
    setHandleStatus('available');
  }, [takenHandlesOnboard]);

  // Auto-suggest handle from display name (only while user hasn't manually edited it)
  React.useEffect(() => {
    if (handleManual) return;
    const suggested = name.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20);
    setHandle(suggested);
    if (suggested) checkHandle(suggested);
    else setHandleStatus('');
  }, [name, handleManual, checkHandle]);

  const onHandleChange = (raw) => {
    const v = raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
    setHandle(v); setHandleManual(true); checkHandle(v);
  };

  const chosenCats = CATEGORIES.filter(c => cats[c.id]);
  const suggested = COMMUNITIES.filter(c => chosenCats.some(cc => cc.id === c.cat));

  const canNext = step === 1 ? chosenCats.length > 0 : true;
  const next = () => step < 2 ? setStep(step + 1) : onFinish();

  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', background: 'var(--paper)', display: 'flex', flexDirection: 'column', paddingTop: 52 }}>
      {/* progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px 6px' }}>
        {step > 0
          ? <button onClick={() => setStep(step - 1)} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ico d={Icons.back} size={18}/></button>
          : <div style={{ width: 34 }}/>}
        <div style={{ flex: 1, display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? 'var(--stamp-red)' : 'var(--bone-deep)', transition: 'background 200ms' }}/>)}
        </div>
        <button onClick={onFinish} style={{ width: 50, textAlign: 'right', background: 'none', border: 'none', color: 'var(--ink-faint)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Skip</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px 20px' }}>
        {step === 0 && <>
          <StepTitle title="Set up your profile" sub="A quick intro other collectors see when you trade. You can change these later."/>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
            <div style={{ position: 'relative' }}>
              <Avatar name={name || 'You'} color="var(--ink)" size={84}/>
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderRadius: '50%', background: 'var(--stamp-red)', color: 'var(--paper)', border: '3px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico d={Icons.camera} size={15}/></div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AuthField label="Display name" type="text" value={name} onChange={setName} placeholder="e.g. Aman Iyer"/>

            {/* @handle — unique identifier, auto-suggested from name, uniqueness checked live */}
            <div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.02em' }}>@Username</span>
              <div style={{ position: 'relative', marginTop: 7 }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 16, pointerEvents: 'none' }}>@</span>
                <input type="text" value={handle} onChange={e => onHandleChange(e.target.value)} maxLength={20}
                  placeholder="your_handle"
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box', height: 48,
                    padding: '0 42px 0 32px', borderRadius: 12,
                    border: `1px solid ${handleStatus === 'available' ? 'var(--forest)' : (handleStatus === 'taken' || handleStatus === 'invalid') ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
                    background: 'var(--paper-soft)', fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--ink)', outline: 'none' }}/>
                {handleStatus && (
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                    {handleStatus === 'available'
                      ? <Ico d={Icons.check} size={18} style={{ color: 'var(--forest)' }} stroke={2.5}/>
                      : <Ico d={Icons.close} size={18} style={{ color: 'var(--stamp-red)' }} stroke={2.5}/>}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11.5, marginTop: 5, lineHeight: 1.4,
                color: handleStatus === 'available' ? 'var(--forest)' : handleStatus ? 'var(--stamp-red)' : 'var(--ink-faint)' }}>
                {handleStatus === 'available' ? '✓ Available'
                  : handleStatus === 'taken' ? '✗ Already taken — try another'
                  : handleStatus === 'invalid' ? '✗ 3–20 characters · letters, numbers and _ only'
                  : 'Lowercase · letters, numbers and _ only · 3–20 characters'}
              </div>
            </div>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.02em' }}>Bio</span>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={150}
                placeholder="Who you are and what you collect — e.g. “Sneakerhead &amp; Gunpla builder, chasing 90s Jordans.”"
                style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 7, padding: '11px 14px',
                  borderRadius: 12, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)',
                  fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.45, color: 'var(--ink)', outline: 'none', resize: 'none' }}/>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', textAlign: 'right', margin: '5px 2px 0' }}>{bio.length}/150</div>
            </label>
            <div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.02em' }}>Gender</span>
              <div style={{ display: 'flex', gap: 8, marginTop: 7 }}>
                {[['f', 'Female'], ['m', 'Male']].map(([val, lbl]) => {
                  const on = gender === val;
                  return (
                    <button key={val} onClick={() => setGender(on ? '' : val)} style={{
                      flex: 1, height: 48, borderRadius: 12, cursor: 'pointer',
                      border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
                      background: on ? 'var(--ink)' : 'var(--paper-soft)',
                      color: on ? 'var(--paper)' : 'var(--ink)',
                      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14.5 }}>{lbl}</button>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.02em' }}>How old are you?</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>{age >= 80 ? '80+' : age}</span>
              </div>
              <input type="range" min={13} max={80} step={1} value={age} onChange={e => setAge(+e.target.value)}
                style={{ width: '100%', marginTop: 12, accentColor: 'var(--stamp-red)', cursor: 'pointer' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>
                <span>13</span><span>80+</span>
              </div>
            </div>
          </div>
        </>}

        {step === 1 && <>
          <StepTitle title="What do you collect?" sub="Pick all that apply. Your feed and communities tune to this instantly — no followers needed."/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            {CATEGORIES.map(c => {
              const on = cats[c.id];
              return (
                <button key={c.id} onClick={() => setCats(s => ({ ...s, [c.id]: !s[c.id] }))} style={{
                  display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', cursor: 'pointer',
                  border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`, borderRadius: 14,
                  background: on ? 'var(--bone)' : 'var(--paper-soft)', padding: '15px 16px',
                  transition: 'border-color 120ms, background 120ms' }}>
                  <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16.5, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{c.label}</span>
                  <span style={{
                    width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                    border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
                    background: on ? 'var(--ink)' : 'transparent', color: 'var(--paper)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {on && <Ico d={Icons.check} size={15} stroke={3}/>}
                  </span>
                </button>
              );
            })}
          </div>
        </>}

        {step === 2 && <>
          <StepTitle title="Join your communities" sub="Recommended from what you collect. Pick all you like — you can join more anytime."/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            {suggested.map(c => {
              const on = joins[c.id];
              return (
                <button key={c.id} onClick={() => setJoins(j => ({ ...j, [c.id]: !j[c.id] }))} style={{
                  display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', cursor: 'pointer',
                  border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`, borderRadius: 14,
                  background: on ? 'var(--bone)' : 'var(--paper-soft)', padding: '14px 16px',
                  transition: 'border-color 120ms, background 120ms' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{c.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{c.members.toLocaleString('en-IN')} members</div>
                  </div>
                  <span style={{
                    width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                    border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
                    background: on ? 'var(--ink)' : 'transparent', color: 'var(--paper)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {on && <Ico d={Icons.check} size={15} stroke={3}/>}
                  </span>
                </button>
              );
            })}
            {suggested.length === 0 && <EmptyNote>Pick a category first to see recommended communities.</EmptyNote>}
          </div>
        </>}
      </div>

      <div style={{ padding: '12px 20px 30px', flexShrink: 0 }}>
        <Button variant="primary" size="block" disabled={!canNext} onClick={next}>
          {step === 0 ? 'Continue'
            : step === 1 ? `Continue${chosenCats.length ? ` · ${chosenCats.length} picked` : ''}`
            : 'Enter Scorred'}
        </Button>
      </div>
    </div>
  );
}

function StepTitle({ title, sub }) {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 27, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>{title}</h1>
      <p style={{ fontSize: 14.5, color: 'var(--ink-mute)', lineHeight: 1.5, margin: '8px 0 0' }}>{sub}</p>
    </div>
  );
}

// ── Email OTP verification (signup) ───────────────────────────
function OtpVerify({ email, onBack, onVerified }) {
  const [digits, setDigits] = React.useState(['', '', '', '', '', '']);
  const [secs, setSecs] = React.useState(30);
  const [resent, setResent] = React.useState(false);
  const refs = React.useRef([]);

  React.useEffect(() => { if (refs.current[0]) refs.current[0].focus(); }, []);
  React.useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  const full = digits.every(d => d !== '');

  const setAt = (i, v) => {
    const nv = (v || '').replace(/\D/g, '').slice(-1);
    setDigits(d => { const c = [...d]; c[i] = nv; return c; });
    if (nv && i < 5 && refs.current[i + 1]) refs.current[i + 1].focus();
  };
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0 && refs.current[i - 1]) refs.current[i - 1].focus();
  };
  const onPaste = (e) => {
    const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!t) return;
    e.preventDefault();
    const c = ['', '', '', '', '', ''];
    for (let i = 0; i < t.length; i++) c[i] = t[i];
    setDigits(c);
    const ni = Math.min(t.length, 5);
    if (refs.current[ni]) refs.current[ni].focus();
  };
  const resend = () => { setSecs(30); setResent(true); setDigits(['', '', '', '', '', '']); if (refs.current[0]) refs.current[0].focus(); };

  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', background: 'var(--paper)', display: 'flex', flexDirection: 'column', paddingTop: 52 }}>
      <div style={{ padding: '8px 14px' }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 11, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Ico d={Icons.back} size={20}/>
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 24px 24px' }}>
        <div style={{ width: 56, height: 56, borderRadius: 15, background: 'var(--stamp-red-soft)', color: 'var(--stamp-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Ico d={Icons.mail} size={26}/>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '-0.03em', margin: '0 0 6px' }}>Check your email</h1>
        <p style={{ fontSize: 15, color: 'var(--ink-mute)', lineHeight: 1.5, margin: '0 0 26px' }}>
          We sent a 6-digit code to <b style={{ color: 'var(--ink)' }}>{email || 'your email'}</b>. Enter it below to confirm your account.
        </p>

        <div onPaste={onPaste} style={{ display: 'flex', gap: 9, justifyContent: 'space-between' }}>
          {digits.map((d, i) => (
            <input key={i} ref={el => refs.current[i] = el} value={d} inputMode="numeric" maxLength={1}
              onChange={e => setAt(i, e.target.value)} onKeyDown={e => onKey(i, e)}
              style={{ width: '100%', height: 58, textAlign: 'center', borderRadius: 13,
                border: `1.5px solid ${d ? 'var(--ink)' : 'var(--border-strong)'}`, background: 'var(--paper-soft)',
                fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 24, color: 'var(--ink)', outline: 'none',
                caretColor: 'var(--stamp-red)' }}/>
          ))}
        </div>

        <div style={{ marginTop: 24 }}>
          <Button variant="primary" size="block" disabled={!full} onClick={onVerified}>Verify &amp; continue</Button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13.5, color: 'var(--ink-mute)' }}>
          {secs > 0
            ? <span>Resend code in <b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>0:{String(secs).padStart(2, '0')}</b></span>
            : <button onClick={resend} style={{ background: 'none', border: 'none', color: 'var(--stamp-red)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', padding: 0 }}>Resend code</button>}
        </div>
        {resent && secs > 0 && <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12.5, color: 'var(--forest)' }}>A new code is on its way.</div>}

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--ink-faint)' }}>
          Wrong address?{' '}
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Change email</button>
        </div>
      </div>
    </div>
  );
}

// ── Flow controller ───────────────────────────────────────────
function OnboardingFlow({ onEnter }) {
  const [phase, setPhase] = React.useState('splash'); // splash | auth-signup | auth-login | otp | onboard
  const [email, setEmail] = React.useState('');
  if (phase === 'splash') return <Splash onStart={() => setPhase('auth-signup')} onLogin={() => setPhase('auth-login')} onGuest={onEnter}/>;
  if (phase === 'auth-signup') return <Auth mode="signup" onBack={() => setPhase('splash')} onDone={(em) => { setEmail(em || ''); setPhase('otp'); }} onSocial={() => setPhase('onboard')}/>;
  if (phase === 'auth-login') return <Auth mode="login" onBack={() => setPhase('splash')} onDone={onEnter} onSocial={onEnter}/>;
  if (phase === 'otp') return <OtpVerify email={email} onBack={() => setPhase('auth-signup')} onVerified={() => setPhase('onboard')}/>;
  return <Onboard onFinish={onEnter}/>;
}

Object.assign(window, { OnboardingFlow });
