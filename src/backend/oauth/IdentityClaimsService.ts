import createHttpError from "http-errors";
import { Op } from "sequelize";
import { Session } from "@/models/Session";
import { User } from "@/models/User";

/**
 * Claims that identify a user, for the id_token and the userinfo endpoint.
 *
 * `sub` is the identity user id, the same value as `User.userId` in
 * CityCatalyst. Deliberately small: it carries no role or permission. Those are
 * decided from `sub` inside the relying party, never from a token.
 *
 * `email_verified` is left out until the identity service decides how to report
 * it. A claim that guessed would be worse than none.
 */
export interface IdentityClaims {
  sub: string;
  email?: string;
  name?: string;
  /**
   * Organizations the user belongs to. Identity does not know about
   * organizations, so this is always empty. It stays in the shape so existing
   * relying parties keep parsing the token.
   */
  org_ids: string[];
}

export default class IdentityClaimsService {
  /** Profile claims for a user. Used by the userinfo endpoint. */
  public static async forUser(userId: string): Promise<IdentityClaims> {
    const user = await User.findByPk(userId);
    if (!user || user.anonymizedAt) {
      throw new createHttpError.NotFound("User not found");
    }

    const claims: IdentityClaims = { sub: user.userId, org_ids: [] };
    if (user.email) claims.email = user.email;
    if (user.name) claims.name = user.name;
    return claims;
  }

  /**
   * How the user signed in, for the id_token `amr` claim.
   *
   * The code does not record which session asked for it, so this uses the
   * newest live session of the user when there is one (its `amr` is "pwd" or
   * "pwd otp"). Without a session it falls back to what the account requires:
   * a password, plus a second factor when two-factor authentication is on.
   */
  public static async authenticationMethods(userId: string): Promise<string[]> {
    const session = await Session.findOne({
      where: {
        userId,
        revokedAt: null,
        expires: { [Op.gt]: new Date() },
      },
      order: [["authTime", "DESC"]],
    });
    if (session?.amr) return session.amr.split(" ").filter(Boolean);

    const user = await User.findByPk(userId);
    const usesSecondFactor = Boolean(
      user?.twoFactorEnabled && user.twoFactorSecret,
    );
    return usesSecondFactor ? ["pwd", "otp"] : ["pwd"];
  }
}
