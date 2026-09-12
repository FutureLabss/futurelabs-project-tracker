-- Account associations are provisioned only by trusted administrators.
create table public.tracker_auth_links (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.tracker_auth_links enable row level security;
revoke all on public.tracker_auth_links from public, anon, authenticated;
grant all on public.tracker_auth_links to service_role;
comment on column public.profiles.id is 'Stable Tracker profile UUID; existing LMS profiles retain their LMS UUID';

-- Do not rely on Supabase project-specific default privileges. The exchange
-- function uses service_role to resolve profiles and create application sessions.
grant usage on schema public to service_role;
grant select on public.profiles to service_role;
ccccccp
-- Supabase may grant new functions directly to API roles via default privileges.
-- Revoking PUBLIC alone does not remove those direct grants. Only the two RLS
-- predicates need to be callable; business helpers must remain behind the RPCs.
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_tracker_member() to authenticated;
grant execute on function private.can_read_project(uuid) to authenticated;
