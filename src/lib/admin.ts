import createHttpError from "http-errors";
import SessionService from "@/backend/SessionService";

/**
 * Requires a signed-in platform admin.
 *
 * Admins are listed in `IDENTITY_ADMIN_EMAILS`, comma separated. An entry is
 * either a full address (`ops@example.org`) or a domain suffix starting with
 * `@` (`@example.org`). The address must be verified, so nobody gains admin
 * rights by registering an admin's address first.
 *
 * @throws a 401 without a session and a 403 for a non-admin.
 */
export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const { user } = await SessionService.requireUser();

  const email = user.email?.toLowerCase();
  const allowlist = (process.env.IDENTITY_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  const allowed =
    Boolean(email) &&
    Boolean(user.emailVerifiedAt) &&
    allowlist.some((entry) =>
      entry.startsWith("@") ? email!.endsWith(entry) : email === entry,
    );
  if (!allowed) throw createHttpError.Forbidden("Admin access required.");

  return { userId: user.userId, email: email! };
}
