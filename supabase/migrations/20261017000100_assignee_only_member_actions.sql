-- Starting, submitting and declaring a blocker are the assignee's own actions.
-- Managers and administrators may still accept, return, reassign, reschedule,
-- cancel and clear blockers, but they cannot do the member's part for them.
-- Adds one more guard layer in front of the existing tracker_mutate chain.
alter function public.tracker_mutate(text, jsonb) set schema private;
alter function private.tracker_mutate(text, jsonb) rename to mutate_assignee_guarded;
revoke all on function private.mutate_assignee_guarded(text, jsonb) from public, anon, authenticated;

create function public.tracker_mutate(operation text, payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  assignee uuid;
begin
  if not private.is_tracker_member() then
    raise sqlstate 'PT401' using message = 'Tracker session expired. Please sign in again.';
  end if;
  if operation in ('submit_task', 'raise_blocker')
    or (operation = 'update_task_status' and payload->>'status' in ('not_started', 'in_progress')) then
    select assignee_id into assignee from public.tasks where id = (payload->>'task_id')::uuid;
    -- Unknown tasks fall through so the inner layers report them as usual.
    if found and assignee is distinct from auth.uid() then
      raise sqlstate 'PT403' using message = 'Only the task''s assignee can start it, submit it or raise a blocker on it';
    end if;
  end if;
  return private.mutate_assignee_guarded(operation, payload);
end $$;
revoke all on function public.tracker_mutate(text, jsonb) from public, anon;
grant execute on function public.tracker_mutate(text, jsonb) to authenticated;
