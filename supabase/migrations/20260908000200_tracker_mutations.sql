create function private.can_manage_project(project_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles u where u.id = auth.uid() and
      (u.role = 'admin' or (u.role = 'manager' and exists (
        select 1 from public.projects p where p.id = project_id and p.manager_id = u.id
      )))
  );
$$;
revoke all on function private.can_manage_project(uuid) from public;

create function private.record_event(subject_id uuid, subject_type public.ledger_subject_type,
  event_type public.ledger_change_type, from_value text, to_value text, reason text default null)
returns void language sql security definer set search_path = '' as $$
  insert into public.ledger_records(subject_id, subject_type, actor_id, type, from_value, to_value, reason)
  values (subject_id, subject_type, auth.uid(), event_type, from_value, to_value, reason);
$$;
revoke all on function private.record_event(uuid, public.ledger_subject_type, public.ledger_change_type, text, text, text) from public;

-- Every call is one database transaction. The actor comes only from the JWT.
create function public.tracker_mutate(operation text, payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  actor_role public.user_role;
  p public.projects;
  t public.tasks;
  b public.blockers;
  a public.availability;
  can_manage boolean;
  old_value text;
  next_status public.task_status;
  target_id uuid;
  reason text := nullif(btrim(payload->>'reason'), '');
begin
  select role into actor_role from public.profiles where id = actor;
  if actor is null or actor_role is null then raise exception 'Authentication and a tracker profile are required' using errcode = '42501'; end if;
  if payload is null or jsonb_typeof(payload) <> 'object' then raise exception 'An object payload is required'; end if;

  if operation = 'create_project' then
    if actor_role <> 'admin' then raise exception 'Only administrators can create projects' using errcode = '42501'; end if;
    target_id := (payload->>'manager_id')::uuid;
    if target_id is not null and not exists(select 1 from public.profiles where id = target_id and role in ('manager', 'admin')) then raise exception 'Select a manager or administrator'; end if;
    insert into public.projects(name, goal, start_date, target_date, manager_id)
    values (btrim(payload->>'name'), coalesce(payload->>'goal', ''), (payload->>'start_date')::date, (payload->>'target_date')::date, target_id) returning * into p;
    perform private.record_event(p.id, 'project', 'project_created', null, p.name, 'Project initialized');
    if p.manager_id is not null then perform private.record_event(p.id, 'project', 'manager_assigned', null, p.manager_id::text, 'Manager designated on creation'); end if;
    return to_jsonb(p);
  end if;

  if operation = 'assign_project_manager' then
    if actor_role <> 'admin' then raise exception 'Only administrators can assign project managers' using errcode = '42501'; end if;
    select * into p from public.projects where id = (payload->>'project_id')::uuid for update;
    if not found then raise exception 'Project not found'; end if;
    target_id := (payload->>'manager_id')::uuid;
    if target_id is not null and not exists(select 1 from public.profiles where id = target_id and role in ('manager', 'admin')) then raise exception 'Select a manager or administrator'; end if;
    old_value := p.manager_id::text;
    update public.projects set manager_id = target_id where id = p.id returning * into p;
    perform private.record_event(p.id, 'project', 'manager_assigned', old_value, p.manager_id::text, 'Project manager updated');
    return to_jsonb(p);
  end if;

  if operation = 'record_availability' then
    target_id := (payload->>'person_id')::uuid;
    if target_id is distinct from actor and actor_role not in ('manager', 'admin') then raise exception 'You can only record your own leave' using errcode = '42501'; end if;
    insert into public.availability(person_id, from_date, to_date, note)
    values (target_id, (payload->>'from_date')::date, (payload->>'to_date')::date, coalesce(payload->>'note', '')) returning * into a;
    perform private.record_event(a.id, 'availability', 'leave_recorded', null, a.from_date::text || ' to ' || a.to_date::text, a.note);
    return to_jsonb(a);
  end if;

  if operation = 'create_task' then
    select * into p from public.projects where id = (payload->>'project_id')::uuid for share;
    if not found or p.state <> 'active' then raise exception 'An active project is required'; end if;
    target_id := (payload->>'assignee_id')::uuid;
    -- NULL must never turn the permission condition into an implicit allow.
    if not private.can_manage_project(p.id) and (payload->>'origin' is distinct from 'unplanned' or target_id is distinct from actor) then raise exception 'Task creation is not permitted' using errcode = '42501'; end if;
    insert into public.tasks(project_id, title, description, assignee_id, complexity, origin, due_date)
    values (p.id, btrim(payload->>'title'), coalesce(payload->>'description', ''), target_id, (payload->>'complexity')::public.task_complexity, (payload->>'origin')::public.task_origin, (payload->>'due_date')::date) returning * into t;
    perform private.record_event(t.id, 'task', 'task_created', null, t.title, t.origin::text || ' task created');
    return to_jsonb(t);
  end if;

  if operation not in ('assign_task', 'update_task_status', 'reschedule_task', 'submit_task', 'accept_task', 'return_task', 'raise_blocker', 'clear_blocker') then raise exception 'Unsupported tracker operation'; end if;

  -- Lock task before blocker consistently, including cancellation and resolution.
  if operation = 'clear_blocker' then
    select task_id into target_id from public.blockers where id = (payload->>'blocker_id')::uuid;
  else target_id := (payload->>'task_id')::uuid;
  end if;
  select * into t from public.tasks where id = target_id for update;
  if not found then raise exception 'Task not found'; end if;
  can_manage := private.can_manage_project(t.project_id);
  if operation = 'clear_blocker' then
    select * into b from public.blockers where id = (payload->>'blocker_id')::uuid for update;
    if not can_manage and t.assignee_id is distinct from actor and b.owner_id is distinct from actor then raise exception 'Blocker resolution is not permitted' using errcode = '42501'; end if;
  elsif not can_manage and t.assignee_id is distinct from actor then
    raise exception 'You cannot change another member''s task' using errcode = '42501';
  end if;
  if operation in ('assign_task', 'reschedule_task', 'accept_task', 'return_task') and not can_manage then raise exception 'This operation requires the project manager' using errcode = '42501'; end if;
  if t.status in ('accepted', 'cancelled') then raise exception 'Completed or cancelled work cannot be modified'; end if;

  if operation = 'assign_task' then
    old_value := t.assignee_id::text;
    update public.tasks set assignee_id = (payload->>'assignee_id')::uuid where id = t.id returning * into t;
    perform private.record_event(t.id, 'task', 'task_reassigned', old_value, t.assignee_id::text, 'Task owner updated');

  elsif operation = 'reschedule_task' then
    if reason is null then raise exception 'A reason is required when rescheduling'; end if;
    old_value := t.due_date::text;
    update public.tasks set due_date = (payload->>'due_date')::date where id = t.id returning * into t;
    perform private.record_event(t.id, 'task', 'task_redated', old_value, t.due_date::text, reason);

  elsif operation = 'update_task_status' then
    next_status := (payload->>'status')::public.task_status;
    if next_status is null or next_status not in ('not_started', 'in_progress', 'cancelled') then raise exception 'Use the blocker or review operations for this status'; end if;
    if t.status in ('blocked', 'submitted') and next_status <> 'cancelled' then raise exception 'Resolve the blocker or finish review before changing status'; end if;
    if next_status = 'cancelled' and not can_manage and t.origin <> 'unplanned' then raise exception 'Only managers can cancel planned work' using errcode = '42501'; end if;
    old_value := t.status::text;
    if next_status = 'cancelled' and t.active_blocker_id is not null then
      update public.blockers set cleared_at = now(), cleared_by = actor where id = t.active_blocker_id;
      perform private.record_event(t.active_blocker_id, 'blocker', 'blocker_cleared', 'active', 'cleared', 'Task cancelled');
    end if;
    update public.tasks set status = next_status, active_blocker_id = null, submitted_at = null where id = t.id returning * into t;
    perform private.record_event(t.id, 'task', 'status_changed', old_value, t.status::text);

  elsif operation = 'submit_task' then
    if t.status not in ('not_started', 'in_progress') then raise exception 'Only open, unblocked work can be submitted'; end if;
    if t.assignee_id is null then raise exception 'Assign an owner before submitting'; end if;
    if nullif(payload->>'deliverable_url', '') is not null and payload->>'deliverable_url' !~ '^https?://' then raise exception 'Deliverable URL must use HTTP or HTTPS'; end if;
    old_value := t.status::text;
    update public.tasks set status = 'submitted', submitted_at = now(), submission_notes = payload->>'notes', deliverable_url = nullif(payload->>'deliverable_url', '') where id = t.id returning * into t;
    perform private.record_event(t.id, 'task', 'task_submitted', old_value, 'submitted', t.submission_notes);

  elsif operation = 'accept_task' then
    if t.status <> 'submitted' then raise exception 'Only submitted work can be accepted'; end if;
    update public.tasks set status = 'accepted', accepted_at = now(), accepted_by = actor where id = t.id returning * into t;
    perform private.record_event(t.id, 'task', 'task_accepted', 'submitted', 'accepted', 'Delivery accepted');

  elsif operation = 'return_task' then
    if t.status <> 'submitted' then raise exception 'Only submitted work can be returned'; end if;
    if reason is null then raise exception 'A reason is required when returning work'; end if;
    update public.tasks set status = 'in_progress', submitted_at = null where id = t.id returning * into t;
    perform private.record_event(t.id, 'task', 'task_returned', 'submitted', 'in_progress', reason);

  elsif operation = 'raise_blocker' then
    if t.status not in ('not_started', 'in_progress') then raise exception 'Only open, unblocked work can be blocked'; end if;
    old_value := t.status::text;
    insert into public.blockers(task_id, category, description, owner_id, blocking_task_id)
    values (t.id, (payload->>'category')::public.blocker_category, btrim(payload->>'description'), (payload->>'owner_id')::uuid, (payload->>'blocking_task_id')::uuid) returning * into b;
    update public.tasks set status = 'blocked', active_blocker_id = b.id where id = t.id;
    perform private.record_event(t.id, 'task', 'status_changed', old_value, 'blocked', b.description);
    perform private.record_event(b.id, 'blocker', 'blocker_raised', null, b.category::text, b.description);
    return to_jsonb(b);

  elsif operation = 'clear_blocker' then
    if b.cleared_at is not null then raise exception 'Blocker is already resolved'; end if;
    update public.blockers set cleared_at = now(), cleared_by = actor where id = b.id returning * into b;
    update public.tasks set status = 'in_progress', active_blocker_id = null where id = t.id and active_blocker_id = b.id;
    perform private.record_event(t.id, 'task', 'status_changed', t.status::text, 'in_progress', 'Blocker resolved');
    perform private.record_event(b.id, 'blocker', 'blocker_cleared', b.category::text, 'cleared', 'Blocker resolved');
    return to_jsonb(b);
  end if;
  return to_jsonb(t);
end $$;
revoke all on function public.tracker_mutate(text, jsonb) from public, anon;
grant execute on function public.tracker_mutate(text, jsonb) to authenticated;
