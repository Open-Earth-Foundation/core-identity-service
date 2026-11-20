import bcrypt from "bcrypt";
import createHttpError from "http-errors";

/** bcrypt only uses the first 72 bytes of a password. */
export const MAX_PASSWORD_BYTES = 72;
export const BCRYPT_COST = 12;

const complexity =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{4,}$/;

export function assertPasswordPolicy(password: string): void {
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    throw createHttpError.BadRequest(
      `Password must be at most ${MAX_PASSWORD_BYTES} bytes.`,
    );
  }
  if (!complexity.test(password)) {
    throw createHttpError.BadRequest(
      "Password must be at least 4 characters with one lowercase letter, one uppercase letter, and one number.",
    );
  }
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordPolicy(password);
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
