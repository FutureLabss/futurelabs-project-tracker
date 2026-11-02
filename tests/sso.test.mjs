import { TextEncoder } from "node:util";
import { URL } from "node:url";
import { Buffer } from "node:buffer";
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";
const require = createRequire(import.meta.url);
require.extensions[".ts"] = (module, filename) => {
  module._compile(
    ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    filename,
  );
};
const {
  consumeIdentity,
  validCode,
} = require("../supabase/functions/_shared/sso.ts");
const { AuthService } = require("../src/services/auth-service.ts");
const user = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
const sid = "00000000-0000-4000-8000-000000000003";
const response = (body, status = 200) =>
  new globalThis.Response(JSON.stringify(body), { status });

test("LMS contract: identity, denial, invalid, expired, used, malformed and unavailable", async () => {
  assert.equal(validCode(""), false);
  assert.equal(validCode({}), false);
  assert.equal(validCode("opaque"), true);
  const identity = {
    id: user,
    name: "Member",
    email: "member@example.test",
    role: "manager",
  };
  let consumed = false;
  const upstream = async (_url, options) => {
    assert.equal(options.redirect, "error");
    assert.equal(options.headers.Authorization, "Bearer test-server-secret");
    const { code } = JSON.parse(options.body);
    if (code === "expired") return response({}, 410);
    if (code === "ungranted")
      return response({ error: "no_access", user: { id: other } }, 403);
    if (code === "ungranted-forged")
      return response({ error: "no_access", user: { id: "forged" } }, 403);
    if (code !== "valid" || consumed) return response({}, 401);
    consumed = true;
    return response({ success: true, user: identity });
  };
  const consume = (code) =>
    consumeIdentity(
      code,
      "https://lms.example/consume",
      "test-server-secret",
      upstream,
    );
  assert.equal(await consume("invalid"), null);
  assert.equal(await consume("expired"), null);
  assert.deepEqual(await consume("ungranted"), { denied: true, id: other });
  assert.equal(await consume("ungranted-forged"), null);
  const results = await Promise.all([consume("valid"), consume("valid")]);
  assert.deepEqual(results, [identity, null]);
  await assert.rejects(
    consumeIdentity("x", "https://lms.example", "secret", async () =>
      response({ success: true, user: { ...identity, id: "forged" } }),
    ),
  );
  await assert.rejects(
    consumeIdentity("x", "https://lms.example", "secret", async () =>
      response({ success: true, user: { ...identity, role: "owner" } }),
    ),
  );
  await assert.rejects(
    consumeIdentity("x", "https://lms.example", "secret", async () =>
      response({}, 503),
    ),
  );
});

test("Tracker session restores through membership, deduplicates callback and logs out without LMS Auth", async () => {
  const storage = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  const exp = Math.floor(Date.now() / 1000) + 900;
  const token =
    "header." +
    Buffer.from(JSON.stringify({ sub: user, exp })).toString("base64url") +
    ".signature";
  let calls = 0;
  let revoked = false;
  let allowed = true;
  const auth = new AuthService({
    functions: {
      invoke: async () => {
        calls++;
        return { data: { token }, error: null };
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: allowed
              ? { id: user, name: "Member", email: "", role: "member" }
              : null,
            error: allowed ? null : { message: "Denied" },
          }),
        }),
      }),
    }),
    rpc: async (name) => {
      assert.equal(name, "tracker_logout");
      revoked = true;
      return { error: null };
    },
    auth: new Proxy(
      {},
      {
        get: () => {
          throw new Error("Tracker must not call LMS/Tracker Auth");
        },
      },
    ),
  });
  assert.equal(await auth.getSession(), null);
  const [a, b] = await Promise.all([
    auth.consumeCode("valid"),
    auth.consumeCode("valid"),
  ]);
  assert.equal(calls, 1);
  assert.equal(a.user.id, user);
  assert.deepEqual(a, b);
  assert.equal((await auth.getSession()).user.id, user);
  await auth.signOut();
  assert.equal(revoked, true);
  assert.equal(await auth.getSession(), null);
  storage.set("tracker.application-session", token);
  allowed = false;
  await assert.rejects(auth.getSession(), /expired or access was revoked/);
  assert.equal(storage.size, 0);
});

test("SSO migration: active session, project authorization, revocation and canonical identity", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;",
    );
    for (const name of [
      "20260908000100_tracker_schema.sql",
      "20260908000200_tracker_mutations.sql",
      "20260909000100_lms_sso.sql",
      "20260911000300_tracker_password_auth.sql",
    ])
      await db.exec(
        readFileSync(
          new URL("../supabase/migrations/" + name, import.meta.url),
          "utf8",
        ),
      );
    // No Tracker auth.users rows are created.
    await db.query(
      "insert into profiles(id,name,email,role,status) values ($1,'Admin','','admin','active'),($2,'Member','','member','active')",
      [user, other],
    );
    await db.query(
      "insert into tracker_sessions(id,lms_user_id,expires_at) values ($1,$2,now()+interval '15 minutes')",
      [sid, user],
    );
    const asUser = (id, sessionId, fn) =>
      db.transaction(async (tx) => {
        await tx.exec("set local role authenticated");
        await tx.query(
          "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
          [id, JSON.stringify({ iss: "project-tracker", jti: sessionId })],
        );
        return fn(tx);
      });
    const mutate = (id, operation, payload) =>
      asUser(id, sid, (tx) =>
        tx.query("select tracker_mutate($1,$2) as result", [
          operation,
          JSON.stringify(payload),
        ]),
      );
    const input = {
      name: "Private project",
      start_date: "2026-09-01",
      target_date: "2026-10-01",
    };
    const project = (await mutate(user, "create_project", input)).rows[0]
      .result;
    assert.equal(
      (await asUser(user, sid, (tx) => tx.query("select * from projects"))).rows
        .length,
      1,
    );
    await assert.rejects(
      asUser(user, "forged", (tx) =>
        tx.query("select tracker_mutate($1,$2)", ["create_project", input]),
      ),
      /session expired/,
    );
    await db.query("update tracker_sessions set lms_user_id=$1 where id=$2", [
      other,
      sid,
    ]);
    assert.equal(
      (await asUser(other, sid, (tx) => tx.query("select * from projects")))
        .rows.length,
      0,
    );
    await assert.rejects(
      mutate(other, "create_task", {
        project_id: project.id,
        origin: "unplanned",
        assignee_id: other,
      }),
      /Project access denied/,
    );
    await db.query("insert into project_members values ($1,$2)", [
      project.id,
      other,
    ]);
    assert.equal(
      (await asUser(other, sid, (tx) => tx.query("select * from projects")))
        .rows.length,
      1,
    );
    await db.query("update profiles set status='inactive' where id=$1", [
      other,
    ]);
    assert.equal(
      (await asUser(other, sid, (tx) => tx.query("select * from projects")))
        .rows.length,
      0,
    );
    await assert.rejects(
      mutate(other, "record_availability", {}),
      /session expired/,
    );
    await db.query("update profiles set status='active' where id=$1", [other]);
    await asUser(other, sid, (tx) => tx.query("select tracker_logout()"));
    assert.equal(
      (await asUser(other, sid, (tx) => tx.query("select * from profiles")))
        .rows.length,
      0,
    );
    await db.query(
      "update tracker_sessions set revoked_at=null,expires_at=now()-interval '1 minute'",
    );
    await assert.rejects(
      mutate(other, "record_availability", {}),
      /session expired/,
    );
    await assert.rejects(
      asUser(other, sid, (tx) => tx.query("select * from tracker_sessions")),
      /permission denied/,
    );
    await assert.rejects(
      asUser(other, sid, (tx) =>
        tx.query("select private.mutate_business('create_project','{}')"),
      ),
      /permission denied/,
    );
    assert.equal((await db.query("select * from auth.users")).rows.length, 0);
  } finally {
    await db.close();
  }
});

test("Edge handler applies LMS access, rejects denied or inactive people and renews only live sessions", async () => {
  const { Module } = await import("node:module");
  let handler;
  let membership = null;
  let current = null;
  let revokedRows = [];
  let applyError = null;
  let inserts = 0;
  const applied = [];
  const env = {
    TRACKER_ALLOWED_ORIGINS: "https://tracker.example",
    LMS_SSO_CONSUME_URL: "https://lms.example/consume",
    LMS_SSO_CONSUME_SECRET: "test-only",
    SUPABASE_URL: "https://tracker.supabase.co",
    TRACKER_SUPABASE_SECRET_KEY: "test-only",
    TRACKER_SIGNING_JWK: JSON.stringify({
      kty: "EC",
      crv: "P-256",
      kid: "test-key",
      d: "test-only",
    }),
  };
  const originalDeno = globalThis.Deno;
  globalThis.Deno = {
    env: { get: (name) => env[name] },
    serve: (fn) => {
      handler = fn;
    },
  };
  const filename = new URL(
    "../supabase/functions/consume-project-tracker-sso/index.ts",
    import.meta.url,
  ).pathname;
  const module = new Module(filename);
  class SignJWT {
    constructor(payload) {
      assert.deepEqual(payload, { role: "authenticated" });
    }
    setProtectedHeader(header) {
      assert.equal(header.alg, "ES256");
      return this;
    }
    setSubject(id) {
      assert.equal(id, user);
      return this;
    }
    setIssuer(issuer) {
      assert.equal(issuer, "project-tracker");
      return this;
    }
    setAudience(audience) {
      assert.equal(audience, "authenticated");
      return this;
    }
    setJti() {
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setExpirationTime(exp) {
      assert.ok(exp * 1000 > Date.now());
      return this;
    }
    async sign() {
      return "test-signed-token";
    }
  }
  const sessionsTable = {
    select: () => ({
      eq: (column, id) => {
        assert.equal(column, "id");
        assert.equal(id, sid);
        return { maybeSingle: async () => ({ data: current, error: null }) };
      },
    }),
    update: (values) => {
      assert.ok(values.revoked_at);
      return {
        eq: () => ({
          is: () => ({
            select: async () => ({ data: revokedRows, error: null }),
          }),
        }),
      };
    },
    insert: async (row) => {
      assert.equal(row.lms_user_id, user);
      inserts++;
      return { error: null };
    },
  };
  module.require = (name) => {
    if (name.includes("_shared/signing-key"))
      return require("../supabase/functions/_shared/signing-key.ts");
    if (name.startsWith("npm:jose"))
      return {
        SignJWT,
        importJWK: async () => ({}),
        jwtVerify: async (token, _key, options) => {
          assert.equal(options.issuer, "project-tracker");
          if (token !== "live-token") throw new Error("bad signature");
          return { payload: { sub: user, jti: sid } };
        },
      };
    if (name.startsWith("npm:@supabase"))
      return {
        createClient: () => ({
          rpc: async (fn, args) => {
            assert.equal(fn, "apply_lms_access");
            applied.push(args);
            return applyError
              ? { data: null, error: applyError }
              : { data: { id: user, status: "active" }, error: null };
          },
          from: (table) =>
            table === "profiles"
              ? {
                  select: () => ({
                    eq: () => ({
                      maybeSingle: async () => ({
                        data: membership,
                        error: null,
                      }),
                    }),
                  }),
                }
              : sessionsTable,
        }),
      };
    if (name.includes("_shared/sso"))
      return {
        validCode,
        consumeIdentity: async (code) =>
          code === "valid"
            ? {
                id: other,
                name: "Member",
                email: "member@example.test",
                role: "member",
              }
            : code === "ungranted"
              ? { denied: true, id: other }
              : null,
      };
    throw new Error("Unexpected dependency");
  };
  try {
    module._compile(
      ts.transpileModule(
        readFileSync(
          new URL(
            "../supabase/functions/consume-project-tracker-sso/index.ts",
            import.meta.url,
          ),
          "utf8",
        ),
        {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
          },
        },
      ).outputText,
      filename,
    );
    const request = (body, { origin = "https://tracker.example", token } = {}) =>
      new globalThis.Request(
        "https://tracker.example/functions/v1/consume-project-tracker-sso",
        {
          method: "POST",
          headers: {
            origin,
            "content-type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: typeof body === "string" ? body : JSON.stringify(body),
        },
      );
    assert.equal(
      (
        await handler(
          request({ code: "valid" }, { origin: "https://attacker.example" }),
        )
      ).status,
      403,
    );
    assert.equal((await handler(request("{"))).status, 400);
    assert.equal((await handler(request({}))).status, 400);
    assert.equal((await handler(request("x".repeat(5000)))).status, 413);
    assert.equal((await handler(request({ code: "invalid" }))).status, 401);
    assert.equal(applied.length, 0);

    // Not granted in the LMS: the profile is switched off and no session is issued.
    assert.equal((await handler(request({ code: "ungranted" }))).status, 403);
    assert.deepEqual(applied.pop(), {
      p_lms_user_id: other,
      p_name: null,
      p_email: null,
      p_role: null,
      p_active: false,
    });
    assert.equal(inserts, 0);

    // Granted: the LMS identity and role are applied before the session is signed.
    membership = { id: user, status: "inactive" };
    assert.equal((await handler(request({ code: "valid" }))).status, 403);
    assert.equal(inserts, 0);
    membership = { id: user, status: "active" };
    applied.length = 0;
    // Caller-supplied identity or role fields are ignored; only the LMS's answer counts.
    const granted = await handler(
      request({ code: "valid", user_id: user, role: "admin" }),
    );
    assert.equal(granted.status, 200);
    assert.deepEqual(applied.pop(), {
      p_lms_user_id: other,
      p_name: "Member",
      p_email: "member@example.test",
      p_role: "member",
      p_active: true,
    });
    assert.equal(inserts, 1);
    assert.equal(granted.headers.get("cache-control"), "no-store");
    assert.equal((await granted.json()).token, "test-signed-token");
    applyError = { message: "Cannot remove the last active administrator" };
    assert.equal((await handler(request({ code: "valid" }))).status, 503);
    applyError = null;
    applied.length = 0;

    // Renewal needs the current session and nothing else.
    assert.equal(
      (await handler(request({ code: "valid", refresh: true }, { token: "live-token" })))
        .status,
      400,
    );
    assert.equal((await handler(request({ refresh: true }))).status, 400);
    assert.equal(
      (await handler(request({ refresh: true }, { token: "forged-token" }))).status,
      401,
    );
    const future = new Date(Date.now() + 60_000).toISOString();
    current = { id: sid, lms_user_id: user, expires_at: future, revoked_at: future };
    assert.equal(
      (await handler(request({ refresh: true }, { token: "live-token" }))).status,
      401,
    );
    current = { id: sid, lms_user_id: user, expires_at: future, revoked_at: null };
    revokedRows = [];
    assert.equal(
      (await handler(request({ refresh: true }, { token: "live-token" }))).status,
      401,
    );
    revokedRows = [{ id: sid }];
    membership = { id: user, status: "inactive" };
    assert.equal(
      (await handler(request({ refresh: true }, { token: "live-token" }))).status,
      403,
    );
    membership = { id: user, status: "active" };
    const renewed = await handler(
      request({ refresh: true }, { token: "live-token" }),
    );
    assert.equal(renewed.status, 200);
    assert.equal(inserts, 2);
    assert.equal(applied.length, 0);
  } finally {
    globalThis.Deno = originalDeno;
  }
});

test("direct Tracker visit offers only the LMS, with no password form", async () => {
  const { Module } = await import("node:module");
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { MantineProvider } = require("@mantine/core");
  const source = readFileSync(
    new URL("../src/features/auth/OpenFromLmsScreen.tsx", import.meta.url),
    "utf8",
  ).replaceAll(
    "import.meta.env",
    JSON.stringify({
      VITE_LMS_APP_URL: "https://lms.example/launch",
      DEV: false,
    }),
  );
  const module = new Module("lms-screen-test");
  module.require = require;
  module._compile(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    "lms-screen-test",
  );
  const html = renderToStaticMarkup(
    React.createElement(
      MantineProvider,
      {},
      React.createElement(module.exports.OpenFromLmsScreen, {}),
    ),
  );
  assert.match(html, /Go to the LMS/);
  assert.match(html, /href="https:\/\/lms.example\/launch"/);
  assert.doesNotMatch(html, /type="password"/);
  assert.doesNotMatch(html, /type="email"/);
});

test("session renewal presents the current session and keeps it when renewal fails", async () => {
  const storage = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  const tokenFor = (n) =>
    "header." +
    Buffer.from(
      JSON.stringify({ sub: user, n, exp: Math.floor(Date.now() / 1000) + 900 }),
    ).toString("base64url") +
    ".signature";
  let fail = false;
  let calls = 0;
  const auth = new AuthService({
    functions: {
      invoke: async (name, options) => {
        calls++;
        assert.equal(name, "consume-project-tracker-sso");
        assert.deepEqual(options.body, { refresh: true });
        assert.equal(options.headers.Authorization, `Bearer ${tokenFor(1)}`);
        return fail
          ? {
              data: null,
              error: { context: new globalThis.Response("{}", { status: 401 }) },
            }
          : { data: { token: tokenFor(2) }, error: null };
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { id: user, name: "Member", email: "", role: "member" },
            error: null,
          }),
        }),
      }),
    }),
  });
  assert.equal(await auth.refreshSession(), null);
  assert.equal(calls, 0);
  storage.set("tracker.application-session", tokenFor(1));
  fail = true;
  assert.equal(await auth.refreshSession(), null);
  assert.equal(storage.get("tracker.application-session"), tokenFor(1));
  fail = false;
  const [a, b] = await Promise.all([auth.refreshSession(), auth.refreshSession()]);
  assert.equal(calls, 2);
  assert.equal(a.user.id, user);
  assert.deepEqual(a, b);
  assert.equal(storage.get("tracker.application-session"), tokenFor(2));
});

test("private signing key restricts combined operations and signs verifiable data", async () => {
  const { webcrypto } = await import("node:crypto");
  const {
    signingJwk,
  } = require("../supabase/functions/_shared/signing-key.ts");
  const pair = await webcrypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const jwk = await webcrypto.subtle.exportKey("jwk", pair.privateKey);
  const combined = { ...jwk, key_ops: ["sign", "verify"] };
  await assert.rejects(
    webcrypto.subtle.importKey(
      "jwk",
      combined,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      combined.key_ops,
    ),
    { name: "SyntaxError" },
  );
  const normalized = signingJwk(combined);
  const imported = await webcrypto.subtle.importKey(
    "jwk",
    normalized,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    normalized.key_ops,
  );
  const data = new TextEncoder().encode("tracker-session-test");
  const signature = await webcrypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    imported,
    data,
  );
  assert.equal(
    await webcrypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      pair.publicKey,
      signature,
      data,
    ),
    true,
  );
  assert.deepEqual(combined.key_ops, ["sign", "verify"]);
  assert.throws(
    () => signingJwk({ ...jwk, key_ops: ["verify"] }),
    /does not permit/,
  );
  assert.throws(
    () => signingJwk({ ...jwk, key_ops: ["sign", "decrypt"] }),
    /does not permit/,
  );
});
