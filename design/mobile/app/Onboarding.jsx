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
function Auth({ mode, onBack, onDone }) {
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
          <Button variant="primary" size="block" onClick={onDone}>{signup ? 'Continue' : 'Log in'}</Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
        </div>
        <div style={{ display: 'flex', gap: 11 }}>
          <SocialBtn label="Google" onClick={onDone}/>
          <SocialBtn label="Apple" onClick={onDone}/>
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
  const [step, setStep] = React.useState(0); // 0 profile · 1 categories · 2 sub-interests · 3 communities
  const [cats, setCats] = React.useState({});
  const [subs, setSubs] = React.useState({});
  const [others, setOthers] = React.useState({}); // groupKey -> { on, text }
  const [joins, setJoins] = React.useState({ itm: true });
  const [name, setName] = React.useState('');
  const [city, setCity] = React.useState('');

  const chosenCats = CATEGORIES.filter(c => cats[c.id]);
  const suggested = COMMUNITIES.filter(c => chosenCats.some(cc => cc.id === c.cat));

  const setOther = (key, patch) => setOthers(o => ({ ...o, [key]: { ...(o[key] || { on: false, text: '' }), ...patch } }));
  // any 'Others' toggled on must carry text before continuing (§9.2 edge case)
  const othersBlocked = Object.values(others).some(o => o && o.on && !o.text.trim());
  const canNext = step === 0 ? true : step === 1 ? chosenCats.length > 0 : step === 2 ? !othersBlocked : true;

  const next = () => step < 3 ? setStep(step + 1) : onFinish();

  // a sub-interest group: chips + an 'Others' chip that reveals a mandatory text box
  const SubGroup = ({ label, list, gkey }) => {
    const o = others[gkey] || { on: false, text: '' };
    return (
      <div style={{ marginTop: 18 }}>
        <SectionLabel>{label}</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {list.map(s => (
            <CategoryChip key={s} active={subs[gkey + ':' + s]} onClick={() => setSubs(x => ({ ...x, [gkey + ':' + s]: !x[gkey + ':' + s] }))}>{s}</CategoryChip>
          ))}
          <CategoryChip active={o.on} onClick={() => setOther(gkey, { on: !o.on })}>+ Others</CategoryChip>
        </div>
        {o.on && (
          <div style={{ marginTop: 10 }}>
            <input autoFocus value={o.text} onChange={e => setOther(gkey, { text: e.target.value })}
              placeholder="Tell us what we’re missing…"
              style={{ width: '100%', boxSizing: 'border-box', height: 42, padding: '0 13px', borderRadius: 11,
                border: `1px solid ${o.text.trim() ? 'var(--border-strong)' : 'var(--stamp-red)'}`,
                background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink)', outline: 'none' }}/>
            <div style={{ fontSize: 11.5, color: o.text.trim() ? 'var(--ink-faint)' : 'var(--stamp-red)', margin: '6px 2px 0' }}>
              {o.text.trim() ? 'Thanks — this helps us grow the catalogue.' : 'Add a note so we can continue.'}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', background: 'var(--paper)', display: 'flex', flexDirection: 'column', paddingTop: 52 }}>
      {/* progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px 6px' }}>
        {step > 0
          ? <button onClick={() => setStep(step - 1)} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ico d={Icons.back} size={18}/></button>
          : <div style={{ width: 34 }}/>}
        <div style={{ flex: 1, display: 'flex', gap: 6 }}>
          {[0, 1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? 'var(--stamp-red)' : 'var(--bone-deep)', transition: 'background 200ms' }}/>)}
        </div>
        <button onClick={onFinish} style={{ width: 50, textAlign: 'right', background: 'none', border: 'none', color: 'var(--ink-faint)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Skip</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px 20px' }}>
        {step === 0 && <>
          <StepTitle title="Set up your profile" sub="Start with the basics other collectors see when you trade. You can change these later."/>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
            <div style={{ position: 'relative' }}>
              <Avatar name={name || 'You'} color="var(--ink)" size={84}/>
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderRadius: '50%', background: 'var(--stamp-red)', color: 'var(--paper)', border: '3px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico d={Icons.camera} size={15}/></div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AuthField label="Display name" type="text" value={name} onChange={setName} placeholder="e.g. Aman Iyer"/>
            <AuthField label="City (optional)" type="text" value={city} onChange={setCity} placeholder="Powers a future ‘nearby’ feature"/>
          </div>
          <div style={{ background: 'var(--verified-teal-soft)', border: '1px solid var(--verified-teal)', borderRadius: 13, padding: '12px 14px', marginTop: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Ico d={Icons.shield} size={18} style={{ color: 'var(--verified-teal)', flexShrink: 0, marginTop: 1 }}/>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>You start as <b>Verified</b>. Complete trades to build trust signals and unlock <b>Trusted</b> and <b>Top Seller</b> tiers.</div>
          </div>
        </>}

        {step === 1 && <>
          <StepTitle title="What do you collect?" sub="Pick at least one. Your feed and communities tune to this instantly — no followers needed."/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
            {CATEGORIES.map((c, i) => {
              const on = cats[c.id];
              const tone = ['red', 'plum', 'forest', 'teal'][i];
              return (
                <button key={c.id} onClick={() => setCats(s => ({ ...s, [c.id]: !s[c.id] }))} style={{
                  border: `2px solid ${on ? 'var(--ink)' : 'var(--border)'}`, borderRadius: 16, overflow: 'hidden',
                  background: 'var(--paper-soft)', cursor: 'pointer', padding: 0, textAlign: 'left', position: 'relative' }}>
                  <ProductPhoto tone={tone} ratio="3/2" rounded={0}/>
                  {on && <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'var(--ink)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico d={Icons.check} size={15} stroke={3}/></div>}
                  <div style={{ padding: '9px 11px 11px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{c.label}</div>
                </button>
              );
            })}
          </div>
        </>}

        {step === 2 && <>
          <StepTitle title="Get specific" sub="Brands, lines, scale and universe. Missing something? Tap ‘Others’ and tell us."/>
          {chosenCats.map(c => <SubGroup key={c.id} label={c.label} list={SUBINTERESTS[c.id] || []} gkey={c.id}/>)}
          <SubGroup label="Scale" list={SCALES} gkey="scale"/>
          <SubGroup label="Universe" list={UNIVERSES} gkey="universe"/>
        </>}

        {step === 3 && <>
          <StepTitle title="Join your people" sub="Suggested from your interests. Optional — you can join more anytime."/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            {suggested.map(c => {
              const on = joins[c.id];
              const tones = { plum: 'var(--plum)', forest: 'var(--forest)', teal: 'var(--verified-teal)', red: 'var(--stamp-red)', ink: 'var(--ink)' };
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 13, padding: 11 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: tones[c.tone], color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>{c.tag}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{c.members.toLocaleString('en-IN')} members</div>
                  </div>
                  <Button size="sm" variant={on ? 'secondary' : 'dark'} onClick={() => setJoins(j => ({ ...j, [c.id]: !j[c.id] }))}>{on ? 'Joined' : 'Join'}</Button>
                </div>
              );
            })}
            {suggested.length === 0 && <EmptyNote>Pick a category to see suggested communities.</EmptyNote>}
          </div>
        </>}
      </div>

      <div style={{ padding: '12px 20px 30px', flexShrink: 0 }}>
        <Button variant="primary" size="block" disabled={!canNext} onClick={next}>
          {step === 0 ? 'Continue'
            : step === 1 ? `Continue${chosenCats.length ? ` · ${chosenCats.length} picked` : ''}`
            : step === 2 ? (othersBlocked ? 'Add your ‘Others’ note' : 'Continue')
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

// ── Flow controller ───────────────────────────────────────────
function OnboardingFlow({ onEnter }) {
  const [phase, setPhase] = React.useState('splash'); // splash | auth-signup | auth-login | onboard
  if (phase === 'splash') return <Splash onStart={() => setPhase('auth-signup')} onLogin={() => setPhase('auth-login')} onGuest={onEnter}/>;
  if (phase === 'auth-signup') return <Auth mode="signup" onBack={() => setPhase('splash')} onDone={() => setPhase('onboard')}/>;
  if (phase === 'auth-login') return <Auth mode="login" onBack={() => setPhase('splash')} onDone={onEnter}/>;
  return <Onboard onFinish={onEnter}/>;
}

Object.assign(window, { OnboardingFlow });
