-- 2026-11-03 口袋名單新增「味之大王 登別溫泉店 拉麵」（可重複執行，已存在就不會重複新增）
-- 資料來源：るるぶ、まっぷる、ゆこゆこ（各網站資訊不一致）
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'ajinodaiou_noboribetsu', '味之大王 登別溫泉店 拉麵', 'food', '登別', '室內',
  '北海道登別市登別温泉町29-9', '味の大王 登別温泉店', '北海道登別市登別温泉町29-9', '0143-84-2415',
  array['步行'], array['拉麵','地獄拉麵','溫泉街'],
  jsonb_build_object(
    'branch', '登別温泉店',
    'dish', '地獄拉麵（辣度從 0 丁目往上選）；咖哩拉麵待確認',
    'hours', '11:30～15:00（有網站寫晚上 21:00～0:00 也有開，待確認）',
    'closed', '不定休（有網站寫週二）；12/31～01/02 休',
    'reserve', '待確認',
    'queue', '待確認',
    'budget', '約 ¥1,000'
  ),
  jsonb_build_array(
    jsonb_build_object('k','電話','v','0143-84-2415'),
    jsonb_build_object('k','交通說明','v','登別溫泉街上，從 adex inn 步行可到')
  ),
  '登別溫泉街的人氣拉麵，招牌地獄拉麵可以一丁目一丁目往上加辣。各網站的營業時間對不起來，去之前先打電話問。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = '味之大王 登別溫泉店 拉麵' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「味之大王 登別溫泉店 拉麵」
select name, area, phone, info->>'hours' as hours from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and name = '味之大王 登別溫泉店 拉麵' and deleted_at is null;
