-- 2026-11-03 口袋名單新增「迴轉壽司 Toriton 圓山店」（可重複執行，已存在就不會重複新增）
-- 資料來源：トリトン官網 toriton-kita1.jp/shop/maruyama/
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'toriton_maruyama', '迴轉壽司 Toriton 圓山店', 'food', '札幌（圓山）', '室內',
  '〒064-0824 北海道札幌市中央区北4条西23丁目2番17号', '回転寿し トリトン 円山店', '〒064-0824 北海道札幌市中央区北4条西23丁目2番17号', '011-633-5500',
  array['地鐵','步行'], array['迴轉壽司','平價','北海道海鮮'],
  jsonb_build_object(
    'branch', '円山店',
    'dish', '生干貝、鮭魚等北海道海鮮',
    'hours', '11:00～22:00（L.O. 21:30）',
    'closed', '官網沒寫；年末年始營業待確認',
    'reserve', '不接受預約',
    'queue', '可用官網的 LINE 查看候位狀況',
    'budget', '待確認'
  ),
  jsonb_build_array(
    jsonb_build_object('k','電話','v','011-633-5500'),
    jsonb_build_object('k','交通說明','v','地下鐵東西線「西28丁目」站步行約 5 分'),
    jsonb_build_object('k','外帶','v','可用官網 WEB、電話預訂外帶'),
    jsonb_build_object('k','順遊','v','北海道神宮、圓山公園也在口袋名單，同一區')
  ),
  '北見起家的人氣迴轉壽司，札幌市區沒有分店，圓山店是住宿點搭地鐵最好到的一家。熱門時段排隊很久，建議避開正餐時間。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = '迴轉壽司 Toriton 圓山店' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「迴轉壽司 Toriton 圓山店」
select name, area, phone, info->>'hours' as hours from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and name = '迴轉壽司 Toriton 圓山店' and deleted_at is null;
