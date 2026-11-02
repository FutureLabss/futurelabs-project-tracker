-- Who may use the Tracker, and with which role, is decided only in the LMS by its
-- superadmin. The LMS pushes every grant, role change and revocation through the
-- sync-lms-access function, and every SSO sign-in re-applies the LMS's current
-- answer. Tracker password sign-in is removed.
drop table public.tracker_auth_links;

-- An LMS account maps to one Tracker profile. Existing Tracker people keep their
-- profile and history: the first LMS grant for the same email adopts that profile
-- rather than creating a duplicate person.
create table public.lms_account_links (
  lms_user_id uuid primary key,
  profile_id uuid not null unique references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.lms_account_links enable row level security;
revoke all on public.lms_account_links from public, anon, authenticated;
grant all on public.lms_account_links to service_role;

-- Sessions issued by the password login must not outlive it.
update public.tracker_sessions set revoked_at = now() where revoked_at is null;

-- Ledger rows need a Tracker actor; the LMS superadmin has none, so the person is
-- recorded as the subject and actor, with the LMS named as the source.
create function public.apply_lms_access(
  p_lms_user_id uuid, p_name text, p_email text, p_role text, p_active boolean
) returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare
  target public.profiles;
  old_role text;
  old_status text;
  created boolean := false;
begin
  if p_lms_user_id is null or p_active is null then
    raise exception 'LMS user and access state are required';
  end if;
  if p_active then
    p_name := btrim(coalesce(p_name, ''));
    p_email := lower(btrim(coalesce(p_email, '')));
    if p_email not like '%@%' then raise exception 'Valid email is required'; end if;
    if length(p_name) = 0 then p_name := p_email; end if;
    if p_role is null or p_role not in ('member', 'manager', 'admin') then
      raise exception 'Invalid role specified';
    end if;
  end if;

  select p.* into target from public.lms_account_links l
  join public.profiles p on p.id = l.profile_id
  where l.lms_user_id = p_lms_user_id for update of p;
  if not found then
    if not p_active then return null; end if;
    select p.* into target from public.profiles p
    where p.id = p_lms_user_id
      or (lower(p.email) = p_email
        and not exists (select 1 from public.lms_account_links l where l.profile_id = p.id))
    order by (p.id = p_lms_user_id) desc, p.id
    limit 1 for update;
    if not found then
      insert into public.profiles(id, name, email, role, status)
      values (p_lms_user_id, p_name, p_email, p_role::public.user_role, 'active')
      returning * into target;
      created := true;
    end if;
    insert into public.lms_account_links(lms_user_id, profile_id) values (p_lms_user_id, target.id);
  end if;

  if created then
    insert into public.ledger_records(subject_id, subject_type, actor_id, type, from_value, to_value, reason)
    values (target.id, 'person', target.id, 'person_created', null, p_role, 'Access granted in the LMS');
    return target;
  end if;

  old_role := target.role::text;
  old_status := target.status;
  if old_role = 'admin' and old_status = 'active' and (not p_active or p_role <> 'admin')
    and not exists (select 1 from public.profiles
      where role = 'admin' and status = 'active' and id <> target.id) then
    raise exception 'Cannot remove the last active administrator';
  end if;

  if not p_active then
    if old_status = 'inactive' then return target; end if;
    update public.profiles set status = 'inactive' where id = target.id returning * into target;
    update public.tracker_sessions set revoked_at = now() where lms_user_id = target.id and revoked_at is null;
    update public.projects set manager_id = null where manager_id = target.id and state = 'active';
    insert into public.ledger_records(subject_id, subject_type, actor_id, type, from_value, to_value, reason)
    values (target.id, 'person', target.id, 'status_changed', old_status, 'inactive', 'Access revoked in the LMS');
    return target;
  end if;

  if old_role in ('manager', 'admin') and p_role = 'member' then
    insert into public.project_members(project_id, lms_user_id)
    select id, target.id from public.projects where manager_id = target.id and state = 'active'
    on conflict do nothing;
    update public.projects set manager_id = null where manager_id = target.id and state = 'active';
  end if;
  update public.profiles
  set name = p_name, email = p_email, role = p_role::public.user_role, status = 'active'
  where id = target.id returning * into target;
  if old_role <> p_role then
    insert into public.ledger_records(subject_id, subject_type, actor_id, type, from_value, to_value, reason)
    values (target.id, 'person', target.id, 'role_changed', old_role, p_role, 'Role set in the LMS');
  end if;
  if old_status <> 'active' then
    insert into public.ledger_records(subject_id, subject_type, actor_id, type, from_value, to_value, reason)
    values (target.id, 'person', target.id, 'status_changed', old_status, 'active', 'Access granted in the LMS');
  end if;
  return target;
end $$;
revoke all on function public.apply_lms_access(uuid, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.apply_lms_access(uuid, text, text, text, boolean) to service_role;

-- Creating people, changing roles and switching accounts on or off now belong to
-- the LMS; a Tracker-side change would be overwritten at the person's next sign-in.
alter function public.tracker_admin_mutate(text, jsonb) set schema private;
alter function private.tracker_admin_mutate(text, jsonb) rename to admin_mutate_unmanaged;
revoke all on function private.admin_mutate_unmanaged(text, jsonb) from public, anon, authenticated;

create function public.tracker_admin_mutate(operation text, payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if operation in ('create_person', 'change_role', 'set_person_status') then
    raise sqlstate 'PT403' using message = 'People, roles and access are managed in the LMS';
  end if;
  return private.admin_mutate_unmanaged(operation, payload);
end $$;
revoke all on function public.tracker_admin_mutate(text, jsonb) from public, anon;
grant execute on function public.tracker_admin_mutate(text, jsonb) to authenticated;
