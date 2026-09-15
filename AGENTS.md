# Futurelabs Project Tracker - Agent Guidelines & Master Rules

Welcome to the **Futurelabs Project Tracker** codebase. This document outlines the core architecture, security principles, coding standards, and operational workflows that you must follow whenever you work on any feature, bug fix, or refactor in this repository.

---

## 1. Project Overview & Tech Stack

The Futurelabs Project Tracker is a production-grade enterprise tracker supporting three user roles: **Admin**, **Manager**, and **Member**. It features a dual-backend architecture: an in-memory / local storage demo adapter and a hardened Supabase cloud adapter with transactional PostgreSQL RPCs and revocable 15-minute sessions.

- **Frontend Core**: React 19, TypeScript 5.9, Vite 8
- **UI & Components**: Mantine v7 (`@mantine/core`, `@mantine/hooks`, `@mantine/dates`)
- **Styling**: Tailwind CSS v4 (layout & spacing on wrappers only; preflight omitted) + `src/theme.ts` + `src/styles.css`
- **Icons**: `@tabler/icons-react` (exclusively)
- **Data & Server State**: TanStack React Query v5 (`@tanstack/react-query`)
- **Backend / Database**: Supabase (`@supabase/supabase-js`), PostgreSQL with Row-Level Security (RLS) & transactional RPCs
- **Testing**: Node.js built-in test runner (`node --test tests/*.test.mjs`) with `@electric-sql/pglite` (in-memory PostgreSQL) + Playwright smoke test (`tests/admin-browser.smoke.cjs`)

---

## 2. Non-Negotiable Architectural Invariants

Whenever implementing or modifying any feature, you **MUST** strictly adhere to the following 5 layers:

```
[ UI Components ] (src/components/...)
       ↓
[ React Query Hooks ] (src/api/hooks/...)
       ↓
[ Tracker Services ] (src/services/...)
       ↓
[ ITrackerApi Interface ] (src/api/tracker-api.interface.ts)
       ↓
 ┌───────────────────────────┴───────────────────────────┐
 ▼                                                       ▼
[ MockLocalStorageApi ]                       [ SupabaseTrackerApi ]
(src/api/mock/local-storage-adapter.ts)       (src/api/supabase/supabase-tracker-api.ts)
```

### Invariant 1: Never Bypass the Service / Hook Layer
- **UI Components and hooks MUST NEVER import `supabase`, `trackerClient`, or make direct Supabase database requests.**
- All reads and writes must pass through `src/api/hooks/` which call `src/services/` (`taskService`, `projectService`, `blockerService`, `peopleService`, `reportingService`, `authService`).
- Services in turn delegate to the backend adapter implementing `ITrackerApi`.

### Invariant 2: Mandatory Dual Backend Support
- The application supports two runtimes:
  - `VITE_DATA_BACKEND=local`: Mock local-storage adapter with isolated keys (`futurelabs_tracker_v1_*`).
  - `VITE_DATA_BACKEND=supabase`: Remote Supabase database adapter.
- **Any new API method added to `ITrackerApi` MUST be implemented in BOTH:**
  1. `src/api/mock/local-storage-adapter.ts`
  2. `src/api/supabase/supabase-tracker-api.ts`
- Never write code that only works on one backend unless it is explicitly an internal adapter mechanism.

### Invariant 3: Transactional RPCs for Supabase Mutations
- Browser clients **CANNOT** directly write or update database tables via `supabase.from('tasks').insert(...)`. Tables are locked down with RLS.
- All domain mutations run through private transactional stored procedures:
  - `tracker_mutate(action, payload)`: Used for standard task, blocker, and leave workflows.
  - `tracker_admin_mutate(action, payload)`: Used for admin workflows (project membership, closing projects).
- **Identity security**: In Supabase mode, the database derives the caller's identity strictly from `auth.uid()` in the JWT session claims. **Never pass caller-supplied actor IDs directly to database mutations.**

### Invariant 4: React Query Cache Invalidation
- Direct service calls do **NOT** invalidate React Query caches.
- Whenever triggering mutations from UI components, always use the mutation hooks (e.g., `useCreateTask`, `useAdminAction`) or explicitly call `queryClient.invalidateQueries`.
- Ensure relevant query keys (`["tasks"]`, `["projects"]`, `["persons"]`, `["blockers"]`, `["availability"]`, `["ledger"]`, `["signals"]`, `["admin-workspace"]`) are invalidated on state changes to prevent stale UI views.

### Invariant 5: Preserve Existing Typings and Domain Models
- Business entities live in `src/entities/` (`task.entity.ts`, `project.entity.ts`, `person.entity.ts`, `blocker.entity.ts`, `availability.entity.ts`, `ledger-record.entity.ts`, `operational-signals.entity.ts`, `project-member.entity.ts`).
- Mutation inputs are DTOs in `src/dtos/` (`create-task.dto.ts`, `create-project.dto.ts`, `raise-blocker.dto.ts`, `record-leave.dto.ts`, `reschedule-task.dto.ts`).
- Database row mappers in `src/api/supabase/mappers.ts` map snake_case database columns to camelCase TypeScript entities.

---

## 3. UI & Design System Rules

1. **Mantine v7 Primitives**:
   - Use Mantine components (`Button`, `Card`, `Table`, `Badge`, `Modal`, `TextInput`, `Select`, `Tabs`, `Alert`, `ActionIcon`) for all interactive widgets.
   - Use default props and styling from `src/theme.ts` (primary color: `teal`, font: Inter).
2. **Tailwind CSS v4 Usage**:
   - Use Tailwind utility classes primarily for **layout, flexbox, grid, sizing, and spacing** on container/wrapper elements.
   - **Do not** add CSS resets or enable Tailwind Preflight, as it conflicts with Mantine's baseline CSS.
   - Custom shell styles belong in `src/styles.css`.
3. **Icons**:
   - **Always** use `@tabler/icons-react` (e.g. `IconCheck`, `IconAlertTriangle`, `IconCalendar`). Do not introduce Lucide, Feather, FontAwesome, or other icon libraries.
4. **Responsive Layouts**:
   - Desktop and mobile layouts must remain functional. Use Mantine's `useMediaQuery('(max-width: 47.99em)')` and responsive props on `AppShell`.

---

## 4. Environment & Tooling Guidelines

### Critical Rule for Windows Execution
On Windows PowerShell, executing `npm` directly can trigger security policy errors (`PSSecurityException: UnauthorizedAccess` on `npm.ps1`).
- **ALWAYS execute `npm.cmd`** for all npm commands:
  - `npm.cmd test`
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `npm.cmd run dev`

### Quality Verification Checklist
Before concluding work on any feature or change:
1. **Tests**: Run `npm.cmd test` (runs all unit and integration tests with in-memory PGlite; all 32+ tests must pass).
2. **Lint**: Run `npm.cmd run lint` (ESLint must exit with code 0).
3. **Build**: Run `npm.cmd run build` (`tsc -b && vite build` must compile with zero TypeScript errors).

---

## 5. Skills Reference

Specialized skills are available in `.agents/skills/`:
- `feature-development-workflow`: Step-by-step guide for end-to-end fullstack feature development.
- `database-and-migrations`: Creating migrations, transactional RPCs, RLS policies, and PGlite tests.
- `ui-component-development`: Creating Mantine + Tailwind components, table views, dialogs, and hooks.
- `test-and-verify`: Running test suites, troubleshooting PGlite, and resolving build/lint issues.
