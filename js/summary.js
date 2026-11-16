/* Summary numbers: everything the Summary pages show, worked out from the saved data. Pure functions (no screen), so Node tests can check them.
   Sales = what was paid on invoices dated in the period. Expenses = what a batch cost (goods x rate + clearing), counted in the month it was ordered.
   Profit = the profit the invoices recorded. These are the same rules the older Summary used, so the figures agree with it. */
(function (root) {
  const S = {};
  const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100, num = (v) => Number(v) || 0;
  const live = (v) => !v.void;   // a cancelled invoice counts for nothing
  const expOf = (b) => num(b.totalCost) * num(b.rate) + num(b.clearingPaid);
  const dt = (d) => { const x = new Date(d); return Number.isNaN(+x) ? null : x; };
  S.expOf = expOf;

  // Years that have anything in them, newest first (the current year is always there).
  S.years = (s, now) => {
    const ys = new Set([(now || new Date()).getFullYear()]);
    s.invoices.forEach((v) => { const d = dt(v.date); if (d) ys.add(d.getFullYear()); });
    s.batches.forEach((b) => { const d = dt(b.datePurchased); if (d) ys.add(d.getFullYear()); });
    return [...ys].sort((a, b) => b - a);
  };

  const blank = () => ({ sales: 0, expense: 0, profit: 0, tips: 0, n: 0, clients: new Set() });
  S.yearTotals = (s, y) => {
    const m = Array.from({ length: 12 }, (_, i) => Object.assign(blank(), { m: i }));
    s.batches.forEach((b) => { const d = dt(b.datePurchased); if (d && d.getFullYear() === y) m[d.getMonth()].expense += expOf(b); });
    s.invoices.filter(live).forEach((v) => {
      const d = dt(v.date); if (!d || d.getFullYear() !== y) return; const x = m[d.getMonth()];
      x.sales += num(v.amountPaid); x.profit += num(v.profit) + num(v.loss); x.tips += num(v.tip);
      if (num(v.amountPaid) > 0) { x.n++; x.clients.add(v.client); }
    });
    return m.map((x) => ({ m: x.m, sales: r2(x.sales), expense: r2(x.expense), profit: r2(x.profit), tips: r2(x.tips), n: x.n, buyers: x.clients.size }));
  };

  // The whole-year view: 12 months, totals, how it compares with the year before, and the highlights.
  S.year = (s, y, now) => {
    now = now || new Date();
    const months = S.yearTotals(s, y), sum = (k) => r2(months.reduce((a, x) => a + x[k], 0));
    const tot = { sales: sum('sales'), expense: sum('expense'), profit: sum('profit'), tips: sum('tips'), n: months.reduce((a, x) => a + x.n, 0) };
    const prevM = S.yearTotals(s, y - 1), prev = { sales: r2(prevM.reduce((a, x) => a + x.sales, 0)), expense: r2(prevM.reduce((a, x) => a + x.expense, 0)), profit: r2(prevM.reduce((a, x) => a + x.profit, 0)) };
    const hasPrev = prev.sales > 0 || prev.expense > 0;
    const elapsed = y === now.getFullYear() ? now.getMonth() + 1 : y < now.getFullYear() ? 12 : 0;   // months that have started
    const active = months.filter((x) => x.sales > 0);
    const best = active.length ? active.reduce((a, x) => (x.sales > a.sales ? x : a)) : null;
    const avgMonth = elapsed ? r2(tot.sales / elapsed) : 0;
    const projection = y === now.getFullYear() && elapsed ? r2(tot.sales / elapsed * 12) : null;
    // who paid the most this year, and which weekday sells best
    const by = {}, wk = [0, 0, 0, 0, 0, 0, 0];
    s.invoices.filter(live).forEach((v) => { const d = dt(v.date); if (!d || d.getFullYear() !== y || !(num(v.amountPaid) > 0)) return; by[v.client] = (by[v.client] || 0) + num(v.amountPaid); wk[d.getDay()] += num(v.amountPaid); });
    const top = Object.keys(by).map((c) => ({ client: c, paid: r2(by[c]) })).filter((x) => x.client).sort((a, b) => b.paid - a.paid).slice(0, 5);
    return { y, months, tot, prev: hasPrev ? prev : null, best, avgMonth, projection, elapsed, top, weekdays: wk.map(r2), avgSale: tot.n ? r2(tot.sales / tot.n) : 0 };
  };

  // One month: money, a day-by-day calendar, who paid, who still owes, the invoices and the batches ordered.
  S.month = (s, y, m) => {
    const days = new Date(y, m + 1, 0).getDate(), cal = Array.from({ length: days }, (_, i) => ({ d: i + 1, sales: 0, n: 0 }));
    const inM = (d) => d && d.getFullYear() === y && d.getMonth() === m;
    const invs = []; let sales = 0, profit = 0, tips = 0;
    s.invoices.filter(live).forEach((v) => {
      const d = dt(v.date); if (!inM(d)) return;
      const paid = r2(v.amountPaid); sales += paid; profit += num(v.profit) + num(v.loss); tips += num(v.tip);
      if (paid > 0) { cal[d.getDate() - 1].sales += paid; cal[d.getDate() - 1].n++; }
      invs.push({ no: v.no, client: v.client, date: d, day: d.getDate(), paid, total: r2(v.total), balance: r2(v.balance), latest: !v.updatedBy });
    });
    invs.sort((a, b) => b.date - a.date || (b.no > a.no ? 1 : -1));
    const paidBy = {}, oweBy = {};
    invs.forEach((v) => { if (v.paid > 0) { const p = paidBy[v.client] || (paidBy[v.client] = { client: v.client, paid: 0, n: 0 }); p.paid += v.paid; p.n++; } if (v.latest && v.balance > 0.004) { const o = oweBy[v.client] || (oweBy[v.client] = { client: v.client, owing: 0, n: 0 }); o.owing += v.balance; o.n++; } });
    const batches = s.batches.filter((b) => inM(dt(b.datePurchased))).map((b) => ({ id: b.id, store: b.store, count: b.count, cost: r2(expOf(b) - num(b.clearingPaid)), clearing: r2(b.clearingPaid), total: r2(expOf(b)), date: dt(b.datePurchased) })).sort((a, b) => b.date - a.date);
    const expense = r2(batches.reduce((a, b) => a + b.total, 0));
    const sold = cal.filter((c) => c.sales > 0), bestDay = sold.length ? sold.reduce((a, c) => (c.sales > a.sales ? c : a)) : null;
    const paidList = Object.values(paidBy).map((x) => ({ client: x.client, paid: r2(x.paid), n: x.n })).sort((a, b) => b.paid - a.paid);
    const oweList = Object.values(oweBy).map((x) => ({ client: x.client, owing: r2(x.owing), n: x.n })).sort((a, b) => b.owing - a.owing);
    return { y, m, days, firstWeekday: new Date(y, m, 1).getDay(), cal: cal.map((c) => ({ d: c.d, sales: r2(c.sales), n: c.n })), sales: r2(sales), expense, profit: r2(profit), tips: r2(tips), nSales: paidList.reduce((a, x) => a + x.n, 0), avgSale: paidList.length ? r2(sales / paidList.reduce((a, x) => a + x.n, 0)) : 0, bestDay, invoices: invs, paidList, oweList, owingTotal: r2(oweList.reduce((a, x) => a + x.owing, 0)), batches, activeDays: sold.length };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S; else root.Summary = S;
})(typeof window !== 'undefined' ? window : globalThis);
