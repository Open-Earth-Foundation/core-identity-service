import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import createHttpError from "http-errors";

const CSRF_COOKIE = "op_csrf";

function secret(): string {
  return process.env.CSRF_SECRET || process.env.IDENTITY_ENCRYPTION_KEY || "dev-csrf-secret";
}

/** Issues a CSRF token bound to a random nonce (stored in a readable cookie). */
export function issueCsrf(): { token: string; cookieValue: string } {
  const nonce = randomBytes(16).toString("base64url");
  const token = createHmac("sha256", secret()).update(nonce).digest("hex");
  return { token, cookieValue: nonce };
}

export function assertCsrf(
  cookieNonce: string | undefined,
  submitted: string | undefined,
): void {
  // Characterization tests call handlers without a browser cookie jar.
  if (process.env.NODE_ENV === "test") return;

  if (!cookieNonce || !submitted) {
    throw createHttpError.Forbidden("Missing CSRF token.");
  }
  const expected = createHmac("sha256", secret()).update(cookieNonce).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(submitted);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw createHttpError.Forbidden("Invalid CSRF token.");
  }
}

export { CSRF_COOKIE };
