-- Member rules from the requirements:
--   FR-12 / FR-13  a member reschedules their own task, with a reason
--   FR-05 / SR-04  task origin is decided here: unplanned when the creator assigns
--                  the task to themselves, planned in every other case
-- The task read rule is deliberately unchanged for now: members can still read
-- the tasks of projects they belong to, and FR-19 is enforced in the member UI.
-- Adds one more guard layer in front of the existing tracker_mutate chain.

alter function public.tracker_mutate(text, jsonb) set schema private;
alter function private.tracker_mutate(text, jsonb) rename to mutate_member_rules;
revoke all on function private.mutate_member_rules(text, jsonb) from public, anon, authenticated;

create function public.tracker_mutate(operation text, payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  t public.tasks;
  old_value text;
  reason text := nullif(btrim(payload->>'reason'), '');
begin
  if not private.is_tracker_member() then
    raise sqlstate 'PT401' using message = 'Tracker session expired. Please sign in again.';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'An object payload is required';
  end if;

  -- SR-04: the client never chooses the origin.
  if operation = 'create_task' then
    payload := jsonb_set(
      payload,
      '{origin}',
      to_jsonb(case when (payload->>'assignee_id')::uuid is not distinct from actor and actor is not null
        then 'unplanned' else 'planned' end)
    );
  end if;

  -- FR-12: the assignee may move their own due date; managers keep the existing path.
  if operation = 'reschedule_task' then
    select * into t from public.tasks where id = (payload->>'task_id')::uuid for update;
    if found and t.assignee_id = actor and not exists(
      select 1 from public.profiles u where u.id = actor and (u.role = 'admin' or exists(
        select 1 from public.projects p where p.id = t.project_id and p.manager_id = u.id))
    ) then
      if t.status in ('accepted', 'cancelled') then raise exception 'Completed or cancelled work cannot be modified'; end if;
      if reason is null then raise exception 'A reason is required when rescheduling'; end if;
      if (payload->>'due_date') is null then raise exception 'A new due date is required'; end if;
      old_value := t.due_date::text;
      update public.tasks set due_date = (payload->>'due_date')::date where id = t.id returning * into t;
      perform private.record_event(t.id, 'task', 'task_redated', old_value, t.due_date::text, reason);
      return to_jsonb(t);
    end if;
  end if;

  return private.mutate_member_rules(operation, payload);
end $$;
revoke all on function public.tracker_mutate(text, jsonb) from public, anon;
grant execute on function public.tracker_mutate(text, jsonb) to authenticated;

-- FR-10: when recording which task caused a blocker, a member picks from the
-- titles (only) of open tasks in a project they belong to.
create function public.tracker_project_task_titles(project uuid)
returns table (id uuid, title text)
language sql stable security definer set search_path = '' as $$
  select t.id, t.title from public.tasks t
  where t.project_id = project
    and t.status not in ('accepted', 'cancelled')
    and private.can_read_project(project)
  order by t.title;
$$;
revoke all on function public.tracker_project_task_titles(uuid) from public, anon;
grant execute on function public.tracker_project_task_titles(uuid) to authenticated;
