import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const required = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error("Missing server configuration");
  return value;
};

// Compare digests so the comparison time does not depend on the secret.
async function sameSecret(given: string, expected: string) {
  const digest = async (value: string) =>
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    );
  const [a, b] = await Promise.all([digest(given), digest(expected)]);
  return a.reduce((diff, byte, i) => diff | (byte ^ b[i]), 0) === 0;
}

// Server-to-server only: the LMS pushes grants, role changes and revocations made
// by its superadmin. Browsers never call this, so there is no CORS.
Deno.serve(async (request: Request) => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const respond = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers });
  if (request.method !== "POST")
    return respond(405, { error: "Method not allowed" });
  try {
    const bearer = request.headers
      .get("authorization")
      ?.match(/^Bearer ([^\s]+)$/i)?.[1];
    if (!bearer || !(await sameSecret(bearer, required("TRACKER_SYNC_SECRET"))))
      return respond(401, { error: "Unauthorized" });
    const raw = await request.text();
    if (raw.length > 4096) return respond(413, { error: "Request too large" });
    let body: {
      user?: { id?: unknown; name?: unknown; email?: unknown; role?: unknown };
      active?: unknown;
    };
    try {
      body = JSON.parse(raw);
    } catch {
      return respond(400, { error: "Invalid request" });
    }
    const user = body?.user;
    if (
      typeof user?.id !== "string" ||
      !uuid.test(user.id) ||
      typeof body.active !== "boolean" ||
      (body.active &&
        (typeof user.name !== "string" ||
          typeof user.email !== "string" ||
          typeof user.role !== "string"))
    )
      return respond(400, { error: "Invalid request" });
    const client = createClient(
      required("SUPABASE_URL"),
      required("TRACKER_SUPABASE_SECRET_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await client.rpc("apply_lms_access", {
      p_lms_user_id: user.id,
      p_name: body.active ? user.name : null,
      p_email: body.active ? user.email : null,
      p_role: body.active ? user.role : null,
      p_active: body.active,
    });
    if (error) {
      // Business-rule rejections (e.g. last administrator) are safe to show the superadmin.
      console.info(
        JSON.stringify({ event: "tracker_access_sync_rejected", lms_user_id: user.id }),
      );
      return respond(409, { error: error.message });
    }
    console.info(
      JSON.stringify({
        event: "tracker_access_synced",
        lms_user_id: user.id,
        active: body.active,
      }),
    );
    return respond(200, {
      success: true,
      profile_id: data?.id ?? null,
      status: data?.status ?? null,
    });
  } catch {
    return respond(503, { error: "Tracker sync is temporarily unavailable." });
  }
});
