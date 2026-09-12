import { signingJwk } from "../_shared/signing-key.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { importJWK, SignJWT } from "npm:jose@6.1.3";
import { consumeIdentity, validCode } from "../_shared/sso.ts";

const required = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error("Missing server configuration");
  return value;
};
Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") ?? "";
  const allowed = (Deno.env.get("TRACKER_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((s) => s.trim());
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    Vary: "Origin",
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "null",
    "Access-Control-Allow-Headers":
      "apikey, content-type, authorization, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  const respond = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers });
  if (!origin || !allowed.includes(origin))
    return respond(403, { error: "Origin not allowed" });
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (request.method !== "POST")
    return respond(405, { error: "Method not allowed" });
  let stage = "read_request";
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return respond(400, { error: "JSON required" });
    // Bound streaming input before parsing or calling the upstream service.
    const reader = request.body?.getReader();
    if (!reader) return respond(400, { error: "Code required" });
    let raw = "";
    let size = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 4096) {
        await reader.cancel();
        return respond(413, { error: "Request too large" });
      }
      raw += decoder.decode(value, { stream: true });
    }
    let body: { code?: unknown; access_token?: unknown };
    try {
      body = JSON.parse(raw + decoder.decode());
    } catch {
      return respond(400, { error: "Invalid request" });
    }
    const passwordLogin =
      typeof body?.access_token === "string" &&
      body.access_token.length > 0 &&
      body.access_token.length <= 3500;
    if (
      !body ||
      (passwordLogin
        ? body.code !== undefined
        : !validCode(body.code) || body.access_token !== undefined)
    )
      return respond(400, { error: "Provide one sign-in proof" });
    // Validate signing configuration before spending the single-use code.
    stage = "parse_signing_key";
    const jwk = JSON.parse(required("TRACKER_SIGNING_JWK"));
    stage = "validate_signing_key";
    if (jwk.kty !== "EC" || jwk.crv !== "P-256" || !jwk.d || !jwk.kid)
      throw new Error("Invalid signing key");
    stage = "import_signing_key";
    const signingKey = await importJWK(signingJwk(jwk), "ES256").catch(
      (error: unknown) => {
        // Log only allowlisted classifications and booleans, never raw errors or JWK values.
        const name = error instanceof Error ? error.name : "UnknownError";
        const knownNames = [
          "DataError",
          "SyntaxError",
          "NotSupportedError",
          "TypeError",
          "OperationError",
          "InvalidAccessError",
          "JOSENotSupported",
        ];
        const coordinate = (value: unknown) =>
          typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
        console.info(
          JSON.stringify({
            event: "tracker_signing_key_import_failed",
            error_type: knownNames.includes(name) ? name : "OtherError",
            x_format_valid: coordinate(jwk.x),
            y_format_valid: coordinate(jwk.y),
            d_format_valid: coordinate(jwk.d),
            algorithm_compatible: jwk.alg === undefined || jwk.alg === "ES256",
            usage_compatible: jwk.use === undefined || jwk.use === "sig",
            operations_compatible:
              jwk.key_ops === undefined ||
              (Array.isArray(jwk.key_ops) && jwk.key_ops.includes("sign")),
            extractable_compatible:
              jwk.ext === undefined || typeof jwk.ext === "boolean",
          }),
        );
        throw error;
      },
    );
    stage = "configure_supabase_client";
    const client = createClient(
      required("SUPABASE_URL"),
      required("TRACKER_SUPABASE_SECRET_KEY"),
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    let identity: { id: string } | null = null;
    if (passwordLogin) {
      stage = "verify_password_identity";
      const { data, error } = await client.auth.getUser(
        body.access_token as string,
      );
      if (error || !data.user || !data.user.email_confirmed_at)
        return respond(401, {
          error: "Your login could not be verified. Please sign in again.",
        });
      stage = "lookup_account_link";
      const { data: link, error: linkError } = await client
        .from("tracker_auth_links")
        .select("profile_id")
        .eq("auth_user_id", data.user.id)
        .maybeSingle();
      if (linkError) throw new Error("Account lookup unavailable");
      if (!link)
        return respond(403, {
          error:
            "Your account has not been granted Project Tracker access. Contact your administrator.",
        });
      identity = { id: link.profile_id };
    } else {
      stage = "exchange_lms_code";
      const endpoint = new URL(required("LMS_SSO_CONSUME_URL"));
      if (endpoint.protocol !== "https:")
        throw new Error("Invalid server configuration");
      identity = await consumeIdentity(
        body.code as string,
        endpoint.href,
        required("LMS_SSO_CONSUME_SECRET"),
      );
    }
    if (!identity) {
      console.info(
        JSON.stringify({
          event: "tracker_sso_failure",
          reason: "invalid_handoff",
        }),
      );
      return respond(401, {
        error:
          "Your sign-in link is invalid, expired, or already used. Return to the LMS and open Project Tracker again.",
      });
    }
    stage = "lookup_membership";
    const { data: profile, error } = await client
      .from("profiles")
      .select("id,status")
      .eq("id", identity.id)
      .maybeSingle();
    if (error) throw new Error("Membership lookup unavailable");
    if (!profile || profile.status !== "active") {
      console.info(
        JSON.stringify({
          event: "tracker_access_denied",
          lms_user_id: identity.id,
        }),
      );
      return respond(403, {
        error:
          "You do not have active Project Tracker access. Contact your administrator.",
      });
    }
    const id = crypto.randomUUID();
    const expires = Math.floor(Date.now() / 1000) + 900;
    stage = "sign_tracker_token";
    const token = await new SignJWT({ role: "authenticated" })
      .setProtectedHeader({ alg: "ES256", kid: jwk.kid, typ: "JWT" })
      .setSubject(identity.id)
      .setIssuer("project-tracker")
      .setAudience("authenticated")
      .setJti(id)
      .setIssuedAt()
      .setExpirationTime(expires)
      .sign(signingKey);
    stage = "persist_tracker_session";
    const { error: sessionError } = await client
      .from("tracker_sessions")
      .insert({
        id,
        lms_user_id: identity.id,
        expires_at: new Date(expires * 1000).toISOString(),
      });
    if (sessionError) throw new Error("Session unavailable");
    console.info(
      JSON.stringify({
        event: "tracker_sso_success",
        lms_user_id: identity.id,
      }),
    );
    console.info(
      JSON.stringify({
        event: "tracker_session_created",
        lms_user_id: identity.id,
      }),
    );
    return respond(200, { token, expires_at: expires });
  } catch {
    console.info(
      JSON.stringify({
        event: "tracker_sso_failure",
        reason: "service_unavailable",
        stage,
      }),
    );
    return respond(503, {
      error: "Sign-in is temporarily unavailable. Please try again.",
    });
  }
});
