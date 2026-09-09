-- Single-organization tracker. Access requires a provisioned Auth user/profile.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.user_role as enum ('member', 'manager', 'admin');
create type public.project_state as enum ('active', 'closed');
create type public.task_status as enum ('not_started', 'in_progress', 'blocked', 'submitted', 'accepted', 'cancelled');
create type public.task_complexity as enum ('low', 'mid', 'high');
create type public.task_origin as enum ('planned', 'unplanned');
create type public.blocker_category as enum ('person', 'external', 'decision', 'unclear_requirement');
create type public.ledger_subject_type as enum ('project', 'task', 'blocker', 'availability');
create type public.ledger_change_type as enum ('project_created', 'project_closed', 'manager_assigned', 'task_created', 'status_changed', 'task_reassigned', 'task_redated', 'blocker_raised', 'blocker_cleared', 'task_submitted', 'task_accepted', 'task_returned', 'task_cancelled', 'leave_recorded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  name text not null check (length(btrim(name)) > 0),
  email text not null,
  role public.user_role not null default 'member',
  avatar_url text,
  title text
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  goal text not null default '',
  start_date date not null,
  target_date date not null check (target_date >= start_date),
  manager_id uuid references public.profiles(id),
  state public.project_state not null default 'active',
  created_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  title text not null check (length(btrim(title)) > 0),
  description text not null default '',
  assignee_id uuid references public.profiles(id),
  status public.task_status not null default 'not_started',
  complexity public.task_complexity not null,
  origin public.task_origin not null,
  due_date date not null,
  submitted_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id),
  active_blocker_id uuid,
  deliverable_url text,
  submission_notes text,
  created_at timestamptz not null default now(),
  check (status <> 'accepted' or (accepted_at is not null and accepted_by is not null)),
  check (status <> 'submitted' or submitted_at is not null),
  check ((status = 'blocked') = (active_blocker_id is not null))
);
create table public.blockers (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id),
  category public.blocker_category not null,
  description text not null check (length(btrim(description)) > 0),
  owner_id uuid not null references public.profiles(id),
  blocking_task_id uuid references public.tasks(id),
  raised_at timestamptz not null default now(),
  cleared_at timestamptz,
  cleared_by uuid references public.profiles(id),
  unique (id, task_id),
  check (blocking_task_id is distinct from task_id),
  check ((cleared_at is null) = (cleared_by is null))
);
alter table public.tasks add constraint tasks_active_blocker_fk
  foreign key (active_blocker_id, id) references public.blockers(id, task_id) deferrable initially deferred;
create unique index blockers_one_active_per_task on public.blockers(task_id) where cleared_at is null;
create table public.availability (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.profiles(id),
  from_date date not null,
  to_date date not null check (to_date >= from_date),
  note text not null default ''
);
create table public.ledger_records (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null,
  subject_type public.ledger_subject_type not null,
  actor_id uuid not null references public.profiles(id),
  type public.ledger_change_type not null,
  from_value text,
  to_value text,
  reason text,
  occurred_at timestamptz not null default now(),
  check (type not in ('task_redated', 'task_returned') or nullif(btrim(reason), '') is not null)
);
create index projects_manager_idx on public.projects(manager_id);
create index tasks_project_idx on public.tasks(project_id);
create index tasks_assignee_status_idx on public.tasks(assignee_id, status);
create index tasks_due_date_idx on public.tasks(due_date);
create index tasks_accepted_by_idx on public.tasks(accepted_by);
create index blockers_owner_idx on public.blockers(owner_id);
create index blockers_dependency_idx on public.blockers(blocking_task_id);
create index availability_person_dates_idx on public.availability(person_id, from_date, to_date);
create index ledger_subject_time_idx on public.ledger_records(subject_id, occurred_at desc);
create index ledger_actor_idx on public.ledger_records(actor_id);
create index ledger_time_idx on public.ledger_records(occurred_at desc, id);

create function private.is_tracker_member() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles where id = auth.uid()); $$;
revoke all on function private.is_tracker_member() from public;
grant execute on function private.is_tracker_member() to authenticated;

-- Shared read visibility matches the demo's single-organization dashboards.
-- Writes are only exposed through the transactional RPC in the next migration.
do $$
declare table_name text;
begin
  foreach table_name in array array['profiles', 'projects', 'tasks', 'blockers', 'availability', 'ledger_records'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
    execute format('create policy tracker_member_read on public.%I for select to authenticated using ((select private.is_tracker_member()))', table_name);
  end loop;
end $$;

create function private.handle_tracker_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, name, email)
  values (new.id, coalesce(nullif(btrim(new.raw_user_meta_data->>'name'), ''), nullif(split_part(new.email, '@', 1), ''), 'Team member'), coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;
revoke all on function private.handle_tracker_user() from public;
create trigger tracker_user_created after insert on auth.users
  for each row execute function private.handle_tracker_user();
create trigger tracker_user_email_changed after update of email on auth.users
  for each row execute function private.handle_tracker_user();
-- Existing accounts are provisioned as members. Roles are never taken from user metadata.
insert into public.profiles(id, name, email)
select id, coalesce(nullif(btrim(raw_user_meta_data->>'name'), ''), nullif(split_part(email, '@', 1), ''), 'Team member'), coalesce(email, '') from auth.users
on conflict (id) do nothing;
