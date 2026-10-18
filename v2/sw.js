/* 北海道 10 日遊：離線快取。更新網站時請把 VERSION 改掉，讓手機抓到新版。
   只清除自己（PREFIX 開頭）的舊快取，不會動到其他版本的快取。 */
const PREFIX = "hk-v2-";
const VERSION = PREFIX + "2026-10-18p";
const CORE = [
  "./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./css/style.css", "./data/static.js", "./data/snapshot.json",
  "./js/main.js", "./js/state.js", "./js/util.js", "./js/ui.js", "./js/config.js", "./js/datastore.js", "./js/features/editor.js", "./js/features/board.js", "./js/features/backup.js", "./js/features/members.js", "./js/features/expense.js",
  "./js/features/map.js", "./js/features/pocket.js", "./js/features/today.js", "./js/features/fx.js",
  "./js/features/vjw.js", "./js/features/driver.js", "./js/features/weather.js", "./js/features/net.js",
  "./js/pages/home.js", "./js/pages/ch01.js", "./js/pages/ch02.js", "./js/pages/ch03.js", "./js/pages/ch04.js",
  "./js/pages/ch05.js", "./js/pages/ch06.js", "./js/pages/ch07.js", "./js/pages/ch08.js", "./js/pages/ch09.js",
  "./images/cover-h.jpg", "./images/cover-v.jpg", "./images/map.jpg", "./images/line-qr.png",
  "./images/hotel-1.jpg", "./images/hotel-2.jpg", "./images/hotel-3.jpg", "./images/hotel-4.jpg",
  "./images/ch-01.jpg", "./images/ch-02.jpg", "./images/ch-03.jpg", "./images/ch-04.jpg", "./images/ch-05.jpg",
  "./images/ch-06.jpg", "./images/ch-07.jpg", "./images/ch-08.jpg", "./images/ch-09.jpg",
  "./images/mascot-countdown.jpg", "./images/mascot-trip.jpg", "./images/mascot-home.jpg",
  "./images/act-asahikawa.jpg", "./images/act-ski.jpg"
];
const TIMEOUT = 3000;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const put = (req, res) => { if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; };

// 網路優先，超過 3 秒或失敗就用快取；網路之後回來仍會更新快取
function networkFirst(req, fallbackHTML) {
  return new Promise(resolve => {
    let done = false;
    const fromCache = () => caches.match(req).then(r => r || (fallbackHTML ? caches.match("./index.html") : null));
    const timer = setTimeout(() => fromCache().then(r => { if (r && !done) { done = true; resolve(r); } }), TIMEOUT);
    fetch(req).then(res => { put(req, res); if (!done) { done = true; clearTimeout(timer); resolve(res); } })
      .catch(() => fromCache().then(r => { if (!done) { done = true; clearTimeout(timer); resolve(r || Response.error()); } }));
  });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Supabase：不快取（離線資料由 hk-snapshot 負責）
  if (url.hostname.endsWith(".supabase.co")) return;
  // 圖片：快取優先（改圖時換檔名）
  if (url.origin === location.origin && url.pathname.includes("/images/")) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => put(req, res))));
    return;
  }
  // 網頁、js、css、data：網路優先＋3 秒逾時
  if (req.mode === "navigate" || url.origin === location.origin) {
    e.respondWith(networkFirst(req, req.mode === "navigate"));
    return;
  }
  // 天氣：網路優先，沒網路用快取
  if (url.hostname === "api.open-meteo.com") {
    e.respondWith(fetch(req).then(res => put(req, res)).catch(() => caches.match(req).then(r => r || Response.error())));
    return;
  }
  // 字型：有快取就先用，背景再更新
  if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
