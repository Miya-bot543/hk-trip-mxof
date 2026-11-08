-- 2026-11-08 口袋名單新增「cafe BAAL」（小樽站附近，可重複執行，已存在就不會重複新增）
-- 資料來源：NAVITIME navitime.co.jp/poi?spot=01125-J001011284、食べログ tabelog.com/tw/hokkaido/A0106/A010601/1052877/
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'cafe_baal_otaru', 'cafe BAAL', 'food', '小樽', '室內',
  '北海道小樽市稲穂3-8-10', 'Cafe BaaL（かふぇばーる）', '北海道小樽市稲穂3-8-10', '0134-22-2282',
  array['步行'], array['咖啡廳','生義大利麵','牛排丼','小樽站'],
  jsonb_build_object(
    'branch',  '',
    'dish',    '生義大利麵、牛排丼（ステーキ丼）',
    'budget',  '午餐約 ¥900～1,999、晚餐約 ¥1,300～1,999（各網站寫法不同）',
    'hours',   '11:30～14:30、17:30～20:00（資料未標更新日期，待確認）',
    'closed',  '週一；年末年始營業待確認',
    'reserve', '可透過 HotPepper 網路預約',
    'queue',   '店小只有 16 席，建議早點去'
  ),
  jsonb_build_array(
    jsonb_build_object('k','交通說明','v','小樽站走路約 3 分鐘（約 250 公尺）')
  ),
  '小樽站旁的小咖啡廳，生義大利麵和牛排丼評價不錯，價格親民。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and legacy_id = 'cafe_baal_otaru' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「cafe BAAL」
select name, area, phone, info->>'hours' as hours from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and legacy_id = 'cafe_baal_otaru' and deleted_at is null;
