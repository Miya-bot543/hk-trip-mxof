-- 2026-10-19
-- 1. 清掉 05 行程規劃板的測試資料：所有非固定（locked = false）的行程，以及它們的異動紀錄
--    不會動：固定骨架（航班、租車、住宿等 locked = true 的 19 筆）、口袋名單、共用匯率
-- 2. 07 口袋名單新增「海膽丼專門店 凪〜nagi〜」（資料來源：店家官網 unidon-nagi.com）
begin;

delete from public.change_log
where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
  and table_name = 'itinerary_items'
  and row_id in (select id::text from public.itinerary_items
                 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and locked = false);

delete from public.itinerary_items
where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and locked = false;

insert into public.places (trip_id, name, category, area, venue, address, ja_name, ja_address, phone,
                           lat, lng, stay_minutes, transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
values ('94419d88-c426-4b67-b963-b0029b223886',
  '海膽丼專門店 凪〜nagi〜', 'food', '札幌（大通）', '室內',
  '〒060-0062 北海道札幌市中央區南二條西1丁目5-6 第二廣和大樓 3F',
  'うに丼専門店 凪〜nagi〜', '〒060-0062 北海道札幌市中央区南二条西1-5-6 第2広和ビル 3F', '011-252-7088',
  43.058037, 141.35643, 60,
  array['地下鐵','步行'], array['海膽丼','蟹味噌湯','可預約'],
  jsonb_build_object(
    'hours',   '11:00～15:00（L.O. 14:30）、17:00～20:00（L.O. 19:30）',
    'closed',  '週日（年末年始營業日待確認）',
    'dish',    '【海膽丼】松（頂級馬糞海膽）、【松與梅】雙色海膽丼、海膽鮭魚卵丼／海膽帝王蟹丼；丼飯附螃蟹味噌湯',
    'reserve', '待確認',
    'queue',   '店內 18 席，可電話或官網「ネット予約」預約',
    'budget',  '約 ¥6,000～7,999'),
  jsonb_build_array(
    jsonb_build_object('k','電話','v','011-252-7088'),
    jsonb_build_object('k','交通說明','v','地下鐵大通站、薄野站各步行約 7 分；狸小路附近'),
    jsonb_build_object('k','付款','v','可刷卡（VISA、Master、JCB、AMEX、Diners），也能用 PayPay、Alipay 等')),
  '工廠直營的海膽丼專門店，海膽丼分松、竹、梅三種，都附蟹汁。有繁體中文平板點餐，建議提早預約免排隊。',
  true, '匯入', '匯入');

commit;

-- 檢查：非固定行程應該是 0；固定行程應該是 19；凪應該是 1
select
  (select count(*) from public.itinerary_items where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and locked = false) as test_items,
  (select count(*) from public.itinerary_items where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and locked = true)  as fixed_items,
  (select count(*) from public.places where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and name like '海膽丼專門店 凪%' and deleted_at is null) as nagi;
