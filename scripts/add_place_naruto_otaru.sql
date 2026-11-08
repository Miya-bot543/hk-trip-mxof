-- 2026-11-08 口袋名單新增「若雞時代なると 本店」（可重複執行，已存在就不會重複新增）
-- 資料來源：NAVITIME navitime.co.jp、Walkerplus walkerplus.com、GLTJP gltjp.com（公休寫法不同，以店家電話確認為準）
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'naruto_otaru', '若雞時代なると 本店', 'food', '小樽', '室內',
  '北海道小樽市稲穂3-16-13', '若鶏時代なると 本店', '北海道小樽市稲穂3-16-13', '0134-32-3280',
  array['步行'], array['炸半隻雞','小樽在地美食'],
  jsonb_build_object(
    'branch',  '本店',
    'dish',    '炸半隻雞（若鶏半身揚げ）、壽司、丼飯',
    'budget',  '炸半隻雞約 ¥980（各網站價格不一，待確認）',
    'hours',   '11:00～21:00（L.O. 20:30）',
    'closed',  '1/1 休（另有網站寫不定休）；年末營業待確認',
    'reserve', '待確認',
    'queue',   '待確認'
  ),
  jsonb_build_array(
    jsonb_build_object('k','電話','v','0134-32-3280'),
    jsonb_build_object('k','外帶','v','店門口有 24 小時炸半隻雞販賣機')
  ),
  '小樽在地的炸半隻雞老店，只用鹽和胡椒調味，外皮酥脆、裡面多汁。12/30（三）去之前請先打電話確認有沒有開。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = '若雞時代なると 本店' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「若雞時代なると 本店」
select name, area, phone, info->>'hours' as hours from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and name = '若雞時代なると 本店' and deleted_at is null;
