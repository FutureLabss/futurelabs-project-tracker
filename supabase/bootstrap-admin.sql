-- Run AFTER all migrations in the Tracker project's SQL Editor.
-- Create a confirmed email/password account in Tracker Auth first.
-- Replace the placeholders below. Re-running with the same IDs is safe.
-- For an existing LMS profile, set tracker_profile_id to its existing UUID.
begin;
do $$
declare
  tracker_auth_user_id uuid := 'REPLACE_WITH_TRACKER_AUTH_USER_UUID';
  tracker_profile_id uuid := tracker_auth_user_id;
  admin_name text := 'Tracker Administrator';
  account_email text;
begin
  select email into account_email from auth.users
  where id = tracker_auth_user_id and email_confirmed_at is not null;
  if account_email is null then
    raise exception 'Create and confirm the Tracker Auth account first';
  end if;
  if exists(select 1 from public.tracker_auth_links
    where (auth_user_id = tracker_auth_user_id and profile_id <> tracker_profile_id)
       or (profile_id = tracker_profile_id and auth_user_id <> tracker_auth_user_id)) then
    raise exception 'An account is already linked to a different profile; review the existing link';
  end if;
  insert into public.profiles(id, name, email, role, status)
  values(tracker_profile_id, admin_name, account_email, 'admin', 'active')
  on conflict(id) do update set role = 'admin', status = 'active';
  insert into public.tracker_auth_links(auth_user_id, profile_id)
  values(tracker_auth_user_id, tracker_profile_id)
  on conflict(auth_user_id) do nothing;
end $$;
commit;
