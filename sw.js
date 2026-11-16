/* Saved-copy-first service worker: the app's own files are kept on the phone in one cache per version, and the app opens straight from it
   (no waiting for the internet, so it starts fast even on a weak signal). A new version is downloaded in the background; the Update bar
   (index.html) appears, and nothing changes until you press Update. The deploy workflow replaces the CACHE name with the commit id,
   so every deploy changes this file and installed apps notice it. */
const CACHE = 'buy-sell-v21';
const SHELL = ['./', 'index.html', 'css/style.css', 'css/modern.css', 'js/logic.js', 'js/people.js', 'js/myorders.js', 'js/zonedata.js', 'js/ttshape.js', 'js/logofit.js', 'js/invheader.js', 'js/assets.js', 'vendor/qrcode/qrcode.js', 'js/cardmaker.js', 'vendor/fflate/fflate.js', 'js/zonemap.js', 'js/selectpicker.js', 'js/theme.js', 'js/invdesign.js', 'js/pdf.js', 'js/i18n.js', 'js/photo.js', 'js/photostore.js', 'js/photoui.js', 'js/photosync.js', 'js/team.js', 'js/plan.js', 'js/icons.js', 'js/studio.js', 'js/logomaker.js', 'js/titlemaker.js', 'js/sync.js', 'js/cloud.js', 'js/words.js', 'js/storecore.js', 'js/mappick.js', 'js/storefront.js', 'js/app.js', 'manifest.webmanifest', 'icons/favicon.png', 'icons/apple-touch-icon.png', 'icons/logo.png', 'icons/bruiz-logo-512.png', 'icons/brand/circle.png', 'icons/brand/title.png', 'icons/brand/mark.png', 'icons/brand/banner.jpg', 'icons/invoice-banner.jpg', 'icons/invoice-banner-es.jpg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];
// Third-party code (vendor/: the mark finder, about 8 MB, and Firebase) never changes between deploys: it is saved once, in a cache of its own that
// survives updates, the first time it is used, and is not downloaded again.
const VENDOR = 'vendor-v1';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))); });
// A new version waits until the person taps the Update button in the app (which sends this message).
self.addEventListener('message', (e) => { if (e.data === 'skip-waiting') self.skipWaiting(); });
// The automatic mark finder (8 MB) was removed: drop its saved files from phones that downloaded it.
const dropMarkFinder = () => caches.open(VENDOR).then((c) => c.keys().then((ks) => Promise.all(ks.filter((r) => /\/vendor\/tesseract\//.test(r.url)).map((r) => c.delete(r))))).catch(() => {});
self.addEventListener('activate', (e) => {
  e.waitUntil(dropMarkFinder().then(() => caches.keys()).then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== VENDOR).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Only the exact app files (and the app's own start page) come from the saved copy. Anything with a ?query (like the public store page's
// tagged files), other pages and other things are asked from the internet first, as before.
const SHELL_SET = new Set(SHELL.filter((u) => u !== './'));
const savedKey = (req) => {
  const url = new URL(req.url), rel = url.pathname.slice(new URL('./', self.registration.scope).pathname.length);
  if (req.mode === 'navigate') return rel === '' || rel === 'index.html' ? 'index.html' : null;
  if (url.search) return null;
  return SHELL_SET.has(rel) ? rel : null;
};
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  if (new URL(e.request.url).pathname.includes('/vendor/')) {
    e.respondWith(caches.open(VENDOR).then((c) => c.match(e.request).then((m) => m || fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  const key = savedKey(e.request);
  const network = () => fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; });
  if (key) {
    // this version's own saved copy first (never another version's), the internet only if it is missing
    e.respondWith(caches.open(CACHE).then((c) => c.match(key).then((m) => m || network().catch(() => caches.match('index.html')))));
    return;
  }
  e.respondWith(network().catch(() => caches.open(CACHE).then((c) => c.match(e.request)).then((m) => m || caches.open(CACHE).then((c) => c.match('index.html')))));
});
