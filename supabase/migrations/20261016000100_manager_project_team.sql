-- Let managers run the team of the projects they manage (FR-22): read its
-- membership and add or remove people, with the same rules as the admin path.

create policy manager_membership_read on public.project_members for select to authenticated
using (
  private.is_tracker_member() and exists(
    select 1 from public.projects p where p.id = project_id and p.manager_id = auth.uid()
  )
);

-- tracker_manager_mutate, now also handling set_project_member.
create or replace function public.tracker_manager_mutate(operation text, payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  p public.projects;
  t public.tasks;
  person uuid;
  included boolean;
  old_value text;
  reason text := nullif(btrim(payload->>'reason'), '');
begin
  if not private.is_tracker_member() then
    raise sqlstate 'PT401' using message = 'Tracker session expired. Please sign in again.';
  end if;
  if not exists(select 1 from public.profiles where id = actor and role = 'manager' and status = 'active') then
    raise sqlstate 'PT403' using message = 'Manager access is required';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'An object payload is required';
  end if;
  if operation not in ('create_project', 'close_project', 'set_project_member', 'change_complexity', 'reopen_task') then
    raise exception 'Unsupported manager operation';
  end if;

  -- FR-20: the creating manager always becomes the project's manager.
  if operation = 'create_project' then
    if nullif(btrim(payload->>'name'), '') is null then raise exception 'A project name is required'; end if;
    if (payload->>'target_date')::date < (payload->>'start_date')::date then
      raise exception 'The target date cannot be before the start date';
    end if;
    insert into public.projects(name, goal, start_date, target_date, manager_id)
    values (btrim(payload->>'name'), coalesce(payload->>'goal', ''), (payload->>'start_date')::date,
      (payload->>'target_date')::date, actor)
    returning * into p;
    perform private.record_event(p.id, 'project', 'project_created', null, p.name, 'Project initialized');
    perform private.record_event(p.id, 'project', 'manager_assigned', null, actor::text, 'Created by its manager');
    return to_jsonb(p);
  end if;

  -- FR-21: same closing rule as the administrator path.
  if operation = 'close_project' then
    select * into p from public.projects where id = (payload->>'project_id')::uuid for update;
    if not found or p.manager_id is distinct from actor then
      raise sqlstate 'PT403' using message = 'Only the project''s manager can close it';
    end if;
    if p.state <> 'active' then raise exception 'An active project is required'; end if;
    if exists(select 1 from public.tasks where project_id = p.id and status not in ('accepted', 'cancelled')) then
      raise exception 'Accept or cancel all open tasks before closing this project';
    end if;
    update public.projects set state = 'closed' where id = p.id returning * into p;
    perform private.record_event(p.id, 'project', 'project_closed', 'active', 'closed', 'Project completed');
    return to_jsonb(p);
  end if;

  -- FR-22: a manager controls who works on their own project. Mirrors the
  -- administrator set_project_member rules.
  if operation = 'set_project_member' then
    select * into p from public.projects where id = (payload->>'project_id')::uuid for update;
    if not found or p.manager_id is distinct from actor then
      raise sqlstate 'PT403' using message = 'Only the project''s manager can change its team';
    end if;
    if p.state <> 'active' then raise exception 'An active project is required'; end if;
    person := (payload->>'person_id')::uuid;
    if jsonb_typeof(payload->'included') is distinct from 'boolean' then
      raise exception 'included must be a boolean';
    end if;
    included := (payload->>'included')::boolean;
    if included and not exists(
      select 1 from public.profiles where id = person and status = 'active' and role in ('member', 'manager')
    ) then
      raise exception 'Select an active member or manager';
    end if;
    if not included and (
      exists(select 1 from public.tasks where project_id = p.id and assignee_id = person and status not in ('accepted', 'cancelled')) or
      exists(select 1 from public.blockers b join public.tasks t2 on t2.id = b.task_id
        where t2.project_id = p.id and b.owner_id = person and b.cleared_at is null)
    ) then
      raise exception 'Reassign open tasks and resolve owned blockers before removing access';
    end if;
    if included then
      insert into public.project_members(project_id, lms_user_id) values (p.id, person) on conflict do nothing;
      if found then
        perform private.record_event(p.id, 'project', 'project_member_added', null, person::text, 'Added by the project manager');
      end if;
    else
      delete from public.project_members where project_id = p.id and lms_user_id = person;
      if found then
        perform private.record_event(p.id, 'project', 'project_member_removed', person::text, null, 'Removed by the project manager');
      end if;
    end if;
    return jsonb_build_object('project_id', p.id, 'person_id', person, 'included', included);
  end if;

  -- Task operations: lock the task, then check its project is managed by the caller.
  select * into t from public.tasks where id = (payload->>'task_id')::uuid for update;
  if not found then raise exception 'Task not found'; end if;
  select * into p from public.projects where id = t.project_id for share;
  if p.manager_id is distinct from actor then
    raise sqlstate 'PT403' using message = 'Only the project''s manager can change this task';
  end if;
  if p.state <> 'active' then raise exception 'Closed projects cannot be changed'; end if;

  if operation = 'change_complexity' then
    -- FR-26
    if t.status in ('accepted', 'cancelled') then raise exception 'Completed or cancelled work cannot be modified'; end if;
    if payload->>'complexity' is null then raise exception 'A complexity is required'; end if;
    old_value := t.complexity::text;
    if old_value = payload->>'complexity' then raise exception 'The task already has this complexity'; end if;
    update public.tasks set complexity = (payload->>'complexity')::public.task_complexity
    where id = t.id returning * into t;
    perform private.record_event(t.id, 'task', 'complexity_changed', old_value, t.complexity::text, reason);
  else
    -- FR-30 / SR-07: accepted work goes back to in progress and is recorded as reopened.
    if t.status <> 'accepted' then raise exception 'Only accepted work can be reopened'; end if;
    if reason is null then raise exception 'A reason is required when reopening work'; end if;
    update public.tasks set status = 'in_progress', accepted_at = null, accepted_by = null, submitted_at = null
    where id = t.id returning * into t;
    perform private.record_event(t.id, 'task', 'task_reopened', 'accepted', 'in_progress', reason);
  end if;
  return to_jsonb(t);
end $$;
revoke all on function public.tracker_manager_mutate(text, jsonb) from public, anon;
grant execute on function public.tracker_manager_mutate(text, jsonb) to authenticated;
