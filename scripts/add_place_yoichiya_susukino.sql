-- 2026-10-28 口袋名單新增「海膽專門店 世壱屋 札幌薄野店」（可重複執行，已存在就不會重複新增）
-- 資料來源：世壱屋官網 yoichiya.info（價格為 2025/11/01 起的公告）
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'yoichiya', '海膽專門店 世壱屋 札幌薄野店', 'food', '札幌（薄野）', '室內',
  '〒064-0805 北海道札幌市中央区南5条西6丁目9-3', 'うに専門店 世壱屋 札幌すすきの店', '北海道札幌市中央区南5条西6丁目9-3', '080-4053-5692',
  array['步行'], array['海膽','海膽丼','早上 8 點開'],
  jsonb_build_object(
    'branch',  '札幌すすきの店',
    'dish',    '海膽本鮪 5 種比較丼、海膽鮭魚卵丼、海膽松葉蟹丼、海膽定食等',
    'budget',  '一般份 ¥6,050～7,150、半份 ¥4,950～6,050（分白、赤兩種）',
    'hours',   '8:00～14:00（L.O. 13:30）',
    'closed',  '週二，另有不定休；年末年始營業待確認',
    'reserve', '待確認',
    'queue',   '待確認'
  ),
  jsonb_build_array(
    jsonb_build_object('k','電話','v','080-4053-5692'),
    jsonb_build_object('k','交通說明','v','距離船舶花園薄野飯店（Vessel）步行約 1 分'),
    jsonb_build_object('k','其他分店（南二条）','v','札幌市中央区南2条東1丁目1-5，午 9:00～16:00、晚 18:00～23:00（晚餐週四、週日休）'),
    jsonb_build_object('k','其他分店（小樽運河）','v','小樽市堺町2-18，10:00～17:00')
  ),
  '本店在余市的海膽專門店，招牌是一次吃到 5 種海膽的比較丼。營業時間官網寫明以店家電話確認為準，出發前請先打電話問。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = '海膽專門店 世壱屋 札幌薄野店' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「海膽專門店 世壱屋 札幌薄野店」
select name, area, phone, info->>'hours' as hours from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and name = '海膽專門店 世壱屋 札幌薄野店' and deleted_at is null;
