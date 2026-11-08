-- 2026-11-08 口袋名單新增「支笏湖」（可重複執行，已存在就不會重複新增）
-- 資料來源：北海道觀光官網 visit-hokkaido.jp、支笏湖遊客中心 shikotsukovc.sakura.ne.jp、mapple.net
-- 座標未查證，先留空
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, lat, lng, stay_minutes,
   transport, tags, info, extra, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'shikotsuko', '支笏湖', 'spot', '千歲・新千歲機場', '戶外',
  '〒066-0281 北海道千歲市支笏湖溫泉（遊客中心）', null, null, 120,
  array['租車自駕','路線巴士'], array['湖景','雪景','拍照','散步道'],
  jsonb_build_object(
    'fee',   '湖畔免費；遊客中心免費（停車場收費，冬季費用待確認）',
    'stay',  '約 1～2 小時',
    'hours', '湖畔自由參觀；遊客中心冬季（12～3 月）約 9:30～16:00 或 16:30（待確認），週二與年末年始休館',
    'tips',  '⚠️ 遊覽船冬季停駛；冬季路況多變，自駕前先查道路資訊；冰濤祭通常在 1 月底～2 月，行程期間看不到'
  ),
  jsonb_build_array(
    jsonb_build_object('k','電話','v','0123-25-2404（支笏湖遊客中心）'),
    jsonb_build_object('k','交通說明','v','新千歲機場開車約 40 分、搭北海道中央巴士約 60 分；札幌市區開車約 70～75 分')
  ),
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = '支笏湖' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「支笏湖」
select name, area, info->>'fee' as fee from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and name = '支笏湖' and deleted_at is null;
