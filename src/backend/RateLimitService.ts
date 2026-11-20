import { sha256Hex } from "@/lib/crypto";
import { LoginRateLimit } from "@/models/LoginRateLimit";
import { db } from "@/models";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

async function ensureDb() {
  if (!db.initialized) await db.initialize();
}

/**
 * Shared login rate limit: 5 attempts per 15 minutes per email, stored in the
 * database so it holds across replicas.
 */
export default class RateLimitService {
  /** @returns false when the email is over the limit. */
  public static async checkAndRecord(email: string): Promise<boolean> {
    await ensureDb();
    const emailKey = sha256Hex(email.toLowerCase());
    const now = new Date();
    const row = await LoginRateLimit.findByPk(emailKey);

    if (!row || now.getTime() - row.windowStartedAt.getTime() >= WINDOW_MS) {
      await LoginRateLimit.upsert({
        emailKey,
        windowStartedAt: now,
        attemptCount: 1,
      });
      return true;
    }

    if (row.attemptCount >= MAX_ATTEMPTS) {
      return false;
    }

    await row.update({ attemptCount: row.attemptCount + 1 });
    return true;
  }

  /** Clears the window after a successful login. */
  public static async clear(email: string): Promise<void> {
    await ensureDb();
    await LoginRateLimit.destroy({
      where: { emailKey: sha256Hex(email.toLowerCase()) },
    });
  }
}
