-- 2026-10-27 旭川一日遊（12/29）行程細節（可重複執行）
-- 1. 固定卡 note 補上集合時間地點與景點
update public.itinerary_items
   set note = '07:50 大通站 31 號出口集合（07:40 前到）；旭山動物園 → Ken & Mary 之樹 → 白鬚瀑布 → 白金青池 → 森林精靈露臺；約 17:50 回大通；TWD 1,710／每位',
       updated_by = '整理', updated_at = now()
 where id = 'c3ac9bc4-1940-46eb-9b9d-763ccde2c650'
   and trip_id = '94419d88-c426-4b67-b963-b0029b223886';

-- 2. 07 森林精靈露臺：改 note
update public.places
   set note = '森林裡 15 間小木屋組成的工藝小店街，雪夜點燈很夢幻。12/29 旭川一日遊會停留約 30 分（15:00），露臺關閉時改去拓真館。',
       updated_by = '整理', updated_at = now()
 where id = 'fb41f7f4-ff0f-4b5e-8e3c-b9be6166702b'
   and trip_id = '94419d88-c426-4b67-b963-b0029b223886';

-- 3. 07 森林精靈露臺：標成已排入 12/29 下午（鎖定，不會出現在 05 規劃板）
insert into public.itinerary_items
  (trip_id, day, slot, position, place_id, place_snapshot, title, kind, locked, status, note, created_by, updated_by)
select '94419d88-c426-4b67-b963-b0029b223886', '2026-12-29', 'afternoon', 1,
       'fb41f7f4-ff0f-4b5e-8e3c-b9be6166702b',
       '{"name":"森林精靈露臺（ニングルテラス）","area":"富良野"}'::jsonb,
       '森林精靈露臺（ニングルテラス）', 'visit', true, 'must', '旭川一日遊行程內，15:00 停留約 30 分', '整理', '整理'
 where not exists (
   select 1 from public.itinerary_items
    where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
      and place_id = 'fb41f7f4-ff0f-4b5e-8e3c-b9be6166702b'
      and day = '2026-12-29' and deleted_at is null);

-- 結果確認：應該看到 2 筆 12/29 的資料
select day, slot, title, kind, locked, note from public.itinerary_items
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and day = '2026-12-29' and deleted_at is null
 order by slot, position;
