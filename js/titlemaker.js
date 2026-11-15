/* Title maker: the name picture used as the title on invoices (a big name, a line, a small line under it).
   Pure settings handling + one drawing function that returns a canvas, so Node tests can drive the settings part. */
(function (root) {
  const T = {};
  const clamp = (v, a, b) => Math.min(b, Math.max(a, Number.isFinite(+v) ? +v : a));
  const hex = (v, d) => (/^#[0-9a-fA-F]{6}$/.test(String(v || '')) ? String(v).toLowerCase() : d);
  const pick = (v, list, d) => (list.includes(v) ? v : d);

  // Fonts that exist on phones and computers without downloading anything. {s} is the size in pixels.
  T.FONTS = {
    bold: '800 {s}px Inter, Arial, sans-serif', heavy: '900 {s}px "Arial Black", Inter, Arial, sans-serif', round: '700 {s}px "Trebuchet MS", Inter, sans-serif',
    slim: '300 {s}px Inter, Arial, sans-serif', serif: 'italic 700 {s}px Georgia, Caladea, serif', elegant: '400 {s}px Georgia, "Times New Roman", serif',
    classic: '700 {s}px "Times New Roman", Times, serif', script: 'italic 400 {s}px "Brush Script MT", "Segoe Script", "Snell Roundhand", cursive', mono: '700 {s}px "Courier New", Courier, monospace',
  };
  T.FONT_KEYS = Object.keys(T.FONTS);
  T.LINES = ['solid', 'double', 'dotted', 'dashed'];
  T.DECOS = ['none', 'diamond', 'dot', 'star'];
  T.ALIGNS = ['left', 'center', 'right'];
  T.CASES = ['upper', 'asis'];
  T.LIMITS = { 'name.size': [90, 280], 'name.spacing': [0, 24], 'line.width': [2, 18], 'line.len': [20, 100], 'line.gap': [6, 60], 'sub.size': [24, 110], 'sub.spacing': [0, 70], 'sub.gap': [6, 70], pad: [0, 70] };

  T.defaults = (name, brand) => ({
    v: 1,
    name: { text: String(name || 'MY STORE').toUpperCase().slice(0, 24), font: 'bold', size: 200, spacing: 3, col: '#333333', case: 'upper' },
    line: { on: true, style: 'solid', width: 6, len: 100, gap: 22, col: hex(brand, '#741b47'), deco: 'none' },
    sub: { on: true, text: 'ONLINE STORE', font: 'bold', size: 54, spacing: 30, col: hex(brand, '#741b47'), case: 'upper', gap: 24 },
    align: 'center', pad: 20, bg: { on: false, col: '#ffffff' },
  });

  // Make any stored setting safe: every value is checked and kept inside its range.
  T.norm = (c, name, brand) => {
    const d = T.defaults(name, brand); c = c && typeof c === 'object' ? c : {}; const n = c.name || {}, l = c.line || {}, s = c.sub || {}, b = c.bg || {};
    const L = T.LIMITS;
    return {
      v: 1,
      name: { text: String(n.text == null ? d.name.text : n.text).slice(0, 24), font: pick(n.font, T.FONT_KEYS, d.name.font), size: clamp(n.size == null ? d.name.size : n.size, ...L['name.size']), spacing: clamp(n.spacing == null ? d.name.spacing : n.spacing, ...L['name.spacing']), col: hex(n.col, d.name.col), case: pick(n.case, T.CASES, d.name.case) },
      line: { on: l.on == null ? d.line.on : !!l.on, style: pick(l.style, T.LINES, d.line.style), width: clamp(l.width == null ? d.line.width : l.width, ...L['line.width']), len: clamp(l.len == null ? d.line.len : l.len, ...L['line.len']), gap: clamp(l.gap == null ? d.line.gap : l.gap, ...L['line.gap']), col: hex(l.col, d.line.col), deco: pick(l.deco, T.DECOS, d.line.deco) },
      sub: { on: s.on == null ? d.sub.on : !!s.on, text: String(s.text == null ? d.sub.text : s.text).slice(0, 30), font: pick(s.font, T.FONT_KEYS, d.sub.font), size: clamp(s.size == null ? d.sub.size : s.size, ...L['sub.size']), spacing: clamp(s.spacing == null ? d.sub.spacing : s.spacing, ...L['sub.spacing']), col: hex(s.col, d.sub.col), case: pick(s.case, T.CASES, d.sub.case), gap: clamp(s.gap == null ? d.sub.gap : s.gap, ...L['sub.gap']) },
      align: pick(c.align, T.ALIGNS, d.align), pad: clamp(c.pad == null ? d.pad : c.pad, ...L.pad), bg: { on: !!b.on, col: hex(b.col, d.bg.col) },
    };
  };
  T.getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  T.setPath = (o, p, v) => { const ks = p.split('.'), last = ks.pop(), t = ks.reduce((a, k) => (a[k] = a[k] || {}), o); t[last] = v; return o; };
  // true when the two settings make the same picture
  T.same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // Draw the title at its natural size and return the canvas (null without a document, e.g. in Node tests).
  T.draw = (cfg) => {
    if (typeof document === 'undefined') return null;
    const c = T.norm(cfg), g0 = document.createElement('canvas').getContext('2d');
    const txt = (o) => { const s = (o.text || '').trim(); return o.case === 'upper' ? s.toUpperCase() : s; };
    const name = txt(c.name) || ' ', sub = c.sub.on ? txt(c.sub) : '';
    const spaced = (g, s, sp) => { let w = 0; for (const ch of s) w += g.measureText(ch).width + sp; return w - sp; };
    const NS = c.name.size, SS = c.sub.size, nsp = NS * c.name.spacing / 100, ssp = SS * c.sub.spacing / 100;
    g0.font = T.FONTS[c.name.font].replace('{s}', NS); const nw = spaced(g0, name, nsp);
    g0.font = T.FONTS[c.sub.font].replace('{s}', SS); const sw = sub ? spaced(g0, sub, ssp) : 0;
    const bw = Math.max(nw, sw, 10), pad = c.pad, lw = c.line.on ? c.line.width : 0, deco = c.line.on && c.line.deco !== 'none' ? Math.max(14, lw * 3.2) : 0;
    const lineH = c.line.on ? (c.line.style === 'double' ? lw * 3 : Math.max(lw, deco)) : 0;
    const W = Math.ceil(bw + pad * 2 + 20), H = Math.ceil(pad * 2 + NS * 0.8 + (c.line.on ? c.line.gap + lineH : 0) + (sub ? c.sub.gap + SS * 0.8 : 0));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.textBaseline = 'alphabetic';
    if (c.bg.on) { g.fillStyle = c.bg.col; g.fillRect(0, 0, W, H); }
    const left = (W - bw) / 2, xFor = (w) => (c.align === 'left' ? left : c.align === 'right' ? left + bw - w : left + (bw - w) / 2);
    const draw = (s, x0, y, sp) => { let x = x0; g.textAlign = 'left'; for (const ch of s) { g.fillText(ch, x, y); x += g.measureText(ch).width + sp; } };
    let y = pad + NS * 0.78; g.fillStyle = c.name.col; g.font = T.FONTS[c.name.font].replace('{s}', NS); draw(name, xFor(nw), y, nsp);
    if (c.line.on) {
      y += c.line.gap; const len = bw * c.line.len / 100, x0 = xFor(len), mid = y + lineH / 2; g.fillStyle = g.strokeStyle = c.line.col;
      const bar = (a, b, yy, th) => {
        if (c.line.style === 'dotted') { const r = th / 2, step = th * 2.4; for (let x = a + r; x <= b - r + 0.1; x += step) { g.beginPath(); g.arc(x, yy + th / 2, r, 0, 7); g.fill(); } }
        else if (c.line.style === 'dashed') { const dl = th * 4, step = dl * 1.6; for (let x = a; x < b; x += step) g.fillRect(x, yy, Math.min(dl, b - x), th); }
        else g.fillRect(a, yy, b - a, th);
      };
      const lines = (a, b) => { if (c.line.style === 'double') { bar(a, b, mid - lw * 1.5, lw); bar(a, b, mid + lw * 0.5, lw); } else bar(a, b, mid - lw / 2, lw); };
      if (deco) { const hole = deco * 1.9, m = x0 + len / 2; lines(x0, Math.max(x0, m - hole)); lines(Math.min(x0 + len, m + hole), x0 + len); g.beginPath();
        if (c.line.deco === 'dot') g.arc(m, mid, deco / 2, 0, 7);
        else if (c.line.deco === 'diamond') { g.moveTo(m, mid - deco * 0.7); g.lineTo(m + deco * 0.7, mid); g.lineTo(m, mid + deco * 0.7); g.lineTo(m - deco * 0.7, mid); g.closePath(); }
        else { for (let i = 0; i < 10; i++) { const r = i % 2 ? deco * 0.32 : deco * 0.8, a = -Math.PI / 2 + i * Math.PI / 5; g[i ? 'lineTo' : 'moveTo'](m + Math.cos(a) * r, mid + Math.sin(a) * r); } g.closePath(); }
        g.fill();
      } else lines(x0, x0 + len);
      y += lineH;
    }
    if (sub) { y += c.sub.gap + SS * 0.72; g.fillStyle = c.sub.col; g.font = T.FONTS[c.sub.font].replace('{s}', SS); draw(sub, xFor(sw), y, ssp); }
    return cv;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = T; else root.TitleMaker = T;
})(typeof window !== 'undefined' ? window : globalThis);
