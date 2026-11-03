-- 2026-11-03 口袋名單新增「十勝豚丼 いっぴん 札幌Stellar Place店」（可重複執行，已存在就不會重複新增）
-- 資料來源：十勝豚丼いっぴん各店介紹（shiroishi-cc.com 2026/07、macaro-ni、hamoni）
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'ippin_stellar', '十勝豚丼 いっぴん 札幌Stellar Place店', 'food', '札幌（札幌站周邊）', '室內',
  '北海道札幌市中央区北5条西2丁目 札幌ステラプレイス 6F', '十勝豚丼 いっぴん ステラプレイス店', '北海道札幌市中央区北5条西2丁目 札幌ステラプレイス 6F', null,
  array['步行'], array['豚丼','炭烤','十勝名物'],
  jsonb_build_object(
    'branch', 'ステラプレイス店',
    'dish', '炭烤豚丼（備長炭烤本里肌）',
    'hours', '11:00～22:00（L.O. 21:30）',
    'closed', '依 Stellar Place 商場公休',
    'reserve', '不接受預約',
    'queue', '午餐 12:00～13:00 約等 15～25 分，平日 11 點剛開比較空',
    'budget', '約 ¥1,000～2,000（各網站價格不一致，待確認）'
  ),
  jsonb_build_array(
    jsonb_build_object('k','交通說明','v','JR 札幌站直結，Stellar Place 6 樓'),
    jsonb_build_object('k','其他分店（日生大樓店）','v','大通站步行約 5 分，地下街直結，15:30～17:00 休息')
  ),
  '帶廣的鄉土料理，厚切豬肉刷鹹甜醬汁後用炭火烤。不接受預約，先到先吃。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = '十勝豚丼 いっぴん 札幌Stellar Place店' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「十勝豚丼 いっぴん 札幌Stellar Place店」
select name, area, phone, info->>'hours' as hours from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and name = '十勝豚丼 いっぴん 札幌Stellar Place店' and deleted_at is null;
