// ─────────────────────────────────────────────────────────────
// Direct Messages — inbox + thread with Deal completion
// BRD §9.10 / §8.6 MK-08 / §8.7
// ─────────────────────────────────────────────────────────────

function InboxView() {
  const { push } = useNav();
  return (
    <Screen nav={false} header={<DetailHeader title="Messages"/>}>
      <div style={{ padding: '6px 0 24px' }}>
        {INBOX.map(c => {
          const u = userOf(c.user);
          const l = c.listing ? listingOf(c.listing) : null;
          return (
            <button key={c.user} onClick={() => push({ name: 'chat', user: c.user })} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', cursor: 'pointer',
              background: 'none', border: 'none', borderBottom: '1px solid var(--border)', padding: '13px 16px' }}>
              <Avatar name={u.name} color={u.color} size={48} verified={u.tier !== 'Verified'}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', flexShrink: 0 }}>{c.time}</span>
                </div>
                {l && l.sku && <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', margin: '2px 0' }}>re: {catOf(l.sku).sku}</div>}
                {l && !l.sku && <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>re: {l.title}</div>}
                <div style={{ fontSize: 13, color: c.unread ? 'var(--ink)' : 'var(--ink-faint)', fontWeight: c.unread ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.preview}</div>
              </div>
              {c.unread > 0 && <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, background: 'var(--stamp-red)', color: 'var(--paper)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.unread}</span>}
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

function ChatView({ route }) {
  const { push, flashToast } = useNav();
  const { threads, sendMessage, deals, requestDeal, confirmDeal } = useAppState();
  const handle = route.user;
  const u = userOf(handle);
  const thread = threads[handle] || { listing: route.listing || null, messages: [] };
  const listingId = route.listing || thread.listing;
  const l = listingId ? listingOf(listingId) : null;
  const lName = l ? (l.sku ? catOf(l.sku).brand : l.brand) : 'item';
  const dealState = deals[handle];
  const [attachOpen, setAttachOpen] = React.useState(false);
  const [offerOpen, setOfferOpen]   = React.useState(false);
  const [offerAmt, setOfferAmt]     = React.useState(l ? String(Math.round((l.price || 0) * 0.9)) : '');

  // ── More / Report / Block sheet ──
  const [moreOpen, setMoreOpen]       = React.useState(false);
  const [reportOpen, setReportOpen]   = React.useState(false);
  const [blockOpen, setBlockOpen]     = React.useState(false);
  const [isBlocked, setIsBlocked]     = React.useState(false);
  const [reportReason, setReportReason] = React.useState(null);
  const [reportSent, setReportSent]   = React.useState(false);

  const REPORT_REASONS = [
    'Fake / impersonation',
    'Counterfeit / replica listings',
    'Scam or fraud attempt',
    'Harassment or abuse',
    'Spam',
    'Other',
  ];

  const handleBlock = () => {
    setIsBlocked(v => !v);
    setBlockOpen(false);
    setMoreOpen(false);
    flashToast(isBlocked ? `@${u.handle} unblocked` : `@${u.handle} blocked`);
  };

  const handleReport = () => {
    setReportSent(true);
    setTimeout(() => {
      setReportOpen(false);
      setMoreOpen(false);
      setReportSent(false);
      setReportReason(null);
      flashToast('Report submitted — we\'ll review within 24 hrs');
    }, 1600);
  };

  const closeSheets = () => { setMoreOpen(false); setReportOpen(false); setBlockOpen(false); setReportReason(null); setAttachOpen(false); setOfferOpen(false); };
  const [draft, setDraft] = React.useState(route.intent === 'trade' ? `Hi! Would you trade the ${lName}? I can offer a sealed piece.` : (route.intent === 'buy' && l ? `Hi! Is the ${lName} still available?` : ''));
  const bodyRef = React.useRef(null);

  React.useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [thread.messages.length, dealState]);

  const send = () => { if (draft.trim()) { sendMessage(handle, draft.trim()); setDraft(''); } };

  return (
    <React.Fragment>

      {/* ── Attach sheet ── */}
      {attachOpen && (
        <div onClick={() => setAttachOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 0 36px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 20px' }}/>
            <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { icon: Icons.camera,  label: 'Photo',         action: () => { sendMessage(handle, '📷 [Photo attached]'); setAttachOpen(false); flashToast('Photo sent'); } },
                { icon: Icons.bag,     label: 'Share listing', action: () => { if (l) { sendMessage(handle, `📦 Sharing listing: ${l.title || catOf(l.sku).title}`); setAttachOpen(false); flashToast('Listing shared'); } else { setAttachOpen(false); flashToast('No listing in this thread'); } } },
                { icon: Icons.tag,     label: 'Make offer',   action: () => { setAttachOpen(false); setTimeout(() => setOfferOpen(true), 80); } },
              ].map(opt => (
                <button key={opt.label} onClick={opt.action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, padding: '16px 8px', background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 16, cursor: 'pointer' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>
                    <Ico d={opt.icon} size={22}/>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--ink)' }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Offer sheet ── */}
      {offerOpen && (
        <div onClick={() => setOfferOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 20px 36px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 18px' }}/>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Make an offer</div>
            {l && <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 16 }}>Listed at <b style={{ color: 'var(--ink)' }}>₹{(l.price || 0).toLocaleString('en-IN')}</b></div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--border-strong)', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
              <span style={{ padding: '0 14px', fontSize: 18, fontWeight: 700, color: 'var(--ink-faint)', borderRight: '1px solid var(--border)', height: 50, display: 'flex', alignItems: 'center' }}>₹</span>
              <input
                autoFocus
                type="number"
                value={offerAmt}
                onChange={e => setOfferAmt(e.target.value)}
                placeholder="Enter amount"
                style={{ flex: 1, height: 50, padding: '0 14px', border: 'none', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', background: 'none' }}
              />
            </div>
            <Button variant="primary" style={{ width: '100%', justifyContent: 'center', opacity: offerAmt ? 1 : 0.45 }}
              onClick={() => {
                if (!offerAmt) return;
                sendMessage(handle, `💰 Offer: ₹${Number(offerAmt).toLocaleString('en-IN')} for ${l ? (l.title || catOf(l.sku).title) : 'item'}`);
                setOfferOpen(false);
                flashToast('Offer sent!');
              }}>
              Send offer
            </Button>
          </div>
        </div>
      )}

      {/* ── Bottom-sheet overlay ── */}
      {(moreOpen || reportOpen || blockOpen) && (
        <div onClick={closeSheets} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>

          {/* Main menu */}
          {moreOpen && !reportOpen && !blockOpen && (
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 0 32px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 18px' }}/>
              {[{
                icon: Icons.flag,  label: isBlocked ? 'Unblock @' + u.handle : 'Block @' + u.handle, danger: false,
                onClick: () => { setMoreOpen(false); setTimeout(() => setBlockOpen(true), 80); },
              }, {
                icon: Icons.close, label: 'Report @' + u.handle, danger: true,
                onClick: () => { setMoreOpen(false); setTimeout(() => setReportOpen(true), 80); },
              }].map(item => (
                <button key={item.label} onClick={item.onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', color: item.danger ? 'var(--stamp-red)' : 'var(--ink)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: item.danger ? '#FEE2E2' : 'var(--paper-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
                    <Ico d={item.icon} size={18}/>
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15 }}>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Report sheet */}
          {reportOpen && (
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 0 32px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 0' }}/>
              <div style={{ padding: '16px 20px 10px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Report @{u.handle}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 3 }}>Why are you reporting this conversation?</div>
              </div>
              {reportSent ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 8px', gap: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--paper-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ico d={Icons.check} size={24} style={{ color: 'var(--forest)' }}/>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Report submitted</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>We'll review this within 24 hrs</div>
                </div>
              ) : (
                <React.Fragment>
                  {REPORT_REASONS.map(reason => (
                    <button key={reason} onClick={() => setReportReason(reason)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink)', fontWeight: reportReason === reason ? 600 : 400 }}>{reason}</span>
                      {reportReason === reason && <Ico d={Icons.check} size={16} style={{ color: 'var(--stamp-red)' }}/>}
                    </button>
                  ))}
                  <div style={{ padding: '14px 20px 0' }}>
                    <Button variant="primary" style={{ width: '100%', justifyContent: 'center', opacity: reportReason ? 1 : 0.45 }} onClick={reportReason ? handleReport : undefined}>
                      Submit report
                    </Button>
                  </div>
                </React.Fragment>
              )}
            </div>
          )}

          {/* Block confirmation */}
          {blockOpen && (
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 0 32px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 0' }}/>
              <div style={{ padding: '20px 20px 6px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <Avatar name={u.name} color={u.color} size={56}/>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
                  {isBlocked ? 'Unblock' : 'Block'} @{u.handle}?
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 6, lineHeight: 1.55, maxWidth: 280, margin: '6px auto 0' }}>
                  {isBlocked
                    ? `@${u.handle} will be able to message and see your profile again.`
                    : `They won't be able to see your profile, listings or messages. You can unblock them anytime from Settings.`}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '20px 20px 0' }}>
                <Button variant="primary"
                  style={{ width: '100%', justifyContent: 'center', background: isBlocked ? 'var(--forest)' : 'var(--stamp-red)', borderColor: isBlocked ? 'var(--forest)' : 'var(--stamp-red)' }}
                  onClick={handleBlock}>
                  {isBlocked ? 'Unblock' : 'Block'} @{u.handle}
                </Button>
                <Button variant="secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setBlockOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Screen nav={false} bodyRef={bodyRef} bg="var(--bone)"
        header={<DetailHeader title={<button onClick={() => push({ name: 'profile', user: handle })} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'inherit', fontSize: 'inherit', color: 'inherit', letterSpacing: 'inherit', lineHeight: 'inherit', textAlign: 'left' }}>{u.name}</button>} subtitle={`${u.vouchesReceived} vouches · ${u.deals} deals · ${u.response}`}
          trailing={<IconButton icon={<Ico d={Icons.more} size={18}/>} onClick={() => setMoreOpen(true)}/>}/>}
        footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '10px 14px 30px' }}>
          {/* safe-trade reminder — trades happen off-platform; Scorred doesn't guarantee deals */}
          <div style={{ marginBottom: 10, background: 'var(--verified-teal-soft)', border: '1px solid var(--verified-teal)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
              <Ico d={Icons.shield} size={16} style={{ color: 'var(--verified-teal)', flexShrink: 0, marginTop: 1 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--verified-teal)' }}>Trade safely</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 2 }}>Ask for in-hand photos, check vouches, and prefer verified sellers. After a good deal, leave each other a vouch.</div>
                <button onClick={() => push({ name: 'vouch', user: handle, mode: 'give' })} style={{ marginTop: 7, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--verified-teal)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Ico d={Icons.shield} size={13}/>Leave a vouch for @{u.handle}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <IconButton icon={<Ico d={Icons.plus} size={20}/>} onClick={() => setAttachOpen(true)}/>
            <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message…"
              style={{ flex: 1, height: 42, padding: '0 14px', borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink)', outline: 'none' }}/>
            <IconButton icon={<Ico d={Icons.send} size={18}/>} active={!!draft.trim()} onClick={send}/>
          </div>
        </div>
      }>
      {/* listing context header — BRD §9.10 */}
      {l && (() => {
        const c = l.sku ? catOf(l.sku) : { tone: l.tone || 'ink', title: l.title };
        return (
        <button onClick={() => push({ name: 'listing', id: l.id })} style={{
          display: 'flex', alignItems: 'center', gap: 11, width: 'calc(100% - 28px)', margin: '12px 14px', cursor: 'pointer',
          background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 13, padding: 10, textAlign: 'left' }}>
          <div style={{ width: 44, height: 44, borderRadius: 9, overflow: 'hidden', flexShrink: 0 }}><ProductPhoto tone={c.tone} ratio="1/1" rounded={9}/></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
            <div style={{ fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}><Money value={l.price} currency={l.sym || '₹'}/> · <span style={{ color: 'var(--ink-faint)' }}>{(l.condition || '').split('·')[0]}</span></div>

          </div>
        </button>
        );
      })()}

      <div style={{ padding: '4px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {thread.messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
            <div style={{
              padding: '9px 13px', borderRadius: 16, fontSize: 14.5, lineHeight: 1.45,
              background: m.from === 'me' ? 'var(--stamp-red)' : 'var(--paper)',
              color: m.from === 'me' ? 'var(--paper)' : 'var(--ink)',
              border: m.from === 'me' ? 'none' : '1px solid var(--border)',
              borderBottomRightRadius: m.from === 'me' ? 5 : 16, borderBottomLeftRadius: m.from === 'me' ? 16 : 5,
            }}>{m.text}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 3, textAlign: m.from === 'me' ? 'right' : 'left', padding: '0 4px' }}>{m.time}</div>
          </div>
        ))}
      </div>{/* END messages */}

      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-faint)', padding: '0 32px 12px', lineHeight: 1.5 }}>
        First time trading with @{u.handle}? Deals complete off-platform — check trust signals & ask for an in-hand video.
      </div>
    </Screen>
    </React.Fragment>
  );
}

const dealBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 44,
  borderRadius: 12, border: '1px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)',
  cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
};

Object.assign(window, { InboxView, ChatView });
