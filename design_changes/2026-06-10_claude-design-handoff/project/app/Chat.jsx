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
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>{u.name}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginLeft: 'auto' }}>{c.time}</span>
                </div>
                {l && <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', margin: '2px 0' }}>re: {catOf(l.sku).sku}</div>}
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
  const dealState = deals[handle];
  const [makePublic, setMakePublic] = React.useState(false); // opt-in public thread (v1.2 §9.10)
  const [draft, setDraft] = React.useState(route.intent === 'trade' ? `Hi! Would you trade the ${l ? catOf(l.sku).brand : 'item'}? I can offer a sealed piece.` : (route.intent === 'buy' && l ? `Hi! Is the ${catOf(l.sku).brand} still available?` : ''));
  const bodyRef = React.useRef(null);

  React.useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [thread.messages.length, dealState]);

  const send = () => { if (draft.trim()) { sendMessage(handle, draft.trim()); setDraft(''); } };

  return (
    <Screen nav={false} bodyRef={bodyRef} bg="var(--bone)"
      header={<DetailHeader title={u.name} subtitle={makePublic ? 'Public thread · visible to all' : `${u.rating}★ · ${u.deals} deals · ${u.response}`}
        trailing={<IconButton icon={<Ico d={makePublic ? Icons.eye : Icons.more} size={18}/>} onClick={() => flashToast('Block · report')}/>}/>}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '10px 14px 30px' }}>
          {/* deal completion controls — BRD §8.6 MK-08 */}
          {dealState !== 'confirmed' && (
            <div style={{ marginBottom: 10 }}>
              {!dealState && (
                <button onClick={() => { requestDeal(handle); flashToast('Deal marked — waiting for @' + u.handle + ' to confirm'); }} style={dealBtn}>
                  <Ico d={Icons.check} size={16}/>Mark as sold / traded to @{u.handle}
                </button>
              )}
              {dealState === 'requested' && (
                <div style={{ background: 'var(--grail-gold-soft)', border: '1px solid var(--grail-gold)', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Ico d={Icons.clock} size={17} style={{ color: 'var(--grail-gold-deep)', flexShrink: 0 }}/>
                  <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink-soft)' }}>Waiting for @{u.handle} to confirm the deal.</span>
                  <Button size="sm" variant="grail" onClick={() => { confirmDeal(handle); flashToast('Deal confirmed · trade history updated'); }}>Simulate confirm</Button>
                </div>
              )}
            </div>
          )}
          {dealState === 'confirmed' && (
            <div style={{ marginBottom: 10, background: 'var(--forest-soft)', border: '1px solid var(--forest)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--forest)', fontWeight: 600, fontSize: 13 }}>
                <Ico d={Icons.shield} size={16}/>Deal confirmed
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <span style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Rate this trade:</span>
                <Stars n={5} size={18}/>
                <Button size="sm" variant="teal" style={{ marginLeft: 'auto' }} onClick={() => flashToast('Trade vouch left for @' + u.handle)}>Leave vouch</Button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <IconButton icon={<Ico d={Icons.plus} size={20}/>} onClick={() => flashToast('Attach item · photo · offer')}/>
            <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message…"
              style={{ flex: 1, height: 42, padding: '0 14px', borderRadius: 999, border: '1px solid var(--border-strong)', background: 'var(--paper-soft)', fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink)', outline: 'none' }}/>
            <IconButton icon={<Ico d={Icons.send} size={18}/>} active={!!draft.trim()} onClick={send}/>
          </div>
        </div>
      }>
      {/* opt-in public thread — BRD v1.2 §9.10 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 14px 0', padding: '11px 13px', background: makePublic ? 'var(--verified-teal-soft)' : 'var(--paper)', border: `1px solid ${makePublic ? 'var(--verified-teal)' : 'var(--border)'}`, borderRadius: 13 }}>
        <Ico d={makePublic ? Icons.eye : Icons.eyeOff} size={18} style={{ color: makePublic ? 'var(--verified-teal)' : 'var(--ink-faint)', flexShrink: 0 }}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{makePublic ? 'Public thread' : 'Make thread public'}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', lineHeight: 1.4 }}>{makePublic ? 'Anyone can read this Q&A on the listing. No private info shared.' : 'Let other buyers see your questions & the seller’s answers.'}</div>
        </div>
        <Toggle on={makePublic} onClick={() => { setMakePublic(v => !v); flashToast(makePublic ? 'Thread is private again' : 'Thread is now public · both of you must opt in'); }}/>
      </div>

      {/* listing context header — BRD §9.10 */}
      {l && (
        <button onClick={() => push({ name: 'listing', id: l.id })} style={{
          display: 'flex', alignItems: 'center', gap: 11, width: 'calc(100% - 28px)', margin: '12px 14px', cursor: 'pointer',
          background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 13, padding: 10, textAlign: 'left' }}>
          <div style={{ width: 44, height: 44, borderRadius: 9, overflow: 'hidden', flexShrink: 0 }}><ProductPhoto tone={catOf(l.sku).tone} ratio="1/1" rounded={9}/></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{catOf(l.sku).title}</div>
            <div style={{ fontSize: 13 }}><Money value={l.price}/> · <span style={{ color: 'var(--ink-faint)' }}>{l.condition.split('·')[0]}</span></div>
          </div>
          <VerifyBadge tier={l.verify}/>
        </button>
      )}

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
        {dealState === 'confirmed' && (
          <div style={{ alignSelf: 'center', background: 'var(--bone-deep)', color: 'var(--ink-mute)', fontSize: 11.5, padding: '4px 12px', borderRadius: 999, margin: '6px 0' }}>
            Deal completed · recorded on both profiles
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-faint)', padding: '0 32px 12px', lineHeight: 1.5 }}>
        First time trading with @{u.handle}? Deals complete off-platform — check trust signals & ask for an in-hand video.
      </div>
    </Screen>
  );
}

const dealBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 44,
  borderRadius: 12, border: '1px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)',
  cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
};

Object.assign(window, { InboxView, ChatView });
