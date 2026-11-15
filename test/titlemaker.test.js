const assert = require('assert'); const T = require('../js/titlemaker.js');
// defaults: the name in capitals, a line and a small line under it, in the brand colour
const d = T.defaults('b-ruiz', '#741b47'); assert.strictEqual(d.name.text, 'B-RUIZ'); assert.strictEqual(d.line.col, '#741b47'); assert.strictEqual(d.sub.text, 'ONLINE STORE');
// norm keeps every value inside its range and falls back for bad ones
const n = T.norm({ name: { size: 9999, font: 'nope', col: 'red', spacing: -5 }, line: { style: 'wavy', width: 1, len: 500 }, sub: { size: 1 }, align: 'up', pad: 999 }, 'x', '#123456');
assert.strictEqual(n.name.size, 280); assert.strictEqual(n.name.font, 'bold'); assert.strictEqual(n.name.col, '#333333'); assert.strictEqual(n.name.spacing, 0);
assert.strictEqual(n.line.style, 'solid'); assert.strictEqual(n.line.width, 2); assert.strictEqual(n.line.len, 100); assert.strictEqual(n.sub.size, 24); assert.strictEqual(n.align, 'center'); assert.strictEqual(n.pad, 70);
// nothing stored: the defaults come back
assert.ok(T.same(T.norm(undefined, 'My Shop', '#741b47'), T.defaults('My Shop', '#741b47')));
// norm is idempotent, and every font / line / mark option is accepted
const all = T.norm({ name: { font: 'script' }, line: { style: 'dotted', deco: 'star' }, bg: { on: true, col: '#ffffff' } }); assert.ok(T.same(T.norm(all), all));
T.FONT_KEYS.forEach((k) => assert.strictEqual(T.norm({ name: { font: k } }).name.font, k)); T.LINES.forEach((k) => assert.strictEqual(T.norm({ line: { style: k } }).line.style, k)); T.DECOS.forEach((k) => assert.strictEqual(T.norm({ line: { deco: k } }).line.deco, k));
// getPath / setPath
const c = T.defaults('a'); T.setPath(c, 'line.width', 9); assert.strictEqual(T.getPath(c, 'line.width'), 9); assert.strictEqual(T.draw(c), null, 'no canvas in Node');
console.log('titlemaker tests passed');
