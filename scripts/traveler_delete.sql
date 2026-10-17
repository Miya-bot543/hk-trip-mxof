-- 6.2 第 1 步：旅伴刪除（可重複執行）
-- 已有記帳紀錄（付款或分攤，含已刪除的帳）→ 改成 active=false 隱藏，回傳 'hidden'
-- 沒有任何紀錄 → 直接刪除（想去／已去標記一併刪除），回傳 'deleted'
create or replace function public.traveler_delete(p_trip uuid, p_code text, p_actor text, p_id uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_before jsonb; v_used boolean;
begin
  perform public._check_code(p_trip, p_code);
  select to_jsonb(x) into v_before from public.travelers x where x.id = p_id and x.trip_id = p_trip;
  if v_before is null then raise exception 'not_found'; end if;
  v_used := exists (select 1 from public.expenses where paid_by = p_id)
         or exists (select 1 from public.expense_splits where traveler_id = p_id);
  if v_used then
    update public.travelers set active = false, updated_at = now() where id = p_id and trip_id = p_trip;
    perform public._log(p_trip, 'travelers', p_id::text, 'hide', p_actor, v_before);
    return 'hidden';
  end if;
  delete from public.travelers where id = p_id and trip_id = p_trip;
  perform public._log(p_trip, 'travelers', p_id::text, 'delete', p_actor, v_before);
  return 'deleted';
end $$;

revoke all on function public.traveler_delete(uuid, text, text, uuid) from public;
grant execute on function public.traveler_delete(uuid, text, text, uuid) to anon, authenticated;

select 'traveler_delete 建立完成' as result;
