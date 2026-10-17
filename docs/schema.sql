-- =====================================================================
-- 北海道 10 日遊 v2：Supabase 資料表建立指令
-- 設計重點：
--   1. 不需要登入。任何人可以「讀取」（看網站）。
--   2. 「新增／修改／刪除」一律透過下方的 RPC 函式，並且必須帶「家庭通關碼」。
--      資料表本身不開放匿名直接寫入（RLS 擋掉），所以就算公開金鑰在網頁裡也改不了資料。
--   3. 刪除採「軟刪除」（deleted_at），可以還原；所有寫入都記錄在 change_log。
--   4. 收藏清單（places）與每日行程（itinerary_items）分離，用 place_id 關聯。
--   5. 多幣別記帳：每筆記錄原幣別金額＋當下匯率，結算用旅程主要幣別（TWD）。
-- 執行方式：Supabase 後台 SQL Editor 整份貼上執行，或由 Claude Code 用 Supabase CLI 套用。
-- 本檔可重複執行（使用 if not exists / or replace）。
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. 旅程
-- ---------------------------------------------------------------------
create table if not exists public.trips (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,               -- 例如 'hokkaido-2026'
  name            text not null,
  start_date      date not null,
  end_date        date not null,
  base_currency   char(3) not null default 'TWD',
  edit_code_hash  text,                               -- 家庭通關碼（bcrypt 雜湊，絕不回傳給前端）
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. 旅伴（記帳分帳用；只用暱稱，不放真實姓名）
-- ---------------------------------------------------------------------
create table if not exists public.travelers (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  nickname     text not null check (char_length(nickname) between 1 and 20),
  group_label  text,                                  -- 例如 '中華組'、'星宇組'
  color        text,
  sort         int not null default 0,
  active       boolean not null default true,
  updated_at   timestamptz not null default now()
);
create index if not exists travelers_trip_idx on public.travelers(trip_id);

-- ---------------------------------------------------------------------
-- 3. 地點資料庫＝收藏清單（口袋名單）：景點、餐廳、購物、住宿…
-- ---------------------------------------------------------------------
create table if not exists public.places (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  legacy_id     text,                                 -- 舊版 id，例如 'aoao'，方便對照
  name          text not null check (char_length(name) between 1 and 80),
  category      text not null default 'spot' check (category in ('spot','food','shop','hotel','transport','other')),
  area          text,                                 -- 例如 '札幌（大通・狸小路）'
  venue         text check (venue in ('室內','戶外','園區') or venue is null),
  address       text,
  ja_name       text,
  ja_address    text,
  phone         text,
  lat           double precision,
  lng           double precision,
  stay_minutes  int check (stay_minutes is null or stay_minutes between 5 and 720),
  transport     text[] not null default '{}',
  tags          text[] not null default '{}',
  info          jsonb  not null default '{}'::jsonb,  -- 分類專屬欄位（hours/fee/closed/dish/reserve…）
  extra         jsonb  not null default '[]'::jsonb,  -- 自訂欄位 [{k,v}]
  note          text,
  is_wishlist   boolean not null default true,        -- 出現在口袋名單（住宿等可設 false）
  created_by    text,                                 -- 操作者暱稱（非登入帳號）
  updated_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists places_trip_idx on public.places(trip_id) where deleted_at is null;

-- 每位旅伴的「♡ 想去」「✓ 已去」
create table if not exists public.place_marks (
  place_id     uuid not null references public.places(id) on delete cascade,
  traveler_id  uuid not null references public.travelers(id) on delete cascade,
  trip_id      uuid not null references public.trips(id) on delete cascade,
  want         boolean not null default false,
  done         boolean not null default false,
  updated_at   timestamptz not null default now(),
  primary key (place_id, traveler_id)
);

-- ---------------------------------------------------------------------
-- 4. 每日行程（與收藏分離；place_id 可為空＝自訂或固定行程）
-- ---------------------------------------------------------------------
create table if not exists public.itinerary_items (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references public.trips(id) on delete cascade,
  day             date not null,
  slot            text not null default 'morning' check (slot in ('allday','morning','afternoon','evening')),
  position        double precision not null default 0,          -- 同一天同時段內的排序
  place_id        uuid references public.places(id) on delete set null,
  place_snapshot  jsonb not null default '{}'::jsonb,           -- 加入當下的 name/address/lat/lng，地點被刪除時仍可顯示
  title           text,                                          -- 自訂或固定行程的標題
  kind            text not null default 'visit' check (kind in ('fixed','visit','meal','move','note')),
  start_time      time,
  end_time        time,
  locked          boolean not null default false,               -- 固定骨架：一鍵排序不可移動、不可刪除
  pinned          boolean not null default false,               -- 使用者釘選：排序時保留時間
  status          text not null default 'must' check (status in ('must','maybe')),
  group_label     text,                                          -- 只適用某組時填，例如 '星宇組'
  note            text,
  created_by      text,
  updated_by      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists items_trip_day_idx on public.itinerary_items(trip_id, day) where deleted_at is null;

-- ---------------------------------------------------------------------
-- 5. 匯率與記帳分帳
-- ---------------------------------------------------------------------
create table if not exists public.fx_rates (
  trip_id       uuid not null references public.trips(id) on delete cascade,
  currency      char(3) not null,
  rate_to_base  numeric(18,8) not null check (rate_to_base > 0),   -- 1 單位外幣 = ? 主要幣別
  updated_by    text,
  updated_at    timestamptz not null default now(),
  primary key (trip_id, currency)
);

create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  spent_on      date not null,
  title         text not null check (char_length(title) between 1 and 80),
  category      text not null default 'food' check (category in ('food','transport','ticket','shopping','lodging','other')),
  amount        numeric(14,2) not null check (amount >= 0),
  currency      char(3) not null default 'JPY',
  rate_to_base  numeric(18,8) not null check (rate_to_base > 0),   -- 記帳當下的匯率（之後改匯率不影響舊帳）
  paid_by       uuid not null references public.travelers(id),
  split_mode    text not null default 'equal' check (split_mode in ('equal','shares','exact')),
  place_id      uuid references public.places(id) on delete set null,
  note          text,
  created_by    text,
  updated_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists expenses_trip_idx on public.expenses(trip_id) where deleted_at is null;

create table if not exists public.expense_splits (
  expense_id    uuid not null references public.expenses(id) on delete cascade,
  traveler_id   uuid not null references public.travelers(id),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  shares        numeric(10,4) not null default 1 check (shares >= 0),  -- equal/shares 模式用
  amount        numeric(14,2),                                         -- exact 模式用（原幣別）
  primary key (expense_id, traveler_id)
);

-- ---------------------------------------------------------------------
-- 6. 變更紀錄（誰在什麼時候改了什麼；誤刪可還原）
-- ---------------------------------------------------------------------
create table if not exists public.change_log (
  id          bigserial primary key,
  trip_id     uuid not null references public.trips(id) on delete cascade,
  table_name  text not null,
  row_id      text not null,
  action      text not null,               -- upsert / delete / restore / reorder
  actor       text,                        -- 操作者暱稱
  before      jsonb,
  at          timestamptz not null default now()
);
create index if not exists change_log_trip_idx on public.change_log(trip_id, at desc);

-- =====================================================================
-- 權限：RLS 開啟；匿名只能讀；寫入只能透過 RPC
-- =====================================================================
alter table public.trips            enable row level security;
alter table public.travelers        enable row level security;
alter table public.places           enable row level security;
alter table public.place_marks      enable row level security;
alter table public.itinerary_items  enable row level security;
alter table public.fx_rates         enable row level security;
alter table public.expenses         enable row level security;
alter table public.expense_splits   enable row level security;
alter table public.change_log       enable row level security;

-- 讀取政策（任何人可讀；軟刪除的不顯示）
drop policy if exists read_trips on public.trips;
create policy read_trips on public.trips for select to anon, authenticated using (true);
drop policy if exists read_travelers on public.travelers;
create policy read_travelers on public.travelers for select to anon, authenticated using (true);
drop policy if exists read_places on public.places;
create policy read_places on public.places for select to anon, authenticated using (deleted_at is null);
drop policy if exists read_marks on public.place_marks;
create policy read_marks on public.place_marks for select to anon, authenticated using (true);
drop policy if exists read_items on public.itinerary_items;
create policy read_items on public.itinerary_items for select to anon, authenticated using (deleted_at is null);
drop policy if exists read_fx on public.fx_rates;
create policy read_fx on public.fx_rates for select to anon, authenticated using (true);
drop policy if exists read_expenses on public.expenses;
create policy read_expenses on public.expenses for select to anon, authenticated using (deleted_at is null);
drop policy if exists read_splits on public.expense_splits;
create policy read_splits on public.expense_splits for select to anon, authenticated using (true);
-- change_log 不開放直接讀取（只能透過 RPC 查最近紀錄）

-- 不讓前端讀到通關碼雜湊：trips 只開放部分欄位
revoke select on public.trips from anon, authenticated;
grant  select (id, slug, name, start_date, end_date, base_currency, created_at) on public.trips to anon, authenticated;

-- 匿名不可直接寫入任何資料表
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;

-- =====================================================================
-- RPC 函式（全部 security definer；第一行都先檢查通關碼）
-- =====================================================================

-- 內部：檢查通關碼
create or replace function public._check_code(p_trip uuid, p_code text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_code is null or not exists (
    select 1 from public.trips t
    where t.id = p_trip and t.edit_code_hash is not null
      and t.edit_code_hash = extensions.crypt(p_code, t.edit_code_hash)
  ) then
    raise exception 'invalid_code' using errcode = '28000';
  end if;
end $$;
revoke all on function public._check_code(uuid, text) from public, anon, authenticated;

-- 前端用：驗證通關碼是否正確（回傳 true/false，不丟錯）
create or replace function public.verify_code(p_trip uuid, p_code text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._check_code(p_trip, p_code);
  return true;
exception when others then
  return false;
end $$;

-- 只能在 SQL Editor（管理者）執行：設定或更換通關碼
create or replace function public.set_edit_code(p_trip uuid, p_new_code text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if char_length(coalesce(p_new_code,'')) < 6 then
    raise exception '通關碼至少 6 個字元';
  end if;
  update public.trips set edit_code_hash = extensions.crypt(p_new_code, extensions.gen_salt('bf')) where id = p_trip;
end $$;
revoke all on function public.set_edit_code(uuid, text) from public, anon, authenticated;

-- 內部：寫變更紀錄
create or replace function public._log(p_trip uuid, p_table text, p_row text, p_action text, p_actor text, p_before jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.change_log(trip_id, table_name, row_id, action, actor, before)
  values (p_trip, p_table, p_row, p_action, left(p_actor, 20), p_before);
$$;
revoke all on function public._log(uuid, text, text, text, text, jsonb) from public, anon, authenticated;

-- 工具：jsonb 陣列轉 text[]
create or replace function public._txt_arr(j jsonb)
returns text[] language sql immutable as $$
  select coalesce(array(select jsonb_array_elements_text(coalesce(j,'[]'::jsonb))), '{}'::text[]);
$$;

-- ---------- 地點（收藏清單） ----------
create or replace function public.place_upsert(p_trip uuid, p_code text, p_actor text, p jsonb)
returns public.places language plpgsql security definer set search_path = public, extensions as $$
declare r public.places; v_id uuid := coalesce((p->>'id')::uuid, gen_random_uuid()); v_before jsonb;
begin
  perform public._check_code(p_trip, p_code);
  select to_jsonb(x) into v_before from public.places x where x.id = v_id and x.trip_id = p_trip;
  insert into public.places as t (id, trip_id, legacy_id, name, category, area, venue, address, ja_name, ja_address, phone,
                                   lat, lng, stay_minutes, transport, tags, info, extra, note, is_wishlist, created_by, updated_by)
  values (v_id, p_trip, p->>'legacy_id', p->>'name', coalesce(p->>'category','spot'), p->>'area', nullif(p->>'venue',''),
          p->>'address', p->>'ja_name', p->>'ja_address', p->>'phone',
          (p->>'lat')::double precision, (p->>'lng')::double precision, (p->>'stay_minutes')::int,
          public._txt_arr(p->'transport'), public._txt_arr(p->'tags'),
          coalesce(p->'info','{}'::jsonb), coalesce(p->'extra','[]'::jsonb), p->>'note',
          coalesce((p->>'is_wishlist')::boolean, true), left(p_actor,20), left(p_actor,20))
  on conflict (id) do update set
    name = excluded.name, category = excluded.category, area = excluded.area, venue = excluded.venue,
    address = excluded.address, ja_name = excluded.ja_name, ja_address = excluded.ja_address, phone = excluded.phone,
    lat = excluded.lat, lng = excluded.lng, stay_minutes = excluded.stay_minutes,
    transport = excluded.transport, tags = excluded.tags, info = excluded.info, extra = excluded.extra,
    note = excluded.note, is_wishlist = excluded.is_wishlist,
    updated_by = excluded.updated_by, updated_at = now(), deleted_at = null
  where t.trip_id = p_trip
  returning * into r;
  if r.id is null then raise exception 'not_found'; end if;
  perform public._log(p_trip, 'places', r.id::text, 'upsert', p_actor, v_before);
  return r;
end $$;

create or replace function public.place_delete(p_trip uuid, p_code text, p_actor text, p_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_before jsonb;
begin
  perform public._check_code(p_trip, p_code);
  select to_jsonb(x) into v_before from public.places x where x.id = p_id and x.trip_id = p_trip;
  update public.places set deleted_at = now(), updated_by = left(p_actor,20), updated_at = now()
  where id = p_id and trip_id = p_trip;
  perform public._log(p_trip, 'places', p_id::text, 'delete', p_actor, v_before);
end $$;

create or replace function public.place_restore(p_trip uuid, p_code text, p_actor text, p_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._check_code(p_trip, p_code);
  update public.places set deleted_at = null, updated_by = left(p_actor,20), updated_at = now()
  where id = p_id and trip_id = p_trip;
  perform public._log(p_trip, 'places', p_id::text, 'restore', p_actor, null);
end $$;

create or replace function public.mark_set(p_trip uuid, p_code text, p_place uuid, p_traveler uuid, p_want boolean, p_done boolean)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._check_code(p_trip, p_code);
  insert into public.place_marks as m (place_id, traveler_id, trip_id, want, done)
  select p_place, p_traveler, p_trip, coalesce(p_want,false), coalesce(p_done,false)
  where exists (select 1 from public.places where id = p_place and trip_id = p_trip)
    and exists (select 1 from public.travelers where id = p_traveler and trip_id = p_trip)
  on conflict (place_id, traveler_id) do update
    set want = coalesce(p_want, m.want), done = coalesce(p_done, m.done), updated_at = now();
end $$;

-- ---------- 每日行程 ----------
create or replace function public.item_upsert(p_trip uuid, p_code text, p_actor text, p jsonb)
returns public.itinerary_items language plpgsql security definer set search_path = public, extensions as $$
declare r public.itinerary_items; v_id uuid := coalesce((p->>'id')::uuid, gen_random_uuid()); v_before jsonb;
begin
  perform public._check_code(p_trip, p_code);
  select to_jsonb(x) into v_before from public.itinerary_items x where x.id = v_id and x.trip_id = p_trip;
  if v_before is not null and (v_before->>'locked')::boolean and not coalesce((p->>'allow_locked')::boolean,false) then
    raise exception 'locked_item';
  end if;
  insert into public.itinerary_items as t (id, trip_id, day, slot, position, place_id, place_snapshot, title, kind,
        start_time, end_time, locked, pinned, status, group_label, note, created_by, updated_by)
  values (v_id, p_trip, (p->>'day')::date, coalesce(p->>'slot','morning'), coalesce((p->>'position')::double precision, 0),
          (p->>'place_id')::uuid, coalesce(p->'place_snapshot','{}'::jsonb), p->>'title', coalesce(p->>'kind','visit'),
          (p->>'start_time')::time, (p->>'end_time')::time, coalesce((p->>'locked')::boolean,false),
          coalesce((p->>'pinned')::boolean,false), coalesce(p->>'status','must'), p->>'group_label', p->>'note',
          left(p_actor,20), left(p_actor,20))
  on conflict (id) do update set
    day = excluded.day, slot = excluded.slot, position = excluded.position, place_id = excluded.place_id,
    place_snapshot = excluded.place_snapshot, title = excluded.title, kind = excluded.kind,
    start_time = excluded.start_time, end_time = excluded.end_time, pinned = excluded.pinned,
    status = excluded.status, group_label = excluded.group_label, note = excluded.note,
    updated_by = excluded.updated_by, updated_at = now(), deleted_at = null
  where t.trip_id = p_trip
  returning * into r;
  if r.id is null then raise exception 'not_found'; end if;
  perform public._log(p_trip, 'itinerary_items', r.id::text, 'upsert', p_actor, v_before);
  return r;
end $$;

-- 一次更新多筆的日期／時段／順序／時間（拖曳、一鍵排序用）
-- p_items: [{id, day, slot, position, start_time, end_time}]
create or replace function public.items_reorder(p_trip uuid, p_code text, p_actor text, p_items jsonb)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare n int;
begin
  perform public._check_code(p_trip, p_code);
  with src as (
    select (e->>'id')::uuid as rid, (e->>'day')::date as new_day, e->>'slot' as new_slot,
           (e->>'position')::double precision as pos,
           (e ? 'start_time') as has_st, (e->>'start_time')::time as st,
           (e ? 'end_time') as has_et, (e->>'end_time')::time as et
    from jsonb_array_elements(p_items) e
  )
  update public.itinerary_items t set
    day = coalesce(src.new_day, t.day), slot = coalesce(src.new_slot, t.slot), position = coalesce(src.pos, t.position),
    start_time = case when src.has_st then src.st else t.start_time end,
    end_time   = case when src.has_et then src.et else t.end_time end,
    updated_by = left(p_actor,20), updated_at = now()
  from src
  where t.id = src.rid and t.trip_id = p_trip and t.locked = false;
  get diagnostics n = row_count;
  perform public._log(p_trip, 'itinerary_items', 'batch', 'reorder', p_actor, p_items);
  return n;
end $$;

create or replace function public.item_delete(p_trip uuid, p_code text, p_actor text, p_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_before jsonb;
begin
  perform public._check_code(p_trip, p_code);
  select to_jsonb(x) into v_before from public.itinerary_items x where x.id = p_id and x.trip_id = p_trip;
  if (v_before->>'locked')::boolean then raise exception 'locked_item'; end if;
  update public.itinerary_items set deleted_at = now(), updated_by = left(p_actor,20), updated_at = now()
  where id = p_id and trip_id = p_trip;
  perform public._log(p_trip, 'itinerary_items', p_id::text, 'delete', p_actor, v_before);
end $$;

create or replace function public.item_restore(p_trip uuid, p_code text, p_actor text, p_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._check_code(p_trip, p_code);
  update public.itinerary_items set deleted_at = null, updated_by = left(p_actor,20), updated_at = now()
  where id = p_id and trip_id = p_trip;
  perform public._log(p_trip, 'itinerary_items', p_id::text, 'restore', p_actor, null);
end $$;

-- ---------- 旅伴 ----------
create or replace function public.traveler_upsert(p_trip uuid, p_code text, p_actor text, p jsonb)
returns public.travelers language plpgsql security definer set search_path = public, extensions as $$
declare r public.travelers; v_id uuid := coalesce((p->>'id')::uuid, gen_random_uuid());
begin
  perform public._check_code(p_trip, p_code);
  insert into public.travelers as t (id, trip_id, nickname, group_label, color, sort, active)
  values (v_id, p_trip, p->>'nickname', p->>'group_label', p->>'color', coalesce((p->>'sort')::int,0), coalesce((p->>'active')::boolean,true))
  on conflict (id) do update set nickname = excluded.nickname, group_label = excluded.group_label, color = excluded.color,
    sort = excluded.sort, active = excluded.active, updated_at = now()
  where t.trip_id = p_trip
  returning * into r;
  perform public._log(p_trip, 'travelers', r.id::text, 'upsert', p_actor, null);
  return r;
end $$;

-- 已有記帳紀錄 → active=false 隱藏（回傳 'hidden'）；沒有 → 直接刪除（回傳 'deleted'）
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


-- ---------- 匯率 ----------
create or replace function public.fx_set(p_trip uuid, p_code text, p_actor text, p_currency text, p_rate numeric)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._check_code(p_trip, p_code);
  insert into public.fx_rates(trip_id, currency, rate_to_base, updated_by)
  values (p_trip, upper(p_currency), p_rate, left(p_actor,20))
  on conflict (trip_id, currency) do update set rate_to_base = excluded.rate_to_base, updated_by = excluded.updated_by, updated_at = now();
  perform public._log(p_trip, 'fx_rates', upper(p_currency), 'upsert', p_actor, null);
end $$;

-- ---------- 記帳（主檔＋分攤一起寫，單一交易） ----------
-- p: {id?, spent_on, title, category, amount, currency, rate_to_base, paid_by, split_mode, place_id?, note?,
--     splits: [{traveler_id, shares?, amount?}]}
create or replace function public.expense_upsert(p_trip uuid, p_code text, p_actor text, p jsonb)
returns public.expenses language plpgsql security definer set search_path = public, extensions as $$
declare r public.expenses; v_id uuid := coalesce((p->>'id')::uuid, gen_random_uuid()); v_before jsonb;
begin
  perform public._check_code(p_trip, p_code);
  if jsonb_array_length(coalesce(p->'splits','[]'::jsonb)) = 0 then raise exception 'no_splits'; end if;
  select to_jsonb(x) into v_before from public.expenses x where x.id = v_id and x.trip_id = p_trip;
  insert into public.expenses as t (id, trip_id, spent_on, title, category, amount, currency, rate_to_base, paid_by,
                                     split_mode, place_id, note, created_by, updated_by)
  values (v_id, p_trip, (p->>'spent_on')::date, p->>'title', coalesce(p->>'category','food'), (p->>'amount')::numeric,
          upper(coalesce(p->>'currency','JPY')), (p->>'rate_to_base')::numeric, (p->>'paid_by')::uuid,
          coalesce(p->>'split_mode','equal'), (p->>'place_id')::uuid, p->>'note', left(p_actor,20), left(p_actor,20))
  on conflict (id) do update set
    spent_on = excluded.spent_on, title = excluded.title, category = excluded.category, amount = excluded.amount,
    currency = excluded.currency, rate_to_base = excluded.rate_to_base, paid_by = excluded.paid_by,
    split_mode = excluded.split_mode, place_id = excluded.place_id, note = excluded.note,
    updated_by = excluded.updated_by, updated_at = now(), deleted_at = null
  where t.trip_id = p_trip
  returning * into r;
  if r.id is null then raise exception 'not_found'; end if;
  delete from public.expense_splits where expense_id = r.id;
  insert into public.expense_splits(expense_id, traveler_id, trip_id, shares, amount)
  select r.id, (s->>'traveler_id')::uuid, p_trip, coalesce((s->>'shares')::numeric,1), (s->>'amount')::numeric
  from jsonb_array_elements(p->'splits') s;
  perform public._log(p_trip, 'expenses', r.id::text, 'upsert', p_actor, v_before);
  return r;
end $$;

create or replace function public.expense_delete(p_trip uuid, p_code text, p_actor text, p_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_before jsonb;
begin
  perform public._check_code(p_trip, p_code);
  select to_jsonb(x) into v_before from public.expenses x where x.id = p_id and x.trip_id = p_trip;
  update public.expenses set deleted_at = now(), updated_by = left(p_actor,20), updated_at = now()
  where id = p_id and trip_id = p_trip;
  perform public._log(p_trip, 'expenses', p_id::text, 'delete', p_actor, v_before);
end $$;

create or replace function public.expense_restore(p_trip uuid, p_code text, p_actor text, p_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._check_code(p_trip, p_code);
  update public.expenses set deleted_at = null, updated_by = left(p_actor,20), updated_at = now()
  where id = p_id and trip_id = p_trip;
  perform public._log(p_trip, 'expenses', p_id::text, 'restore', p_actor, null);
end $$;

-- ---------- 最近變更（需通關碼；用於「最近修改」與還原） ----------
create or replace function public.recent_changes(p_trip uuid, p_code text, p_limit int default 50)
returns setof public.change_log language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._check_code(p_trip, p_code);
  return query select * from public.change_log where trip_id = p_trip order by at desc limit least(coalesce(p_limit,50), 200);
end $$;

-- 開放 RPC 給前端（_check_code / _log / set_edit_code 已撤銷）
grant execute on function
  public.verify_code(uuid, text),
  public.place_upsert(uuid, text, text, jsonb), public.place_delete(uuid, text, text, uuid), public.place_restore(uuid, text, text, uuid),
  public.mark_set(uuid, text, uuid, uuid, boolean, boolean),
  public.item_upsert(uuid, text, text, jsonb), public.items_reorder(uuid, text, text, jsonb),
  public.item_delete(uuid, text, text, uuid), public.item_restore(uuid, text, text, uuid),
  public.traveler_upsert(uuid, text, text, jsonb), public.traveler_delete(uuid, text, text, uuid),
  public.fx_set(uuid, text, text, text, numeric),
  public.expense_upsert(uuid, text, text, jsonb), public.expense_delete(uuid, text, text, uuid), public.expense_restore(uuid, text, text, uuid),
  public.recent_changes(uuid, text, int)
to anon, authenticated;

-- =====================================================================
-- 即時同步
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['places','place_marks','itinerary_items','travelers','fx_rates','expenses','expense_splits'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- =====================================================================
-- 初始資料（旅程本身）。通關碼請另外用 set_edit_code 設定，不要寫在這個檔案裡。
-- =====================================================================
insert into public.trips (slug, name, start_date, end_date, base_currency)
values ('hokkaido-2026', '北海道 10 日遊', '2026-12-25', '2027-01-03', 'TWD')
on conflict (slug) do nothing;

-- 設定通關碼（在 SQL Editor 執行，把 '你的通關碼' 換掉；執行後請清掉這行，不要存檔或上傳）：
-- select public.set_edit_code((select id from public.trips where slug = 'hokkaido-2026'), '你的通關碼');
