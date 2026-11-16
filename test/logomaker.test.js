const assert = require('assert'); const L = require('../js/logomaker.js'); const T = require('../js/titlemaker.js');
const d = L.defaults('br-ui z', '#741b47'); assert.strictEqual(d.text, 'BRU'); assert.strictEqual(d.bg, '#741b47'); assert.strictEqual(d.fg, '#ffffff'); assert.strictEqual(L.defaults('', '#111111').text, 'B');
const n = L.norm({ text: 'ab-c!d', style: 'wavy', shape: 'hex', font: 'nope', size: 999, lift: -99, spacing: 99, bg: 'red', ring: { on: 1, width: 0, col: 'x' } }, 'x', '#123456');
assert.strictEqual(n.text, 'ABC'); assert.strictEqual(n.style, 'solid'); assert.strictEqual(n.shape, 'circle'); assert.strictEqual(n.font, 'bold'); assert.strictEqual(n.size, 120); assert.strictEqual(n.lift, -20); assert.strictEqual(n.spacing, 30); assert.strictEqual(n.bg, '#123456'); assert.strictEqual(n.ring.on, true); assert.strictEqual(n.ring.width, 2);
assert.ok(L.same(L.norm(undefined, 'My', '#741b47'), L.defaults('My', '#741b47')));
// every style, shape and font is accepted; norm is idempotent
L.STYLES.forEach((s) => assert.strictEqual(L.norm({ style: s }).style, s)); L.SHAPES.forEach((s) => assert.strictEqual(L.norm({ shape: s }).shape, s)); L.FONTS.forEach((f) => { assert.strictEqual(L.norm({ font: f }).font, f); assert.ok(T.FONT_KEYS.includes(f), 'font exists in the title maker: ' + f); });
const a = L.norm({ style: 'gradient', ring: { on: true } }); assert.ok(L.same(L.norm(a), a));
// recolor follows the brand colour per style
const r = L.recolor(L.norm({ style: 'ring' }), '#1565c0'); assert.strictEqual(r.bg, '#1565c0'); assert.strictEqual(r.fg, '#1565c0'); assert.strictEqual(r.bg2, '#ffffff'); assert.strictEqual(L.recolor(L.norm({ style: 'solid' }), '#1565c0').fg, '#ffffff');
const p = L.defaults('A'); L.setPath(p, 'ring.width', 9); assert.strictEqual(L.getPath(p, 'ring.width'), 9); assert.strictEqual(L.draw(p, 64), null);
console.log('logomaker tests passed');
