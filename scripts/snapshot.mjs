// 把 Supabase 目前的資料存成 data/snapshot.json（唯讀快照）。只用公開金鑰讀取，不寫入。
// 用法：node scripts/snapshot.mjs（之後由 GitHub Actions 定期執行）
import fs from "node:fs";
import { SUPABASE_URL, SUPABASE_ANON_KEY, TRIP_SLUG } from "../js/config.js";

const URL_ = process.env.SUPABASE_URL || SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
const OUT = new URL("../data/snapshot.json", import.meta.url);
const get = async path => {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`${path} → ${r.status} ${await r.text()}`);
  return r.json();
};

const [trip] = await get(`trips?select=id,slug,name,start_date,end_date,base_currency&slug=eq.${TRIP_SLUG}`);
if (!trip) throw new Error("找不到旅程 " + TRIP_SLUG);
const t = `trip_id=eq.${trip.id}`, live = "deleted_at=is.null";
const snap = {
  trip,
  places: await get(`places?select=*&${t}&${live}&order=created_at,legacy_id`),
  itinerary_items: await get(`itinerary_items?select=*&${t}&${live}&order=day,position`),
  travelers: await get(`travelers?select=*&${t}&order=sort,nickname`),
  place_marks: await get(`place_marks?select=*&${t}`),
  fx_rates: await get(`fx_rates?select=*&${t}`),
  expenses: await get(`expenses?select=*&${t}&${live}&order=spent_on,created_at`),
  expense_splits: await get(`expense_splits?select=*&${t}`),
};
// 內容沒變就不改檔（避免 Actions 產生空 commit）
const body = JSON.stringify(snap, null, 1) + "\n";
const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8").replace(/ "saved_at": ".*?",\n/, "") : "";
if (old === body) { console.log("沒有變更"); process.exit(0); }
fs.writeFileSync(OUT, body.replace("{\n", `{\n "saved_at": "${new Date().toISOString()}",\n`));
console.log("已更新", Object.entries(snap).filter(([k]) => k !== "trip").map(([k, v]) => `${k}=${v.length}`).join(" "));
