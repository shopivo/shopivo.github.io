/* Brand Studio: ready invoice designs that follow one brand colour.
   A template = a header layout (where the logo, title, name and details sit) + a look recipe (soft, bold, clean) painted in the brand colour.
   Pure functions on the header settings, so Node tests can check them. */
(function (root) {
  const S = {};
  S.LAYOUTS = { A: 'logoLeft', C: 'logoRight', D: 'logoTitle', E: 'titleOnly' };
  S.NEEDS_TITLE = { D: true, E: true };   // these layouts show the title picture instead of the plain name
  S.LOOKS = ['soft', 'bold', 'clean'];
  // 11 designs: every layout in the looks that suit it
  S.TEMPLATES = [
    { id: 'soft-a', layout: 'A', look: 'soft' }, { id: 'soft-c', layout: 'C', look: 'soft' }, { id: 'soft-d', layout: 'D', look: 'soft' }, { id: 'soft-e', layout: 'E', look: 'soft' },
    { id: 'bold-a', layout: 'A', look: 'bold' }, { id: 'bold-c', layout: 'C', look: 'bold' }, { id: 'bold-d', layout: 'D', look: 'bold' }, { id: 'bold-e', layout: 'E', look: 'bold' },
    { id: 'clean-a', layout: 'A', look: 'clean' }, { id: 'clean-d', layout: 'D', look: 'clean' }, { id: 'clean-e', layout: 'E', look: 'clean' },
  ];
  S.byId = (id) => S.TEMPLATES.find((t) => t.id === id) || null;
  const HEX = /^#[0-9a-fA-F]{6}$/;
  S.hex = (v, d) => (HEX.test(String(v || '')) ? String(v).toLowerCase() : d || '#741b47');

  // The colours of one look for one brand colour. mix(a, to, k) moves colour a toward `to` by k.
  S.recipe = (look, color, mix) => {
    const c = S.hex(color);
    if (look === 'bold') return { bg: { type: 'gradient', grad: { mode: 'linear', angle: 14, cx: 0.5, cy: 0.5, r: 0.8, blend: 'smooth', stops: [{ c: mix(c, '#000000', 0.5), p: 0 }, { c: mix(c, '#000000', 0.22), p: 0.55 }, { c, p: 1 }] } }, ink: '#ffffff', title: mix(c, '#ffffff', 0.78), accent: c };
    if (look === 'clean') return { bg: { type: 'solid', solid: mix(c, '#ffffff', 0.93) }, ink: '#1b1420', title: c, accent: c };
    return { bg: { type: 'gradient', grad: { mode: 'radial', cx: 0.28, cy: 0.3, r: 0.85, angle: 100, blend: 'smooth', stops: [{ c: mix(c, '#ffffff', 0.92), p: 0 }, { c: mix(c, '#ffffff', 0.76), p: 0.45 }, { c: mix(c, '#ffffff', 0.52), p: 1 }] } }, ink: '#1b1420', title: mix(c, '#000000', 0.12), accent: mix(c, '#ffffff', 0.3) };   // soft
  };
  // Paint a look on header settings (the same fields a built-in preset changes).
  S.paint = (cfg, rec, IH) => {
    cfg = IH.norm(cfg); cfg.bg.type = rec.bg.type; if (rec.bg.grad) cfg.bg.grad = Object.assign({}, cfg.bg.grad, rec.bg.grad); if (rec.bg.solid) cfg.bg.solid = rec.bg.solid;
    cfg.items.name.color = rec.ink; cfg.items.lines.color = rec.ink; cfg.items.tagline.color = rec.ink; cfg.items.invoice.color = rec.title; cfg.accent = rec.accent;
    return IH.norm(cfg);
  };
  // The whole template on top of the current header settings (the pictures the owner added are kept).
  S.apply = (cfg, tplId, color, IH) => {
    const t = S.byId(tplId); if (!t) return IH.norm(cfg);
    return S.paint(IH.applyLayout(cfg, t.layout), S.recipe(t.look, color, IH.mix), IH);
  };
  // Colours worth offering as a brand colour (a fixed, tasteful set)
  S.SWATCHES = ['#741b47', '#b5179e', '#c62828', '#e8590c', '#c9892a', '#2e7d32', '#0b7285', '#1565c0', '#283593', '#6a1b9a', '#37474f', '#111111'];
  // The strongest colours of a small picture's pixels (data = RGBA array), skipping near-white, near-black and grey. Returns up to n hex colours.
  S.dominant = (data, n) => {
    const bins = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]; if (a < 128) continue;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 40 || mx > 245 || mx < 40) continue;
      const k = (r >> 5) + ',' + (g >> 5) + ',' + (b >> 5), e = bins[k] || (bins[k] = { n: 0, r: 0, g: 0, b: 0 }); e.n++; e.r += r; e.g += g; e.b += b;
    }
    const hx = (e) => '#' + [e.r, e.g, e.b].map((v) => Math.round(v / e.n).toString(16).padStart(2, '0')).join('');
    const out = []; Object.values(bins).sort((a, b) => b.n - a.n).forEach((e) => { const h = hx(e); if (out.length < (n || 4) && !out.some((o) => Math.abs(parseInt(o.slice(1, 3), 16) - parseInt(h.slice(1, 3), 16)) + Math.abs(parseInt(o.slice(3, 5), 16) - parseInt(h.slice(3, 5), 16)) + Math.abs(parseInt(o.slice(5, 7), 16) - parseInt(h.slice(5, 7), 16)) < 90)) out.push(h); });
    return out;
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S; else root.Studio = S;
})(typeof window !== 'undefined' ? window : globalThis);
