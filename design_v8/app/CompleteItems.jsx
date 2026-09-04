// ─────────────────────────────────────────────────────────────
// CompleteItems — batch-complete flow for quick-added items.
// Two fields per item (condition + price paid), Next advances. The whole point is
// that finishing 6 items takes under a minute; anything else belongs on the item page.
// ─────────────────────────────────────────────────────────────

const ciField = {
  width: '100%', boxSizing: 'border-box', height: 46, padding: '0 13px', borderRadius: 11,
  border: '1px solid var(--border-strong)', background: 'var(--paper)',
  fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 16, color: 'var(--ink)', outline: 'none',
};

// One item's two-field form — shared by the batch flow and the single-item sheet.
function CompleteItemFields({ item, cat, draft, setDraft }) {
  const isPo = item.status === 'preorder';
  const conds = conditionsFor(cat ? cat.cat : 'figures');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {!isPo && (
        <div>
          <SectionLabel>Condition</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>
            {conds.map(c => {
              const id = typeof c === 'string' ? c : c.id;
              const label = typeof c === 'string' ? c : c.label;
              const on = draft.cond === id;
              return (
                <button key={id} onClick={() => setDraft(d => ({ ...d, cond: id }))} style={{
                  padding: '9px 13px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  fontSize: 13, fontWeight: on ? 700 : 500, whiteSpace: 'nowrap',
                  border: `1px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
                  background: on ? 'var(--ink)' : 'var(--paper)', color: on ? 'var(--paper)' : 'var(--ink-mute)',
                }}>{label}</button>
              );
            })}
          </div>
          {(() => {
            const sel = conds.find(c => (typeof c === 'string' ? c : c.id) === draft.cond);
            return sel && sel.hint
              ? <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 7 }}>{sel.hint}</div>
              : null;
          })()}
        </div>
      )}
      {isPo && (
        <div>
          <SectionLabel>Expected release</SectionLabel>
          {/* Stored structurally so the pre-order calendar can bucket it — a free-text ETA
              looked fine here but was invisible to every other view. */}
          {/* 'day' precision shares the Month chip and keeps its day field, so opening the editor
             on an exact date can neither leave every chip unselected nor drop the day on save. */}
          <div style={{ display: 'flex', gap: 7, marginTop: 9, flexWrap: 'wrap' }}>
            {[['month', 'Month'], ['quarter', 'Quarter'], ['year', 'Year'], ['tbd', 'Not announced']].map(([id, label]) => {
              const prec = draft.etaPrecision || 'month';
              const on = id === 'month' ? (prec === 'month' || prec === 'day') : prec === id;
              return (
                <button key={id} onClick={() => setDraft(d => ({ ...d, etaPrecision: id === 'month' && d.etaDay ? 'day' : id }))} style={{
                  padding: '8px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  fontSize: 12.5, fontWeight: on ? 700 : 500, whiteSpace: 'nowrap',
                  border: `1px solid ${on ? 'var(--ink)' : 'var(--border-strong)'}`,
                  background: on ? 'var(--ink)' : 'var(--paper)', color: on ? 'var(--paper)' : 'var(--ink-mute)' }}>{label}</button>
              );
            })}
          </div>
          {(draft.etaPrecision || 'month') !== 'tbd' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
              {(() => { const p = draft.etaPrecision || 'month'; return (p === 'month' || p === 'day'); })() && (
                <select value={draft.etaMonth != null ? draft.etaMonth : ''} onChange={e => setDraft(d => ({ ...d, etaMonth: e.target.value === '' ? null : parseInt(e.target.value, 10) }))}
                  style={{ ...ciField, flex: 1, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15 }}>
                  <option value="">Month</option>
                  {MONTH_FULL.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              )}
              {(draft.etaPrecision || 'month') === 'quarter' && (
                <select value={draft.etaQuarter || ''} onChange={e => setDraft(d => ({ ...d, etaQuarter: e.target.value === '' ? null : parseInt(e.target.value, 10) }))}
                  style={{ ...ciField, flex: 1, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15 }}>
                  <option value="">Quarter</option>
                  {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                </select>
              )}
              <select value={draft.etaYear || ''} onChange={e => setDraft(d => ({ ...d, etaYear: e.target.value === '' ? null : parseInt(e.target.value, 10) }))}
                style={{ ...ciField, width: 110, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15 }}>
                <option value="">Year</option>
                {[2026, 2027, 2028, 2029].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
      )}      <div>
        <SectionLabel>{isPo ? 'Total price' : 'What you paid'}</SectionLabel>
        <div style={{ position: 'relative', marginTop: 9 }}>
          <span style={{ position: 'absolute', left: 13, top: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 16, color: 'var(--ink-faint)' }}>₹</span>
          <input value={draft.price || ''} inputMode="numeric"
            onChange={e => setDraft(d => ({ ...d, price: e.target.value.replace(/[^0-9]/g, '') }))}
            placeholder={cat ? String(cat.est) : '0'} style={{ ...ciField, paddingLeft: 30 }}/>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 6 }}>
          Only you ever see this — it powers your portfolio value.
        </div>
      </div>
      {/* Deposit is optional, but it's what makes "balance due" real on a pre-order. */}
      {isPo && (
        <div>
          <SectionLabel>Deposit paid <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--ink-faint)' }}>· optional</span></SectionLabel>
          <div style={{ position: 'relative', marginTop: 9 }}>
            <span style={{ position: 'absolute', left: 13, top: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 16, color: 'var(--ink-faint)' }}>₹</span>
            <input value={draft.deposit || ''} inputMode="numeric"
              onChange={e => setDraft(d => ({ ...d, deposit: e.target.value.replace(/[^0-9]/g, '') }))}
              placeholder="0" style={{ ...ciField, paddingLeft: 30 }}/>
          </div>
        </div>
      )}
    </div>
  );
}

function draftToPatch(item, draft) {
  const n = draft.price ? parseInt(draft.price, 10) : 0;
  if (item.status !== 'preorder') return { cond: draft.cond || '', value: n };
  const prec = draft.etaPrecision || 'month';
  const monthish = prec === 'month' || prec === 'day';
  return {
    etaPrecision: prec,
    etaMonth: monthish ? draft.etaMonth : null,
    // Keep an existing exact day rather than flattening it to the month on every save.
    etaDay: prec === 'day' ? (draft.etaDay != null ? draft.etaDay : null) : null,
    etaQuarter: prec === 'quarter' ? draft.etaQuarter : null,
    etaYear: prec === 'tbd' ? null : draft.etaYear,
    total: n, value: n,
    deposit: draft.deposit ? parseInt(draft.deposit, 10) : 0,
  };
}
// Seeds the form when editing an item that already has some details filled in.
function draftFromItem(item) {
  if (!item) return {};
  if (item.status !== 'preorder') return { cond: item.cond || '', price: item.value ? String(item.value) : '' };
  return {
    etaPrecision: item.etaPrecision || (item.etaDay != null ? 'day' : item.etaMonth != null ? 'month' : item.etaYear ? 'year' : 'month'),
    etaMonth: item.etaMonth != null ? item.etaMonth : null,
    etaDay: item.etaDay != null ? item.etaDay : null,
    etaQuarter: item.etaQuarter || null,
    etaYear: item.etaYear || null,
    price: (item.total || item.value) ? String(item.total || item.value) : '',
    deposit: item.deposit ? String(item.deposit) : '',
  };
}
function draftReady(item, draft) {
  const hasPrice = !!(draft.price && parseInt(draft.price, 10) > 0);
  if (item.status !== 'preorder') return !!draft.cond && hasPrice;
  const prec = draft.etaPrecision || 'month';
  const dateOk = prec === 'tbd' ? true
    : (prec === 'month' || prec === 'day') ? (draft.etaMonth != null && !!draft.etaYear)
    : prec === 'quarter' ? (!!draft.etaQuarter && !!draft.etaYear)
    : !!draft.etaYear;
  return dateOk && hasPrice;
}

function CompleteItemsView({ route }) {
  const { pop, flashToast } = useNav();
  const st = useAppState();
  const { saveItemInfo, updateListing, userListings } = st;
  // Snapshot the queue on mount — saving patches state, and we don't want the list
  // shrinking under the user's feet mid-flow. A single-item route is edit mode: that copy
  // is always included, whether or not it currently has gaps.
  const pick = (all) => route.itemId ? all.filter(i => i.id === route.itemId) : all.filter(i => itemGaps(i).length);
  const [queue] = React.useState(() => pick(resolveMyItems(st).filter(i => i.sku)));
  const [idx, setIdx] = React.useState(0);
  const [draft, setDraft] = React.useState(() => draftFromItem(pick(resolveMyItems(st).filter(i => i.sku))[0]));
  const [done, setDone] = React.useState(0);

  if (!queue.length) {
    return (
      <Screen nav={false} header={<DetailHeader title="Nothing to finish"/>}>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Ico d={Icons.check} size={30} style={{ color: 'var(--forest)' }}/>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, marginTop: 12 }}>Every item has its details</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', marginTop: 6, lineHeight: 1.5 }}>Your portfolio value is public and counting everything you own.</div>
          <div style={{ marginTop: 22 }}><Button variant="dark" size="block" onClick={pop}>Back to my collection</Button></div>
        </div>
      </Screen>
    );
  }

  const item = queue[Math.min(idx, queue.length - 1)];
  const c = catOf(item.sku);
  const last = idx >= queue.length - 1;
  const ready = draftReady(item, draft);

  const commit = () => {
    const patch = draftToPatch(item, draft);
    saveItemInfo(item.id, patch);
    // A listing carries its own condition. Correcting the item and leaving the market showing
    // the old grade is the kind of mismatch a buyer reads as dishonesty — so it moves with it.
    const live = patch.cond ? activeListingFor(item.sku, 'you', userListings, item.status, st) : null;
    const synced = !!(live && live.condition !== patch.cond);
    if (synced) updateListing(live.id, { condition: patch.cond });
    const n = done + 1;
    setDone(n);
    setDraft(draftFromItem(queue[idx + 1]));
    if (last) {
      flashToast(`${n} ${n === 1 ? 'item' : 'items'} completed`,
        synced ? `Your listing now says ${patch.cond} too` : `+${n * 20} XP · now counting toward your portfolio value`);
      setTimeout(() => pop(), 60);
    } else setIdx(i => i + 1);
  };

  return (
    <Screen nav={false}
      header={<DetailHeader title={route.itemId ? 'Item details' : 'Finish your items'} subtitle={route.itemId ? (c ? c.title : '') : `${idx + 1} of ${queue.length} · +20 XP each`}/>}
      footer={
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--paper)', padding: '12px 16px 30px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button variant="dark" size="block" disabled={!ready} onClick={commit}>
            {last ? 'Save & finish' : 'Save & next'}
          </Button>
          {!last && (
            <button onClick={() => { setDraft(draftFromItem(queue[idx + 1])); setIdx(i => i + 1); }} style={{
              height: 40, borderRadius: 11, border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5, color: 'var(--ink-faint)' }}>
              Skip this one
            </button>
          )}
        </div>
      }>
      {/* progress — the unfinished bar is the pull */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ height: 5, borderRadius: 3, background: 'var(--bone)', overflow: 'hidden' }}>
          <div style={{ width: `${(done / queue.length) * 100}%`, height: '100%', background: 'var(--forest)', borderRadius: 3, transition: 'width 240ms' }}/>
        </div>
      </div>

      <div style={{ padding: '16px 16px 28px' }}>
        {/* fixed catalogue card — what you're describing, not editable here */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--paper-soft)', border: '1px solid var(--border)', borderRadius: 14, padding: 12, marginBottom: 20 }}>
          <div style={{ width: 62, height: 62, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
            <ProductPhoto tone={c ? c.tone : 'ink'} ratio="1/1" rounded={0}/>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <Tag kind={item.status === 'preorder' ? 'po' : 'default'}>{statusLabel(item.status)}</Tag>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c ? c.title : item.sku}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>{c ? [c.brand, c.year].filter(Boolean).join(' · ') : ''}</div>
          </div>
        </div>

        <CompleteItemFields item={item} cat={c} draft={draft} setDraft={setDraft}/>
      </div>
    </Screen>
  );
}

Object.assign(window, { CompleteItemsView, CompleteItemFields, draftToPatch, draftReady, draftFromItem });
