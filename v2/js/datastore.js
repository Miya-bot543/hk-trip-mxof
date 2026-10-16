/* 資料層：各頁只透過這裡讀寫資料，不直接碰 Supabase。
   啟動時先用手機裡的 hk-snapshot（或 data/snapshot.json）立刻畫面，再背景連 Supabase。
   模式：live（即時同步）／snapshot（唯讀快照）／offline（沒有網路，用最後一次讀到的資料）。 */
import { SUPABASE_URL, SUPABASE_ANON_KEY, TRIP_SLUG, LIVE_ENABLED } from "./config.js";
import { store } from "./util.js";

const SB_SRC = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js";
const SB_SRI = "sha384-Rj26LVGvoeRVR6+mwQmFfcR3QOBEwT+ZmuCWpuiqeTzJpCs0ER4ITAWGb4Hiy3Ok";
const TIMEOUT = 5000;
const TABLES = ["places", "itinerary_items", "travelers", "place_marks", "fx_rates", "expenses", "expense_splits"];
const SOFT = new Set(["places", "itinerary_items", "expenses"]);   // 有 deleted_at 的資料表
const TRIP_COLS = "id,slug,name,start_date,end_date,base_currency";

const empty = () => Object.fromEntries(TABLES.map(t => [t, []]));
let D = Object.assign({ trip: null }, empty());
let sb = null, readyP = null;
const subs = new Set();

export const ds = {
  mode: "snapshot",
  ready: () => readyP || init(),
  canEdit: () => false,   // 5.2 第 3 步加入通關碼後開放
  places: () => D.places,
  items: day => day ? D.itinerary_items.filter(i => i.day === day) : D.itinerary_items,
  travelers: () => D.travelers,
  marks: () => D.place_marks,
  fx: () => D.fx_rates,
  expenses: () => D.expenses,
  splits: () => D.expense_splits,
  trip: () => D.trip,
  on(ev, fn) { if (ev === "change") subs.add(fn); return () => subs.delete(fn); },
};

const emit = () => subs.forEach(fn => { try { fn(ds.mode); } catch (e) { console.error(e); } });
const setData = (d, save) => {
  D = Object.assign({ trip: null }, empty(), d);
  if (save) store.set("hk-snapshot", Object.assign({ saved_at: new Date().toISOString() }, D));
};
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

function loadScript(src, integrity) {
  if (window.supabase) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.integrity = integrity; s.crossOrigin = "anonymous";
    s.onload = res; s.onerror = () => rej(new Error("supabase-js 載入失敗"));
    document.head.appendChild(s);
  });
}

async function fetchTable(t) {
  let q = sb.from(t).select("*").eq("trip_id", D.trip.id);
  if (SOFT.has(t)) q = q.is("deleted_at", null);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function fetchAll() {
  const { data: trip, error } = await sb.from("trips").select(TRIP_COLS).eq("slug", TRIP_SLUG).single();
  if (error) throw error;
  D.trip = trip;
  const rows = await Promise.all(TABLES.map(fetchTable));
  const d = { trip };
  TABLES.forEach((t, i) => { d[t] = rows[i]; });
  return d;
}

// Realtime：有變更就重抓該資料表（短時間內多筆變更合併成一次）
function subscribe() {
  const pending = new Set(); let timer = null;
  const flush = async () => {
    const ts = [...pending]; pending.clear();
    try {
      const rows = await Promise.all(ts.map(fetchTable));
      ts.forEach((t, i) => { D[t] = rows[i]; });
      setData(D, true); emit();
    } catch (e) { console.warn("重新讀取失敗", e); }
  };
  const ch = sb.channel("trip-" + D.trip.id);
  TABLES.forEach(t => ch.on("postgres_changes", { event: "*", schema: "public", table: t, filter: `trip_id=eq.${D.trip.id}` },
    () => { pending.add(t); clearTimeout(timer); timer = setTimeout(flush, 300); }));
  ch.subscribe();
}

async function goLive() {
  await withTimeout(loadScript(SB_SRC, SB_SRI), TIMEOUT);
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const d = await withTimeout(fetchAll(), TIMEOUT);
  setData(d, true);
  ds.mode = "live";
  subscribe();
  emit();
}

function init() {
  readyP = (async () => {
    // 1. 立刻畫面：先用手機裡最後一次的資料，沒有才抓網站上的快照檔
    const local = store.get("hk-snapshot", null);
    const fileP = withTimeout(fetch("data/snapshot.json", { cache: "no-cache" }), TIMEOUT)
      .then(r => r.ok ? r.json() : null).catch(e => { console.warn("讀不到快照", e); return null; });
    // 網站上的快照比手機裡的新，而且還沒連上即時資料，就換成網站上的
    const useFile = f => { if (f && f.trip && ds.mode !== "live" && !(local && local.saved_at >= f.saved_at)) { setData(f, true); return true; } };
    if (local && local.trip) { setData(local, false); fileP.then(f => { if (useFile(f)) emit(); }); }
    else useFile(await fileP);
    ds.mode = navigator.onLine === false ? "offline" : "snapshot";
    // 2. 背景連 Supabase（不擋住畫面）
    if (LIVE_ENABLED && SUPABASE_URL && SUPABASE_ANON_KEY && navigator.onLine !== false) {
      goLive().catch(e => { console.warn("無法連線資料庫，改用唯讀快照", e); ds.mode = navigator.onLine === false ? "offline" : "snapshot"; emit(); });
    }
  })();
  return readyP;
}
