-- 2026-11-08 口袋名單新增「輸送帶壽司 Toppi～ 小樽運河通店」（可重複執行，已存在就不會重複新增）
-- 資料來源：るるぶ rurubu.jp、EPARK epark.jp（兩邊營業時間、公休寫法不同，以店家電話確認為準）
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'toppi_otaru', '輸送帶壽司 Toppi～ 小樽運河通店', 'food', '小樽', '室內',
  '北海道小樽市港町6-4', '回転寿司 とっぴ～ 小樽運河通り店', '北海道小樽市港町6-4', '0134-27-8111',
  array['步行'], array['迴轉壽司','12/30（三）政壽司替代'],
  jsonb_build_object(
    'branch',  '小樽運河通り店',
    'dish',    '迴轉壽司',
    'budget',  '待確認',
    'hours',   '約 11:00～20:30 L.O.（另有網站寫 10:00～21:00，待確認）',
    'closed',  '不定休（另有網站寫無公休）；年末年始營業待確認',
    'reserve', '待確認',
    'queue',   '待確認'
  ),
  jsonb_build_array(
    jsonb_build_object('k','電話','v','0134-27-8111')
  ),
  '12/30（三）政壽司公休，改排這間當替代。營業時間和公休各網站寫的不一樣，出發前請先打電話確認 12/30 有沒有開。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = '輸送帶壽司 Toppi～ 小樽運河通店' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「輸送帶壽司 Toppi～ 小樽運河通店」
select name, area, phone, info->>'hours' as hours from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and name = '輸送帶壽司 Toppi～ 小樽運河通店' and deleted_at is null;
