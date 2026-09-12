export function validCode(code: unknown): code is string {
  return (
    typeof code === "string" &&
    code.length > 0 &&
    code.length <= 2048 &&
    !/\s/.test(code)
  );
}
// LMS owns hashing, expiry and atomic consume. Never retry a single-use exchange.
export async function consumeIdentity(
  code: string,
  endpoint: string,
  secret: string,
  transport = fetch,
): Promise<{ id: string } | null> {
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
  if ([400, 401, 403, 404, 409, 410].includes(response.status)) return null;
  if (!response.ok) throw new Error("LMS unavailable");
  const result = await response.json();
  if (
    result?.success !== true ||
    typeof result.user?.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      result.user.id,
    )
  ) {
    throw new Error("Invalid LMS response");
  }
  return { id: result.user.id };
}
