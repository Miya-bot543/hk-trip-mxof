-- 清掉記帳測試資料（2026-10-17）：所有帳目、分攤、旅行成員，以及這三種的異動紀錄
-- 不會動：行程、口袋名單、共用匯率
begin;
delete from public.expense_splits where trip_id = '94419d88-c426-4b67-b963-b0029b223886';
delete from public.expenses       where trip_id = '94419d88-c426-4b67-b963-b0029b223886';
delete from public.travelers      where trip_id = '94419d88-c426-4b67-b963-b0029b223886';
delete from public.change_log     where trip_id = '94419d88-c426-4b67-b963-b0029b223886'
  and table_name in ('expenses', 'expense_splits', 'travelers');
commit;

-- 檢查：三個數字都應該是 0
select
  (select count(*) from public.expenses       where trip_id = '94419d88-c426-4b67-b963-b0029b223886') as expenses,
  (select count(*) from public.expense_splits where trip_id = '94419d88-c426-4b67-b963-b0029b223886') as splits,
  (select count(*) from public.travelers      where trip_id = '94419d88-c426-4b67-b963-b0029b223886') as travelers;
