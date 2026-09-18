-- Project membership is administered through a session-validated RPC only.
grant select on public.project_members to authenticated;
create policy admin_membership_read on public.project_members for select to authenticated
using (private.is_tracker_member() and exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create function public.tracker_admin_mutate(operation text, payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.projects; person uuid; included boolean;
begin
  if not private.is_tracker_member() then raise sqlstate 'PT401' using message = 'Tracker session expired. Please sign in again.'; end if;
  if not exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise sqlstate 'PT403' using message = 'Administrator access is required'; end if;
  if payload is null or jsonb_typeof(payload) <> 'object' then raise exception 'An object payload is required'; end if;
  if operation not in ('set_project_member', 'close_project') then raise exception 'Unsupported admin operation'; end if;
  -- Task creation holds a share lock on this row, so it cannot race project closing.
  select * into p from public.projects where id = (payload->>'project_id')::uuid for update;
  if not found or p.state <> 'active' then raise exception 'An active project is required'; end if;
  if operation = 'close_project' then
    if exists(select 1 from public.tasks where project_id = p.id and status not in ('accepted', 'cancelled')) then
      raise exception 'Accept or cancel all open tasks before closing this project'; end if;
    update public.projects set state = 'closed' where id = p.id returning * into p;
    perform private.record_event(p.id, 'project', 'project_closed', 'active', 'closed', 'Project completed');
    return to_jsonb(p);
  end if;
  person := (payload->>'person_id')::uuid;
  if jsonb_typeof(payload->'included') is distinct from 'boolean' then raise exception 'included must be a boolean'; end if;
  included := (payload->>'included')::boolean;
  if not exists(select 1 from public.profiles where id = person and (not included or status = 'active')) then
    raise exception 'Select an active person'; end if;
  if not included and (
    exists(select 1 from public.tasks where project_id = p.id and assignee_id = person and status not in ('accepted', 'cancelled')) or
    exists(select 1 from public.blockers b join public.tasks t on t.id = b.task_id where t.project_id = p.id and b.owner_id = person and b.cleared_at is null)
  ) then raise exception 'Reassign open tasks and resolve owned blockers before removing access'; end if;
  if included then
    insert into public.project_members(project_id, lms_user_id) values(p.id, person) on conflict do nothing;
    if found then perform private.record_event(p.id, 'project', 'project_member_added', null, person::text, 'Project access granted'); end if;
  else
    delete from public.project_members where project_id = p.id and lms_user_id = person;
    if found then perform private.record_event(p.id, 'project', 'project_member_removed', person::text, null, 'Project access removed'); end if;
  end if;
  return jsonb_build_object('project_id', p.id, 'person_id', person, 'included', included);
end $$;
revoke all on function public.tracker_admin_mutate(text, jsonb) from public, anon;
grant execute on function public.tracker_admin_mutate(text, jsonb) to authenticated;

-- Serialize assignment/blocker changes with membership removal and project closing.
alter function public.tracker_mutate(text, jsonb) set schema private;
alter function private.tracker_mutate(text, jsonb) rename to mutate_scoped;
revoke all on function private.mutate_scoped(text, jsonb) from public, anon, authenticated;
create function public.tracker_mutate(operation text, payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare target uuid; manager uuid;
begin
  if not private.is_tracker_member() then raise sqlstate 'PT401' using message = 'Tracker session expired. Please sign in again.'; end if;
  if operation in ('create_task', 'assign_project_manager') then target := (payload->>'project_id')::uuid;
  elsif operation = 'clear_blocker' then
    select t.project_id into target from public.tasks t join public.blockers b on b.task_id=t.id where b.id=(payload->>'blocker_id')::uuid;
  elsif operation not in ('create_project', 'record_availability') then
    select project_id into target from public.tasks where id=(payload->>'task_id')::uuid;
  end if;
  if target is not null then
    if not private.can_read_project(target) then raise sqlstate 'PT403' using message = 'Project access denied'; end if;
    if operation = 'assign_project_manager' then
      perform 1 from public.projects where id=target for update;
    else
      perform 1 from public.projects where id=target for share;
    end if;
  end if;
  if operation in ('create_project', 'assign_project_manager') then
    manager := (payload->>'manager_id')::uuid;
    if manager is not null and not exists(select 1 from public.profiles where id=manager and status='active' and role in ('manager','admin')) then
      raise exception 'Select an active manager or administrator'; end if;
    if operation = 'assign_project_manager' and exists(select 1 from public.projects where id=target and state='closed') then
      raise exception 'Closed projects cannot be changed'; end if;
  end if;
  return private.mutate_scoped(operation, payload);
end $$;
revoke all on function public.tracker_mutate(text, jsonb) from public, anon;
grant execute on function public.tracker_mutate(text, jsonb) to authenticated;
