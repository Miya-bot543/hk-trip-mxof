-- 2026-11-03 口袋名單新增「奧芝商店 実家店」湯咖哩（可重複執行，已存在就不會重複新增）
-- 資料來源：奧芝商店官網 okushiba.net/shop/
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'okushiba_jikka', '奧芝商店 実家店 湯咖哩', 'food', '札幌（大通）', '室內',
  '北海道札幌市中央区南1条西5丁目16 プレジデント松井ビル100', '奥芝商店 実家店', '北海道札幌市中央区南1条西5丁目16 プレジデント松井ビル100', '011-596-6552',
  array['步行','地鐵'], array['湯咖哩','蝦湯底'],
  jsonb_build_object(
    'branch',  '実家店',
    'dish',    '蝦湯底湯咖哩',
    'hours',   '11:00～15:00（L.O.）、17:00～21:00（L.O.）',
    'closed',  '週一；年末年始營業待確認',
    'reserve', '待確認'
  ),
  jsonb_build_array(
    jsonb_build_object('k','交通說明','v','地下鐵「大通」站步行約 5 分，沒有停車場'),
    jsonb_build_object('k','其他分店（奥''clock店）','v','札幌市中央区北1条西2丁目 札幌時計台ビル B1，大通站步行約 5 分，不定休'),
    jsonb_build_object('k','其他分店（駅前創成寺店）','v','札幌市中央区北4条西1丁目 ホクレンビル B1 パールタウン，札幌站步行約 2 分，不定休')
  ),
  '札幌很有名的湯咖哩連鎖店，招牌是濃郁的蝦湯底。三家市區分店營業時間相同，実家店離薄野和大通最近。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = '奧芝商店 実家店 湯咖哩' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「奧芝商店 実家店 湯咖哩」
select name, area, phone, info->>'hours' as hours from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and name = '奧芝商店 実家店 湯咖哩' and deleted_at is null;
