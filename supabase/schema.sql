-- CARMAINTRACK — esquema Supabase
-- Corre este script no SQL Editor do teu projeto Supabase antes de usar a app.
-- Cada conta (oficina) só vê os seus próprios dados (Row Level Security).
-- O portal público do cliente lê os dados de UM veículo através da função
-- public_vehicle(token), que só devolve o necessário para essa página.

create extension if not exists pgcrypto;

-- Oficina (uma por conta) --------------------------------------------------
create table if not exists workshops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique default auth.uid() references auth.users on delete cascade,
  name text not null default 'A minha oficina',
  tagline text,
  logo_url text,
  primary_color text not null default '#0f766e',
  phone text,
  whatsapp text,
  address text,
  default_interval_km int not null default 15000,
  default_interval_months int not null default 12,
  warn_km int not null default 3000,
  warn_days int not null default 30,
  created_at timestamptz not null default now()
);

-- Paleta de cores do painel e do portal (ver src/lib/theme.js).
alter table workshops add column if not exists theme jsonb;

create or replace function my_workshop_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from workshops where owner_id = auth.uid()
$$;

-- Clientes ----------------------------------------------------------------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null default my_workshop_id() references workshops on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

-- Veículos ----------------------------------------------------------------
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null default my_workshop_id() references workshops on delete cascade,
  client_id uuid references clients on delete set null,
  plate text not null,
  make text,
  model text,
  year int,
  photo_url text,
  current_km int not null default 0,
  reminders_enabled boolean not null default true,
  -- 96 bits aleatórios: o link do portal não é adivinhável
  public_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now()
);

-- Serviços / revisões -------------------------------------------------------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null default my_workshop_id() references workshops on delete cascade,
  vehicle_id uuid not null references vehicles on delete cascade,
  date date not null default current_date,
  km int,
  title text not null default 'Revisão',
  oil text,
  filters text[] not null default '{}',
  extras jsonb not null default '[]', -- [{ "name": "...", "note": "..." }]
  notes text,
  next_km int,
  next_date date,
  created_at timestamptz not null default now()
);

create index if not exists vehicles_workshop_idx on vehicles (workshop_id);
create index if not exists services_vehicle_idx on services (vehicle_id, date desc);

-- Subscrições (Stripe) -------------------------------------------------------
-- Escrita só pelo servidor (service role, em api/*.js). Cada conta só lê a sua.
create table if not exists subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null,
  plan text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 'past_due' dá alguns dias de tolerância enquanto o Stripe tenta cobrar de novo.
create or replace function has_active_subscription() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from subscriptions
    where user_id = auth.uid() and status in ('active', 'trialing', 'past_due')
  )
$$;

-- Row Level Security ------------------------------------------------------
alter table workshops enable row level security;
alter table clients enable row level security;
alter table vehicles enable row level security;
alter table services enable row level security;
alter table subscriptions enable row level security;

-- Sem subscrição ativa, a conta deixa de ler e escrever os dados da oficina.

drop policy if exists workshops_owner on workshops;
create policy workshops_owner on workshops for all
  using (owner_id = auth.uid() and has_active_subscription())
  with check (owner_id = auth.uid() and has_active_subscription());

drop policy if exists clients_owner on clients;
create policy clients_owner on clients for all
  using (workshop_id = my_workshop_id() and has_active_subscription())
  with check (workshop_id = my_workshop_id() and has_active_subscription());

drop policy if exists vehicles_owner on vehicles;
create policy vehicles_owner on vehicles for all
  using (workshop_id = my_workshop_id() and has_active_subscription())
  with check (workshop_id = my_workshop_id() and has_active_subscription());

drop policy if exists services_owner on services;
create policy services_owner on services for all
  using (workshop_id = my_workshop_id() and has_active_subscription())
  with check (workshop_id = my_workshop_id() and has_active_subscription());

drop policy if exists subscriptions_read_own on subscriptions;
create policy subscriptions_read_own on subscriptions for select
  using (user_id = auth.uid());

-- Portal público ----------------------------------------------------------
create or replace function public_vehicle(p_token text) returns json
language plpgsql stable security definer set search_path = public as $$
declare
  v vehicles;
  w workshops;
  owner_name text;
begin
  select * into v from vehicles where public_token = p_token;
  if not found then
    return null;
  end if;
  select * into w from workshops where id = v.workshop_id;
  -- Com a subscrição da oficina cancelada, o portal deixa de mostrar dados.
  if not exists (
    select 1 from subscriptions
    where user_id = w.owner_id and status in ('active', 'trialing', 'past_due')
  ) then
    return null;
  end if;
  select name into owner_name from clients where id = v.client_id;

  return json_build_object(
    'vehicle', json_build_object(
      'plate', v.plate, 'make', v.make, 'model', v.model, 'year', v.year,
      'photo_url', v.photo_url, 'current_km', v.current_km),
    'owner_name', owner_name,
    'workshop', json_build_object(
      'name', w.name, 'tagline', w.tagline, 'logo_url', w.logo_url,
      'primary_color', w.primary_color, 'theme', w.theme, 'phone', w.phone, 'whatsapp', w.whatsapp,
      'address', w.address, 'warn_km', w.warn_km, 'warn_days', w.warn_days),
    'services', coalesce((
      select json_agg(json_build_object(
        'id', s.id, 'date', s.date, 'km', s.km, 'title', s.title, 'oil', s.oil,
        'filters', s.filters, 'extras', s.extras, 'notes', s.notes,
        'next_km', s.next_km, 'next_date', s.next_date, 'created_at', s.created_at)
        order by s.date desc, s.created_at desc)
      from services s where s.vehicle_id = v.id), '[]'::json)
  );
end;
$$;

revoke all on function public_vehicle(text) from public;
grant execute on function public_vehicle(text) to anon, authenticated;
