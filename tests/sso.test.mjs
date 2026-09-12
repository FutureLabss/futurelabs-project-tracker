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

test("LMS contract: valid, invalid, expired, used, malformed and unavailable", async () => {
  assert.equal(validCode(""), false);
  assert.equal(validCode({}), false);
  assert.equal(validCode("opaque"), true);
  let consumed = false;
  const upstream = async (_url, options) => {
    assert.equal(options.redirect, "error");
    assert.equal(options.headers.Authorization, "Bearer test-server-secret");
    const { code } = JSON.parse(options.body);
    if (code === "expired") return response({}, 410);
    if (code !== "valid" || consumed) return response({}, 401);
    consumed = true;
    return response({ success: true, user: { id: user } });
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
  const results = await Promise.all([consume("valid"), consume("valid")]);
  assert.deepEqual(results, [{ id: user }, null]);
  await assert.rejects(
    consumeIdentity("x", "https://lms.example", "secret", async () =>
      response({ success: true, user: { id: "forged" } }),
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
    await db.query("insert into auth.users(id) values ($1)", [other]);
    await db.query(
      "insert into tracker_auth_links(auth_user_id,profile_id) values ($1,$2)",
      [other, user],
    );
    await assert.rejects(
      asUser(user, sid, (tx) => tx.query("select * from tracker_auth_links")),
      /permission denied/,
    );
    await assert.rejects(
      asUser(user, sid, (tx) =>
        tx.query("update tracker_auth_links set profile_id=$1", [other]),
      ),
      /permission denied/,
    );
    await db.query("delete from auth.users where id=$1", [other]);
    assert.equal(
      (await db.query("select * from tracker_auth_links")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from profiles where id=$1", [user])).rows
        .length,
      1,
    );
  } finally {
    await db.close();
  }
});

test("Edge handler rejects invalid requests and inactive/missing membership before issuing sessions", async () => {
  const { Module } = await import("node:module");
  let handler;
  let membership = null;
  let linked = false;
  let verified = false;
  let inserts = 0;
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
  module.require = (name) => {
    if (name.includes("_shared/signing-key"))
      return require("../supabase/functions/_shared/signing-key.ts");
    if (name.startsWith("npm:jose"))
      return { SignJWT, importJWK: async () => ({}) };
    if (name.startsWith("npm:@supabase"))
      return {
        createClient: () => ({
          auth: {
            getUser: async (token) => ({
              data: {
                user:
                  verified && token === "verified-token"
                    ? { id: other, email_confirmed_at: "2026-09-11" }
                    : null,
              },
              error: null,
            }),
          },
          from: (table) =>
            table === "tracker_auth_links"
              ? {
                  select: () => ({
                    eq: (column, id) => {
                      assert.equal(column, "auth_user_id");
                      assert.equal(id, other);
                      return {
                        maybeSingle: async () => ({
                          data: linked ? { profile_id: user } : null,
                          error: null,
                        }),
                      };
                    },
                  }),
                }
              : table === "profiles"
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
                : {
                    insert: async () => {
                      inserts++;
                      return { error: null };
                    },
                  },
        }),
      };
    if (name.includes("_shared/sso"))
      return {
        validCode,
        consumeIdentity: async (code) =>
          code === "valid" ? { id: user } : null,
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
    const request = (body, origin = "https://tracker.example") =>
      new globalThis.Request(
        "https://tracker.example/functions/v1/consume-project-tracker-sso",
        {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: typeof body === "string" ? body : JSON.stringify(body),
        },
      );
    assert.equal(
      (await handler(request({ code: "valid" }, "https://attacker.example")))
        .status,
      403,
    );
    assert.equal((await handler(request("{"))).status, 400);
    assert.equal((await handler(request({}))).status, 400);
    assert.equal((await handler(request("x".repeat(5000)))).status, 413);
    assert.equal((await handler(request({ code: "invalid" }))).status, 401);
    assert.equal((await handler(request({ code: "valid" }))).status, 403);
    membership = { id: user, status: "inactive" };
    assert.equal((await handler(request({ code: "valid" }))).status, 403);
    assert.equal(inserts, 0);
    membership = { id: user, status: "active" };
    const success = await handler(
      request({ code: "valid", user_id: other, role: "admin" }),
    );
    assert.equal(success.status, 200);
    assert.equal(inserts, 1);
    assert.equal(success.headers.get("cache-control"), "no-store");
    assert.equal((await success.json()).token, "test-signed-token");
    assert.equal(
      (await handler(request({ access_token: "verified-token" }))).status,
      401,
    );
    verified = true;
    assert.equal(
      (await handler(request({ access_token: "verified-token" }))).status,
      403,
    );
    linked = true;
    membership.status = "inactive";
    assert.equal(
      (await handler(request({ access_token: "verified-token" }))).status,
      403,
    );
    membership.status = "active";
    assert.equal(
      (
        await handler(
          request({ access_token: "verified-token", code: "valid" }),
        )
      ).status,
      400,
    );
    assert.equal(
      (await handler(request({ access_token: "forged-token", user_id: user })))
        .status,
      401,
    );
    delete env.LMS_SSO_CONSUME_URL;
    delete env.LMS_SSO_CONSUME_SECRET;
    assert.equal(
      (
        await handler(
          request({
            access_token: "verified-token",
            user_id: other,
            role: "admin",
          }),
        )
      ).status,
      200,
    );
    assert.equal(inserts, 2);
  } finally {
    globalThis.Deno = originalDeno;
  }
});

test("direct Tracker visit renders password login and LMS action", async () => {
  const { Module } = await import("node:module");
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { MantineProvider } = require("@mantine/core");
  const source = readFileSync(
    new URL("../src/features/auth/SupabaseLoginScreen.tsx", import.meta.url),
    "utf8",
  ).replaceAll(
    "import.meta.env",
    JSON.stringify({
      VITE_LMS_APP_URL: "https://lms.example/launch",
      DEV: false,
    }),
  );
  const module = new Module("login-test");
  module.require = require;
  module._compile(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    "login-test",
  );
  const html = renderToStaticMarkup(
    React.createElement(
      MantineProvider,
      {},
      React.createElement(module.exports.SupabaseLoginScreen, {
        onSignIn: async () => {},
      }),
    ),
  );
  assert.match(html, /Login with LMS/);
  assert.match(html, /href="https:\/\/lms.example\/launch"/);
  assert.match(html, /type="password"/);
  assert.match(html, /type="email"/);
});

test("password login exchanges verified proof, clears credential session and rejects bad credentials", async () => {
  const storage = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  const token =
    "header." +
    Buffer.from(
      JSON.stringify({ sub: user, exp: Math.floor(Date.now() / 1000) + 900 }),
    ).toString("base64url") +
    ".signature";
  let exchanges = 0;
  let cleanups = 0;
  let invalid = false;
  const auth = new AuthService(
    {
      functions: {
        invoke: async (_name, { body }) => {
          exchanges++;
          assert.deepEqual(body, { access_token: "verified-proof" });
          return { data: { token }, error: null };
        },
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: {
                id: user,
                name: "Member",
                email: "member@example.com",
                role: "member",
                status: "active",
              },
              error: null,
            }),
          }),
        }),
      }),
    },
    {
      auth: {
        signInWithPassword: async (credentials) => {
          assert.equal(credentials.email, "member@example.com");
          return invalid
            ? { error: new Error("Invalid login credentials") }
            : {
                data: { session: { access_token: "verified-proof" } },
                error: null,
              };
        },
        signOut: async () => {
          cleanups++;
          return { error: null };
        },
      },
    },
  );
  assert.equal(
    (await auth.signInWithPassword(" member@example.com ", "secret")).user.id,
    user,
  );
  assert.equal(exchanges, 1);
  assert.equal(cleanups, 1);
  invalid = true;
  await assert.rejects(
    auth.signInWithPassword("member@example.com", "wrong"),
    /Invalid login/,
  );
  assert.equal(exchanges, 1);
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
