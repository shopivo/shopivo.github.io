/* My orders: orders the owner takes herself (regulars who ask her to get things, sales agreed on WhatsApp). Pure logic on the app state, so Node tests can drive it.
   An order holds rows: a real item from a batch (reserved for the customer until it is handed over) or a typed item that is linked to a batch item later.
   Where an order is: ordered (something is still on its way) -> arrived (every item is here) -> handed (given over, money still owing) -> done (paid in full, or cancelled).
   Deposits are kept on the order. Handing over makes the real invoice (the items are sold that day, dated that day, and the deposits are what was paid). */
(function (root) {
  const MO = {};
  const Lg = () => root.Logic || require('./logic.js');
  const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const num = (v) => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(n) ? n : 0; };
  const fail = (code) => { const e = new Error(code); e.code = code; return e; };
  const newId = () => 'mo' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

  MO.list = (s) => (s.myOrders || (s.myOrders = []));
  MO.byId = (s, id) => MO.list(s).find((o) => o.id === id) || null;
  MO.nextCode = (s) => 'M-' + String(Math.max(0, ...MO.list(s).map((o) => parseInt(String(o.code || '').replace(/\D/g, ''), 10) || 0)) + 1).padStart(3, '0');
  MO.itemOf = (s, row) => (row && row.itemId ? s.items.find((i) => i.id === row.itemId) || null : null);
  MO.reservedBy = (s, item) => (item && item.reservedFor ? MO.byId(s, item.reservedFor) : null);

  // One row: ordered (typed, or its item is still in transit), arrived (its item is here), handed (given over).
  MO.rowState = (s, o, row) => { if (o.handedAt) return 'handed'; const it = MO.itemOf(s, row); return !it || it.status === 'In Transit' ? 'ordered' : 'arrived'; };
  MO.total = (o) => r2((o.rows || []).reduce((n, r) => n + num(r.price), 0));
  MO.deposits = (o) => r2((o.payments || []).reduce((n, p) => n + num(p.amount), 0));
  MO.pay = (s, o) => { if (o.handedAt && o.invoice) { const p = Lg().orderPay(s, o.invoice); if (p) return { total: p.total, paid: p.paid, owing: p.owing }; } const t = MO.total(o), d = MO.deposits(o); return { total: t, paid: d, owing: r2(Math.max(0, t - d)) }; };
  MO.stage = (s, o) => {
    if (o.cancelledAt) return 'done';
    if (o.handedAt) return MO.pay(s, o).owing > 0 ? 'handed' : 'done';
    return (o.rows || []).length && o.rows.every((r) => MO.rowState(s, o, r) === 'arrived') ? 'arrived' : 'ordered';
  };
  MO.counts = (s) => { const c = { ordered: 0, arrived: 0, handed: 0, done: 0 }; MO.list(s).forEach((o) => { c[MO.stage(s, o)]++; }); return c; };

  const reserve = (s, o, item) => { const by = MO.reservedBy(s, item); if ((item.reservedFor && item.reservedFor !== o.id) && by && !by.cancelledAt && !by.handedAt) throw fail('reserved'); if (Lg().isSold(item)) throw fail('itemSold'); item.reservedFor = o.id; };
  const release = (s, o) => { (o.rows || []).forEach((r) => { const it = MO.itemOf(s, r); if (it && it.reservedFor === o.id) delete it.reservedFor; }); };

  // d: { client, phone, option, place, note, tag, rows: [{ itemId, desc, price }], deposit, date }
  MO.create = (s, d) => {
    const client = Lg().cleanName(d.client || ''); if (!client) throw fail('moNoClient');
    if (!String(d.phone || '').replace(/\D/g, '')) throw fail('moNoPhone');
    if (!(d.rows || []).length) throw fail('moNoRows');
    const o = { id: newId(), code: MO.nextCode(s), client, phone: String(d.phone).trim(), option: d.option === 'pickup' ? 'pickup' : 'delivery', place: String(d.place || '').trim(), note: String(d.note || '').trim(), tag: d.tag === 'wa' ? 'wa' : 'pre', createdAt: (d.date || new Date()).toISOString(), rows: [], payments: [], invoice: '', handedAt: '' };
    try {
    (d.rows || []).forEach((r) => {
      if (r.itemId) { const it = s.items.find((i) => i.id === r.itemId); if (!it) throw fail('moNoItem'); reserve(s, o, it); const price = num(r.price) > 0 ? num(r.price) : Lg().effectivePrice(it); if (!(price > 0)) throw fail('noPrice'); o.rows.push({ itemId: it.id, desc: it.desc || r.desc || '', price: r2(price) }); }
      else { if (!String(r.desc || '').trim()) throw fail('noDesc'); if (!(num(r.price) > 0)) throw fail('noPrice'); o.rows.push({ itemId: '', desc: String(r.desc).trim(), price: r2(num(r.price)) }); }
    });
    if (num(d.deposit) > 0) { if (num(d.deposit) > MO.total(o) + 0.005) throw fail('moTooMuch'); o.payments.push({ at: o.createdAt, amount: r2(num(d.deposit)) }); }
    } catch (e) { release(s, o); throw e; }   // all or nothing: a failed order keeps nothing reserved
    MO.list(s).push(o); s.myOrdersUsed = true; return o;   // myOrdersUsed: once there were orders, an empty list is still sent to the cloud
  };
  MO.link = (s, id, idx, itemId) => { const o = MO.byId(s, id), r = o && o.rows[idx], it = s.items.find((i) => i.id === itemId); if (!o || !r || !it) throw fail('moNoItem'); if (o.handedAt) throw fail('moHanded'); reserve(s, o, it); const old = MO.itemOf(s, r); if (old && old.reservedFor === o.id) delete old.reservedFor; r.itemId = it.id; if (!r.desc) r.desc = it.desc; return o; };
  MO.removeRow = (s, id, idx) => { const o = MO.byId(s, id); if (!o || o.handedAt) throw fail('moHanded'); if (o.rows.length < 2) throw fail('moLastRow'); const r = o.rows[idx], it = MO.itemOf(s, r); if (it && it.reservedFor === o.id) delete it.reservedFor; o.rows.splice(idx, 1); return o; };
  MO.setPrice = (s, id, idx, price) => { const o = MO.byId(s, id); if (!o || o.handedAt) throw fail('moHanded'); if (!(num(price) > 0)) throw fail('noPrice'); o.rows[idx].price = r2(num(price)); return o; };
  MO.addPayment = (s, id, amount, date) => { const o = MO.byId(s, id); if (!o || o.handedAt || o.cancelledAt) throw fail('moHanded'); const a = num(amount); if (!(a > 0)) throw fail('noPaying'); if (a > MO.pay(s, o).owing + 0.005) throw fail('moTooMuch'); o.payments.push({ at: (date || new Date()).toISOString(), amount: r2(a) }); return o; };
  MO.cancel = (s, id, date) => { const o = MO.byId(s, id); if (!o || o.handedAt) throw fail('moHanded'); release(s, o); o.cancelledAt = (date || new Date()).toISOString(); return o; };
  MO.remove = (s, id) => { const o = MO.byId(s, id); if (!o) return; release(s, o); s.myOrders = MO.list(s).filter((x) => x.id !== id); };
  MO.canDelete = (s, o) => MO.stage(s, o) === 'done' && (!o.handedAt || !o.invoice ? true : false) || !!o.cancelledAt;

  // Handing over: the items are sold today at the order's prices; what was paid so far (deposits + now) is on the invoice. how: 'delivery' | 'pickup'.
  MO.handOver = (s, id, { how, paidNow, date }) => {
    const o = MO.byId(s, id); if (!o || o.cancelledAt) throw fail('moNoItem'); if (o.handedAt) throw fail('moHanded');
    if (MO.stage(s, o) !== 'arrived') throw fail('moNotArrived');
    const items = o.rows.map((r) => MO.itemOf(s, r)); items.forEach((it, n) => { it.price = o.rows[n].price; it.saleOn = false; it.discount = 0; });
    const total = MO.total(o), paying = r2(Math.min(total, MO.deposits(o) + Math.max(0, num(paidNow))));
    const inv = Lg().createInvoice(s, { itemIds: items.map((i) => i.id), client: o.client, paying, allowZero: true, date: date || new Date(), orderId: o.id });
    items.forEach((it) => { delete it.reservedFor; });
    o.invoice = inv.no; o.handedAt = (date || new Date()).toISOString(); o.how = how === 'pickup' ? 'pickup' : 'delivery';
    return inv;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = MO; else root.MyOrders = MO;
})(typeof window !== 'undefined' ? window : globalThis);
