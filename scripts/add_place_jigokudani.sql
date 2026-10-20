-- 2026-10-20 口袋名單新增「登別地獄谷」（可重複執行，已存在就不會重複新增）
-- 資料來源：北海道觀光官網 visit-hokkaido.jp、登別國際觀光會議協會 noboribetsu-spa.jp
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, lat, lng, stay_minutes,
   transport, tags, info, extra, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'jigokudani', '登別地獄谷', 'spot', '登別', '戶外',
  '〒059-0551 北海道登別市登別温泉町', 42.4974278, 141.146399, 60,
  array['步行','租車自駕'], array['火山景觀','散步道','拍照'],
  jsonb_build_object(
    'fee',   '免費（地獄谷停車場普通車 500 日圓／次）',
    'stay',  '約 30～60 分',
    'hours', '自由參觀；夜間「鬼火之路」點燈 日落～21:30',
    'tips',  '⚠️ 冬季部分步道可能封閉、背陰處容易結冰，建議穿防滑鞋；冬季步道與點燈狀況請先向登別觀光協會確認'
  ),
  jsonb_build_array(
    jsonb_build_object('k','洽詢','v','登別觀光協會 0143-84-3311'),
    jsonb_build_object('k','交通說明','v','登別溫泉巴士站步行約 10 分；登別東 IC 開車約 10 分')
  ),
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = '登別地獄谷' and deleted_at is null
);

-- 結果確認：應該看到 1 筆「登別地獄谷」
select name, area, info->>'fee' as fee from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and name = '登別地獄谷' and deleted_at is null;
