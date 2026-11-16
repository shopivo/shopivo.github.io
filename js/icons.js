/* Icons: clean line icons that replace the emoji at the start of buttons, rows and headings (one look everywhere).
   The app keeps writing emoji in its text; this watches the screen and swaps a known emoji for its icon. Unknown emoji are left as they are. */
(function (root) {
  const I = {};
  const P = {
    pin: '<path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.8C19 14.8 12 21 12 21z"/><circle cx="12" cy="10" r="2.4"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
    bag: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    receipt: '<path d="M6 3h12v18l-2.5-1.6L13 21l-2.5-1.6L8 21l-2-1.4V3z"/><path d="M9 8h6M9 12h6"/>',
    eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z"/>',
    store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M5 12v8h14v-8"/>',
    save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    checkc: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 16V5M7 9.5l5-5 5 5M5 20h14"/>',
    message: '<path d="M4 5h16v11H9l-5 4V5z"/>',
    box: '<path d="M12 3l8.5 4.5v9L12 21l-8.5-4.5v-9L12 3z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/>',
    users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3 3 0 0 1 0 6M18.5 20a5.5 5.5 0 0 0-3-4.9"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.3 0 2-.8 2-1.8 0-1.2-1-1.4-1-2.5 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.8 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2.5"/><path d="M9 4.5h6v3H9zM9 12h6M9 16h4"/>',
    note: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    cart: '<path d="M3 4h3l2.4 11h9.6l2-8H7"/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 10 18.7l1-1"/>',
    ruler: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    camera: '<path d="M4 8h3.5l1.5-2.5h6L16.5 8H20v11H4z"/><circle cx="12" cy="13" r="3.3"/>',
    gift: '<path d="M4 9h16v4H4zM5 13v8h14v-8M12 9v12"/><path d="M12 9S9 9 8 7.5 9 4.5 10.5 5.5 12 9 12 9zM12 9s3 0 4-1.5-1-3-2.5-2S12 9 12 9z"/>',
    type: '<path d="M5 6V4.5h14V6M12 4.5V20M9 20h6"/>',
    megaphone: '<path d="M4 10v4h3l8 4V6L7 10H4z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
    clip: '<path d="M20 11l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.5 16.7a1.7 1.7 0 0 1-2.4-2.4L14.5 7"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    out: '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
    inbox: '<path d="M4 13l2.5-8h11L20 13v6H4v-6zM4 13h5l1 2h4l1-2h5"/>',
    bolt: '<path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z"/>',
    building: '<path d="M5 21V4h9v17M14 9h5v12M3 21h18M8 8h3M8 12h3M8 16h3"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-3"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 8v3h18v-3a2 2 0 0 1 0-8V5H3v3z"/><path d="M14 6v2M14 11v2M14 16v2"/>',
    refresh: '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3M18 3v4h-4M6 21v-4h4"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 2 .8A3 3 0 0 1 14 4h6v15h-6a2 2 0 0 0-2 1.3A2 2 0 0 0 10 19H4V4z"/><path d="M12 5v15"/>',
    wallet: '<path d="M4 7a2 2 0 0 1 2-2h12v4"/><path d="M4 7v11a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14.5" r="1.2"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    trend: '<path d="M3 17l6-6 4 4 7-8M15 7h5v5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>',
    flower: '<circle cx="12" cy="12" r="2.3"/><path d="M12 9.7c-2-3-1-6 0-6s2 3 0 6zM14.3 12c3-2 6-1 6 0s-3 2-6 0zM12 14.3c2 3 1 6 0 6s-2-3 0-6zM9.7 12c-3 2-6 1-6 0s3-2 6 0z"/>',
    dollar: '<path d="M12 3v18M16.5 7.5C15.5 6 14 5.5 12 5.5c-2.3 0-4 1.2-4 3s1.5 2.6 4 3.2 4 1.2 4 3.2-1.8 3-4 3c-2 0-3.8-.7-4.7-2.3"/>',
    shuffle: '<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/>',
    contact: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="9" cy="11" r="2.2"/><path d="M5.5 16.5a3.5 3.5 0 0 1 7 0M14.5 10h4M14.5 14h3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    bank: '<path d="M3 10l9-6 9 6zM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    id: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M6 16a3 3 0 0 1 6 0M14.5 10h4M14.5 13h3"/>',
    alert: '<path d="M12 4l9 16H3L12 4z"/><path d="M12 10v4.5M12 17.5v.01"/>',
  };
  // emoji (without the variation mark) -> icon name
  const M = { '📍': 'pin', '💳': 'card', '🛍': 'bag', '🚚': 'truck', '🛵': 'truck', '🧾': 'receipt', '👁': 'eye', '⏳': 'clock', '🕘': 'clock', '🔒': 'lock', '🔏': 'lock', '📤': 'send', '🏪': 'store', '💾': 'save', '✅': 'checkc',
    '✏': 'edit', '📞': 'phone', '✨': 'sparkles', '🎉': 'sparkles', '⬇': 'download', '📥': 'inbox', '⬆': 'upload', '💬': 'message', '📦': 'box', '🖼': 'image', '👥': 'users', '👤': 'user', '🧭': 'compass', '🎨': 'palette', '📅': 'calendar',
    '⚙': 'sliders', '📋': 'clipboard', '📝': 'note', '🛒': 'cart', '🔗': 'link', '📏': 'ruler', '🏷': 'tag', '🔖': 'bookmark', '📷': 'camera', '🎁': 'gift', '🔤': 'type', '🗣': 'megaphone', '🔑': 'key', '📎': 'clip', '🗺': 'map',
    '💡': 'bulb', '🚪': 'out', '⚡': 'bolt', '🏢': 'building', '📊': 'chart', '📈': 'trend', '🎟': 'ticket', '🔄': 'refresh', '📖': 'book', '💰': 'wallet', '🌐': 'globe', '📄': 'file', '🌸': 'flower', '💲': 'dollar', '🔀': 'shuffle',
    '📇': 'contact', '🔍': 'search', '🏦': 'bank', '🛡': 'shield', '💧': 'drop', '🪪': 'id', '⚠': 'alert', '📲': 'send', '📱': 'phone' };
  const key = (s) => String(s).replace(/️/g, '');
  I.has = (e) => !!M[key(e)];
  I.svg = (name) => (P[name] ? `<svg viewBox="0 0 24 24" aria-hidden="true">${P[name]}</svg>` : '');
  I.nameOf = (e) => M[key(e)] || '';
  I.names = () => Object.keys(P);
  I.emojis = () => Object.keys(M);
  // the leading emoji of a string, when it is one we have an icon for
  const LEAD = /^(\s*)((?:[\u{1F300}-\u{1FAFF}☀-➿⭐⏳]️?))(\s|$)/u;
  I.lead = (s) => { const m = LEAD.exec(s || ''); return m && I.has(m[2]) ? { emoji: m[2], rest: (s || '').slice(m[0].length), name: I.nameOf(m[2]) } : null; };

  // ---- the screen part: only runs in a browser ----
  const SKIP = 'script,style,textarea,input,select,option,canvas,svg,.inv,.printable,.keep-emoji,[contenteditable]';
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CANVAS', 'SVG']);
  function swapIn(node) {
    const el = node.parentElement; if (!el || SKIP_TAGS.has(el.tagName) || (el.closest && el.closest(SKIP))) return;
    const l = I.lead(node.data); if (!l) return;
    const sp = document.createElement('span'); sp.className = 'ico'; sp.setAttribute('aria-hidden', 'true'); sp.innerHTML = I.svg(l.name);
    node.data = (l.rest || '') ; el.insertBefore(sp, node);
    if (!node.data.trim()) { sp.classList.add('solo'); }
  }
  function scan(rootEl) {
    if (!rootEl || rootEl.nodeType !== 1 || !rootEl.isConnected) return;
    const w = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null), list = []; let n;
    while ((n = w.nextNode())) { if (n.data && n.data.length < 120 && /[☀-➿⭐⏳\u{1F300}-\u{1FAFF}]/u.test(n.data)) list.push(n); }
    list.forEach(swapIn);
  }
  I.scan = scan;
  I.start = () => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined' || I._on) return; I._on = true;
    let pend = new Set(), raf = 0;
    const run = () => { raf = 0; const items = [...pend]; pend = new Set(); items.forEach(scan); };
    new MutationObserver((muts) => { for (const m of muts) { m.addedNodes.forEach((a) => { if (a.nodeType === 1) pend.add(a); else if (a.nodeType === 3 && a.parentElement) pend.add(a.parentElement); }); } if (!raf && pend.size) raf = requestAnimationFrame(run); }).observe(document.body, { childList: true, subtree: true });
    scan(document.body);
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = I; else { root.Icons = I; if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', I.start); else I.start(); } }
})(typeof window !== 'undefined' ? window : globalThis);
