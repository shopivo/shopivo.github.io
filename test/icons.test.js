const assert=require('assert'); const I=require('../js/icons.js');
I.emojis().forEach((e)=>assert.ok(I.svg(I.nameOf(e)),'icon for '+e));
assert.strictEqual(I.lead('📦 New batch').rest,'New batch'); assert.strictEqual(I.lead('📦 New batch').name,'box'); assert.strictEqual(I.lead('No icon here'),null); assert.strictEqual(I.lead('🦄 unknown'),null); assert.strictEqual(I.lead('⚠️ Careful').name,'alert'); assert.strictEqual(I.lead('✓ done'),null);
console.log('icons tests passed');
