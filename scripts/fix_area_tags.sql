-- 2026-10-16 口袋名單整理（可重複執行）
-- 1. 地區「札幌（大通・狸小路）」改成「札幌（大通）」
-- 2. 標籤裡跟地區名稱完全相同的字刪掉（狸小路是商店街，不算地區，保留）
begin;

update public.places
   set area = '札幌（大通）', updated_by = '整理', updated_at = now()
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
   and area = '札幌（大通・狸小路）';

update public.places p
   set tags = array(select t from unnest(p.tags) t
                     where t not in ('札幌','薄野','大通','札幌站','中島公園','圓山','宮之森','手稻','定山溪','小樽',
                                     '登別','白老','洞爺湖','室蘭','千歲','新千歲機場','苫小牧','旭川','美瑛','富良野',
                                     '層雲峽','二世谷','函館','北海道')),
       updated_by = '整理', updated_at = now()
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
   and tags && array['札幌','薄野','大通','札幌站','中島公園','圓山','宮之森','手稻','定山溪','小樽',
                     '登別','白老','洞爺湖','室蘭','千歲','新千歲機場','苫小牧','旭川','美瑛','富良野',
                     '層雲峽','二世谷','函館','北海道'];

commit;

-- 結果確認：應該看到 4 筆「札幌（大通）」，且沒有任何地區標籤
select name, area, tags from public.places
 where trip_id = '94419d88-c426-4b67-b963-b0029b223886' and area like '札幌（大通%'
 order by name;
