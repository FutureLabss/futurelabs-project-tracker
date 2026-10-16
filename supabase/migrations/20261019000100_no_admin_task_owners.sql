-- Administrators oversee work; they are never a task's owner. Creating or
-- reassigning a task to an administrator is rejected. A task's status is kept
-- on reassignment: the new owner carries on from where the work stands.
-- Adds one more guard layer in front of the existing tracker_mutate chain.
alter function public.tracker_mutate(text, jsonb) set schema private;
alter function private.tracker_mutate(text, jsonb) rename to mutate_owner_checked;
revoke all on function private.mutate_owner_checked(text, jsonb) from public, anon, authenticated;

create function public.tracker_mutate(operation text, payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_tracker_member() then
    raise sqlstate 'PT401' using message = 'Tracker session expired. Please sign in again.';
  end if;
  if operation in ('create_task', 'assign_task')
    and payload is not null and jsonb_typeof(payload) = 'object'
    and exists(
      select 1 from public.profiles
      where id = nullif(payload->>'assignee_id', '')::uuid and role = 'admin'
    ) then
    raise sqlstate 'PT403' using message = 'Administrators cannot be assigned tasks';
  end if;
  return private.mutate_owner_checked(operation, payload);
end $$;
revoke all on function public.tracker_mutate(text, jsonb) from public, anon;
grant execute on function public.tracker_mutate(text, jsonb) to authenticated;
