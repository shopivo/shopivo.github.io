const assert = require('assert');
const L = require('../js/logic.js'); const MO = require('../js/myorders.js'); global.Logic = L;
const state = () => { const s = L.defaultState(); L.createBatch(s, { store: 'SHEIN', count: 4, currency: 'USD', totalCost: 40, margin: 100 }); s.items.forEach((x, n) => { x.desc = ['Blue swimsuit', 'Gold bracelet set', 'Black bra', 'Rose swimsuit'][n]; x.cost = 10; x.price = [320, 140, 100, 300][n]; x.size = 'M'; }); return s; };
const fails = (fn, code) => { try { fn(); } catch (e) { assert.strictEqual(e.code, code, 'expected ' + code + ' got ' + (e.code || e.message)); return; } assert.fail('expected ' + code); };
let s = state(); const [a, b, c, d] = s.items;
// a new order reserves its items; a typed row waits for a batch item
let o = MO.create(s, { client: 'Monica hermana', phone: '1 868 555 0100', option: 'delivery', place: 'Arima', rows: [{ itemId: a.id }, { itemId: b.id, price: 130 }, { itemId: '', desc: 'Pink bag', price: 90 }], deposit: 100 });
assert.strictEqual(o.code, 'M-001'); assert.strictEqual(MO.total(o), 540); assert.strictEqual(MO.deposits(o), 100); assert.strictEqual(a.reservedFor, o.id); assert.strictEqual(o.rows[1].price, 130);
assert.strictEqual(MO.stage(s, o), 'ordered'); assert.deepStrictEqual(MO.counts(s), { ordered: 1, arrived: 0, handed: 0, done: 0 });
// reserved items cannot go to someone else (the invoice maker says so too)
fails(() => MO.create(s, { client: 'Keisha', phone: '555 1111', rows: [{ itemId: a.id }] }), 'reserved');
fails(() => L.createInvoice(s, { itemIds: [a.id], client: 'Keisha', paying: 10, allowZero: true }), 'reserved');
assert.ok(L.previewInvoice(s, { itemIds: [a.id], client: 'Keisha', paying: 10 }).errors.includes('reserved'));
// phone, rows and prices are required; a deposit cannot be more than the total
fails(() => MO.create(s, { client: 'X', phone: '', rows: [{ itemId: c.id }] }), 'moNoPhone'); fails(() => MO.create(s, { client: 'X', phone: '5551', rows: [] }), 'moNoRows'); fails(() => MO.create(s, { client: 'X', phone: '5551', rows: [{ itemId: c.id }], deposit: 999 }), 'moTooMuch'); fails(() => MO.create(s, { client: 'X', phone: '5551', rows: [{ itemId: '', desc: 'Hat', price: 0 }] }), 'noPrice');
assert.strictEqual(c.reservedFor, undefined, 'a failed order reserves nothing, not even half');
// link the typed row to a batch item
MO.link(s, o.id, 2, c.id); assert.strictEqual(c.reservedFor, o.id); assert.strictEqual(o.rows[2].itemId, c.id);
// still in transit: ordered. Make the batch available: arrived by itself.
assert.strictEqual(MO.stage(s, o), 'ordered'); L.makeAvailable(s, s.batches[0].id); assert.strictEqual(MO.stage(s, o), 'arrived'); assert.strictEqual(MO.counts(s).arrived, 1);
// payments before hand over
MO.addPayment(s, o.id, 50); assert.strictEqual(MO.pay(s, o).owing, 390); fails(() => MO.addPayment(s, o.id, 9999), 'moTooMuch');
// hand over: a real invoice, items sold at the order's prices, reservations gone, deposits on the invoice
const inv = MO.handOver(s, o.id, { how: 'delivery', paidNow: 100 });
assert.strictEqual(inv.total, 540); assert.strictEqual(inv.balance, 290); assert.strictEqual(o.invoice, inv.no); assert.ok(o.handedAt); assert.strictEqual(a.reservedFor, undefined); assert.strictEqual(b.price, 130);
assert.strictEqual(MO.stage(s, o), 'handed'); assert.strictEqual(MO.pay(s, o).owing, 290);
fails(() => MO.handOver(s, o.id, { how: 'pickup' }), 'moHanded');
// later payments go through the normal invoice flow and the order follows
L.recordPayment(s, inv.no, 290, new Date()); assert.strictEqual(MO.stage(s, o), 'done'); assert.strictEqual(MO.pay(s, o).owing, 0);
// not arrived: cannot hand over. Cancel releases the items.
s = state(); const [a2, b2] = s.items; const o2 = MO.create(s, { client: 'Keisha', phone: '5552', rows: [{ itemId: a2.id }, { itemId: b2.id }] });
fails(() => MO.handOver(s, o2.id, { how: 'pickup' }), 'moNotArrived'); MO.cancel(s, o2.id, 'refund'); assert.strictEqual(a2.reservedFor, undefined); assert.strictEqual(MO.stage(s, o2), 'done'); assert.doesNotThrow(() => L.previewInvoice(s, { itemIds: [a2.id], client: 'Z', paying: 1 }));
// remove a row (not the last), set a price, delete an order
s = state(); const o3 = MO.create(s, { client: 'Oscarly', phone: '5553', rows: [{ itemId: s.items[0].id }, { itemId: s.items[1].id }] }); MO.removeRow(s, o3.id, 1); assert.strictEqual(s.items[1].reservedFor, undefined); fails(() => MO.removeRow(s, o3.id, 0), 'moLastRow'); MO.setPrice(s, o3.id, 0, 310); assert.strictEqual(MO.total(o3), 310);
MO.remove(s, o3.id); assert.strictEqual(MO.list(s).length, 0); assert.strictEqual(s.items[0].reservedFor, undefined);
// an item deleted from the batch leaves the row waiting (ordered), nothing crashes
s = state(); const o4 = MO.create(s, { client: 'A', phone: '5554', rows: [{ itemId: s.items[0].id }] }); s.items.length = 0; assert.strictEqual(MO.stage(s, o4), 'ordered');
// sync: the orders travel as one small document and come back
const Sync = require('../js/sync.js'); s = state(); MO.create(s, { client: 'Sync', phone: '5555', rows: [{ itemId: s.items[0].id }] }); const docs = Sync.docs(s); assert.ok(docs.meta.myorders); const t = L.defaultState(); Sync.apply(t, 'meta', 'myorders', docs.meta.myorders); assert.strictEqual(t.myOrders.length, 1); assert.strictEqual(t.myOrders[0].client, 'Sync');
assert.deepStrictEqual(Sync.clearData(t).myOrders, []);

// ---- step 2
// delivery fee is part of the order total; pickup has none
s = state(); let w = MO.create(s, { client: 'Wa', phone: '5556', option: 'delivery', fee: 30, rows: [{ itemId: s.items[0].id }] }); assert.strictEqual(MO.total(w), 350); w.option = 'pickup'; assert.strictEqual(MO.total(w), 320); w.option = 'delivery';
// the order invoice: a real number, outside the invoice log, and the same number comes back at hand over
const noBefore = L.nextInvoiceNo(s); const pre = MO.makePre(s, w.id); assert.strictEqual(pre.no, noBefore); assert.strictEqual(s.invoices.length, 0); assert.strictEqual(MO.makePre(s, w.id).no, noBefore, 'making it twice keeps the same number'); assert.notStrictEqual(L.nextInvoiceNo(s), noBefore, 'nobody else gets that number');
let pv = MO.preInvoice(s, w); assert.ok(pv.pre && pv.dueOn === 'delivery' && pv.total === 350 && pv.balance === 350 && pv.lines.length === 1 && pv.delivery === 30);
assert.strictEqual(MO.preState(s, w), 'unsent'); MO.preSent(s, w); assert.strictEqual(MO.preState(s, w), 'sent'); MO.setPrice(s, w.id, 0, 300); assert.strictEqual(MO.preState(s, w), 'changed', 'a changed order needs the invoice sent again');
assert.strictEqual(MO.preByNo(s, noBefore).id, w.id);
L.makeAvailable(s, s.batches[0].id); const inv2 = MO.handOver(s, w.id, { how: 'delivery', paidNow: 330 }); assert.strictEqual(inv2.no, noBefore); assert.strictEqual(inv2.delivery, 30); assert.strictEqual(inv2.total, 330); assert.strictEqual(inv2.balance, 0); assert.strictEqual(MO.preByNo(s, noBefore), null, 'once handed over it is a real invoice');
// split: what is here becomes the order you hand over, the late items wait in a new order, a big deposit moves with them
s = state(); const [x1, x2, x3] = s.items; x1.status = 'Available'; const sp = MO.create(s, { client: 'Sp', phone: '5557', rows: [{ itemId: x1.id }, { itemId: x2.id }, { itemId: x3.id }], deposit: 400 });
assert.strictEqual(MO.stage(s, sp), 'ordered'); const late = MO.split(s, sp.id); assert.strictEqual(MO.stage(s, sp), 'arrived'); assert.strictEqual(sp.rows.length, 1); assert.strictEqual(late.rows.length, 2); assert.strictEqual(x2.reservedFor, late.id); assert.strictEqual(MO.deposits(sp), 320, 'only what the order costs stays'); assert.strictEqual(MO.deposits(late), 80); assert.strictEqual(late.splitFrom, sp.id); fails(() => MO.split(s, sp.id), 'moNothingToSplit');
// cancel: refund, or keep as credit that the next order can use
s = state(); const c1 = MO.create(s, { client: 'Cr', phone: '5558', rows: [{ itemId: s.items[0].id }], deposit: 100 }); MO.cancel(s, c1.id, 'credit'); assert.strictEqual(MO.credit(s, 'Cr'), 100); assert.strictEqual(c1.depositTo, 'credit');
const c2 = MO.create(s, { client: 'Cr', phone: '5558', rows: [{ itemId: s.items[0].id }], useCredit: 70 }); assert.strictEqual(MO.deposits(c2), 70); assert.strictEqual(MO.credit(s, 'Cr'), 30); assert.strictEqual(c2.payments[0].credit, true);
const c3 = MO.create(s, { client: 'Rf', phone: '5559', rows: [{ itemId: s.items[1].id }], deposit: 50 }); MO.cancel(s, c3.id, 'refund'); assert.strictEqual(MO.credit(s, 'Rf'), 0); assert.strictEqual(c3.depositTo, 'refund');
// WhatsApp map links
assert.deepStrictEqual(MO.parsePin('https://maps.google.com/?q=10.5167,-61.4112&z=17'), { lat: 10.5167, lng: -61.4112 }); assert.deepStrictEqual(MO.parsePin('https://www.google.com/maps/place/Chaguanas/@10.5167,-61.4112,15z'), { lat: 10.5167, lng: -61.4112 }); assert.deepStrictEqual(MO.parsePin('geo:10.28,-61.467'), { lat: 10.28, lng: -61.467 }); assert.deepStrictEqual(MO.parsePin('10.28, -61.467'), { lat: 10.28, lng: -61.467 });
assert.deepStrictEqual(MO.parsePin('https://maps.app.goo.gl/AbCdEf123'), { short: true }); assert.strictEqual(MO.parsePin('hello'), null); assert.deepStrictEqual(MO.parsePin('https://x.com/?q=999.1,-61.4'), { short: true }, 'not a real place: ask for the map');
// credits travel with the orders
const Sy = require('../js/sync.js'); const cd = Sy.docs(s); const t2 = L.defaultState(); Sy.apply(t2, 'meta', 'myorders', cd.meta.myorders); assert.strictEqual(t2.myCredits.Cr, 30);
// one due-days setting for every invoice (7 unless changed)
{ const z = state(); assert.strictEqual(L.dueDays(z), 7); z.settings.dueDays = 14; const [x] = z.items; x.status = 'Available'; x.price = 50; const v = L.createInvoice(z, { itemIds: [x.id], client: 'Zed', paying: 0, allowZero: true, date: new Date('2026-01-01T12:00:00Z') }); assert.strictEqual(Math.round((new Date(v.due) - new Date(v.date)) / 864e5), 14); z.settings.dueDays = 0; assert.strictEqual(L.dueDays(z), 0); z.settings.dueDays = 'x'; assert.strictEqual(L.dueDays(z), 7); }
// bring in existing invoices: paid -> completed, owing -> handed over, from a batch still on its way -> ordered; nothing is sold twice
{
  const z = state(); const [i1, i2, i3, i4] = z.items; L.makeAvailable(z, z.batches[0].id);
  [i1, i2, i3, i4].forEach((x, n) => { x.status = 'Available'; x.price = 100 + n * 10; });
  const vPaid = L.createInvoice(z, { itemIds: [i1.id], client: 'Anna', paying: 100, date: new Date('2026-01-05') });
  const vOwe = L.createInvoice(z, { itemIds: [i2.id], client: 'Ben', paying: 40, date: new Date('2026-01-06') });
  const vPart = L.createInvoice(z, { itemIds: [i3.id], client: 'Cy', paying: 50, date: new Date('2026-01-07') }); L.recordPayment(z, vPart.no, 70, new Date('2026-01-08'));
  L.createBatch(z, { store: 'TEMU', count: 1, currency: 'USD', totalCost: 10, margin: 100 }); const far = z.items[z.items.length - 1]; far.desc = 'Far hat'; far.status = 'Available'; far.price = 70; far.status = 'In Transit';
  const vAway = L.createInvoice(z, { itemIds: [far.id], client: 'Di', paying: 70, date: new Date('2026-01-09') });
  const before = JSON.stringify([z.invoices, z.items]);
  const plan = MO.adoptPlan(z); assert.deepStrictEqual(plan.counts, { ordered: 1, arrived: 0, handed: 1, done: 2 }); assert.strictEqual(plan.count, 4);
  assert.strictEqual(JSON.stringify([z.invoices, z.items]), before, 'preview changes nothing'); assert.strictEqual(MO.list(z).length, 0);
  MO.adopt(z, { phoneOf: (n) => (n === 'Ben' ? '1 868 555 0101' : '') });
  assert.strictEqual(JSON.stringify([z.invoices, z.items]), before, 'invoices and items are not touched');
  assert.deepStrictEqual(MO.counts(z), { ordered: 1, arrived: 0, handed: 1, done: 2 });
  const ben = MO.list(z).find((o) => o.client === 'Ben'); assert.strictEqual(ben.phone, '1 868 555 0101'); assert.strictEqual(MO.pay(z, ben).owing, 70); assert.strictEqual(ben.invoice, vOwe.no);
  const cy = MO.list(z).find((o) => o.client === 'Cy'); assert.strictEqual(cy.invoice, vPart.no); assert.strictEqual(MO.stage(z, cy), 'done', 'later payments are counted with the first invoice');
  assert.strictEqual(MO.list(z).length, 4, 'one order per purchase, not per invoice');
  assert.deepStrictEqual(MO.adoptPlan(z).counts, { ordered: 0, arrived: 0, handed: 0, done: 0 }, 'run twice does not add twice');
  // the order sold from a batch on its way arrives with its batch, and handing over adds no invoice
  const di = MO.list(z).find((o) => o.client === 'Di'); assert.strictEqual(MO.stage(z, di), 'ordered'); fails(() => MO.cancel(z, di.id), 'moHanded'); fails(() => MO.setPrice(z, di.id, 0, 10), 'moHanded');
  L.makeAvailable(z, z.batches[1].id); assert.strictEqual(MO.stage(z, di), 'arrived'); const n0 = z.invoices.length; MO.handOver(z, di.id, { how: 'delivery', paidNow: 0 });
  assert.strictEqual(z.invoices.length, n0); assert.strictEqual(MO.stage(z, di), 'done'); assert.ok(di.handedAt);
  // paying the rest while handing over goes on the invoice
  const ben2 = MO.list(z).find((o) => o.client === 'Ben'); assert.strictEqual(MO.stage(z, ben2), 'handed'); L.recordPayment(z, ben2.invoice, 70, new Date()); assert.strictEqual(MO.stage(z, ben2), 'done');
  // undo removes only these orders
  assert.strictEqual(MO.undoAdopt(z), 4); assert.strictEqual(MO.list(z).length, 0);
  // invoices of online orders, and voided ones, are left out
  const y = state(); y.items.forEach((x) => { x.status = 'Available'; x.price = 50; }); const o1 = L.createInvoice(y, { itemIds: [y.items[0].id], client: 'W', paying: 50 }); L.createInvoice(y, { itemIds: [y.items[1].id], client: 'V', paying: 50 });
  const p2 = MO.adoptPlan(y, { skip: [o1.no] }); assert.strictEqual(p2.count, 1); assert.strictEqual(p2.online, 1);
}
console.log('myorders tests passed');
