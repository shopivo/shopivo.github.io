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
  MO.credit = (s, client) => r2(Math.max(0, num((s.myCredits || {})[client])));   // money a customer left with you from a cancelled order, to use on her next one
  MO.byId = (s, id) => MO.list(s).find((o) => o.id === id) || null;
  MO.nextCode = (s) => 'M-' + String(Math.max(0, ...MO.list(s).map((o) => parseInt(String(o.code || '').replace(/\D/g, ''), 10) || 0)) + 1).padStart(3, '0');
  MO.itemOf = (s, row) => (row && row.itemId ? s.items.find((i) => i.id === row.itemId) || null : null);
  MO.reservedBy = (s, item) => (item && item.reservedFor ? MO.byId(s, item.reservedFor) : null);

  // One row: ordered (typed, or its item is still in transit), arrived (its item is here), handed (given over).
  MO.rowState = (s, o, row) => { if (o.handedAt) return 'handed'; const it = MO.itemOf(s, row); return !it || it.status === 'In Transit' ? 'ordered' : 'arrived'; };
  MO.itemsTotal = (o) => r2((o.rows || []).reduce((n, r) => n + num(r.price), 0));
  MO.fee = (o) => (o.option === 'delivery' ? r2(Math.max(0, num(o.fee))) : 0);   // delivery fee (0 for pickup and for regulars with free delivery)
  MO.total = (o) => r2(MO.itemsTotal(o) + MO.fee(o));
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
    const o = { id: newId(), code: MO.nextCode(s), client, phone: String(d.phone).trim(), option: d.option === 'pickup' ? 'pickup' : 'delivery', place: String(d.place || '').trim(), note: String(d.note || '').trim(), tag: d.tag === 'wa' ? 'wa' : 'pre', fee: r2(Math.max(0, num(d.fee))), lat: Number.isFinite(+d.lat) && d.lat !== '' && d.lat != null ? +d.lat : null, lng: Number.isFinite(+d.lng) && d.lng !== '' && d.lng != null ? +d.lng : null, createdAt: (d.date || new Date()).toISOString(), rows: [], payments: [], invoice: '', handedAt: '' };
    try {
    (d.rows || []).forEach((r) => {
      if (r.itemId) { const it = s.items.find((i) => i.id === r.itemId); if (!it) throw fail('moNoItem'); reserve(s, o, it); const price = num(r.price) > 0 ? num(r.price) : Lg().effectivePrice(it); if (!(price > 0)) throw fail('noPrice'); o.rows.push({ itemId: it.id, desc: it.desc || r.desc || '', price: r2(price) }); }
      else { if (!String(r.desc || '').trim()) throw fail('noDesc'); if (!(num(r.price) > 0)) throw fail('noPrice'); o.rows.push({ itemId: '', desc: String(r.desc).trim(), price: r2(num(r.price)) }); }
    });
    if (num(d.useCredit) > 0) { const c = Math.min(num(d.useCredit), MO.credit(s, o.client), MO.total(o)); if (c > 0) { o.payments.push({ at: o.createdAt, amount: r2(c), credit: true }); (s.myCredits = s.myCredits || {})[o.client] = r2(MO.credit(s, o.client) - c); } }
    if (num(d.deposit) > 0) { if (num(d.deposit) + MO.deposits(o) > MO.total(o) + 0.005) throw fail('moTooMuch'); o.payments.push({ at: o.createdAt, amount: r2(num(d.deposit)) }); }
    } catch (e) { release(s, o); throw e; }   // all or nothing: a failed order keeps nothing reserved
    MO.list(s).push(o); s.myOrdersUsed = true; return o;   // myOrdersUsed: once there were orders, an empty list is still sent to the cloud
  };
  MO.link = (s, id, idx, itemId) => { const o = MO.byId(s, id), r = o && o.rows[idx], it = s.items.find((i) => i.id === itemId); if (!o || !r || !it) throw fail('moNoItem'); if (o.handedAt) throw fail('moHanded'); reserve(s, o, it); const old = MO.itemOf(s, r); if (old && old.reservedFor === o.id) delete old.reservedFor; r.itemId = it.id; if (!r.desc) r.desc = it.desc; return o; };
  MO.removeRow = (s, id, idx) => { const o = MO.byId(s, id); if (!o || o.handedAt) throw fail('moHanded'); if (o.rows.length < 2) throw fail('moLastRow'); const r = o.rows[idx], it = MO.itemOf(s, r); if (it && it.reservedFor === o.id) delete it.reservedFor; o.rows.splice(idx, 1); return o; };
  MO.setFee = (s, id, fee) => { const o = MO.byId(s, id); if (!o || o.handedAt) throw fail('moHanded'); o.fee = r2(Math.max(0, num(fee))); return o; };
  MO.setPrice = (s, id, idx, price) => { const o = MO.byId(s, id); if (!o || o.handedAt) throw fail('moHanded'); if (!(num(price) > 0)) throw fail('noPrice'); o.rows[idx].price = r2(num(price)); return o; };
  MO.addPayment = (s, id, amount, date) => { const o = MO.byId(s, id); if (!o || o.handedAt || o.cancelledAt) throw fail('moHanded'); const a = num(amount); if (!(a > 0)) throw fail('noPaying'); if (a > MO.pay(s, o).owing + 0.005) throw fail('moTooMuch'); o.payments.push({ at: (date || new Date()).toISOString(), amount: r2(a) }); return o; };
  // what: 'refund' (the deposit goes back to her) or 'credit' (it stays with you as credit for her next order). Without a deposit it does not matter.
  MO.cancel = (s, id, what, date) => { const o = MO.byId(s, id); if (!o || o.handedAt) throw fail('moHanded'); const dep = MO.deposits(o); release(s, o); o.cancelledAt = (date || new Date()).toISOString();
    if (dep > 0) { if (what === 'credit') { (s.myCredits = s.myCredits || {})[o.client] = r2(MO.credit(s, o.client) + dep); o.depositTo = 'credit'; } else { o.depositTo = 'refund'; } }
    return o; };
  MO.remove = (s, id) => { const o = MO.byId(s, id); if (!o) return; release(s, o); s.myOrders = MO.list(s).filter((x) => x.id !== id); };
  MO.canDelete = (s, o) => MO.stage(s, o) === 'done' && (!o.handedAt || !o.invoice ? true : false) || !!o.cancelledAt;

  // Handing over: the items are sold today at the order's prices; what was paid so far (deposits + now) is on the invoice. how: 'delivery' | 'pickup'.
  MO.handOver = (s, id, { how, paidNow, date }) => {
    const o = MO.byId(s, id); if (!o || o.cancelledAt) throw fail('moNoItem'); if (o.handedAt) throw fail('moHanded');
    if (MO.stage(s, o) !== 'arrived') throw fail('moNotArrived');
    const items = o.rows.map((r) => MO.itemOf(s, r)); items.forEach((it, n) => { it.price = o.rows[n].price; it.saleOn = false; it.discount = 0; it.delivery = 0; }); if (MO.fee(o) > 0) items[0].delivery = MO.fee(o);
    const total = MO.total(o), paying = r2(Math.min(total, MO.deposits(o) + Math.max(0, num(paidNow))));
    const inv = Lg().createInvoice(s, { itemIds: items.map((i) => i.id), client: o.client, paying, allowZero: true, date: date || new Date(), orderId: o.id, no: o.pre && !s.invoices.some((v) => v.no === o.pre.no) ? o.pre.no : undefined });
    items.forEach((it) => { delete it.reservedFor; });
    o.invoice = inv.no; o.handedAt = (date || new Date()).toISOString(); o.how = how === 'pickup' ? 'pickup' : 'delivery';
    return inv;
  };


  // ---- the invoice you can send the moment you place the order. It has a real invoice number but it is NOT a sale yet: it lives on the order, outside the invoice log,
  // sales, profit and "owed". Handing over makes the real invoice with the same number.
  MO.makePre = (s, id, date) => { const o = MO.byId(s, id); if (!o || o.handedAt || o.cancelledAt) throw fail('moHanded'); if (o.pre) return o.pre; const n = parseInt(String(Lg().nextInvoiceNo(s)).replace(/\D/g, ''), 10); const no = Lg().nextInvoiceNo(s); s.settings = s.settings || {}; s.settings.invoiceSeq = Math.max(num(s.settings.invoiceSeq), n); o.pre = { no, date: (date || new Date()).toISOString() }; return o.pre; };
  MO.preInvoice = (s, o) => {
    if (!o || !o.pre) return null; const total = MO.total(o), paid = Math.min(total, MO.deposits(o)), fee = MO.fee(o);
    const due = new Date(o.pre.date); due.setDate(due.getDate() + Lg().dueDays(s));
    return { no: o.pre.no, client: o.client, desc: o.rows.map((r) => r.desc).join(', '), lines: o.rows.map((r) => ({ desc: r.desc, qty: 1, price: r.price })), total, amountPaid: paid, previouslyPaid: 0, balance: r2(total - paid), delivery: fee, date: o.pre.date, due: due.toISOString(), dueOn: 'delivery', pre: true, orderId: o.id, updatedBy: '', ref: '', sentAt: o.pre.sentAt || 0, qty: o.rows.length, profit: 0, loss: 0, tip: 0 };
  };
  MO.preByNo = (s, no) => MO.list(s).find((o) => o.pre && o.pre.no === no && !o.handedAt && !o.cancelledAt) || null;
  MO.preSig = (s, o) => JSON.stringify([o.rows.map((r) => [r.desc, r.price]), MO.fee(o), MO.deposits(o)]);
  MO.preSent = (s, o) => { if (o.pre) { o.pre.sentAt = Date.now(); o.pre.sentSig = MO.preSig(s, o); } };
  MO.preState = (s, o) => (!o.pre ? 'none' : !o.pre.sentAt ? 'unsent' : o.pre.sentSig === MO.preSig(s, o) ? 'sent' : 'changed');

  // One item is late: the items that are here become their own order (the one you hand over now), the late ones go to a new order that keeps waiting.
  MO.split = (s, id) => {
    const o = MO.byId(s, id); if (!o || o.handedAt || o.cancelledAt) throw fail('moHanded');
    const here = o.rows.filter((r) => MO.rowState(s, o, r) === 'arrived'), late = o.rows.filter((r) => MO.rowState(s, o, r) !== 'arrived'); if (!here.length || !late.length) throw fail('moNothingToSplit');
    const n = { id: newId(), code: MO.nextCode(s), client: o.client, phone: o.phone, option: o.option, place: o.place, note: o.note, tag: o.tag, fee: 0, lat: o.lat == null ? null : o.lat, lng: o.lng == null ? null : o.lng, createdAt: new Date().toISOString(), rows: late, payments: [], invoice: '', handedAt: '', splitFrom: o.id };
    o.rows = here; MO.list(s).push(n);
    late.forEach((r) => { const it = MO.itemOf(s, r); if (it && it.reservedFor === o.id) it.reservedFor = n.id; });
    const over = r2(Math.max(0, MO.deposits(o) - MO.total(o)));   // a deposit bigger than what is here moves with the late items
    if (over > 0) { let left = over; const keep = []; (o.payments || []).slice().reverse().forEach((p) => { if (left <= 0) { keep.unshift(p); return; } const take = Math.min(left, num(p.amount)); left = r2(left - take); if (take > 0) n.payments.push({ at: p.at, amount: r2(take), credit: p.credit }); if (num(p.amount) - take > 0.004) keep.unshift(Object.assign({}, p, { amount: r2(num(p.amount) - take) })); }); o.payments = keep; }
    s.myOrdersUsed = true; return n;
  };

  // A map link someone sent on WhatsApp -> { lat, lng }; { short: true } when it is a short link that only the internet can open; null when it is not a place.
  MO.parsePin = (text) => {
    let s = String(text || '').trim(); if (!s) return null; try { s = decodeURIComponent(s); } catch (e) { /* keep it as typed */ }
    const pats = [/[?&](?:q|ll|query|center|destination|daddr)=(-?\d{1,3}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)/i, /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/, /geo:(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/i, /^\s*(-?\d{1,3}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)\s*$/];
    for (const re of pats) { const m = s.match(re); if (m) { const lat = +m[1], lng = +m[2]; if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng }; } }
    return /^(https?:\/\/|maps\.app|goo\.gl)/i.test(s) ? { short: true } : null;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = MO; else root.MyOrders = MO;
})(typeof window !== 'undefined' ? window : globalThis);
