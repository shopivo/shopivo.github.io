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
fails(() => MO.handOver(s, o2.id, { how: 'pickup' }), 'moNotArrived'); MO.cancel(s, o2.id); assert.strictEqual(a2.reservedFor, undefined); assert.strictEqual(MO.stage(s, o2), 'done'); assert.doesNotThrow(() => L.previewInvoice(s, { itemIds: [a2.id], client: 'Z', paying: 1 }));
// remove a row (not the last), set a price, delete an order
s = state(); const o3 = MO.create(s, { client: 'Oscarly', phone: '5553', rows: [{ itemId: s.items[0].id }, { itemId: s.items[1].id }] }); MO.removeRow(s, o3.id, 1); assert.strictEqual(s.items[1].reservedFor, undefined); fails(() => MO.removeRow(s, o3.id, 0), 'moLastRow'); MO.setPrice(s, o3.id, 0, 310); assert.strictEqual(MO.total(o3), 310);
MO.remove(s, o3.id); assert.strictEqual(MO.list(s).length, 0); assert.strictEqual(s.items[0].reservedFor, undefined);
// an item deleted from the batch leaves the row waiting (ordered), nothing crashes
s = state(); const o4 = MO.create(s, { client: 'A', phone: '5554', rows: [{ itemId: s.items[0].id }] }); s.items.length = 0; assert.strictEqual(MO.stage(s, o4), 'ordered');
// sync: the orders travel as one small document and come back
const Sync = require('../js/sync.js'); s = state(); MO.create(s, { client: 'Sync', phone: '5555', rows: [{ itemId: s.items[0].id }] }); const docs = Sync.docs(s); assert.ok(docs.meta.myorders); const t = L.defaultState(); Sync.apply(t, 'meta', 'myorders', docs.meta.myorders); assert.strictEqual(t.myOrders.length, 1); assert.strictEqual(t.myOrders[0].client, 'Sync');
assert.deepStrictEqual(Sync.clearData(t).myOrders, []);
console.log('myorders tests passed');
