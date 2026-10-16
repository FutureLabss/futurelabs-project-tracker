-- Rescheduling records a schedule slip (mandatory reason, slip count, project
-- health), so it only applies to work someone owns. An unassigned task is
-- given an owner first. Re-creates the 20261020000100 guard with this added.
create or replace function public.tracker_mutate(operation text, payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_tracker_member() then
    raise sqlstate 'PT401' using message = 'Tracker session expired. Please sign in again.';
  end if;
  if operation in ('create_task', 'reschedule_task')
    and payload is not null and jsonb_typeof(payload) = 'object'
    and nullif(payload->>'due_date', '') is not null
    and (payload->>'due_date')::date < (now() at time zone 'utc')::date - 1 then
    raise exception 'The due date cannot be in the past';
  end if;
  if operation = 'reschedule_task'
    and payload is not null and jsonb_typeof(payload) = 'object'
    and exists(
      select 1 from public.tasks
      where id = nullif(payload->>'task_id', '')::uuid and assignee_id is null
    ) then
    raise exception 'Assign an owner before rescheduling this task';
  end if;
  return private.mutate_owner_checked(operation, payload);
end $$;
revoke all on function public.tracker_mutate(text, jsonb) from public, anon;
grant execute on function public.tracker_mutate(text, jsonb) to authenticated;
