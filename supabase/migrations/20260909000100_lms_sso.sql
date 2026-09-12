-- LMS UUIDs replace Tracker Auth identity references; existing business rows are preserved.
drop trigger if exists tracker_user_created on auth.users;
drop trigger if exists tracker_user_email_changed on auth.users;
drop function private.handle_tracker_user();
alter table public.profiles drop constraint profiles_id_fkey;
alter table public.profiles add column status text not null default 'inactive' check (status in ('active', 'inactive'));
comment on column public.profiles.id is 'Canonical LMS auth.users UUID; external identity, not Tracker Auth';
-- profiles is the existing single-workspace membership model. Activation is explicit.
create table public.tracker_sessions (
  id uuid primary key,
  lms_user_id uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index tracker_sessions_user_idx on public.tracker_sessions(lms_user_id);
alter table public.tracker_sessions enable row level security;
revoke all on public.tracker_sessions from public, anon, authenticated;
grant all on public.tracker_sessions to service_role;
create table public.project_members (
  project_id uuid not null references public.projects(id),
  lms_user_id uuid not null references public.profiles(id),
  primary key(project_id, lms_user_id)
);
alter table public.project_members enable row level security;
revoke all on public.project_members from public, anon, authenticated;
grant all on public.project_members to service_role;
-- Preserve current assignments as explicit project access.
insert into public.project_members select distinct project_id, assignee_id from public.tasks where assignee_id is not null on conflict do nothing;

create or replace function private.is_tracker_member() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles p join public.tracker_sessions s on s.lms_user_id = p.id
 where p.id = auth.uid() and p.status = 'active' and s.revoked_at is null and s.expires_at > now()
 and s.id::text = (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'jti')
 and (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'iss') = 'project-tracker');
$$;
create function private.can_read_project(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select private.is_tracker_member() and exists(select 1 from public.profiles u where u.id = auth.uid() and
 (u.role = 'admin' or exists(select 1 from public.projects p where p.id = target and p.manager_id = u.id)
 or exists(select 1 from public.project_members m where m.project_id = target and m.lms_user_id = u.id)));
$$;
revoke all on function private.can_read_project(uuid) from public;
grant execute on function private.can_read_project(uuid) to authenticated;
drop policy tracker_member_read on public.projects;
create policy project_read on public.projects for select to authenticated using (private.can_read_project(id));
drop policy tracker_member_read on public.tasks;
create policy task_read on public.tasks for select to authenticated using (private.can_read_project(project_id));
drop policy tracker_member_read on public.blockers;
create policy blocker_read on public.blockers for select to authenticated using (exists(select 1 from public.tasks t where t.id = task_id));
drop policy tracker_member_read on public.ledger_records;
create policy ledger_read on public.ledger_records for select to authenticated using (
 private.is_tracker_member() and (
 (subject_type = 'project' and private.can_read_project(subject_id)) or
 (subject_type = 'task' and exists(select 1 from public.tasks t where t.id = subject_id)) or
 (subject_type = 'blocker' and exists(select 1 from public.blockers b where b.id = subject_id)) or
 (subject_type = 'availability' and exists(select 1 from public.availability a where a.id = subject_id))));

-- Keep the existing transactional business rules behind an additional session/access gate.
alter function public.tracker_mutate(text, jsonb) set schema private;
alter function private.tracker_mutate(text, jsonb) rename to mutate_business;
revoke all on function private.mutate_business(text, jsonb) from public, anon, authenticated;
create function public.tracker_mutate(operation text, payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare target uuid; person uuid; dependency uuid;
begin
 if not private.is_tracker_member() then raise sqlstate 'PT401' using message = 'Tracker session expired. Please sign in again.'; end if;
 if operation in ('create_task', 'assign_project_manager') then target := (payload->>'project_id')::uuid;
 elsif operation = 'clear_blocker' then
 select t.project_id into target from public.tasks t join public.blockers b on b.task_id = t.id where b.id = (payload->>'blocker_id')::uuid;
 elsif operation not in ('create_project', 'record_availability') then
 select project_id into target from public.tasks where id = (payload->>'task_id')::uuid;
 end if;
 if operation not in ('create_project', 'record_availability') and (target is null or not private.can_read_project(target)) then
 raise sqlstate 'PT403' using message = 'Project access denied'; end if;
 person := coalesce((payload->>'assignee_id')::uuid, (payload->>'owner_id')::uuid);
 if person is not null and target is not null and not exists (
 select 1 from public.profiles p where p.id = person and p.status = 'active' and
 (p.role = 'admin' or exists(select 1 from public.projects j where j.id = target and j.manager_id = person)
 or exists(select 1 from public.project_members m where m.project_id = target and m.lms_user_id = person))) then
 raise sqlstate 'PT403' using message = 'Selected person has no project access'; end if;
 dependency := (payload->>'blocking_task_id')::uuid;
 if dependency is not null and not exists(select 1 from public.tasks t where t.id = dependency and private.can_read_project(t.project_id)) then
 raise sqlstate 'PT403' using message = 'Dependency access denied'; end if;
 return private.mutate_business(operation, payload);
end $$;
revoke all on function public.tracker_mutate(text, jsonb) from public, anon;
grant execute on function public.tracker_mutate(text, jsonb) to authenticated;
create function public.tracker_logout() returns void language plpgsql security definer set search_path = '' as $$
begin
 update public.tracker_sessions set revoked_at = now() where lms_user_id = auth.uid()
 and id::text = (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'jti');
 raise log '%', json_build_object('event', 'tracker_logout', 'lms_user_id', auth.uid(), 'timestamp', now());
end $$;
revoke all on function public.tracker_logout() from public, anon;
grant execute on function public.tracker_logout() to authenticated;
