/* Logo maker: a logo from your letters. Six styles, nine letter styles, three shapes, a border, colours that follow your brand.
   Settings handling is pure (Node tests); draw() returns a canvas in a browser. */
(function (root) {
  const L = {};
  const TM = () => root.TitleMaker || (typeof require !== 'undefined' ? require('./titlemaker.js') : null);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, Number.isFinite(+v) ? +v : a));
  const hex = (v, d) => (/^#[0-9a-fA-F]{6}$/.test(String(v || '')) ? String(v).toLowerCase() : d);
  const pick = (v, list, d) => (list.includes(v) ? v : d);
  const mix = (h, to, k) => { const a = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), b = [1, 3, 5].map((i) => parseInt(to.slice(i, i + 2), 16)); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  L.mix = mix;
  L.STYLES = ['solid', 'gradient', 'ring', 'duo', 'soft', 'badge'];
  L.SHAPES = ['circle', 'rounded', 'square'];
  L.FONTS = ['bold', 'heavy', 'round', 'slim', 'serif', 'elegant', 'classic', 'script', 'mono'];
  L.LIMITS = { size: [40, 120], lift: [-20, 20], spacing: [0, 30], ringw: [2, 16] };

  L.defaults = (text, brand) => { const b = hex(brand, '#741b47'); return { v: 1, text: String(text || 'B').toUpperCase().replace(/[^A-Za-z0-9]/g, '').slice(0, 3) || 'B', style: 'solid', shape: 'circle', font: 'bold', size: 100, lift: 0, spacing: 0, bg: b, bg2: mix(b, '#000000', 0.35), fg: '#ffffff', ring: { on: false, width: 6, col: '#ffffff' } }; };
  L.norm = (c, text, brand) => {
    const d = L.defaults(text, brand); c = c && typeof c === 'object' ? c : {}; const r = c.ring || {};
    return { v: 1, text: (c.text == null ? d.text : String(c.text).toUpperCase().replace(/[^A-Za-z0-9]/g, '').slice(0, 3)) || d.text, style: pick(c.style, L.STYLES, d.style), shape: pick(c.shape, L.SHAPES, d.shape), font: pick(c.font, L.FONTS, d.font),
      size: clamp(c.size == null ? d.size : c.size, ...L.LIMITS.size), lift: clamp(c.lift == null ? d.lift : c.lift, ...L.LIMITS.lift), spacing: clamp(c.spacing == null ? d.spacing : c.spacing, ...L.LIMITS.spacing),
      bg: hex(c.bg, d.bg), bg2: hex(c.bg2, d.bg2), fg: hex(c.fg, d.fg), ring: { on: !!r.on, width: clamp(r.width == null ? d.ring.width : r.width, ...L.LIMITS.ringw), col: hex(r.col, d.ring.col) } };
  };
  // A style's own colours from one brand colour (letters, second colour)
  L.recolor = (cfg, brand) => { const b = hex(brand, cfg.bg); cfg = L.norm(cfg); cfg.bg = b; cfg.bg2 = mix(b, '#000000', 0.35); cfg.fg = '#ffffff'; if (cfg.style === 'ring') { cfg.bg2 = '#ffffff'; cfg.fg = b; } if (cfg.style === 'soft') { cfg.bg2 = mix(b, '#ffffff', 0.86); cfg.fg = b; } return L.norm(cfg); };
  L.getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  L.setPath = (o, p, v) => { const ks = p.split('.'), last = ks.pop(), t = ks.reduce((a, k) => (a[k] = a[k] || {}), o); t[last] = v; return o; };
  L.same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  L.draw = (cfg, S) => {
    if (typeof document === 'undefined') return null;
    const c = L.norm(cfg), cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
    const path = (inset) => { const a = inset, w = S - inset * 2; g.beginPath(); if (c.shape === 'circle') g.arc(S / 2, S / 2, w / 2, 0, Math.PI * 2); else if (c.shape === 'rounded') { const r = w * 0.24; g.moveTo(a + r, a); g.arcTo(a + w, a, a + w, a + w, r); g.arcTo(a + w, a + w, a, a + w, r); g.arcTo(a, a + w, a, a, r); g.arcTo(a, a, a + w, a, r); g.closePath(); } else g.rect(a, a, w, w); };
    let letter = c.fg;
    g.save(); path(0); g.clip();
    if (c.style === 'gradient') { const gr = g.createLinearGradient(0, 0, S, S); gr.addColorStop(0, c.bg); gr.addColorStop(1, c.bg2); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
    else if (c.style === 'duo') { g.fillStyle = c.bg; g.fillRect(0, 0, S, S); g.fillStyle = c.bg2; g.beginPath(); g.moveTo(S, 0); g.lineTo(S, S); g.lineTo(0, S); g.closePath(); g.fill(); }
    else if (c.style === 'ring') { g.fillStyle = c.bg2; g.fillRect(0, 0, S, S); }
    else if (c.style === 'soft') { g.fillStyle = c.bg2; g.fillRect(0, 0, S, S); }
    else { g.fillStyle = c.bg; g.fillRect(0, 0, S, S); }
    g.restore();
    if (c.style === 'ring') { const w = S * 0.07; g.save(); g.strokeStyle = c.bg; g.lineWidth = w; path(w / 2); g.stroke(); g.restore(); }
    if (c.style === 'badge') { const w = S * 0.022; g.save(); g.strokeStyle = c.fg; g.lineWidth = w; g.globalAlpha = 0.9; path(S * 0.07); g.stroke(); g.restore(); }
    if (c.ring.on) { const w = S * c.ring.width / 100; g.save(); g.strokeStyle = c.ring.col; g.lineWidth = w; path(w / 2); g.stroke(); g.restore(); }
    const n = Math.max(1, c.text.length), fs = Math.round(S * (n === 1 ? 0.56 : n === 2 ? 0.44 : 0.34) * c.size / 100), tm = TM(), f = (tm && tm.FONTS[c.font]) || '700 {s}px Arial';
    g.fillStyle = letter; g.textBaseline = 'middle'; g.font = f.replace('{s}', fs); g.textAlign = 'left';
    const sp = fs * c.spacing / 100; let w = 0; for (const ch of c.text) w += g.measureText(ch).width + sp; w -= sp; let x = S / 2 - w / 2; const y = S / 2 + fs * 0.04 - S * c.lift / 100;
    for (const ch of c.text) { g.fillText(ch, x, y); x += g.measureText(ch).width + sp; }
    return cv;
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = L; else root.LogoMaker = L;
})(typeof window !== 'undefined' ? window : globalThis);
