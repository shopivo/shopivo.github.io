const assert = require('assert');
const L = require('../js/logic.js'), S = require('../js/summary.js');
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.011, `${a} != ${b}`);

// a small business: two batches (Jul and Aug 2026), invoices in Aug and Oct, one part-paid then paid
const s = L.defaultState(); s.settings.rates.USD = 7;
const b1 = L.createBatch(s, { store: 'SHEIN', count: 3, totalCost: 100, currency: 'USD', margin: 100, date: new Date(2026, 6, 10) });
const b2 = L.createBatch(s, { store: 'TEMU', count: 2, totalCost: 50, currency: 'USD', margin: 100, date: new Date(2026, 7, 5) });
s.items.forEach((i, n) => { i.cost = 30; i.desc = 'Dress ' + n; i.sold = 200; i.status = 'Available'; });
L.payClearing(s, b1.id, 60);
L.createInvoice(s, { itemIds: [s.items[0].id], client: 'Ann', paying: 200, date: new Date(2026, 7, 3, 10) });
L.createInvoice(s, { itemIds: [s.items[1].id], client: 'Bea', paying: 80, date: new Date(2026, 7, 3, 15) });
L.createInvoice(s, { itemIds: [s.items[2].id], client: 'Ann', paying: 200, date: new Date(2026, 9, 20) });
L.createInvoice(s, { itemIds: [s.items[3].id], client: 'Cy', paying: 0, allowZero: true, date: new Date(2026, 9, 21) });
const now = new Date(2026, 9, 25);

// years
assert.deepStrictEqual(S.years(s, now), [2026]);
// year view agrees with the older monthly summary
const old = L.monthlySummary(s, 2026), yr = S.year(s, 2026, now);
old.forEach((o, i) => { near(yr.months[i].sales, o.sales); near(yr.months[i].expense, o.expense); near(yr.months[i].profit, o.profit); });
near(yr.tot.sales, 480); assert.equal(yr.best.m, 7); assert.equal(yr.elapsed, 10); near(yr.avgMonth, 48); near(yr.projection, 576);
assert.equal(yr.top[0].client, 'Ann'); near(yr.top[0].paid, 400); assert.equal(yr.prev, null); assert.equal(yr.tot.n, 3);
assert.ok(yr.weekdays.reduce((a, x) => a + x, 0) === 480);
// a finished year has no projection
assert.equal(S.year(s, 2026, new Date(2027, 1, 1)).projection, null); assert.equal(S.year(s, 2026, new Date(2027, 1, 1)).elapsed, 12);

// month view: August
const m = S.month(s, 2026, 7);
near(m.sales, 280); assert.equal(m.days, 31); assert.equal(m.nSales, 2); assert.equal(m.activeDays, 1); assert.equal(m.bestDay.d, 3); near(m.cal[2].sales, 280); assert.equal(m.cal[2].n, 2);
assert.deepStrictEqual(m.paidList.map((x) => x.client), ['Ann', 'Bea']);
assert.deepStrictEqual(m.oweList.map((x) => x.client), ['Bea']); assert.ok(m.oweList[0].owing > 0); near(m.owingTotal, m.oweList[0].owing);
assert.equal(m.batches.length, 1); assert.equal(m.batches[0].store, 'TEMU'); near(m.expense, m.batches[0].total);
assert.equal(m.invoices.length, 2); assert.equal(m.firstWeekday, new Date(2026, 7, 1).getDay());
// July only has the first batch and its clearing
const jl = S.month(s, 2026, 6); near(jl.sales, 0); near(jl.expense, 100 * 7.175 + 60); assert.equal(jl.paidList.length, 0); assert.equal(jl.bestDay, null);
// October: Cy owes the whole price
const oc = S.month(s, 2026, 9); assert.deepStrictEqual(oc.oweList.map((x) => x.client), ['Cy']);
// an empty month and a cancelled invoice change nothing
const em = S.month(s, 2026, 0); near(em.sales, 0); assert.equal(em.invoices.length, 0);
console.log('summary tests passed');

// due markers on the calendar, and one day's events
(() => {
  const s2 = L.defaultState(); s2.settings.rates.USD = 7;
  L.createBatch(s2, { store: 'SHEIN', count: 3, totalCost: 100, currency: 'USD', margin: 100, date: new Date(2026, 9, 3) });
  s2.items.forEach((i, n) => { i.cost = 30; i.desc = 'D' + n; i.sold = 100; i.status = 'Available'; });
  const a = L.createInvoice(s2, { itemIds: [s2.items[0].id], client: 'Ann', paying: 40, date: new Date(2026, 9, 5, 9) });   // due 12 Oct
  L.recordPayment(s2, a.no, 20, new Date(2026, 9, 8, 9));
  const now = new Date(2026, 9, 10);
  const mo = S.month(s2, 2026, 9, now); assert.equal(mo.cal[11].due, 1); assert.equal(mo.cal[11].over, false);
  const later = S.month(s2, 2026, 9, new Date(2026, 9, 20)); assert.equal(later.cal[11].over, true);
  const d5 = S.day(s2, 2026, 9, 5, now); assert.equal(d5.sales.length, 1); assert.equal(d5.payments.length, 0); near(d5.paidTotal, 40); near(d5.creditTotal, d5.sales[0].balance);
  const d8 = S.day(s2, 2026, 9, 8, now); assert.equal(d8.sales.length, 0); assert.equal(d8.payments.length, 1); near(d8.payments[0].paid, 20);
  const d12 = S.day(s2, 2026, 9, 12, now); assert.equal(d12.due.length, 1); assert.equal(d12.due[0].client, 'Ann'); assert.equal(d12.due[0].overdue, false);
  assert.equal(S.day(s2, 2026, 9, 3, now).ordered.length, 1); assert.equal(S.day(s2, 2026, 9, 20, now).empty, true);
})();
