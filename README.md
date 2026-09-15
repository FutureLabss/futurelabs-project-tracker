# Futurelabs Project Tracker

React, TypeScript, Vite, Mantine, TanStack React Query, and Supabase project tracker.

## Development

Run npm ci, then npm run dev. The default backend is the local-storage demo. Run npm run build, npm run lint, and npm test to validate changes. Node 22.18+ is recommended to satisfy the existing build dependencies.

## Backend configuration

Copy .env.example to .env.local. Choose VITE_DATA_BACKEND=local for the browser demo, or supabase for the cloud adapter. Supabase mode also requires VITE_TRACKER_SUPABASE_URL, VITE_TRACKER_SUPABASE_PUBLISHABLE_KEY, with optional VITE_LMS_APP_URL for the LMS button. Local environment files are ignored by Git.

Follow [Supabase setup](supabase/README.md) to apply the migrations, provision memberships and direct-login account links, import the Tracker signing key, and configure SSO. The checked-in configuration contains no credentials and has not been deployed to a remote project.

## Architecture

Components -> React Query hooks -> service classes -> ITrackerApi adapter.

- src/services: TaskService, ProjectService, BlockerService, PeopleService, ReportingService, DemoService, and AuthService.
- src/services/index.ts: exports shared tracker services and chooses the configured adapter.
- src/services/create-tracker-services.ts: accepts an injected backend independently from environment configuration.
- src/api/tracker-api.interface.ts: backend contract adapted from project-track-demo.
- src/api/hooks: queries and mutations with cache invalidation.
- src/api/mock: reference local-storage adapter with isolated futurelabs_tracker_v1_ keys.
- src/api/supabase: Supabase adapter and database-to-domain field mapping.
- src/lib/supabase: environment validation, shared client, and database types.
- src/entities, src/dtos, src/domain: domain records, mutation inputs, reference seed data, and reporting calculations.
- src/features/auth and src/app/SupabaseApp.tsx: cloud sign-in, session restoration, profile loading, logout, and cache clearing on account changes.
- supabase/migrations: eight tables, access policies, LMS membership/session authorization, and atomic workflow mutations.

Outside React, import taskService from src/services and call await taskService.getTasks({ assigneeId: personId }). Other service methods follow ITrackerApi. Errors reject the returned promise.

Inside React, use useTasks, useProjects, useCreateTask, and the other hooks. Direct service calls do not invalidate React Query caches; use mutation hooks for UI updates or explicitly invalidate affected queries.

The member dashboard consumes backend tasks, people, and projects. Its summaries use those records and the selected date. The Supabase dashboard starts at today's date and uses the signed-in person's name and ID. The admin dashboard uses service-backed portfolio, analytics, governance, risk, task, people, and activity screens. The manager dashboard and member action buttons remain presentation scaffolding.

## Tests

npm test checks the local workflows, Supabase request mapping/pagination, configuration errors, and database permissions/workflows. PostgreSQL tests use PGlite with a simulated managed Auth schema and require no external credentials or Docker. Hosted Auth/network integration still requires a configured Supabase project.

## UI conventions

Use Mantine for buttons, forms, tabs, cards, badges, and tables, with shared defaults in `src/theme.ts`. Customize components through Mantine props or its Styles API. Use Tailwind for responsive layout, sizing, and spacing on wrapper elements; its Preflight reset is omitted to preserve Mantine baseline styles. Keep project-specific shell styling in `src/styles.css`. Use `@tabler/icons-react` for all icons.


## Admin dashboard

Admin navigation now loads real records through `useAdminWorkspace` and the existing project, task, people, blocker, and reporting services. Forms run service operations through `useAdminAction`, which refreshes affected queries after successful saves. Components and hooks do not import the Supabase client or issue database requests. Authentication is also constructed in the service composition module.

Supported flows:

- Create projects, assign/remove leads, inspect health, grant/revoke project membership, and close projects once all tasks are accepted or cancelled.
- Create planned/unplanned tasks, assign owners, start/cancel work, reschedule with reasons, submit deliverables, accept work, and return it for rework.
- Raise categorized blockers with responsible people and optional task dependencies; resolve blockers and inspect their history.
- Inspect team profiles, workload, accepted work and leave; record leave for team members.
- Review portfolio RAG, throughput, rework, unplanned capacity, deadline changes, blocker categories, unmanaged projects, unowned tasks, and delivery risks.
- Inspect immutable activity records and export the current report/table to CSV. Exported user content is escaped and spreadsheet formulas are neutralized.

Project membership management uses existing verified Tracker profiles. LMS identity provisioning and Tracker role/status changes remain trusted administrative setup, not browser signup. Assigned project leads and admins have implicit access; other assignees must have explicit membership. Removing access is blocked while the person owns open project tasks or unresolved blockers. Closed projects remain readable but cannot receive new tasks.

Apply all migrations in filename order, including `20260911000100_admin_events.sql` and `20260911000200_admin_workflows.sql`, before using this UI with Supabase. The first adds audit event values; the second adds the admin-only membership/closing RPC, membership read policy, and serialization with existing workflow mutations. No remote migrations are applied by the local build or tests.

`npm test` includes real PostgreSQL execution of the full migration chain and admin lifecycle, session/role rejection, audit checks, adapter transport, and local persistence. For browser verification, run a local server with `VITE_DATA_BACKEND=local`, then `node tests/admin-browser.smoke.cjs`. The smoke test defaults to `http://127.0.0.1:5178`; override `ADMIN_TEST_URL` as needed. It requires an available Playwright installation/browser; `PLAYWRIGHT_MODULE` can point at an existing cached package. It creates an isolated browser context, performs the admin lifecycle, checks mobile navigation, and writes ignored screenshots/CSV under `test-results/`.
