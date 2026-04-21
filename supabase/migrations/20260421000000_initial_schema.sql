-- Enums
create type public.app_role as enum ('admin', 'staff');
create type public.code_status as enum ('unused', 'redeemed');

-- Venues
create table public.venues (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  name                text not null,
  slug                text not null unique,
  active              boolean not null default true,
  benefit_headline    text not null default '',
  benefit_description text not null default '',
  code_prefix         text not null default 'CLUB',
  owner_id            uuid references auth.users(id) on delete set null
);

-- Profiles
create table public.profiles (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  venue_id     uuid references public.venues(id) on delete set null,
  display_name text
);

-- User roles
create table public.user_roles (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role    public.app_role not null,
  unique (user_id, role)
);

-- Customers
create table public.customers (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  venue_id      uuid not null references public.venues(id) on delete cascade,
  phone         text not null,
  name          text,
  email         text,
  total_visits  integer not null default 0,
  last_visit_at timestamptz,
  unique (venue_id, phone)
);

-- Visits
create table public.visits (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  venue_id    uuid not null references public.venues(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade
);

-- Codes
create table public.codes (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  venue_id         uuid not null references public.venues(id) on delete cascade,
  customer_id      uuid not null references public.customers(id) on delete cascade,
  visit_id         uuid references public.visits(id) on delete set null,
  code             text not null unique,
  status           public.code_status not null default 'unused',
  benefit_snapshot text,
  redeemed_at      timestamptz,
  redeemed_by      uuid references auth.users(id) on delete set null
);

-- Helper: check if user has a given role
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Helper: check if user belongs to a venue
create or replace function public.user_in_venue(_user_id uuid, _venue_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where user_id = _user_id and venue_id = _venue_id
  );
$$;

-- Generate a unique code with prefix (e.g. CLUB-A3F2B1)
create or replace function public.gen_unique_code(_prefix text)
returns text language plpgsql as $$
declare
  _code text;
begin
  loop
    _code := _prefix || '-' || upper(substring(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from public.codes where code = _code);
  end loop;
  return _code;
end;
$$;

-- Check in a customer and generate their benefit code
create or replace function public.checkin_customer(
  _venue_slug text,
  _phone      text,
  _name       text default null,
  _email      text default null
)
returns table (
  venue_name    text,
  customer_name text,
  benefit       text,
  code          text,
  code_id       uuid
)
language plpgsql security definer as $$
declare
  _venue    public.venues;
  _customer public.customers;
  _visit    public.visits;
  _code_val text;
  _code_id  uuid;
begin
  select * into _venue from public.venues where slug = _venue_slug and active = true;
  if not found then
    raise exception 'Venue not found';
  end if;

  insert into public.customers (venue_id, phone, name, email)
    values (_venue.id, _phone, _name, _email)
    on conflict (venue_id, phone) do update
      set name  = coalesce(excluded.name, customers.name),
          email = coalesce(excluded.email, customers.email)
  returning * into _customer;

  insert into public.visits (venue_id, customer_id)
    values (_venue.id, _customer.id)
  returning * into _visit;

  update public.customers
     set total_visits  = total_visits + 1,
         last_visit_at = now()
   where id = _customer.id;

  _code_val := public.gen_unique_code(_venue.code_prefix);

  insert into public.codes (venue_id, customer_id, visit_id, code, benefit_snapshot)
    values (_venue.id, _customer.id, _visit.id, _code_val, _venue.benefit_description)
  returning id into _code_id;

  return query select _venue.name, _customer.name, _venue.benefit_description, _code_val, _code_id;
end;
$$;

-- Validate a code (read-only, no redemption)
create or replace function public.validate_code(_code text)
returns table (
  code_id       uuid,
  status        public.code_status,
  benefit       text,
  customer_name text,
  venue_id      uuid
)
language sql stable security definer as $$
  select c.id, c.status, c.benefit_snapshot, cu.name, c.venue_id
  from public.codes c
  join public.customers cu on cu.id = c.customer_id
  where c.code = _code;
$$;

-- Redeem a code (authenticated staff action)
create or replace function public.redeem_code(_code text)
returns table (success boolean, message text)
language plpgsql security definer as $$
declare
  _row public.codes;
begin
  select * into _row from public.codes where code = _code for update;
  if not found then
    return query select false, 'Code not found'::text; return;
  end if;
  if _row.status = 'redeemed' then
    return query select false, 'Code already redeemed'::text; return;
  end if;
  update public.codes
     set status = 'redeemed', redeemed_at = now(), redeemed_by = auth.uid()
   where id = _row.id;
  return query select true, 'Redeemed'::text;
end;
$$;

-- Row Level Security
alter table public.venues    enable row level security;
alter table public.profiles  enable row level security;
alter table public.user_roles enable row level security;
alter table public.customers enable row level security;
alter table public.visits    enable row level security;
alter table public.codes     enable row level security;

create policy "venue staff read own venue"
  on public.venues for select using (public.user_in_venue(auth.uid(), id));

create policy "own profile"
  on public.profiles for all using (user_id = auth.uid());

create policy "own roles"
  on public.user_roles for select using (user_id = auth.uid());

create policy "venue staff read customers"
  on public.customers for select using (public.user_in_venue(auth.uid(), venue_id));

create policy "venue staff read visits"
  on public.visits for select using (public.user_in_venue(auth.uid(), venue_id));

create policy "venue staff read codes"
  on public.codes for select using (public.user_in_venue(auth.uid(), venue_id));
