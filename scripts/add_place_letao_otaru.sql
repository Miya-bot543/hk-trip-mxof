-- 2026-11-08 口袋名單新增「LeTAO 小樽洋菓子舖 本店」（可重複執行，已存在就不會重複新增）
-- 資料來源：GLTJP gltjp.com、icotto icotto.jp、北海道觀光官網 visit-hokkaido.jp（冬季營業時間未明寫，以官網 letao-brand.jp 為準）
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'letao_otaru', 'LeTAO 小樽洋菓子舖 本店', 'food', '小樽', '室內',
  '北海道小樽市堺町7-16', '小樽洋菓子舗ルタオ 本店', '北海道小樽市堺町7-16', '0120-31-4521',
  array['步行'], array['甜點','雙層起司蛋糕','堺町通'],
  jsonb_build_object(
    'branch',  '本店',
    'dish',    '雙層起司蛋糕（ドゥーブルフロマージュ），2 樓喫茶有本店限定甜點和紅茶',
    'budget',  '待確認',
    'hours',   '約 9:00～18:00（依季節調整，冬季時間待確認）；2 樓喫茶 L.O. 約 17:30',
    'closed',  '無休；年末年始營業待確認',
    'reserve', '假日、旺季當天不接受喫茶預約',
    'queue',   '待確認'
  ),
  jsonb_build_array(
    jsonb_build_object('k','電話','v','0120-31-4521（日本免付費電話，國外手機可能打不通）'),
    jsonb_build_object('k','交通說明','v','在堺町通上，可以和小樽運河一起逛')
  ),
  'LeTAO 的本店，2 樓喫茶可以吃現做的北海道限定生雙層起司蛋糕。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = 'LeTAO 小樽洋菓子舖 本店' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「LeTAO 小樽洋菓子舖 本店」
select name, area, phone, info->>'hours' as hours from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and name = 'LeTAO 小樽洋菓子舖 本店' and deleted_at is null;
