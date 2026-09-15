// A private ECDSA CryptoKey can sign; verification uses its public counterpart.
export function signingJwk(jwk: Record<string, unknown>) {
  if (
    jwk.key_ops !== undefined &&
    (!Array.isArray(jwk.key_ops) ||
      !jwk.key_ops.includes("sign") ||
      jwk.key_ops.some((op) => op !== "sign" && op !== "verify"))
  ) {
    throw new Error("Signing key does not permit signing");
  }
  return { ...jwk, key_ops: ["sign"] };
}
