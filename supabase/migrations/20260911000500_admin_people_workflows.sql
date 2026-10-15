create or replace function public.tracker_admin_mutate(operation text, payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  p public.projects;
  person uuid;
  included boolean;
  target_profile public.profiles;
  p_name text;
  p_email text;
  p_role text;
  p_title text;
  p_status text;
  new_id uuid;
  old_role text;
  old_status text;
begin
  if not private.is_tracker_member() then
    raise sqlstate 'PT401' using message = 'Tracker session expired. Please sign in again.';
  end if;
  if not exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise sqlstate 'PT403' using message = 'Administrator access is required';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'An object payload is required';
  end if;
  if operation not in (
    'set_project_member',
    'close_project',
    'create_person',
    'update_profile',
    'change_role',
    'set_person_status',
    'revoke_sessions'
  ) then
    raise exception 'Unsupported admin operation';
  end if;

  -- 1. Project Operations
  if operation in ('set_project_member', 'close_project') then
    select * into p from public.projects where id = (payload->>'project_id')::uuid for update;
    if not found or p.state <> 'active' then
      raise exception 'An active project is required';
    end if;
    if operation = 'close_project' then
      if exists(select 1 from public.tasks where project_id = p.id and status not in ('accepted', 'cancelled')) then
        raise exception 'Accept or cancel all open tasks before closing this project';
      end if;
      update public.projects set state = 'closed' where id = p.id returning * into p;
      perform private.record_event(p.id, 'project', 'project_closed', 'active', 'closed', 'Project completed');
      return to_jsonb(p);
    end if;

    person := (payload->>'person_id')::uuid;
    if jsonb_typeof(payload->'included') is distinct from 'boolean' then
      raise exception 'included must be a boolean';
    end if;
    included := (payload->>'included')::boolean;
    if not exists(select 1 from public.profiles where id = person and (not included or status = 'active')) then
      raise exception 'Select an active person';
    end if;
    if not included and (
      exists(select 1 from public.tasks where project_id = p.id and assignee_id = person and status not in ('accepted', 'cancelled')) or
      exists(select 1 from public.blockers b join public.tasks t on t.id = b.task_id where t.project_id = p.id and b.owner_id = person and b.cleared_at is null)
    ) then
      raise exception 'Reassign open tasks and resolve owned blockers before removing access';
    end if;
    if included then
      insert into public.project_members(project_id, lms_user_id) values(p.id, person) on conflict do nothing;
      if found then
        perform private.record_event(p.id, 'project', 'project_member_added', null, person::text, 'Project access granted');
      end if;
    else
      delete from public.project_members where project_id = p.id and lms_user_id = person;
      if found then
        perform private.record_event(p.id, 'project', 'project_member_removed', person::text, null, 'Project access removed');
      end if;
    end if;
    return jsonb_build_object('project_id', p.id, 'person_id', person, 'included', included);
  end if;

  -- 2. People Operations
  if operation = 'create_person' then
    p_name := btrim(coalesce(payload->>'name', ''));
    if length(p_name) = 0 then raise exception 'Person name cannot be blank'; end if;
    p_email := lower(btrim(coalesce(payload->>'email', '')));
    if length(p_email) = 0 or p_email not like '%@%' then raise exception 'Valid email is required'; end if;
    p_role := coalesce(payload->>'role', 'member');
    if p_role not in ('member', 'manager', 'admin') then raise exception 'Invalid role specified'; end if;
    p_status := coalesce(payload->>'status', 'active');
    if p_status not in ('active', 'inactive') then raise exception 'Invalid status specified'; end if;
    p_title := nullif(btrim(coalesce(payload->>'title', '')), '');
    if payload->>'id' is not null then
      new_id := (payload->>'id')::uuid;
    else
      new_id := gen_random_uuid();
    end if;

    insert into public.profiles(id, name, email, role, status, title)
    values(new_id, p_name, p_email, p_role::public.user_role, p_status, p_title)
    returning * into target_profile;

    perform private.record_event(new_id, 'person', 'person_created', null, p_role, 'Person account provisioned');
    return to_jsonb(target_profile);
  end if;

  person := (payload->>'person_id')::uuid;
  select * into target_profile from public.profiles where id = person for update;
  if not found then raise exception 'Person profile not found'; end if;

  if operation = 'update_profile' then
    if payload ? 'name' then
      p_name := btrim(payload->>'name');
      if length(p_name) = 0 then raise exception 'Name cannot be blank'; end if;
      target_profile.name := p_name;
    end if;
    if payload ? 'title' then
      target_profile.title := nullif(btrim(payload->>'title'), '');
    end if;
    if payload ? 'avatar_url' then
      target_profile.avatar_url := nullif(btrim(payload->>'avatar_url'), '');
    end if;
    update public.profiles set name = target_profile.name, title = target_profile.title, avatar_url = target_profile.avatar_url
    where id = target_profile.id returning * into target_profile;
    perform private.record_event(target_profile.id, 'person', 'profile_updated', null, null, 'Profile details updated');
    return to_jsonb(target_profile);
  end if;

  if operation = 'change_role' then
    p_role := payload->>'role';
    if p_role not in ('member', 'manager', 'admin') then raise exception 'Invalid role specified'; end if;
    old_role := target_profile.role::text;
    if old_role = 'admin' and p_role <> 'admin' then
      if (select count(*) from public.profiles where role = 'admin' and status = 'active' and id <> target_profile.id) = 0 then
        raise exception 'Cannot demote the last active administrator';
      end if;
    end if;
    if old_role in ('manager', 'admin') and p_role = 'member' then
      insert into public.project_members(project_id, lms_user_id)
      select id, target_profile.id from public.projects where manager_id = target_profile.id and state = 'active'
      on conflict do nothing;
      update public.projects set manager_id = null where manager_id = target_profile.id and state = 'active';
    end if;
    update public.profiles set role = p_role::public.user_role where id = target_profile.id returning * into target_profile;
    perform private.record_event(target_profile.id, 'person', 'role_changed', old_role, p_role, 'User role updated');
    return to_jsonb(target_profile);
  end if;

  if operation = 'set_person_status' then
    p_status := payload->>'status';
    if p_status not in ('active', 'inactive') then raise exception 'Invalid status specified'; end if;
    old_status := target_profile.status;
    if target_profile.role = 'admin' and old_status = 'active' and p_status = 'inactive' then
      if (select count(*) from public.profiles where role = 'admin' and status = 'active' and id <> target_profile.id) = 0 then
        raise exception 'Cannot deactivate the last active administrator';
      end if;
    end if;
    update public.profiles set status = p_status where id = target_profile.id returning * into target_profile;
    if p_status = 'inactive' then
      update public.tracker_sessions set revoked_at = now() where lms_user_id = target_profile.id and revoked_at is null;
      update public.projects set manager_id = null where manager_id = target_profile.id and state = 'active';
    end if;
    perform private.record_event(target_profile.id, 'person', 'status_changed', old_status, p_status, 'Account status updated');
    return to_jsonb(target_profile);
  end if;

  if operation = 'revoke_sessions' then
    update public.tracker_sessions set revoked_at = now() where lms_user_id = target_profile.id and revoked_at is null;
    perform private.record_event(target_profile.id, 'person', 'sessions_revoked', null, null, 'Active tracker sessions revoked');
    return jsonb_build_object('person_id', target_profile.id, 'revoked', true);
  end if;

  raise exception 'Unsupported admin operation';
end $$;

drop policy if exists ledger_read on public.ledger_records;
create policy ledger_read on public.ledger_records for select to authenticated using (
  private.is_tracker_member() and (
    (subject_type = 'project' and private.can_read_project(subject_id)) or
    (subject_type = 'task' and exists(select 1 from public.tasks t where t.id = subject_id)) or
    (subject_type = 'blocker' and exists(select 1 from public.blockers b where b.id = subject_id)) or
    (subject_type = 'availability' and exists(select 1 from public.availability a where a.id = subject_id)) or
    (subject_type = 'person' and exists(select 1 from public.profiles u where u.id = auth.uid() and (u.role = 'admin' or u.id = subject_id)))
  )
);
