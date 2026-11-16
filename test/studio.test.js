const assert = require('assert'); const S = require('../js/studio.js'); const IH = require('../js/invheader.js');
assert.strictEqual(S.TEMPLATES.length, 17); assert.ok(S.byId('bold-d')); assert.strictEqual(S.byId('nope'), null);
// every template makes valid header settings in any brand colour, and keeps what the owner added
['#741b47', '#1565c0', '#111111', '#ffffff'].forEach((col) => S.TEMPLATES.forEach((t) => {
  const base = IH.defaults(); base.slots.title = 'pic1'; const c = S.apply(base, t.id, col, IH);
  assert.strictEqual(c.layout, t.layout); assert.ok(/^#[0-9a-f]{6}$/i.test(c.accent)); assert.ok(IH.norm(c).bg.type); assert.strictEqual(c.slots.title, 'pic1');
  assert.ok(IH.colours(c).head, 'invoice table colour');
}));
// looks differ: bold is dark with white text, clean is a light solid
const b = S.apply(IH.defaults(), 'bold-a', '#741b47', IH), cl = S.apply(IH.defaults(), 'clean-a', '#741b47', IH), so = S.apply(IH.defaults(), 'soft-a', '#741b47', IH);
assert.strictEqual(b.items.name.color, '#ffffff'); assert.strictEqual(cl.bg.type, 'solid'); assert.ok(IH.lum(cl.bg.solid) > 200); assert.strictEqual(so.bg.type, 'gradient'); assert.strictEqual(S.hex('bad', '#123456'), '#123456');
// dominant colours: red wins over white and grey
const px = []; for (let i = 0; i < 60; i++) px.push(200, 20, 30, 255); for (let i = 0; i < 100; i++) px.push(255, 255, 255, 255); for (let i = 0; i < 40; i++) px.push(128, 128, 128, 255); for (let i = 0; i < 30; i++) px.push(20, 40, 200, 255);
const d = S.dominant(px, 3); assert.strictEqual(d.length, 2); assert.ok(d[0].startsWith('#c8')); assert.ok(d[1].startsWith('#14'));
// Promote pictures and the business card follow the brand colour
const ps = S.promoStyle('soft', '#741b47', IH.mix), pb = S.promoStyle('bold', '#741b47', IH.mix), pc = S.promoStyle('clean', '#741b47', IH.mix);
assert.ok(IH.lum(ps.head[0]) > 200 && ps.ink === '#1b1420'); assert.strictEqual(pb.head[0], '#741b47'); assert.strictEqual(pb.ink, '#ffffff'); assert.strictEqual(pc.head[0], pc.head[1]);
const cc = S.cardColors('#1565c0', IH.mix); assert.ok(IH.lum(cc.dark) < IH.lum(cc.light)); assert.ok(/^#[0-9a-f]{6}$/.test(cc.dark));
// the two-colour look turns the hue; mono ignores the brand colour
assert.notStrictEqual(S.hueShift('#741b47', 38), '#741b47'); assert.strictEqual(S.hueShift('#741b47', 360), '#741b47'); assert.ok(/^#[0-9a-f]{6}$/.test(S.hueShift('#1565c0', 90))); assert.strictEqual(S.hueShift('#777777', 90), '#777777');
const du = S.apply(IH.defaults(), 'duo-a', '#741b47', IH), mo = S.apply(IH.defaults(), 'mono-a', '#741b47', IH), mo2 = S.apply(IH.defaults(), 'mono-a', '#1565c0', IH);
assert.strictEqual(du.bg.type, 'gradient'); assert.notStrictEqual(du.bg.grad.stops[0].c, du.bg.grad.stops[2].c); assert.strictEqual(mo.bg.solid, '#ffffff'); assert.strictEqual(mo.accent, mo2.accent);
console.log('studio tests passed');
