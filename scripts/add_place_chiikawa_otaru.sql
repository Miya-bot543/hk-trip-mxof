-- 2026-11-18 口袋名單新增「吉伊卡哇 もぐもぐ本舗 小樽店」（可重複執行，已存在就不會重複新增）
-- 資料來源：PR TIMES prtimes.jp/main/html/rd/p/000000163.000035374.html、gamepedia premium.gamepedia.jp/hobby/archives/180494、tinpanblog.com/?p=14737
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'chiikawa_otaru', '吉伊卡哇 もぐもぐ本舗 小樽店', 'shop', '小樽', '室內',
  '北海道小樽市堺町6-1', 'ちいかわもぐもぐ本舗 小樽店', '北海道小樽市堺町6-1', null,
  array['步行'], array['吉伊卡哇','小樽限定','堺町通','伴手禮'],
  jsonb_build_object(
    'buy',    '小樽限定「變成長尾山雀了！」玩偶（シマエナガになっちゃった！ぬいぐるみ，全 3 種，各 ¥2,420）',
    'hours',  '9:30～17:30（店內ベビーカステラ 10:00～17:00），冬季時間待確認',
    'closed', '無休（可能依季節調整）；年末年始營業待確認'
  ),
  jsonb_build_array(
    jsonb_build_object('k','交通說明','v','在堺町通上，南小樽站走路約 8 分鐘，可以和 LeTAO、小樽運河一起逛'),
    jsonb_build_object('k','滿額贈','v','店內消費滿 ¥3,000 送壓克力吊飾（開幕時資訊，現在還有沒有待確認）')
  ),
  '2026 年 7 月開的北海道第一家吉伊卡哇もぐもぐ本舗，有約 90 種小樽限定商品。熱門商品可能缺貨。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and legacy_id = 'chiikawa_otaru' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「吉伊卡哇 もぐもぐ本舗 小樽店」
select name, area, info->>'buy' as buy, info->>'hours' as hours from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and legacy_id = 'chiikawa_otaru' and deleted_at is null;
