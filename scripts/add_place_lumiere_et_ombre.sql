-- 2026-10-31 口袋名單新增「Lumière et ombre 巧克力甜點店」（可重複執行，已存在就不會重複新增）
-- 資料來源：sapporo-list.info、ekiten.jp（2023/09 更新）、店家 X @ombre_et 簡介
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'lumiere_et_ombre', 'Lumière et ombre 巧克力甜點店', 'shop', '札幌（市區其他）', '室內',
  '北海道札幌市中央区南13条西23丁目2-3', 'リュミエール エ オンブル', '北海道札幌市中央区南13条西23丁目2-3', '011-796-2904',
  array['市電','公車'], array['巧克力','甜點','伴手禮'],
  jsonb_build_object(
    'hours',  '11:00～18:00（另有網站寫到 19:00，待確認）',
    'closed', '週二、週三；年末年始營業待確認',
    'buy',    'Concorde 巧克力霜淇淋、巧克力蛋糕、巧克力脆片（Feuilletine）、可可豆、餅乾'
  ),
  jsonb_build_array(
    jsonb_build_object('k','交通說明','v','市電「西線14条」站步行約 11～12 分；公車「啓明ターミナル」站步行約 1 分'),
    jsonb_build_object('k','距離札幌民宿','v','往西約 2 公里（依街區估算），步行約 25～30 分'),
    jsonb_build_object('k','內用','v','沒有內用座位，只能外帶'),
    jsonb_build_object('k','付款','v','店家 X 曾寫只收現金，可能是舊資訊')
  ),
  '巧克力專門的甜點店，蛋糕和巧克力都用很濃的可可，也有加酒的大人口味。12/29（二）、12/30（三）是固定公休，住札幌民宿那兩天（12/31、01/01）剛好是年末年始，出發前請先打電話確認。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = 'Lumière et ombre 巧克力甜點店' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「Lumière et ombre 巧克力甜點店」
select name, area, phone, info->>'hours' as hours from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and name = 'Lumière et ombre 巧克力甜點店' and deleted_at is null;
