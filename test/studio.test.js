const assert = require('assert'); const S = require('../js/studio.js'); const IH = require('../js/invheader.js');
assert.strictEqual(S.TEMPLATES.length, 11); assert.ok(S.byId('bold-d')); assert.strictEqual(S.byId('nope'), null);
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
console.log('studio tests passed');
