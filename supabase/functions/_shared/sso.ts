const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const roles = ["member", "manager", "admin"];

export type LmsIdentity = {
  id: string;
  name: string;
  email: string;
  role: "member" | "manager" | "admin";
};
export type LmsDenial = { denied: true; id: string };

export function validCode(code: unknown): code is string {
  return (
    typeof code === "string" &&
    code.length > 0 &&
    code.length <= 2048 &&
    !/\s/.test(code)
  );
}
// LMS owns hashing, expiry, atomic consume and the access grant. Never retry a
// single-use exchange. A 403 means the code was valid but the LMS superadmin has
// not granted (or has revoked) Tracker access for that user.
export async function consumeIdentity(
  code: string,
  endpoint: string,
  secret: string,
  transport = fetch,
): Promise<LmsIdentity | LmsDenial | null> {
  const response = await transport(endpoint, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(10000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ code }),
  });
  if (response.status === 403) {
    const body = await response.json().catch(() => null);
    return typeof body?.user?.id === "string" && uuid.test(body.user.id)
      ? { denied: true, id: body.user.id }
      : null;
  }
  if ([400, 401, 404, 409, 410].includes(response.status)) return null;
  if (!response.ok) throw new Error("LMS unavailable");
  const result = await response.json();
  const user = result?.user;
  if (
    result?.success !== true ||
    typeof user?.id !== "string" ||
    !uuid.test(user.id) ||
    typeof user.email !== "string" ||
    typeof user.name !== "string" ||
    !roles.includes(user.role)
  ) {
    throw new Error("Invalid LMS response");
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
