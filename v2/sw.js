/* /v2/ 已搬到正式網址。這支 sw 只負責取代舊的 /v2/ 離線功能：
   清掉舊的 hk-v2- 快取、解除自己，再讓開著的分頁重新載入（會轉到正式網址）。 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith("hk-v2-")).map(k => caches.delete(k))))
    .then(() => self.registration.unregister())
    .then(() => self.clients.matchAll({ type: "window" }))
    .then(cs => cs.forEach(c => c.navigate(c.url).catch(() => {}))));
});
