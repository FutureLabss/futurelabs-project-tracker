# Supabase setup

This directory contains the database schema and transactional API used by SupabaseTrackerApi. Nothing is deployed automatically. Local demo mode remains the default.

## Connect a hosted project

1. Create or choose a Supabase project intended for this application. These migrations create new tables and types in public; review any existing schema before applying them.
2. In Supabase Auth settings, disable public sign-ups. This is a single-organization application: every provisioned profile can read shared tracker data, including people, availability, and the audit feed. The local config disables sign-ups, but hosted Auth settings must be configured separately.
3. Apply the two migrations in filename order using the Supabase SQL editor, or use the CLI commands below after reviewing the target project.
4. Create password-based users in Authentication > Users. The migration provisions existing users, and the Auth trigger provisions new ones with the member role. Profile names come from name metadata or the email prefix. User-supplied role metadata is ignored.
5. Promote the initial administrator with a trusted SQL editor session. Replace the example UUID with the selected user's Auth ID:

```sql
update public.profiles
set role = 'admin'
where id = '00000000-0000-0000-0000-000000000000';
```

Use the same controlled process to assign manager roles. Application users cannot edit their roles. Project manager assignments are a separate workflow.

6. Copy .env.example to .env.local in the application root. Set VITE_DATA_BACKEND=supabase, VITE_SUPABASE_URL to the project URL, and VITE_SUPABASE_PUBLISHABLE_KEY to its sb_publishable_ key. Restart Vite. Legacy JWT anon keys are not accepted by this configuration; use a publishable key. Never put a secret or service_role key in frontend environment variables.
7. Sign in with a provisioned account. Supabase mode uses real Auth sessions and profiles. Local sample credentials and browser seed data are not migrated or uploaded.

CLI alternative for migration deployment (run from the application root):

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

The repository has not been linked to a remote project and no remote migrations have been applied by this implementation.

## Local Supabase

With Docker running, execute npx supabase start from the application root. Migrations are applied to the local stack. Use npx supabase status to obtain its URL and publishable key, then configure .env.local. Provision users through local Studio. No seed script is enabled, so there are no bundled real Auth accounts or shared passwords.

The default local Auth site URL is http://localhost:5173. Update it and its redirect allowlist when running the app on a different origin. Configure the corresponding hosted site URL before hosting the application.

## Permissions and workflow rules

- All provisioned users can read the six application tables. This is not a multi-tenant schema.
- Administrators create projects and assign managers; administrators and a project's assigned manager manage its tasks and review submitted work.
- Members can create unplanned tasks assigned to themselves, update their own open work, submit it, and raise blockers. Only project managers/administrators can cancel planned work. Members can cancel their own unplanned work.
- Blockers can be cleared by the task assignee, the blocker owner, or project management.
- Users record their own leave; managers and administrators can record leave for others.
- Writes use public.tracker_mutate. Direct table writes and ledger edits are not granted to browser roles. Audit actor IDs always come from auth.uid(), not request payloads. Task changes and ledger records commit together.
- Submitted work must go through acceptance/return. Blocked work must be resolved before submission. Accepted and cancelled tasks cannot be modified through this API.
- Demo reset is deliberately unavailable in Supabase mode.

The ledger's subject_id is polymorphic, paired with subject_type; the transactional API creates those references. It is not a foreign key to one table. User deletion is restricted where records reference the profile, preserving attribution; account deactivation/retention is an administrative concern.

## Schema and generated types

The six tables are profiles, projects, tasks, blockers, availability, and ledger_records. Status/role/category values use enums, and dates and relationships have database constraints. Reporting is calculated from the stored records using the existing domain functions; it does not introduce analytics tables.

src/lib/supabase/database.types.ts is initially maintained against these migrations. After applying schema changes, regenerate it using the Supabase CLI. Capture successful output into this file; database-rows.ts keeps the adapter's row aliases independent from the generated file format.

```sh
npx supabase gen types typescript --linked --schema public
```

For the local stack, replace --linked with --local. Run npm run build after replacing the types.

## Verification and limits

npm test runs service and HTTP-adapter tests plus the migrations against embedded PostgreSQL (PGlite). Tests simulate Supabase's auth.users table and auth.uid() helper and verify grants, RLS, role checks, rollback, and audit attribution. They do not validate a hosted Supabase project's Auth settings, network access, or email delivery.

The adapter paginates list reads in batches of 500; keep the API maximum row count at 500 or higher (the included config uses 1000). Client-side analytics fetch multiple collections separately, so reports are not a single transactional snapshot during concurrent writes.

The current member task views use the backend. Existing placeholder action buttons and static admin/manager panels have not been expanded into new UI workflows; all ITrackerApi operations are available through the services and hooks.

References: [Supabase user management](https://supabase.com/docs/guides/auth/managing-user-data), [database functions](https://supabase.com/docs/guides/database/functions), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [generated types](https://supabase.com/docs/guides/api/rest/generating-types).
