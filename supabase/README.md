# LMS SSO deployment and technical report

Tracker uses the live LMS identity provider and its own business database. Direct email/password login is also supported through Tracker Supabase Auth and an administrator-managed account link. Local demo mode remains available explicitly through VITE_DATA_BACKEND=local.

## Integration contract (must confirm against the deployed LMS)

The LMS implementation was not supplied with this repository. The configurable adapter in functions/_shared/sso.ts assumes HTTPS POST to LMS_SSO_CONSUME_URL, Authorization: Bearer LMS_SSO_CONSUME_SECRET, JSON `{ "code": "opaque-code" }`, and a successful response `{ "success": true, "user": { "id": "LMS-UUID" } }`. It forwards no browser identity, redirects, or roles.

The LMS endpoint MUST hash using its own established scheme and atomically consume only an unused, unexpired code bound to the Tracker application/callback. Concurrent requests for the same code must yield at most one success. Invalid, expired, reused or wrong-audience codes must return 400/401/403/404/409/410. Other failures become a generic 503. Tracker never retries the exchange and never guesses the LMS hashing/storage schema. Confirm this contract before deployment; adapt only the small server-side adapter if needed. Do not modify production LMS identities or auth configuration.

## Session and authorization

The Edge Function resolves the verified LMS UUID against existing profiles, which now doubles as Tracker membership: profiles.id is the external LMS UUID; role is member/manager/admin; status must be active. Tracker roles are independent of LMS roles. No cross-database foreign key exists.

After membership validation, the function signs a 15-minute ES256 JWT with sub=LMS UUID, iss=project-tracker, aud=authenticated, role=authenticated and a random jti. It persists jti and expiration in tracker_sessions. The signing key MUST be imported and trusted by the Tracker Supabase Data API; simply signing a token does not establish database trust. See [Supabase signing keys](https://supabase.com/docs/guides/auth/signing-keys) and [externally minted JWT support](https://supabase.com/docs/guides/auth/jwts).

The shared trackerClient supplies that JWT with its accessToken callback. Supabase verifies the signature and expiration; RLS additionally checks issuer, jti, session expiry/revocation and current active membership. Consequently auth.uid() is used only after explicit Data API token trust is configured. Mutations recheck these conditions before invoking the existing private transactional business rules. Browser callers cannot invoke the private implementation or change tables directly.

Administrators have all-project access. Assigned project managers and explicit project_members have project access. Task/blocker/project ledger reads follow that scope; mutation checks prevent cross-project task creation, reassignment to outsiders and inaccessible dependency references. Profiles and availability remain a shared team directory/calendar for active members, preserving the existing single-organization behavior. Reports aggregate only authorized project data.

The browser stores only the short-lived Tracker token in sessionStorage. Direct login uses a separate nonpersistent Auth client; its Auth session is signed out after the exchange. This supports reloads within the tab. It is JavaScript-readable and is NOT an HttpOnly cookie: XSS can steal it. No refresh token is issued. Expiration requires signing in again with either method. Membership is validated before rendering protected UI, on focus, every 30 seconds and at token expiry; the database enforces revocation on every request. Existing cached content may remain visible until the next validation, at most 30 seconds in an active tab.

Logout revokes the current jti through tracker_logout, clears browser state and query caches, and never calls LMS Auth. If the network prevents revocation, local state is still removed and an error explains that the server token lasts at most 15 minutes. There is no automatic LMS-wide logout or LMS revocation synchronization.

## Required Tracker configuration

1. Back up and review existing Tracker data. Apply migrations in filename order using the migration CLI. Do not manually change production schema. The new migration drops only Tracker Auth provisioning triggers and the profiles-to-Tracker-Auth foreign key, preserves business records, and defaults every existing profile to inactive. Do not activate old Tracker UUIDs unless verified to equal canonical LMS UUIDs. Where old IDs differ, prepare a reviewed mapping/data migration for every ownership and audit reference; no email-based automatic relinking is performed.
2. Provision profiles using verified LMS UUIDs through a trusted administrative process, setting name/email, Tracker role and status=active. Grant explicit project_members rows as needed. Existing task assignees are backfilled as project members; project managers have access through projects.manager_id. Normal browser roles cannot provision membership.
3. In Tracker Supabase JWT signing-key settings, import a securely generated ES256/P-256 private JWK. Keep its private material only in approved secret storage. Configure TRACKER_SIGNING_JWK with the matching private JWK and the kid actually assigned by Supabase. Ensure the imported key is accepted for Data API verification (rotate into use when necessary). Confirm its public key in the Tracker JWKS and run the token smoke tests below. Do not change LMS signing keys.
4. Set Edge Function secrets: TRACKER_SUPABASE_SECRET_KEY (Tracker privileged key), TRACKER_SIGNING_JWK (private JSON JWK), LMS_SSO_CONSUME_URL (fixed HTTPS URL), LMS_SSO_CONSUME_SECRET (server bearer credential), TRACKER_ALLOWED_ORIGINS (comma-separated exact Tracker origins, no wildcard). SUPABASE_URL is supplied by the Edge runtime. Add localhost origins only for development. Keep every secret out of VITE_ variables and Git.
5. Deploy consume-project-tracker-sso. Its checked-in verify_jwt=false permits the initial unauthenticated code exchange; the handler checks origin and LMS proof itself. No other function is configured this way. See [Supabase function configuration](https://supabase.com/docs/guides/functions/function-configuration).
6. Set frontend VITE_DATA_BACKEND=supabase, VITE_TRACKER_SUPABASE_URL, VITE_TRACKER_SUPABASE_PUBLISHABLE_KEY (sb_publishable_) and VITE_LMS_APP_URL (fixed LMS launch/login URL). Legacy VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY aliases remain accepted. LMS Supabase URL/key are not needed in the browser because no browser LMS Auth operation occurs; the configured server endpoint represents LMS identity authority.
7. Configure the hosting SPA fallback so /auth/callback serves index.html. Ensure the LMS allows this exact callback and issues codes for this Tracker audience. Avoid query strings in hosting/access logs and analytics on callback routes. index.html uses no-referrer and the app immediately removes code from browser history. Serve over HTTPS; configure a tested CSP and rate limiting for the exchange endpoint at the hosting/API boundary.
8. Keep Tracker password signup disabled. Configure monitoring for structured tracker_sso_success, tracker_sso_failure, tracker_access_denied and tracker_session_created events; never log request bodies or tokens. Schedule administrative cleanup of expired/revoked tracker_sessions. Membership updates immediately control backend access.

CLI (review the target project before executing):

```sh
npx supabase link --project-ref TRACKER_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
npx supabase functions deploy consume-project-tracker-sso
```

No remote project was changed by this implementation. Signing-key setup, LMS contract confirmation, provisioning, secret configuration and deployment remain required.

## Files and migration

Created: src/lib/supabase/tracker-session.ts; supabase/functions/_shared/sso.ts; supabase/functions/consume-project-tracker-sso/index.ts; supabase/migrations/20260909000100_lms_sso.sql; tests/sso.test.mjs.

Modified: src/App.tsx; src/services/auth-service.ts; src/features/auth/use-supabase-session.ts; src/features/auth/SupabaseLoginScreen.tsx; src/app/SupabaseApp.tsx; src/lib/supabase/client.ts, config.ts, database.types.ts; src/vite-env.d.ts; index.html; .env.example; supabase/config.toml; README.md; this document.

The migration reuses profiles instead of a competing tracker_memberships table, adds tracker_sessions/project_members, tightens RLS, wraps tracker_mutate and adds tracker_logout. The adapter, domain services, existing transactional validation and role dashboards remain in place. No routing library or second state framework was added; the application already has a single guarded dashboard, and the callback is handled at startup.

## Verification and manual acceptance

Run npm test, npm run build and npm run lint. New tests cover the rendered password-free LMS login screen, actual Edge handler validation and membership gates (with signing/database dependencies mocked), the LMS contract/replay rejection, invalid/expired handoffs, session restoration, deduplicated consumption, logout without Auth calls, and PostgreSQL session/project/revocation checks. Existing historical migration/workflow tests remain regression coverage. Embedded PostgreSQL tests simulate gateway claims; they do not prove Supabase signature verification or the deployed LMS's atomic consume implementation.

Before production:

1. Direct Tracker visit shows Sign in through LMS with no password input or dashboard flash. Missing callback code displays a return-to-LMS action. No user-controlled redirect parameter is honored.
2. Launch from LMS with a valid fresh code and active profile: one exchange, canonical identity, correct role dashboard, clean URL. Reload preserves the tab session.
3. Replay the same code, including concurrent server requests: exactly one success. Test expired, random and wrong-audience codes; none creates another Tracker session. Check logs for absence of raw code/token values.
4. Missing and inactive profiles return 403 after valid LMS verification. They must not create a session. Toggle an active profile inactive while open; subsequent data requests deny access and UI clears on revalidation.
5. Using the actual Data API, reject a changed signature, untrusted signing key, expired JWT, missing/forged jti, wrong issuer, and a Tracker Auth token. A valid imported-key Tracker token should read only its authorized projects. Test all mutations against an unassigned project, including unplanned self-assigned tasks and blocker dependencies.
6. Log out, then replay the captured Tracker token against reads and mutations: data is denied. Verify LMS remains signed in. Test offline logout and its warning.
7. Test session expiry, LMS/backend outage, blocked origin, malformed JSON and oversized requests. Test key rotation with a fresh handoff.
8. Confirm production SPA callback routing, no query/token logging, HTTPS, CSP, exact CORS origins and endpoint rate limiting.

Browser automation and real LMS/Supabase end-to-end validation require a functioning browser runtime and configured environments. The admin workflow UI is now service-backed. Manager panels and member action placeholders remain presentation scaffolding.


## Admin workflow migrations (September 11)

Apply `20260911000100_admin_events.sql` followed by `20260911000200_admin_workflows.sql` after the SSO migration. They add `project_member_added`/`project_member_removed` ledger events and expose `tracker_admin_mutate` for active-session admins only. The RPC grants/removes explicit project membership and closes projects without open tasks. Direct browser writes to membership remain forbidden; admins can read memberships through RLS. Existing task mutations acquire the project lock before checking assignment access, preventing membership removal/project closing from racing task changes.

No new table or Edge Function is required for these admin operations. Existing LMS profiles must be provisioned and active. Browser forms select active managers and eligible project members; the database independently validates them. Read models, forms, and CSV exports communicate through the service layer.

The new `tests/admin-database.test.mjs` runs all migrations against PostgreSQL with simulated gateway claims and exercises the admin lifecycle and rejection paths. This does not validate a hosted deployment or real LMS token trust.

## Email/password login setup

Apply `20260911000300_tracker_password_auth.sql` and redeploy `consume-project-tracker-sso`. The same function accepts either an LMS code or a Supabase access token, never both. It verifies the latter with Tracker Auth `getUser`, requires a confirmed email, resolves the trusted account link, and checks active membership before issuing the existing 15-minute Tracker session. Existing RLS, roles, revocation and project access checks apply to both methods unchanged. Direct login does not require LMS secrets.

Keep public signup disabled. Create a confirmed email/password account in the Tracker Supabase Authentication administration interface through your trusted onboarding process. Associate its Auth UUID with an active Tracker profile using a privileged SQL session:

```sql
insert into public.tracker_auth_links (auth_user_id, profile_id)
values ('TRACKER_AUTH_USER_UUID', 'EXISTING_TRACKER_PROFILE_UUID');
```

For an existing LMS user, use their existing profile UUID; do not recreate the profile or change assignments. For a direct-only user, create a profile with a new UUID, name, email, appropriate role and active status, then add the link and required project membership. Linking a later LMS identity requires a separately reviewed identity migration because the current LMS flow resolves its UUID directly. Never auto-link accounts based on browser-supplied email or IDs. Ordinary users cannot read or write the link table. Removing a link prevents future direct sign-ins; deactivate the profile or revoke its Tracker sessions to immediately remove existing access.

Use `VITE_DATA_BACKEND=supabase` to show this login screen. `VITE_LMS_APP_URL` enables the optional LMS button; email/password works without it. Both methods still require the existing Tracker signing-key and allowed-origin configuration. Hosted credentials, email delivery, and Data API key trust must be verified against the deployment. Public registration and self-service password recovery are not included in this change.

## Clean rebuild and first admin

Apply every file in `supabase/migrations` in filename order, with one transaction per file. In particular, commit `20260911000100_admin_events.sql` before the admin workflow migration uses its new enum values. Do not paste the entire directory into one transaction, or rerun CREATE statements against an already populated schema. The early Auth provisioning trigger is historical and is removed by the LMS migration; the final schema uses explicit account links.

For a disposable local Supabase database, `supabase db reset` replays the migrations (and deletes local data). This implementation does not reset or modify any hosted database. For a hosted rebuild, apply the files to your prepared empty Tracker database using the Supabase migration workflow; keep migration history consistent with that database.

After all migrations, create a confirmed Tracker Auth email/password user. Open `supabase/bootstrap-admin.sql`, replace the Auth UUID placeholder and admin name, and execute it in the Tracker SQL Editor. For an existing LMS profile, use its UUID as `tracker_profile_id`. The script grants the admin role, activates the profile, and creates the direct-login link atomically; it rejects conflicting links and is safe to repeat with the same IDs. Do not place real passwords in SQL or migration files. Deploy the auth Edge Function and configure its signing secrets as described above.
