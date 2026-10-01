-- Assign one or more services to each counter. Existing counters keep their
-- current ability to call every service until an administrator changes it.
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'counters' and column_name = 'service_ids'
  ) then
    alter table public.counters add column service_ids uuid[] not null default '{}'::uuid[];
    update public.counters
      set service_ids = coalesce((select array_agg(id order by created_at, id) from public.services), '{}'::uuid[])
      where service_ids = '{}'::uuid[];
  end if;
end $$;

create or replace function public.qflow_counter_action(p_action text, p_args jsonb default '{}'::jsonb)
returns jsonb
language plpgsql volatile security invoker
set search_path = public
as $$
declare
  v_counter public.counters%rowtype;
  v_queue public.queues%rowtype;
  v_name text;
  v_services uuid[];
begin
  if p_action = 'check' then return 'true'::jsonb; end if;

  if p_action = 'usage' then
    return jsonb_build_object(
      'serviceIds', (select coalesce(jsonb_agg(distinct service_id), '[]'::jsonb) from public.queues),
      'counterIds', (select coalesce(jsonb_agg(distinct counter_id), '[]'::jsonb)
                     from public.queues where counter_id is not null)
    );
  end if;

  if p_action in ('create', 'assign') then
    if jsonb_typeof(p_args->'serviceIds') <> 'array' then
      raise exception 'กรุณาเลือกบริการที่ช่องนี้รับ';
    end if;
    select coalesce(array_agg(distinct value::uuid), '{}'::uuid[])
      into v_services from jsonb_array_elements_text(p_args->'serviceIds') as selected(value);
    if cardinality(v_services) = 0 then
      raise exception 'กรุณาเลือกบริการที่ช่องนี้รับ';
    end if;
    if exists (select 1 from unnest(v_services) as selected(id)
               left join public.services s on s.id = selected.id and s.is_active
               where s.id is null) then
      raise exception 'บริการที่เลือกไม่เปิดใช้งาน';
    end if;
  end if;

  if p_action = 'create' then
    v_name := trim(p_args->>'name');
    if v_name is null or length(v_name) not between 1 and 100 then
      raise exception 'ข้อมูลช่องเรียกคิวไม่ถูกต้อง';
    end if;
    insert into public.counters(name, service_ids) values (v_name, v_services);
    return 'true'::jsonb;
  end if;

  if p_action = 'assign' then
    update public.counters set service_ids = v_services
      where id = (p_args->>'counterId')::uuid;
    if not found then raise exception 'ไม่พบช่องเรียกคิว'; end if;
    return 'true'::jsonb;
  end if;

  if p_action = 'call_next' then
    select * into v_counter from public.counters
      where id = (p_args->>'counterId')::uuid and is_active for update;
    if not found then raise exception 'ช่องบริการไม่เปิดใช้งาน'; end if;
    select * into v_queue from public.queues
      where counter_id = v_counter.id and queue_date = (now() at time zone 'Asia/Bangkok')::date
        and status in ('called', 'serving') order by called_at desc limit 1;
    if found then return public.qflow_queue_json(v_queue); end if;
    select * into v_queue from public.queues
      where queue_date = (now() at time zone 'Asia/Bangkok')::date
        and status = 'waiting' and service_id = any(v_counter.service_ids)
      order by created_at, id for update skip locked limit 1;
    if not found then return null; end if;
    update public.queues set status = 'called', counter_id = v_counter.id, called_at = now()
      where id = v_queue.id returning * into v_queue;
    return public.qflow_queue_json(v_queue);
  end if;

  raise exception 'Unknown counter action';
end;
$$;

revoke all on function public.qflow_counter_action(text, jsonb) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.qflow_counter_action(text, jsonb) to service_role;
  end if;
end $$;
