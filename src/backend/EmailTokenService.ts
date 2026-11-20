import createHttpError from "http-errors";
import { randomToken, sha256Hex } from "@/lib/crypto";
import { db } from "@/models";
import { EmailToken, type EmailTokenPurpose } from "@/models/EmailToken";

const TTL_MS = 60 * 60 * 1000; // 1 hour

async function ensureDb() {
  if (!db.initialized) await db.initialize();
}

export default class EmailTokenService {
  /** Issues a new single-use token and returns the plain value for the link. */
  public static async issue(
    userId: string,
    purpose: EmailTokenPurpose,
  ): Promise<string> {
    await ensureDb();
    // Invalidate earlier unused tokens of the same purpose.
    await EmailToken.update(
      { usedAt: new Date() },
      { where: { userId, purpose, usedAt: null } },
    );

    const token = randomToken(32);
    await EmailToken.create({
      tokenHash: sha256Hex(token),
      userId,
      purpose,
      expires: new Date(Date.now() + TTL_MS),
    });
    return token;
  }

  /**
   * Consumes a token. Throws 401 when unknown, expired, used, or wrong purpose.
   */
  public static async consume(
    token: string,
    purpose: EmailTokenPurpose,
  ): Promise<{ userId: string }> {
    await ensureDb();
    const row = await EmailToken.findByPk(sha256Hex(token));
    if (!row || row.purpose !== purpose || row.usedAt) {
      throw createHttpError.Unauthorized("Invalid or expired token.");
    }
    if (row.expires.getTime() <= Date.now()) {
      throw createHttpError.Unauthorized("Token has expired.");
    }

    const [updated] = await EmailToken.update(
      { usedAt: new Date() },
      { where: { tokenHash: row.tokenHash, usedAt: null } },
    );
    if (updated === 0) {
      throw createHttpError.Unauthorized("Invalid or expired token.");
    }
    return { userId: row.userId };
  }
}
