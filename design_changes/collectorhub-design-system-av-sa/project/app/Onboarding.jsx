// ─────────────────────────────────────────────────────────────
// Onboarding flow — Splash & Auth (§9.1) + Interest selection (§9.2)
// Renders full-screen inside the device until the user enters the app.
// ─────────────────────────────────────────────────────────────

const SUBINTERESTS = {
  figures:  ['Hot Toys', 'SH Figuarts', 'Sideshow', 'Marvel Legends', 'McFarlane', 'Premium Format'],
  designer: ['Pop Mart', 'Skullpanda', 'Labubu', 'KAWS', 'Soft vinyl', 'Sonny Angel'],
  kits:     ['LEGO', 'Gunpla', 'MOC builds', 'Bandai', 'Scale models'],
  diecast:  ['Tomica', 'Mini GT', 'Hot Wheels', 'Inno64', 'Kyosho'],
};

// ── Splash ────────────────────────────────────────────────────
function Splash({ onStart, onLogin, onGuest }) {
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', background: 'var(--paper)', display: 'flex', flexDirection: 'column',
      paddingTop: 52, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 22% 18%, rgba(217,51,36,0.07), transparent 55%), radial-gradient(circle at 84% 86%, rgba(20,17,15,0.05), transparent 55%)' }}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, position: 'relative', padding: '0 32px' }}>
        <div style={{ width: 96, height: 96, borderRadius: 22, background: 'var(--stamp-red)', color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 58, transform: 'rotate(-4deg)', boxShadow: 'var(--shadow-stamp)' }}>C</div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, letterSpacing: '-0.035em', margin: 0, color: 'var(--ink)' }}>CollectorHub</h1>
          <p style={{ fontSize: 16, color: 'var(--ink-mute)', lineHeight: 1.5, margin: '12px 0 0', maxWidth: 280 }}>
            The home for collectors. Showcase what you own, find your niche, and trade with people you can trust.
          </p>
        </div>
      </div>
      <div style={{ position: 'relative', padding: '0 24px 40px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <Button variant="primary" size="block" onClick={onStart}>Create account</Button>
        <Button variant="secondary" size="block" onClick={onLogin}>I already have an account</Button>
        <button onClick={onGuest} style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: '8px 0', marginTop: 2 }}>
          Explore as guest →
        </button>
      </div>
    </div>
  );
}

// ── Auth (email + social) ─────────────────────────────────────
function Auth({ mode, onBack, onDone, onSocial }) {
  const [m, setM] = React.useState(mode);
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const signup = m === 'signup';
  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', background: 'var(--paper)', display: 'flex', flexDirection: 'column', paddingTop: 52 }}>
      <div style={{ padding: '8px 14px' }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 11, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Ico d={Icons.back} size={20}/>
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 24px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          {signup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-mute)', margin: '0 0 26px' }}>
          {signup ? 'Build your collection and start trading.' : 'Log in to pick up where you left off.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com"/>
          <AuthField label="Password" type="password" value={pw} onChange={setPw} placeholder="••••••••"/>
        </div>
        {!signup && <div style={{ textAlign: 'right', marginTop: 10 }}><a style={{ fontSize: 13, color: 'var(--stamp-red)', fontWeight: 600, textDecoration: 'none' }} href="#">Forgot password?</a></div>}

        <div style={{ marginTop: 22 }}>
          <Button variant="primary" size="block" onClick={() => onDone(email)}>{signup ? 'Continue' : 'Log in'}</Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
        </div>
        <div style={{ display: 'flex', gap: 11 }}>
          <SocialBtn label="Google" onClick={onSocial}/>
          <SocialBtn label="Apple" onClick={onSocial}/>
        </div>

        <div style={{ textAlign: 'center', marginTop: 26, fontSize: 13.5, color: 'var(--ink-mute)' }}>
          {signup ? 'Already have an account? ' : 'New to CollectorHub? '}
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
            : 'Enter CollectorHub'}
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
