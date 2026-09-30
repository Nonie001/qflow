-- Run after 001_initial.sql when using Supabase URL + server API key.
-- A single RPC keeps queue mutations atomic over the Supabase Data API.

create or replace function public.qflow_queue_json(p_queue public.queues)
returns jsonb
language sql stable security invoker
set search_path = public
as $$
  select (to_jsonb(p_queue) - 'request_id') || jsonb_build_object(
    'service', (select to_jsonb(s) from public.services s where s.id = p_queue.service_id),
    'counter', (select to_jsonb(c) from public.counters c where c.id = p_queue.counter_id)
  );
$$;

create or replace function public.qflow_position(p_queue public.queues)
returns integer
language sql stable security invoker
set search_path = public
as $$
  select case when p_queue.status = 'waiting' then
    (select count(*)::integer from public.queues q
     where q.service_id = p_queue.service_id and q.queue_date = p_queue.queue_date
       and q.status = 'waiting' and q.queue_sequence < p_queue.queue_sequence)
  else 0 end;
$$;

create or replace function public.qflow_action(p_action text, p_args jsonb default '{}'::jsonb)
returns jsonb
language plpgsql volatile security invoker
set search_path = public
as $$
declare
  v_queue public.queues%rowtype;
  v_service public.services%rowtype;
  v_counter public.counters%rowtype;
  v_id uuid;
  v_service_id uuid;
  v_request_id uuid;
  v_date date;
  v_name text;
  v_prefix text;
  v_operation text;
  v_sequence integer;
  v_claim uuid;
  v_attempts integer;
  v_result jsonb;
begin
  if p_action = 'services' then
    select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at, s.id), '[]'::jsonb)
      into v_result from public.services s
      where not coalesce((p_args->>'activeOnly')::boolean, false) or s.is_active;
    return v_result;
  end if;

  if p_action = 'counters' then
    select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at, c.id), '[]'::jsonb)
      into v_result from public.counters c
      where not coalesce((p_args->>'activeOnly')::boolean, false) or c.is_active;
    return v_result;
  end if;

  if p_action = 'today_queues' or p_action = 'upcoming_queues' then
    select coalesce(jsonb_agg(public.qflow_queue_json(q) order by q.queue_date, q.created_at, q.id), '[]'::jsonb)
      into v_result from public.queues q
      where (p_action = 'today_queues' and q.queue_date = (now() at time zone 'Asia/Bangkok')::date)
         or (p_action = 'upcoming_queues' and q.queue_date > (now() at time zone 'Asia/Bangkok')::date);
    return v_result;
  end if;

  if p_action = 'monitor_data' then
    return jsonb_build_object(
      'counters', (select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at, c.id), '[]'::jsonb)
                   from public.counters c where c.is_active),
      'queues', (select coalesce(jsonb_agg(public.qflow_queue_json(q) order by q.created_at, q.id), '[]'::jsonb)
                 from public.queues q where q.queue_date = (now() at time zone 'Asia/Bangkok')::date)
    );
  end if;

  if p_action = 'customer_queue' then
    select * into v_queue from public.queues where id = (p_args->>'id')::uuid;
    if not found then return null; end if;
    return jsonb_build_object('queue', public.qflow_queue_json(v_queue),
                              'position', public.qflow_position(v_queue));
  end if;

  if p_action = 'create_queue' then
    v_service_id := (p_args->>'serviceId')::uuid;
    v_request_id := (p_args->>'requestId')::uuid;
    v_name := trim(p_args->>'customerName');
    v_date := (p_args->>'bookingDate')::date;
    if v_name is null or length(v_name) = 0 or length(v_name) > 100 then
      raise exception 'กรุณากรอกชื่อไม่เกิน 100 ตัวอักษร';
    end if;
    if v_date is null or v_date < (now() at time zone 'Asia/Bangkok')::date
      or v_date > (now() at time zone 'Asia/Bangkok')::date + 30 then
      raise exception 'เลือกวันที่ภายใน 30 วันนับจากวันนี้';
    end if;
    perform pg_advisory_xact_lock(8271, hashtext(v_request_id::text));
    select * into v_queue from public.queues where request_id = v_request_id;
    if found then
      if v_queue.service_id <> v_service_id or v_queue.queue_date <> v_date
        or v_queue.customer_name <> v_name then
        raise exception 'Request already used';
      end if;
      return jsonb_build_object('queue', public.qflow_queue_json(v_queue),
                                'position', public.qflow_position(v_queue));
    end if;
    select * into v_service from public.services
      where id = v_service_id and is_active for update;
    if not found then raise exception 'บริการนี้ไม่เปิดให้รับคิว'; end if;
    select coalesce(max(queue_sequence), 0) + 1 into v_sequence
      from public.queues where service_id = v_service_id and queue_date = v_date;
    insert into public.queues
      (id, queue_number, queue_sequence, service_id, status, queue_date, request_id, customer_name)
      values (gen_random_uuid(), v_service.prefix || lpad(v_sequence::text, 3, '0'),
              v_sequence, v_service_id, 'waiting', v_date, v_request_id, v_name)
      returning * into v_queue;
    return jsonb_build_object('queue', public.qflow_queue_json(v_queue),
                              'position', public.qflow_position(v_queue));
  end if;

  if p_action = 'call_next' then
    v_service_id := nullif(p_args->>'serviceId', '')::uuid;
    select * into v_counter from public.counters
      where id = (p_args->>'counterId')::uuid and is_active for update;
    if not found then raise exception 'ช่องบริการไม่เปิดใช้งาน'; end if;
    select * into v_queue from public.queues
      where counter_id = v_counter.id and queue_date = (now() at time zone 'Asia/Bangkok')::date
        and status in ('called', 'serving') order by called_at desc limit 1;
    if found then return public.qflow_queue_json(v_queue); end if;
    select * into v_queue from public.queues
      where queue_date = (now() at time zone 'Asia/Bangkok')::date and status = 'waiting'
        and (v_service_id is null or service_id = v_service_id)
      order by created_at, id for update skip locked limit 1;
    if not found then return null; end if;
    update public.queues set status = 'called', counter_id = v_counter.id, called_at = now()
      where id = v_queue.id returning * into v_queue;
    return public.qflow_queue_json(v_queue);
  end if;

  if p_action = 'transition' then
    v_operation := p_args->>'operation';
    select * into v_queue from public.queues
      where id = (p_args->>'id')::uuid
        and queue_date = (now() at time zone 'Asia/Bangkok')::date for update;
    if not found then raise exception 'ไม่พบคิววันนี้'; end if;
    if (v_operation = 'serve' and v_queue.status = 'serving')
      or (v_operation = 'complete' and v_queue.status = 'completed')
      or (v_operation = 'skip' and v_queue.status = 'skipped') then
      return public.qflow_queue_json(v_queue);
    end if;
    if v_operation = 'recall' and v_queue.status in ('called', 'serving') then
      update public.queues set called_at = now() where id = v_queue.id returning * into v_queue;
    elsif v_operation = 'serve' and v_queue.status = 'called' then
      update public.queues set status = 'serving', serving_at = now()
        where id = v_queue.id returning * into v_queue;
    elsif v_operation = 'complete' and v_queue.status in ('called', 'serving') then
      update public.queues set status = 'completed', completed_at = now()
        where id = v_queue.id returning * into v_queue;
    elsif v_operation = 'skip' and v_queue.status in ('waiting', 'called', 'serving') then
      update public.queues set status = 'skipped', completed_at = now()
        where id = v_queue.id returning * into v_queue;
    else
      raise exception 'สถานะคิวไม่รองรับคำสั่งนี้';
    end if;
    return public.qflow_queue_json(v_queue);
  end if;

  if p_action = 'manage' then
    v_operation := p_args->>'operation';
    if p_args->>'table' = 'services' then
      if v_operation = 'create' then
        v_name := trim(p_args->>'name');
        v_prefix := upper(trim(p_args->>'prefix'));
        if v_name is null or length(v_name) not between 1 and 100
          or v_prefix !~ '^[A-Z]{1,2}$' then raise exception 'ข้อมูลบริการไม่ถูกต้อง'; end if;
        insert into public.services(id, name, prefix) values (gen_random_uuid(), v_name, v_prefix);
      elsif v_operation = 'toggle' then
        update public.services set is_active = (p_args->>'isActive')::boolean
          where id = (p_args->>'id')::uuid;
        if not found then raise exception 'Record not found'; end if;
      elsif v_operation = 'delete' then
        delete from public.services where id = (p_args->>'id')::uuid;
        if not found then raise exception 'Record not found'; end if;
      else raise exception 'Invalid operation'; end if;
      return 'true'::jsonb;
    elsif p_args->>'table' = 'counters' then
      if v_operation = 'create' then
        v_name := trim(p_args->>'name');
        if v_name is null or length(v_name) not between 1 and 100 then
          raise exception 'ข้อมูลช่องบริการไม่ถูกต้อง';
        end if;
        insert into public.counters(id, name) values (gen_random_uuid(), v_name);
      elsif v_operation = 'toggle' then
        update public.counters set is_active = (p_args->>'isActive')::boolean
          where id = (p_args->>'id')::uuid;
        if not found then raise exception 'Record not found'; end if;
      elsif v_operation = 'delete' then
        delete from public.counters where id = (p_args->>'id')::uuid;
        if not found then raise exception 'Record not found'; end if;
      else raise exception 'Invalid operation'; end if;
      return 'true'::jsonb;
    end if;
    raise exception 'Invalid table';
  end if;

  if p_action = 'subscribe' then
    insert into public.push_subscriptions(id, queue_id, endpoint, p256dh, auth)
      values (gen_random_uuid(), (p_args->>'queueId')::uuid,
              p_args->>'endpoint', p_args->>'p256dh', p_args->>'auth')
      on conflict (queue_id, endpoint) do update set
        p256dh = excluded.p256dh, auth = excluded.auth, created_at = now();
    return 'true'::jsonb;
  end if;

  if p_action = 'subscriptions' then
    select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) into v_result
      from public.push_subscriptions s where s.queue_id = (p_args->>'queueId')::uuid;
    return v_result;
  end if;

  if p_action = 'delete_subscription' then
    delete from public.push_subscriptions where id = (p_args->>'id')::uuid;
    return 'true'::jsonb;
  end if;

  if p_action = 'almost_ready' then
    select coalesce(jsonb_agg(to_jsonb(q) - 'request_id'), '[]'::jsonb) into v_result
      from public.queues q
      where q.queue_date = (now() at time zone 'Asia/Bangkok')::date
        and q.status = 'waiting' and public.qflow_position(q) <= 3;
    return v_result;
  end if;

  if p_action = 'claim_notification' then
    if p_args->>'type' not in ('queue_created', 'queue_almost_ready', 'queue_called') then
      raise exception 'Invalid notification type';
    end if;
    insert into public.notifications (id, queue_id, type, state)
      select gen_random_uuid(), (p_args->>'queueId')::uuid, p_args->>'type', 'pending'
      where exists (select 1 from public.push_subscriptions
                    where queue_id = (p_args->>'queueId')::uuid)
      on conflict (queue_id, type) do update set
        id = excluded.id, sent_at = now(), state = 'pending'
      where public.notifications.state <> 'sent'
        and public.notifications.sent_at < now() - interval '2 minutes'
      returning id into v_claim;
    return to_jsonb(v_claim);
  end if;

  if p_action = 'finish_notification' then
    if coalesce((p_args->>'sent')::boolean, false) then
      update public.notifications set state = 'sent' where id = (p_args->>'id')::uuid;
    else
      delete from public.notifications where id = (p_args->>'id')::uuid;
    end if;
    return 'true'::jsonb;
  end if;

  if p_action = 'login_attempt' then
    if p_args->>'key' !~ '^[a-f0-9]{64}$' then raise exception 'Invalid key'; end if;
    insert into public.login_attempts (key, attempts) values (p_args->>'key', 1)
      on conflict (key) do update set
        attempts = case when public.login_attempts.window_started < now() - interval '15 minutes'
          then 1 else public.login_attempts.attempts + 1 end,
        window_started = case when public.login_attempts.window_started < now() - interval '15 minutes'
          then now() else public.login_attempts.window_started end
      returning attempts into v_attempts;
    if v_attempts > 10 then raise exception 'Too many attempts. Try again in 15 minutes.'; end if;
    return 'true'::jsonb;
  end if;

  if p_action = 'reset_all' then
    truncate table public.notifications, public.push_subscriptions, public.queues,
      public.services, public.counters, public.login_attempts;
    return 'true'::jsonb;
  end if;

  raise exception 'Unknown action';
end;
$$;

-- Supabase creates public function EXECUTE grants by default. Limit this RPC
-- to the server role; browser keys cannot call it.
revoke all on function public.qflow_queue_json(public.queues) from public;
revoke all on function public.qflow_position(public.queues) from public;
revoke all on function public.qflow_action(text, jsonb) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.qflow_queue_json(public.queues) to service_role;
    grant execute on function public.qflow_position(public.queues) to service_role;
    grant execute on function public.qflow_action(text, jsonb) to service_role;
  end if;
end $$;
