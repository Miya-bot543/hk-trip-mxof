// 一次性：替口袋名單與住宿查座標 → scripts/geocode.json
// 有門牌的地址用國土地理院地址搜尋；沒有門牌的用日文名稱查 OpenStreetMap Nominatim（每秒最多 1 次）。
// 用法：node scripts/geocode.mjs（加 --force 全部重查）
import fs from "node:fs";
import { POCKET_SEED, DRIVER, HOTEL_DRIVER } from "../v2/data/static.js";

const OUT = new URL("./geocode.json", import.meta.url);
const force = process.argv.includes("--force");
const cache = !force && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const UA = "hk-trip-mxof-import/1.0 (https://github.com/Miya-bot543/hk-trip-mxof)";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = a => (a || "").replace(/〒[\d-]+\s*/, "").replace(/（.*?）/g, "").replace(/\s.*$/, "").trim();
const hasBanchi = a => /\d+(-\d+)*$/.test(a) && /[町条丁目]/.test(a);

// 沒有門牌時用的日文名稱（OSM 上的名稱）
const JA_NAME = {
  susukino: "すすきの駅", tanuki: "狸小路", odori: "大通公園", jingu: "北海道神宮 札幌市", maruyama: "円山公園 札幌市",
  otaru: "小樽運河", ningle: "ニングルテラス", ooyunuma: "大湯沼 登別市", okunoyu: "奥の湯 登別市", gensen: "泉源公園 登別市",
};
// 地區中心點：查到的座標離中心超過 radius 公里就當作查錯
const AREA = { 札幌: [43.06, 141.35, 15], 登別: [42.47, 141.16, 12], 小樽: [43.19, 141.00, 10], 富良野: [43.34, 142.38, 20] };
const areaOf = a => Object.keys(AREA).find(k => (a || "").startsWith(k));
const km = (a, b, c, d) => Math.hypot((a - c) * 111, (b - d) * 81);
const near = (hit, area) => !area || km(hit.lat, hit.lng, AREA[area][0], AREA[area][1]) <= AREA[area][2];
// 不匯入的項目（分店／店家未定，使用者 2026-10-16 決定先不放）
const EXCLUDE = new Set(["daruma", "curry"]);

async function gsi(q) {
  const r = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(q)}`, { headers: { "User-Agent": UA } });
  const js = r.ok ? await r.json() : [];
  await sleep(500);
  return js[0] ? { lat: js[0].geometry.coordinates[1], lng: js[0].geometry.coordinates[0], src: "gsi", query: q, display: js[0].properties.title } : null;
}
async function osm(q) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&accept-language=ja&q=${encodeURIComponent(q)}`, { headers: { "User-Agent": UA } });
  const js = r.ok ? await r.json() : [];
  await sleep(1100);
  return js[0] ? { lat: +js[0].lat, lng: +js[0].lon, src: "osm", query: q, display: js[0].display_name } : null;
}

const targets = [
  ...POCKET_SEED.filter(p => !EXCLUDE.has(p.id)).map(p => ({ key: p.id, name: p.name, addr: clean(p.address), area: areaOf(p.area) })),
  ...HOTEL_DRIVER.map(id => DRIVER.find(d => d.id === id)).map(d => ({ key: d.id, name: d.zh, addr: clean(d.addr), area: d.addr.includes("登別") ? "登別" : "札幌" })),
];

for (const t of targets) {
  if (cache[t.key]?.lat) continue;
  let hit = null;
  {
    if (t.addr && hasBanchi(t.addr)) hit = await gsi(t.addr);
    if (hit && !near(hit, t.area)) hit = null;
    if (!hit && JA_NAME[t.key]) hit = await osm(JA_NAME[t.key]);
    if (hit && !near(hit, t.area)) { console.log("FAR ", t.key, hit.display); hit = null; }
  }
  cache[t.key] = hit || { lat: null, lng: null, src: null, query: null, display: null };
  console.log(hit ? "OK  " : "MISS", t.key, t.name, hit ? `${hit.lat.toFixed(5)},${hit.lng.toFixed(5)} [${hit.src}] ${hit.display}` : "");
}
fs.writeFileSync(OUT, JSON.stringify(cache, null, 1) + "\n");
