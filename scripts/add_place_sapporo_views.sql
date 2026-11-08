-- 2026-11-08 口袋名單新增「藻岩山」「札幌市時計台」「札幌電視塔」「JR 塔展望室 T38」（可重複執行，已存在就不會重複新增）
-- 資料來源：北海道觀光官網 visit-hokkaido.jp、NAVITIME、るるぶ、Walkerplus 等（年末年始營業各站寫法不一，以官網或電話確認為準）
-- 官網：藻岩山 mt-moiwa.jp、電視塔 tv-tower.co.jp、T38 jr-tower.com/t38

-- 1. 藻岩山
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'moiwayama', '藻岩山', 'spot', '札幌（市區其他）', '戶外',
  '北海道札幌市中央区伏見5丁目3-7（山麓站）', '011-561-8177',
  array['市電（路面電車）','路線巴士'], array['夜景','纜車','展望台'],
  jsonb_build_object(
    'fee',   '纜車往返大人 ¥2,100（以官網為準）',
    'stay',  '約 1.5～2 小時',
    'hours', '冬季（12～3 月）11:00～22:00（上山末班 21:30）',
    'tips',  '⚠️ 12/31、1/1 有網站寫休業，也有網站寫特別營業 11:00～17:00，請先確認；天候不佳會停駛；山頂很冷要穿暖'
  ),
  jsonb_build_array(
    jsonb_build_object('k','電話','v','011-561-8177（札幌藻岩山纜車）')
  ),
  '札幌代表性的夜景展望台，搭纜車上山可以俯瞰整個札幌市區。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = '藻岩山' and deleted_at is null
);

-- 2. 札幌市時計台
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'clocktower', '札幌市時計台', 'spot', '札幌（大通）', '室內',
  '北海道札幌市中央区北1条西2丁目', '011-231-0838',
  array['地下鐵','步行'], array['歷史建築','拍照'],
  jsonb_build_object(
    'fee',   '大人 ¥350（以官網為準）',
    'stay',  '約 30 分',
    'hours', '8:45～17:10（最後入館 17:00）',
    'tips',  '⚠️ 11～5 月週一休館（12/28 是週一）；年末年始有網站寫 12/29～1/3 休館，也有寫只休 1/1～1/3，請先確認。外觀隨時可以拍'
  ),
  jsonb_build_array(
    jsonb_build_object('k','電話','v','011-231-0838')
  ),
  '舊札幌農學校演武場，札幌最有名的地標之一，館內可以參觀。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = '札幌市時計台' and deleted_at is null
);

-- 3. 札幌電視塔
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'tvtower', '札幌電視塔', 'spot', '札幌（大通）', '室內',
  '北海道札幌市中央区大通西1丁目',
  array['地下鐵','步行'], array['展望台','夜景','大通公園'],
  jsonb_build_object(
    'fee',   '展望台大人 ¥1,200（以官網為準）',
    'stay',  '約 30 分～1 小時',
    'hours', '9:00～22:00（最後入場 21:50），不定休',
    'tips',  '年末年始營業時間待確認，跨年前後人多'
  ),
  jsonb_build_array(
    jsonb_build_object('k','交通說明','v','地下鐵大通站 27 號出口直結')
  ),
  '大通公園東端的展望塔，可以從上面看整條大通公園。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = '札幌電視塔' and deleted_at is null
);

-- 4. JR 塔展望室 T38
insert into public.places
  (trip_id, legacy_id, name, category, area, venue, address, phone,
   transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
select
  '94419d88-c426-4b67-b963-b0029b223886', 'jrtower_t38', 'JR 塔展望室 T38', 'spot', '札幌（札幌站周邊）', '室內',
  '北海道札幌市中央区北5条西2丁目5 JR塔 38F', '011-209-5500',
  array['JR 電車／鐵路','地下鐵','步行'], array['展望台','夜景','雨雪天 OK'],
  jsonb_build_object(
    'fee',   '大人 ¥740（以官網為準）',
    'stay',  '約 30 分～1 小時',
    'hours', '10:00～22:00（最後入場 21:30）',
    'tips',  '從 6 樓櫃檯買票，搭專用電梯上 38 樓；年末年始營業待確認'
  ),
  jsonb_build_array(
    jsonb_build_object('k','電話','v','011-209-5500')
  ),
  'JR 札幌站上方 JR 塔的 38 樓展望室，全室內，下雪天也能看夜景。',
  true, '整理', '整理'
where not exists (
  select 1 from public.places
   where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
     and name = 'JR 塔展望室 T38' and deleted_at is null
);

-- 結果確認：應該看到 4 筆
select name, area, info->>'hours' as hours from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
   and name in ('藻岩山','札幌市時計台','札幌電視塔','JR 塔展望室 T38') and deleted_at is null;
