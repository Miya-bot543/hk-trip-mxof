-- 2026-11-08 口袋名單新增「三角市場」（可重複執行，已存在就不會重複新增）
-- 資料來源：北海道觀光官網 visit-hokkaido.jp、GLTJP gltjp.com、なっぷ nap-camp.com（市場代表電話各站不一，先不填）
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'sankaku_market', '三角市場', 'spot', '小樽', '室內',
  '北海道小樽市稲穂3-10-16',
  array['JR 電車／鐵路','步行'], array['海鮮市場','海鮮丼','小樽站旁'],
  jsonb_build_object(
    'fee',   '免費逛；海鮮丼依店家',
    'stay',  '約 30 分～1 小時',
    'hours', '店舗約 6:00～17:00、食堂約 7:00～17:00（各店不同）',
    'tips',  '多數店家只有 1/1 休；12/30 營業狀況待確認，熱門食堂可能要排隊'
  ),
  jsonb_build_array(
    jsonb_build_object('k','交通說明','v','JR 小樽站步行約 1 分')
  ),
  '小樽站旁的小型海鮮市場，有好幾間海鮮丼食堂可以挑。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = '三角市場' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「三角市場」
select name, area, info->>'hours' as hours from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and name = '三角市場' and deleted_at is null;
