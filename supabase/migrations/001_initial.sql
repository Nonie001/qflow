-- Run once in the Supabase SQL Editor before 002_api.sql.
-- The web app connects from the server through Supabase API or PostgreSQL.
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 100),
  prefix text not null unique check (prefix ~ '^[A-Z]{1,2}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.counters (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.queues (
  id uuid primary key default gen_random_uuid(),
  queue_number text not null,
  queue_sequence integer not null check (queue_sequence > 0),
  service_id uuid not null references public.services(id) on delete restrict,
  counter_id uuid references public.counters(id) on delete restrict,
  status text not null check (status in ('waiting', 'called', 'serving', 'completed', 'skipped', 'cancelled')),
  queue_date date not null,
  created_at timestamptz not null default now(),
  called_at timestamptz,
  serving_at timestamptz,
  completed_at timestamptz,
  request_id uuid not null unique,
  customer_name text not null default '' check (length(customer_name) <= 100),
  unique (service_id, queue_date, queue_sequence),
  unique (queue_date, queue_number)
);

create unique index if not exists queues_one_active_per_counter
  on public.queues(counter_id, queue_date) where counter_id is not null and status in ('called', 'serving');
create index if not exists queues_today_order on public.queues(queue_date, created_at, id);
create index if not exists queues_waiting_order on public.queues(queue_date, status, service_id, queue_sequence);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.queues(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (queue_id, endpoint)
);
create index if not exists push_subscriptions_queue on public.push_subscriptions(queue_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.queues(id) on delete cascade,
  type text not null check (type in ('queue_created', 'queue_almost_ready', 'queue_called')),
  sent_at timestamptz not null default now(),
  state text not null check (state in ('pending', 'sent')),
  unique (queue_id, type)
);

create table if not exists public.login_attempts (
  key text primary key check (key ~ '^[a-f0-9]{64}$'),
  attempts integer not null,
  window_started timestamptz not null default now()
);

-- No browser-facing Data API access. All reads/writes pass through the
-- authenticated Next.js server; its service role or database role bypasses RLS.
alter table public.services enable row level security;
alter table public.counters enable row level security;
alter table public.queues enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.login_attempts enable row level security;
