-- 2026-11-18 口袋名單新增「吉伊卡哇 もぐもぐ本舗 小樽店」（可重複執行，已存在就不會重複新增）
-- 資料來源：官網 chiikawamogumogu.jp/stores/otaru/、chiikawamogumogu.jp/yoyaku/、chiifan.com/articles/111.html（11/17 更新）、PR TIMES prtimes.jp/main/html/rd/p/000000163.000035374.html
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'chiikawa_otaru', '吉伊卡哇 もぐもぐ本舗 小樽店', 'shop', '小樽', '室內',
  '北海道小樽市堺町6-1', 'ちいかわもぐもぐ本舗 小樽店', '北海道小樽市堺町6-1', '0134-65-7172',
  array['步行'], array['吉伊卡哇','小樽限定','堺町通','伴手禮'],
  jsonb_build_object(
    'buy',    '小樽限定變成長尾山雀了！玩偶 3 種，各 ¥2,420',
    'hours',  '9:30～17:30',
    'closed', '無休（可能依季節調整）；年末年始營業待確認'
  ),
  jsonb_build_array(
    jsonb_build_object('k','預約規則','v','需透過官方 LINE 預約系統申請，入場前一晚 20:00 開放「先着順（先搶先贏）」模式，每人皆需各自持有一張數位票券'),
    jsonb_build_object('k','交通說明','v','在堺町通上，南小樽站走路約 8 分鐘，可以和 LeTAO、小樽運河一起逛')
  ),
  '2026 年 7 月開的北海道第一家吉伊卡哇もぐもぐ本舗，有約 90 種小樽限定商品。熱門商品可能缺貨。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and legacy_id = 'chiikawa_otaru' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「吉伊卡哇 もぐもぐ本舗 小樽店」
select name, area, phone, info->>'buy' as buy, extra from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and legacy_id = 'chiikawa_otaru' and deleted_at is null;
