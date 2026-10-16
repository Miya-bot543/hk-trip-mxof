// 一次性：產生 scripts/seed.sql（口袋名單 19 筆＋住宿 4 間＋每日固定行程），在 Supabase SQL Editor 貼上執行。
// 用法：node scripts/build_seed.mjs
// 不含旅伴（由網站新增）、不含通關碼。重複執行 SQL 不會重複匯入。
import fs from "node:fs";
import { POCKET_SEED, HOTELS, DRIVER, HOTEL_DRIVER } from "../v2/data/static.js";

const GEO = JSON.parse(fs.readFileSync(new URL("./geocode.json", import.meta.url), "utf8"));
const EXCLUDE = new Set(["daruma", "curry"]);   // 分店／店家未定，先不匯入
const STAY = { spot: 60, food: 75, shop: 60 };
const STAY_BIG = { shiroi: 120, bear: 120, jidaimura: 120, nixe: 150 };
const HOTEL_AREA = { h1: "登別", h2: "札幌（薄野）", h3: "札幌（中島公園）", h4: "札幌（薄野）" };
const geo = k => ({ lat: GEO[k]?.lat ?? null, lng: GEO[k]?.lng ?? null });

const pocket = POCKET_SEED.filter(p => !EXCLUDE.has(p.id)).map(p => ({
  legacy_id: p.id, name: p.name, category: p.cat, area: p.area || null, venue: p.venue || null,
  address: p.address || null, ja_name: null, ja_address: null, phone: null, ...geo(p.id),
  stay_minutes: STAY_BIG[p.id] ?? STAY[p.cat] ?? 60,
  transport: p.transport || [], tags: p.tags || [],
  info: p.when ? { ...p.info, when: p.when } : (p.info || {}), extra: p.extra || [],
  note: p.note || null, is_wishlist: true, created_at: p.createdAt,
}));

const hotels = HOTEL_DRIVER.map((id, i) => {
  const h = HOTELS[i], d = DRIVER.find(x => x.id === id);
  return {
    legacy_id: id, name: h.name, category: "hotel", area: HOTEL_AREA[id], venue: "室內",
    address: h.address, ja_name: d.ja, ja_address: [d.zip, d.addr].filter(Boolean).join(" "), phone: d.tel, ...geo(id),
    stay_minutes: null, transport: [], tags: ["住宿"],
    info: { checkin: h.inTime, checkout: h.outTime, inDate: h.inDate, outDate: h.outDate }, extra: [],
    note: [...(h.perks || []), h.caution].filter(Boolean).join("；") || null, is_wishlist: false,
    created_at: "2026-10-13T00:00:00.000Z",
  };
});

// 每日固定骨架：文字取自 DAYS／FLIGHTS，不自行補時間；待確認事項放在 note
const F = (day, slot, title, o = {}) => ({ day, slot, title, start_time: o.s ?? null, end_time: o.e ?? null, place: o.place ?? null, group_label: o.g ?? null, note: o.note ?? null });
const items = [
  F("2026-12-25", "morning", "✈️ CI2130 桃園機場第 2 航站 → 新千歲機場國際線航廈", { s: "05:00", e: "09:40", g: "中華組", note: "清晨 05:00 起飛，前往桃園機場的交通與集合時間待確認" }),
  F("2026-12-25", "morning", "🚗 World Net Rent-A-Car 報到、搭免費接駁車到營業所取車", { g: "中華組", note: "1 樓櫃檯（無人時拿起櫃台電話按 1）；Sienta hybrid 或同級車" }),
  F("2026-12-25", "afternoon", "🏨 入住登別 adex inn（14:00 後）", { s: "14:00", place: "h1", g: "中華組" }),
  F("2026-12-26", "morning", "✈️ JX318 台中機場 → 新千歲機場國際線航廈", { s: "10:20", e: "15:00", g: "星宇組" }),
  F("2026-12-26", "afternoon", "🚗 第 2 台車取車", { g: "星宇組", note: "Raize / Yaris Cross 或同級車；冬季天黑早，開車請放慢、預留時間" }),
  F("2026-12-26", "evening", "🏨 入住登別 adex inn（第 2 筆訂房）", { place: "h1", g: "星宇組" }),
  F("2026-12-28", "morning", "🏨 退房登別 adex inn（10:00 前）", { e: "10:00", place: "h1" }),
  F("2026-12-28", "morning", "⛽ 千歲市內加油站加滿 REGULAR（紅色）", { note: "保留收據" }),
  F("2026-12-28", "afternoon", "🚗 新千歲空港營業所還車（兩台車）", { note: "Map Code 113774672；搭營業所接駁巴士到新千歲機場（末班 19:00）；機場前往札幌的交通方式待確認" }),
  F("2026-12-28", "afternoon", "🏨 入住 APA 札幌薄野站前飯店（15:00 後）", { s: "15:00", place: "h2" }),
  F("2026-12-29", "allday", "🚌 旭川一日遊套裝行程", { note: "集合時間、地點與景點待確認；TWD 1,710／每位" }),
  F("2026-12-31", "morning", "🏨 退房 APA 札幌薄野站前飯店（10:00 前）", { e: "10:00", place: "h2" }),
  F("2026-12-31", "afternoon", "🏨 入住札幌民宿（15:00 後）", { s: "15:00", place: "h3", note: "換宿交通：計程車或市電" }),
  F("2027-01-01", "allday", "⛷️ 札幌手稻滑雪場（預定）", { note: "雪具、課程待確認" }),
  F("2027-01-02", "morning", "🏨 退房札幌民宿（10:00 前）", { e: "10:00", place: "h3" }),
  F("2027-01-02", "afternoon", "🏨 入住 Vessel Hotel Campana Susukino（14:00 後）", { s: "14:00", place: "h4", g: "中華組", note: "換宿交通：計程車或市電" }),
  F("2027-01-02", "afternoon", "✈️ JX319 新千歲機場 → 台中機場", { s: "16:00", e: "19:55", g: "星宇組", note: "前往新千歲機場的交通與出發時間待確認" }),
  F("2027-01-03", "morning", "🏨 退房 Vessel Hotel（11:00 前）", { e: "11:00", place: "h4", g: "中華組", note: "回程班機 10:40 起飛，實際需比退房期限（11:00）更早出發前往機場" }),
  F("2027-01-03", "morning", "✈️ CI2131 新千歲機場國際線航廈 → 桃園機場第 2 航站", { s: "10:40", e: "14:15", g: "中華組", note: "出發時間與前往機場的交通待確認" }),
];
const pos = {};
items.forEach(it => { const k = it.day + it.slot; it.position = pos[k] = (pos[k] ?? 0) + 1; });

const json = v => { const s = JSON.stringify(v); if (s.includes("$seed$")) throw new Error("bad text"); return s; };
const sql = `-- 北海道 10 日遊 v2：初始資料匯入（由 scripts/build_seed.mjs 產生，請勿手改）
-- 內容：口袋名單 ${pocket.length} 筆、住宿 ${hotels.length} 間、每日固定行程 ${items.length} 項。不含旅伴與通關碼。
-- 執行方式：Supabase 後台 SQL Editor 整份貼上，按 Run。已匯入過會自動略過，不會重複。
do $$
declare v_trip uuid;
begin
  select id into v_trip from public.trips where slug = 'hokkaido-2026';
  if v_trip is null then raise exception '找不到旅程 hokkaido-2026，請先執行 schema.sql'; end if;
  if exists (select 1 from public.places where trip_id = v_trip and legacy_id is not null) then
    raise notice '已經匯入過，略過'; return;
  end if;

  insert into public.places (trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
    lat, lng, stay_minutes, transport, tags, info, extra, note, is_wishlist, created_by, updated_by, created_at, updated_at)
  select v_trip, x.legacy_id, x.name, x.category, x.area, x.venue, x.address, x.ja_name, x.ja_address, x.phone,
    x.lat, x.lng, x.stay_minutes,
    array(select jsonb_array_elements_text(x.transport)), array(select jsonb_array_elements_text(x.tags)),
    x.info, x.extra, x.note, x.is_wishlist, '匯入', '匯入', x.created_at, x.created_at
  from jsonb_to_recordset($seed$${json([...pocket, ...hotels])}$seed$::jsonb) as x(
    legacy_id text, name text, category text, area text, venue text, address text, ja_name text, ja_address text, phone text,
    lat double precision, lng double precision, stay_minutes int, transport jsonb, tags jsonb, info jsonb, extra jsonb,
    note text, is_wishlist boolean, created_at timestamptz);

  insert into public.itinerary_items (trip_id, day, slot, position, place_id, place_snapshot, title, kind,
    start_time, end_time, locked, pinned, status, group_label, note, created_by, updated_by)
  select v_trip, x.day, x.slot, x.position, p.id,
    case when p.id is null then '{}'::jsonb else jsonb_build_object('name', p.name, 'address', p.address, 'lat', p.lat, 'lng', p.lng) end,
    x.title, 'fixed', x.start_time, x.end_time, true, false, 'must', x.group_label, x.note, '匯入', '匯入'
  from jsonb_to_recordset($seed$${json(items)}$seed$::jsonb) as x(
    day date, slot text, position double precision, place text, title text, start_time time, end_time time, group_label text, note text)
  left join public.places p on p.trip_id = v_trip and p.legacy_id = x.place and p.deleted_at is null;

  insert into public.change_log (trip_id, table_name, row_id, action, actor)
  values (v_trip, 'places', '*', 'import', '匯入');
  raise notice '匯入完成';
end $$;

-- 檢查（應顯示 places=${pocket.length + hotels.length}、items=${items.length}）
select (select count(*) from public.places p join public.trips t on t.id = p.trip_id where t.slug = 'hokkaido-2026') as places,
       (select count(*) from public.itinerary_items i join public.trips t on t.id = i.trip_id where t.slug = 'hokkaido-2026') as items;
`;
fs.writeFileSync(new URL("./seed.sql", import.meta.url), sql);
console.log(`seed.sql：places ${pocket.length}+${hotels.length}、items ${items.length}、${sql.length} 字元`);
