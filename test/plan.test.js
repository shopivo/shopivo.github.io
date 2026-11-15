const assert = require('assert');
const P = require('../js/plan.js');
const D = P.DAY, now = Date.UTC(2026, 10, 15);

// no plan record: never limited
assert.strictEqual(P.status(null, now).state, 'free'); assert.ok(P.canWrite(P.status(null, now)));

// a 30-day trial counts down, then read-only for 14 days, then locked
const trial = { plan: 'trial', trialEnds: P.trialEnd(now) };
assert.strictEqual(trial.trialEnds, now + 30 * D);
let s = P.status(trial, now); assert.strictEqual(s.state, 'trial'); assert.strictEqual(s.daysLeft, 30); assert.ok(P.canWrite(s) && !P.needsNote(s));
s = P.status(trial, now + 24 * D); assert.strictEqual(s.daysLeft, 6); assert.ok(P.needsNote(s), 'last 7 days get a reminder');
s = P.status(trial, now + 31 * D); assert.strictEqual(s.state, 'readonly'); assert.strictEqual(s.graceLeft, 13); assert.ok(!P.canWrite(s) && P.canOpen(s) && P.needsNote(s));
s = P.status(trial, now + 43 * D); assert.strictEqual(s.state, 'readonly'); assert.strictEqual(s.graceLeft, 1);
s = P.status(trial, now + 44 * D); assert.strictEqual(s.state, 'locked'); assert.ok(!P.canWrite(s) && !P.canOpen(s));

// paid plans work the same way from paidUntil; no end date is a gift
const paid = { plan: 'store', paidUntil: { seconds: Math.floor((now + 10 * D) / 1000) } };
assert.strictEqual(P.status(paid, now).state, 'active'); assert.strictEqual(P.status(paid, now).daysLeft, 10);
assert.strictEqual(P.status(paid, now + 11 * D).state, 'readonly');
assert.strictEqual(P.status({ plan: 'team' }, now).state, 'active');
assert.strictEqual(P.status({ plan: 'trial' }, now).state, 'locked', 'a trial with no end date is not trusted');

// locking by hand beats the dates; Firestore timestamps and dates are understood
assert.strictEqual(P.status({ plan: 'store', paidUntil: now + 99 * D, locked: true }, now).state, 'locked');
assert.strictEqual(P.ms(new Date(5)), 5); assert.strictEqual(P.ms({ toMillis: () => 7 }), 7); assert.strictEqual(P.ms('nope'), null);

// paying early never loses days; month-ends are kept sensible
assert.strictEqual(new Date(P.extend(now + 10 * D, now, 1)).getTime(), new Date(Date.UTC(2026, 11, 25)).getTime());
assert.strictEqual(new Date(P.extend(null, Date.UTC(2026, 0, 31), 1)).toISOString().slice(0, 10), '2026-02-28');
assert.strictEqual(new Date(P.extend(now - 40 * D, now, 12)).toISOString().slice(0, 10), '2027-11-15', 'an old end date starts from today');
// payment helpers
assert.strictEqual(P.ref('aB3-dE9fgh12345'), 'AB3DE9'); assert.strictEqual(P.ref(''), ''); assert.strictEqual(P.ref(null), '');
assert.strictEqual(P.safeLink(' https://pay.example.com/x?a=1 '), 'https://pay.example.com/x?a=1');
assert.strictEqual(P.safeLink('http://pay.example.com'), '', 'only secure links'); assert.strictEqual(P.safeLink('javascript:alert(1)'), ''); assert.strictEqual(P.safeLink('https://a b'), '');
assert.strictEqual(P.waDigits('+1 (868) 555-0100'), '18685550100');
console.log('plan tests passed');
