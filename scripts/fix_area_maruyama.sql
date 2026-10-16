-- 2026-10-16 口袋名單整理（可重複執行）
-- 地區「札幌（圓山・宮之森）」改成「札幌（圓山）」
update public.places
   set area = '札幌（圓山）', updated_by = '整理', updated_at = now()
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
   and area = '札幌（圓山・宮之森）';

-- 結果確認：應該看到 2 筆「札幌（圓山）」
select name, area, tags from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and area like '札幌（圓山%'
 order by name;
