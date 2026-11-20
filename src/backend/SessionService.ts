import { cookies } from "next/headers";
import createHttpError from "http-errors";
import { randomToken, sha256Hex } from "@/lib/crypto";
import { db } from "@/models";
import { Session } from "@/models/Session";
import { User } from "@/models/User";

export const SESSION_COOKIE = "op_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

async function ensureDb() {
  if (!db.initialized) await db.initialize();
}

export type SessionUser = {
  userId: string;
  email: string | null;
  name: string | null;
  amr: string;
};

export default class SessionService {
  public static async create(
    userId: string,
    amr: string,
  ): Promise<{ cookieValue: string; expires: Date }> {
    await ensureDb();
    const cookieValue = randomToken(32);
    const expires = new Date(Date.now() + SESSION_TTL_MS);
    const now = new Date();
    await Session.create({
      sessionHash: sha256Hex(cookieValue),
      userId,
      amr,
      authTime: now,
      lastSeenAt: now,
      expires,
    });
    return { cookieValue, expires };
  }

  public static async revokeByCookie(cookieValue: string | undefined): Promise<void> {
    if (!cookieValue) return;
    await ensureDb();
    await Session.update(
      { revokedAt: new Date() },
      { where: { sessionHash: sha256Hex(cookieValue), revokedAt: null } },
    );
  }

  public static async resolve(
    cookieValue: string | undefined,
  ): Promise<(SessionUser & { session: Session }) | null> {
    if (!cookieValue) return null;
    await ensureDb();
    const session = await Session.findByPk(sha256Hex(cookieValue));
    if (!session || session.revokedAt) return null;
    if (session.expires.getTime() <= Date.now()) return null;

    const user = await User.findByPk(session.userId);
    if (!user || user.anonymizedAt) return null;

    await session.update({ lastSeenAt: new Date() });
    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      amr: session.amr,
      session,
    };
  }

  /** Reads the request cookie and returns the signed-in user, or throws 401. */
  public static async requireUser(): Promise<SessionUser & { user: User }> {
    const jar = await cookies();
    const value = jar.get(SESSION_COOKIE)?.value;
    const resolved = await SessionService.resolve(value);
    if (!resolved) {
      throw createHttpError.Unauthorized("Not signed in");
    }
    const user = await User.findByPk(resolved.userId);
    if (!user) throw createHttpError.Unauthorized("Not signed in");
    return { ...resolved, user };
  }

  public static cookieOptions(expires: Date) {
    return {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires,
    };
  }
}
