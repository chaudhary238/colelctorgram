// ─────────────────────────────────────────────────────────────
// Edit profile + Profile-photo update — mirrors onboarding step 0 (§9.2)
// Routes: 'edit-profile' (form) · 'edit-avatar' (photo / colour picker)
// Edits persist via app-state `profile` overrides and reflect on the
// own-profile header instantly.
// ─────────────────────────────────────────────────────────────

const PROFILE_COLORS = [
  'var(--ink)', 'var(--stamp-red)', 'var(--plum)', 'var(--verified-teal)',
  'var(--forest)', 'var(--grail-gold)', 'var(--ink-mute)',
];

// reusable labelled field (matches onboarding's AuthField styling)
function EPField({ label, value, onChange, placeholder, type = 'text' }) {
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

// ── Edit profile form ─────────────────────────────────────────
function EditProfileView() {
  const { pop, push, flashToast } = useNav();
  const { profile, updateProfile } = useAppState();
  const me = { ...ME, ...profile };

  const [name, setName] = React.useState(me.name === 'You' ? '' : me.name);
  const [bio, setBio]   = React.useState(me.bio || '');
  const [city, setCity] = React.useState(me.city || '');
  const [gender, setGender] = React.useState(me.gender || '');
  const [age, setAge]   = React.useState(me.age || 24);

  // @handle — uniqueness checked against all seed users, excluding own current handle
  const myHandle = (me.handle || '').toLowerCase();
  const takenHandles = React.useMemo(() =>
    new Set(Object.values(USERS || {}).map(u => (u.handle || '').toLowerCase()).filter(h => h !== myHandle))
  , [myHandle]);
  const [handle, setHandle]           = React.useState(me.handle || '');
  const [handleStatus, setHandleStatus] = React.useState('');
  const [handleChanged, setHandleChanged] = React.useState(false);

  const checkHandle = (v) => {
    if (!v || v.length < 3) { setHandleStatus('invalid'); return; }
    if (!/^[a-z0-9_]+$/.test(v)) { setHandleStatus('invalid'); return; }
    if (takenHandles.has(v.toLowerCase())) { setHandleStatus('taken'); return; }
    setHandleStatus('available');
  };
  const onHandleChange = (raw) => {
    const v = raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
    setHandle(v); setHandleChanged(true); checkHandle(v);
  };

  const save = () => {
    const newHandle = handle.trim() || me.handle;
    updateProfile({ name: name.trim() || 'You', bio: bio.trim(), city: city.trim(), gender, age, handle: newHandle });
    pop();
    flashToast('Profile updated');
  };

  return (
    <Screen nav={false}
      header={<DetailHeader title="Edit profile" subtitle="What other collectors see"
        trailing={<Button size="sm" variant="dark" onClick={save}>Save</Button>}/>}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px' }}>
          <Button variant="dark" size="block" icon={<Ico d={Icons.check} size={18}/>} onClick={save}>Save changes</Button>
        </div>
      }>
      <div style={{ padding: '18px 20px 20px' }}>
        {/* avatar with camera badge → opens photo updater */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <button onClick={() => push({ name: 'edit-avatar' })} style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <Avatar name={name || 'You'} color={me.color} photo={me.photo} size={92}/>
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 32, height: 32, borderRadius: '50%', background: 'var(--stamp-red)', color: 'var(--paper)', border: '3px solid var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={Icons.camera} size={16}/>
            </div>
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: -14, marginBottom: 20 }}>
          <button onClick={() => push({ name: 'edit-avatar' })} style={{ background: 'none', border: 'none', color: 'var(--stamp-red)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', padding: 4 }}>
            Change profile photo
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <EPField label="Display name" value={name} onChange={setName} placeholder="e.g. Aman Iyer"/>

          {/* @username — unique identifier, checked against all existing handles */}
          <div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.02em' }}>@Username</span>
            <div style={{ position: 'relative', marginTop: 7 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 16, pointerEvents: 'none' }}>@</span>
              <input type="text" value={handle} onChange={e => onHandleChange(e.target.value)} maxLength={20}
                placeholder={me.handle || 'your_handle'}
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
              {handleStatus === 'available' ? '✓ Username available'
                : handleStatus === 'taken' ? '✗ Already taken — try another'
                : handleStatus === 'invalid' ? '✗ 3–20 characters · letters, numbers and _ only'
                : 'Lowercase letters, numbers and _ only · 3–20 characters'}
            </div>
            {handleChanged && handle !== myHandle && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 7, padding: '8px 10px', background: 'var(--grail-gold-soft)', borderRadius: 9 }}>
                <Ico d={Icons.info} size={14} style={{ color: 'var(--grail-gold-deep)', flexShrink: 0, marginTop: 1 }}/>
                <span style={{ fontSize: 11.5, color: 'var(--grail-gold-deep)', lineHeight: 1.45 }}>Changing your username may break links to your profile shared elsewhere.</span>
              </div>
            )}
          </div>

          <label style={{ display: 'block' }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.02em' }}>Bio</span>
            <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 150))} rows={3}
              placeholder="Who you are and what you collect — e.g. “Hot Toys obsessive, chasing 1/6 Marvel.”"
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 7, padding: '11px 14px',
                borderRadius: 12, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)',
                fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.45, color: 'var(--ink)', outline: 'none', resize: 'none' }}/>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', textAlign: 'right', margin: '5px 2px 0' }}>{bio.length}/150</div>
          </label>

          <EPField label="City" value={city} onChange={setCity} placeholder="e.g. Mumbai"/>

          <div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.02em' }}>Gender</span>
            <div style={{ display: 'flex', gap: 8, marginTop: 7 }}>
              {[['f', 'Female'], ['m', 'Male'], ['x', 'Prefer not to say']].map(([val, lbl]) => {
                const on = gender === val;
                return (
                  <button key={val} onClick={() => setGender(on ? '' : val)} style={{
                    flex: 1, height: 48, borderRadius: 12, cursor: 'pointer', padding: '0 6px',
                    border: `1.5px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
                    background: on ? 'var(--ink)' : 'var(--paper-soft)', color: on ? 'var(--paper)' : 'var(--ink)',
                    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5, lineHeight: 1.1 }}>{lbl}</button>
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
      </div>
    </Screen>
  );
}

// ── Profile-photo updater ─────────────────────────────────────
function EditAvatarView() {
  const { pop, flashToast } = useNav();
  const { profile, updateProfile } = useAppState();
  const me = { ...ME, ...profile };
  const fileRef = React.useRef(null);
  const [name] = React.useState(me.name);

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { updateProfile({ photo: reader.result }); flashToast('Profile photo updated'); };
    reader.readAsDataURL(f);
  };

  return (
    <Screen nav={false}
      header={<DetailHeader title="Profile photo" subtitle="Upload a photo or pick a colour"
        trailing={<Button size="sm" variant="dark" onClick={pop}>Done</Button>}/>}>
      <div style={{ padding: '24px 20px' }}>
        {/* live preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
          <Avatar name={name || 'You'} color={me.color} photo={me.photo} size={132}/>
        </div>

        {/* hidden file input */}
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }}/>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="dark" style={{ flex: 1, justifyContent: 'center' }} icon={<Ico d={Icons.camera} size={18}/>}
            onClick={() => fileRef.current && fileRef.current.click()}>
            {me.photo ? 'Replace photo' : 'Upload a photo'}
          </Button>
          {me.photo && (
            <Button variant="secondary" icon={<Ico d={Icons.close} size={17}/>}
              onClick={() => { updateProfile({ photo: null }); flashToast('Photo removed'); }}>Remove</Button>
          )}
        </div>

        {/* colour avatar fallback */}
        <div style={{ marginTop: 26 }}><SectionLabel>Or pick an avatar colour</SectionLabel></div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
          {PROFILE_COLORS.map(c => {
            const on = !me.photo && me.color === c;
            return (
              <button key={c} onClick={() => updateProfile({ color: c, photo: null })} aria-label="Pick colour" style={{
                width: 50, height: 50, borderRadius: '50%', background: c, cursor: 'pointer', position: 'relative',
                border: 'none', boxShadow: on ? '0 0 0 3px var(--paper), 0 0 0 5px var(--ink)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--paper)',
              }}>
                {on && <Ico d={Icons.check} size={20} stroke={3}/>}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 26, fontSize: 12, color: 'var(--ink-faint)', lineHeight: 1.5 }}>
          <Ico d={Icons.shield} size={15} style={{ color: 'var(--verified-teal)', flexShrink: 0, marginTop: 1 }}/>
          <span>A clear face or collection photo helps other collectors trust you when trading.</span>
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { EditProfileView, EditAvatarView });
