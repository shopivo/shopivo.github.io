/* Plans for people who rent the app: a 30-day free trial, then a paid-until date set by the person who runs the app.
   When the date passes, the account is read-only for 14 days (everything can be seen and downloaded, nothing can be changed),
   then it is locked until it is paid. A business with no plan record (the owner's own, or one made before plans existed) is never limited.
   Pure rules, tested in Node. */
(function (root) {
  const DAY = 864e5, TRIAL_DAYS = 30, GRACE_DAYS = 14, PLANS = ['starter', 'store', 'team'];
  const ms = (v) => {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return v;
    if (v instanceof Date) return v.getTime();
    if (typeof v.toMillis === 'function') return v.toMillis();
    if (typeof v.seconds === 'number') return v.seconds * 1000;
    const n = Date.parse(v); return Number.isNaN(n) ? null : n;
  };
  // { state: free | trial | active | readonly | locked, daysLeft, graceLeft, until }
  function status(doc, now) {
    now = now == null ? Date.now() : now;
    if (!doc) return { state: 'free' };
    if (doc.locked === true) return { state: 'locked', locked: true };
    const trial = doc.plan === 'trial', until = trial ? ms(doc.trialEnds) : ms(doc.paidUntil);
    if (until == null) return trial ? { state: 'locked' } : { state: 'active', plan: doc.plan };   // a paid plan with no end date is a gift with no end
    const base = { plan: doc.plan, until };
    if (now < until) return Object.assign(base, { state: trial ? 'trial' : 'active', daysLeft: Math.ceil((until - now) / DAY) });
    if (now < until + GRACE_DAYS * DAY) return Object.assign(base, { state: 'readonly', graceLeft: Math.ceil((until + GRACE_DAYS * DAY - now) / DAY) });
    return Object.assign(base, { state: 'locked' });
  }
  const canWrite = (st) => !!st && (st.state === 'free' || st.state === 'trial' || st.state === 'active');
  const canOpen = (st) => !!st && st.state !== 'locked';
  // when to remind: the last 7 days of a trial or paid period, and everything after it ends
  const needsNote = (st) => !!st && ((st.state === 'trial' || st.state === 'active') && st.daysLeft != null && st.daysLeft <= 7 || st.state === 'readonly' || st.state === 'locked');
  const trialEnd = (now) => (now == null ? Date.now() : now) + TRIAL_DAYS * DAY;
  // add whole months to the later of now and the current end date (so paying early never loses days)
  function extend(currentEnd, now, months) {
    now = now == null ? Date.now() : now; const base = new Date(Math.max(now, ms(currentEnd) || 0)); const d = new Date(base.getTime());
    const day = d.getUTCDate(); d.setUTCMonth(d.getUTCMonth() + months); if (d.getUTCDate() < day) d.setUTCDate(0);
    return d.getTime();
  }
  const api = { DAY, TRIAL_DAYS, GRACE_DAYS, PLANS, ms, status, canWrite, canOpen, needsNote, trialEnd, extend };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Plan = api;
})(typeof window !== 'undefined' ? window : globalThis);
