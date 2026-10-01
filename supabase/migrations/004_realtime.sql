-- Broadcast invalidations only. Queue records can contain customer names and
-- must continue to be fetched through the authenticated Next.js server.
create or replace function public.qflow_broadcast_invalidation()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object('scope', tg_table_name),
    'changed',
    'qflow:changes',
    false
  );
  return null;
exception when others then
  -- A Realtime outage must not prevent booking or serving a queue.
  raise warning 'QFlow Realtime broadcast failed: %', sqlerrm;
  return null;
end;
$$;

revoke all on function public.qflow_broadcast_invalidation() from public;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['services', 'counters', 'queues'] loop
    if not exists (select 1 from pg_trigger
                   where tgrelid = format('public.%I', table_name)::regclass
                     and tgname = 'qflow_broadcast_change') then
      execute format(
        'create trigger qflow_broadcast_change after insert or update or delete on public.%I for each statement execute function public.qflow_broadcast_invalidation()',
        table_name
      );
    end if;
    if not exists (select 1 from pg_trigger
                   where tgrelid = format('public.%I', table_name)::regclass
                     and tgname = 'qflow_broadcast_truncate') then
      execute format(
        'create trigger qflow_broadcast_truncate after truncate on public.%I for each statement execute function public.qflow_broadcast_invalidation()',
        table_name
      );
    end if;
  end loop;
end $$;
