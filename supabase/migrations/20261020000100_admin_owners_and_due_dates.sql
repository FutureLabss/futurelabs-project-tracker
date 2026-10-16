-- Replaces the guard added in 20261019000100_no_admin_task_owners.sql:
-- 1. Administrators may own tasks again, including work they assign to
--    themselves. As the assignee they start, submit and raise blockers on it;
--    start, submit and raise blocker stay assignee-only for every role.
-- 2. A task's due date can no longer be set in the past, on create_task or
--    reschedule_task. "Today" is the UTC date less one day, so a user whose
--    local date is behind UTC can still pick their own today.
-- Delegates to the same private chain as before (private.mutate_owner_checked).
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
  return private.mutate_owner_checked(operation, payload);
end $$;
revoke all on function public.tracker_mutate(text, jsonb) from public, anon;
grant execute on function public.tracker_mutate(text, jsonb) to authenticated;
