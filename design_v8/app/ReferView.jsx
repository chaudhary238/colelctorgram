// ─────────────────────────────────────────────────────────────
// ReferView — invite friends, earn +150 XP per successful referral
// ─────────────────────────────────────────────────────────────

const MOCK_REFERRALS = [
  { name: 'Arjun S.',   handle: 'arjun_s',   joined: '2 days ago', status: 'joined',  xp: 150 },
  { name: 'Priya M.',   handle: 'priya_m',   joined: '5 days ago', status: 'joined',  xp: 150 },
  { name: 'Rahul T.',   handle: 'rahul_t',   joined: '1 week ago', status: 'pending', xp: 0   },
];

function ReferView() {
  const { flashToast } = useNav();
  const [copied, setCopied] = React.useState(false);
  const referCode = 'SCOR-' + (ME.handle || 'you').toUpperCase().slice(0,6);
  const referLink = 'scorred.app/join?ref=' + referCode;
  const earned = MOCK_REFERRALS.filter(r => r.status === 'joined').reduce((s, r) => s + r.xp, 0);

  function copy() {
    setCopied(true);
    flashToast('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  function share() {
    flashToast('Share sheet opened');
  }

  return (
    <Screen nav={false} header={<DetailHeader title="Refer a friend" subtitle="+150 XP per referral"/>}>
      <div style={{ padding: '16px' }}>

        {/* Hero card */}
        <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--paper-soft)', marginBottom: 16 }}>
          <div style={{ background: 'var(--stamp-red)', padding: '24px 20px 20px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Ico d={Icons.gift} size={28} style={{ color: '#fff' }}/>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-0.02em' }}>Invite collectors</div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', marginTop: 6, lineHeight: 1.5 }}>
              You earn <b style={{ color: '#fff' }}>+150 XP</b> for every friend who joins and adds their first item.
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {[
              { n: MOCK_REFERRALS.length, label: 'Invited' },
              { n: MOCK_REFERRALS.filter(r => r.status === 'joined').length, label: 'Joined' },
              { n: earned, label: 'XP earned', mono: true },
            ].map(({ n, label, mono }, i) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', padding: '14px 0', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{n}</div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Referral link */}
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Your referral link</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 11, background: 'var(--bone)', border: '1px solid var(--border)' }}>
              <Ico d={Icons.link || Icons.share} size={15} style={{ color: 'var(--ink-mute)', flexShrink: 0 }}/>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{referLink}</span>
              <button onClick={copy} style={{ flexShrink: 0, padding: '5px 11px', borderRadius: 8, background: copied ? 'var(--verified-teal)' : 'var(--ink)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Ico d={copied ? Icons.check : Icons.copy || Icons.share} size={13} style={{ color: '#fff' }}/>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Share button */}
            <Button variant="dark" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
              icon={<Ico d={Icons.share} size={17}/>} onClick={share}>
              Share invite link
            </Button>
          </div>
        </div>

        {/* How it works */}
        <div style={{ padding: '14px 15px', borderRadius: 14, background: 'var(--bone)', border: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-mute)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
          {[
            { step: '1', text: 'Share your referral link with a collector friend' },
            { step: '2', text: 'They sign up using your link' },
            { step: '3', text: 'They add their first item to their collection' },
            { step: '4', text: 'You instantly earn +150 XP — no limit on referrals' },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: step === '4' ? 0 : 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: 'var(--stamp-red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 12 }}>{step}</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5, paddingTop: 3 }}>{text}</div>
            </div>
          ))}
        </div>

        {/* Referral history */}
        {MOCK_REFERRALS.length > 0 && (
          <>
            <div style={{ marginBottom: 10 }}><SectionLabel>Invites sent</SectionLabel></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {MOCK_REFERRALS.map(r => (
                <div key={r.handle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 13, border: '1px solid var(--border)', background: 'var(--paper-soft)' }}>
                  <Avatar name={r.name} color="var(--ink-ghost)" size={38}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 1 }}>{r.joined}</div>
                  </div>
                  {r.status === 'joined' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--verified-teal)', background: 'var(--verified-teal-soft)', border: '1px solid var(--verified-teal)', borderRadius: 999, padding: '2px 8px' }}>Joined</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: 'var(--verified-teal)' }}>+{r.xp} XP</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', background: 'var(--bone)', border: '1px solid var(--border)', borderRadius: 999, padding: '2px 8px' }}>Pending</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </Screen>
  );
}

Object.assign(window, { ReferView });
