# Futurelabs Project Tracker

React, TypeScript, Vite, Mantine, TanStack React Query, and Supabase project tracker.

## Development

Run npm ci, then npm run dev. The default backend is the local-storage demo. Run npm run build, npm run lint, and npm test to validate changes. Node 22.18+ is recommended to satisfy the existing build dependencies.

## Backend configuration

Copy .env.example to .env.local. Choose VITE_DATA_BACKEND=local for the browser demo, or supabase for the cloud adapter. Supabase mode also requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Local environment files are ignored by Git.

Follow [Supabase setup](supabase/README.md) to apply the migrations, provision users, and configure Auth. The checked-in configuration contains no credentials and has not been deployed to a remote project.

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
- supabase/migrations: six application tables, access policies, Auth profile provisioning, and atomic workflow mutations.

Outside React, import taskService from src/services and call await taskService.getTasks({ assigneeId: personId }). Other service methods follow ITrackerApi. Errors reject the returned promise.

Inside React, use useTasks, useProjects, useCreateTask, and the other hooks. Direct service calls do not invalidate React Query caches; use mutation hooks for UI updates or explicitly invalidate affected queries.

The member dashboard consumes backend tasks, people, and projects. Its summaries use those records and the selected date. The Supabase dashboard starts at today's date and uses the signed-in person's name and ID. Admin/manager dashboard configuration and existing placeholder buttons remain presentation scaffolding.

## Tests

npm test checks the local workflows, Supabase request mapping/pagination, configuration errors, and database permissions/workflows. PostgreSQL tests use PGlite with a simulated managed Auth schema and require no external credentials or Docker. Hosted Auth/network integration still requires a configured Supabase project.

## UI conventions

Use Mantine for buttons, forms, tabs, cards, badges, and tables, with shared defaults in `src/theme.ts`. Customize components through Mantine props or its Styles API. Use Tailwind for responsive layout, sizing, and spacing on wrapper elements; its Preflight reset is omitted to preserve Mantine baseline styles. Keep project-specific shell styling in `src/styles.css`. Use `@tabler/icons-react` for all icons.
