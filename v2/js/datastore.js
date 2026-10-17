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
let sb = null, ch = null, readyP = null;
const subs = new Set();

export const ds = {
  mode: "snapshot",
  ready: () => readyP || init(),
  canEdit: () => ds.mode === "live" && !!store.get("hk-code", ""),
  me: () => store.get("hk-me", ""),
  setMe: name => { store.set("hk-me", String(name || "").trim().slice(0, 8)); emit(); },
  logout: () => { localStorage.removeItem("hk-code"); emit(); },
  places: () => D.places,
  items: day => day ? D.itinerary_items.filter(i => i.day === day) : D.itinerary_items,
  travelers: () => D.travelers,
  marks: () => D.place_marks,
  fx: () => D.fx_rates,
  expenses: () => D.expenses,
  splits: () => D.expense_splits,
  trip: () => D.trip,
  // 備份用：目前手上的全部資料（格式和 data/snapshot.json 一樣）
  dump: () => JSON.parse(JSON.stringify(Object.assign({ saved_at: new Date().toISOString() }, D))),
  on(ev, fn) { if (ev === "change") subs.add(fn); return () => subs.delete(fn); },
};

/* ---------- 寫入（全部走 RPC，第一步由資料庫檢查通關碼） ---------- */
export class DsError extends Error { constructor(code, msg) { super(msg || code); this.code = code; } }

// 驗證通關碼，正確才存進手機
ds.verifyCode = async code => {
  if (ds.mode !== "live") throw new DsError("offline", "目前不是即時模式");
  const { data, error } = await withTimeout(sb.rpc("verify_code", { p_trip: D.trip.id, p_code: code }), TIMEOUT);
  if (error) throw new DsError("network", error.message);
  if (data === true) { store.set("hk-code", code); emit(); }
  return data === true;
};

async function call(fn, args) {
  if (!ds.canEdit()) throw new DsError("no_code");
  const { data, error } = await withTimeout(sb.rpc(fn, Object.assign({ p_trip: D.trip.id, p_code: store.get("hk-code", ""), p_actor: ds.me() || "旅伴" }, args)), 8000)
    .catch(e => ({ error: e }));
  if (error) {
    const m = String(error.message || "");
    if (m.includes("invalid_code")) { localStorage.removeItem("hk-code"); emit(); throw new DsError("invalid_code", m); }
    if (m.includes("locked_item")) throw new DsError("locked_item", m);
    throw new DsError("failed", m);
  }
  return data;
}
const saveLocal = () => setData(D, true);

// 樂觀更新：先改畫面，失敗再改回來
ds.upsertPlace = async p => {
  const before = D.places;
  const i = p.id ? D.places.findIndex(x => x.id === p.id) : -1;
  if (i >= 0) { D.places = D.places.slice(); D.places[i] = Object.assign({}, D.places[i], p); emit(); }
  try {
    const row = await call("place_upsert", { p });
    D.places = before.filter(x => x.id !== row.id).concat(row).sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0));
    saveLocal(); emit(); return row;
  } catch (e) { D.places = before; emit(); throw e; }
};
ds.deletePlace = async id => {
  const before = D.places;
  D.places = D.places.filter(x => x.id !== id); emit();
  try { await call("place_delete", { p_id: id }); saveLocal(); }
  catch (e) { D.places = before; emit(); throw e; }
};
ds.restorePlace = async id => {
  await call("place_restore", { p_id: id });
  D.places = await fetchTable("places"); saveLocal(); emit();
};

// 行程：新增或修改一筆（固定行程由資料庫擋下）
ds.upsertItem = async p => {
  const row = await call("item_upsert", { p });
  D.itinerary_items = D.itinerary_items.filter(x => x.id !== row.id).concat(row);
  saveLocal(); emit(); return row;
};
// 行程：調整順序，每筆送 id 和要改的 slot／position（固定行程由資料庫擋下）
ds.reorderItems = async list => {
  const before = D.itinerary_items, chg = new Map(list.map(x => [x.id, x]));
  D.itinerary_items = D.itinerary_items.map(x => chg.has(x.id) ? Object.assign({}, x, chg.get(x.id)) : x); emit();
  try { await call("items_reorder", { p_items: list }); saveLocal(); }
  catch (e) { D.itinerary_items = before; emit(); throw e; }
};
ds.deleteItem = async id => {
  const before = D.itinerary_items;
  D.itinerary_items = D.itinerary_items.filter(x => x.id !== id); emit();
  try { await call("item_delete", { p_id: id }); saveLocal(); }
  catch (e) { D.itinerary_items = before; emit(); throw e; }
};
ds.restoreItem = async id => {
  await call("item_restore", { p_id: id });
  D.itinerary_items = await fetchTable("itinerary_items"); saveLocal(); emit();
};

// 旅伴：新增、改名、改分組、隱藏後恢復都走 traveler_upsert
ds.upsertTraveler = async p => {
  const row = await call("traveler_upsert", { p });
  D.travelers = D.travelers.filter(x => x.id !== row.id).concat(row);
  saveLocal(); emit(); return row;
};
// 旅伴刪除：有記帳紀錄的改成隱藏（回傳 hidden），沒有的直接刪掉（回傳 deleted）
ds.deleteTraveler = async id => {
  const r = await call("traveler_delete", { p_id: id });
  D.travelers = r === "hidden" ? D.travelers.map(x => x.id === id ? Object.assign({}, x, { active: false }) : x) : D.travelers.filter(x => x.id !== id);
  saveLocal(); emit(); return r;
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
  if (ch) sb.removeChannel(ch);   // 重新連線時先拿掉舊的頻道，避免重複收到通知
  ch = sb.channel("trip-" + D.trip.id);
  TABLES.forEach(t => ch.on("postgres_changes", { event: "*", schema: "public", table: t, filter: `trip_id=eq.${D.trip.id}` },
    () => { pending.add(t); clearTimeout(timer); timer = setTimeout(flush, 300); }));
  ch.subscribe();
}

let connecting = null;
function goLive() {
  if (connecting) return connecting;
  connecting = (async () => {
    await withTimeout(loadScript(SB_SRC, SB_SRI), TIMEOUT);
    if (!sb) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const d = await withTimeout(fetchAll(), TIMEOUT);
    setData(d, true);
    ds.mode = "live";
    subscribe();
    emit();
  })().finally(() => { connecting = null; });
  return connecting;
}
const canLive = () => LIVE_ENABLED && SUPABASE_URL && SUPABASE_ANON_KEY && navigator.onLine !== false;
const tryLive = () => goLive().catch(e => {
  console.warn("無法連線資料庫，改用唯讀快照", e);
  const m = navigator.onLine === false ? "offline" : "snapshot";
  if (ds.mode !== m) { ds.mode = m; emit(); }
});
// 一開始沒連上（例如開飛航模式時打開網站）：網路恢復或切回網站時再試一次，不用關掉分頁重開
const retryLive = () => { if (ds.mode !== "live" && canLive() && readyP) tryLive(); };

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
    if (canLive()) tryLive();
  })();
  window.addEventListener("online", retryLive);
  // 用到一半斷網：先切成離線唯讀，網路回來再自動連回去
  window.addEventListener("offline", () => { if (ds.mode === "live") { ds.mode = "offline"; emit(); } });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") retryLive(); });
  return readyP;
}
