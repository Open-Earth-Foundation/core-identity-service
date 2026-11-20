import createHttpError from "http-errors";
import { randomUUID } from "node:crypto";
import { db } from "@/models";
import { User } from "@/models/User";
import { hashPassword, verifyPassword } from "@/lib/password";
import { logger } from "@/lib/logger";
import EmailTokenService from "./EmailTokenService";
import MailService from "./MailService";
import RateLimitService from "./RateLimitService";
import SessionService from "./SessionService";
import TwoFactorService, { recoveryTokenMinLength } from "./TwoFactorService";

async function ensureDb() {
  if (!db.initialized) await db.initialize();
}

function publicOrigin(): string {
  return (process.env.PUBLIC_ORIGIN || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export default class AuthService {
  /**
   * Password (+ optional 2FA) login. Returns a session cookie value on success.
   * Throws 401 for bad credentials and 429 when rate limited.
   */
  public static async login(input: {
    email: string;
    password: string;
    securityToken?: string;
  }): Promise<{ cookieValue: string; expires: Date; amr: string }> {
    await ensureDb();
    const email = input.email.toLowerCase();

    if (!(await RateLimitService.checkAndRecord(email))) {
      // Do not log the email (architecture §11).
      logger.warn({}, "Login rate limit exceeded");
      throw createHttpError.TooManyRequests("Too many login attempts.");
    }

    const user = await User.findOne({ where: { email } });
    // Same path for missing user, no password, anonymized, or bad password.
    const fail = async () => {
      throw createHttpError.Unauthorized("Invalid email or password.");
    };

    if (!user || !user.passwordHash || user.anonymizedAt) {
      await fail();
    }

    const passwordOk = await verifyPassword(
      input.password,
      user!.passwordHash!,
    );
    if (!passwordOk) await fail();

    let amr = "pwd";
    if (user!.twoFactorEnabled && user!.twoFactorSecret) {
      if (!input.securityToken) {
        throw createHttpError.Unauthorized("Second factor required.");
      }
      const secret = TwoFactorService.readSecret(user!);
      let ok = false;
      if (input.securityToken.length >= recoveryTokenMinLength) {
        ok = await TwoFactorService.verifyRecoveryCode(
          user!,
          input.securityToken,
        );
        if (ok) amr = "pwd otp";
      } else if (secret) {
        ok = await TwoFactorService.verifyTotp(input.securityToken, secret);
        if (ok) amr = "pwd otp";
      }
      if (!ok) {
        throw createHttpError.Unauthorized("Invalid second factor.");
      }
    }

    await RateLimitService.clear(email);
    try {
      await user!.update({ lastActiveAt: new Date() });
    } catch (err) {
      logger.error({ err: String(err) }, "Failed to record lastActiveAt");
    }

    const session = await SessionService.create(user!.userId, amr);
    return { ...session, amr };
  }

  public static async register(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ userId: string; email: string; name: string }> {
    await ensureDb();
    const email = input.email.toLowerCase();
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw createHttpError.Conflict("An account with that email already exists.");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await User.create({
      userId: randomUUID(),
      name: input.name,
      email,
      passwordHash,
    });

    const token = await EmailTokenService.issue(user.userId, "verify_email");
    const verifyUrl = `${publicOrigin()}/verify-email/?token=${encodeURIComponent(token)}`;
    await MailService.send({
      to: email,
      subject: "Verify your email",
      html: `<p>Hello ${escapeHtml(input.name)},</p><p><a href="${verifyUrl}">Verify your email</a></p>`,
      text: `Verify your email: ${verifyUrl}`,
    });

    return { userId: user.userId, email, name: input.name };
  }

  /** Always succeeds from the caller's view (no account enumeration). */
  public static async forgotPassword(emailRaw: string): Promise<void> {
    await ensureDb();
    const email = emailRaw.toLowerCase();
    const user = await User.findOne({ where: { email } });
    if (!user || user.anonymizedAt) return;

    const token = await EmailTokenService.issue(user.userId, "reset_password");
    const resetUrl = `${publicOrigin()}/reset-password/?token=${encodeURIComponent(token)}`;
    await MailService.send({
      to: email,
      subject: "Reset your password",
      html: `<p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in one hour.</p>`,
      text: `Reset your password: ${resetUrl}`,
    });
  }

  public static async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<void> {
    await ensureDb();
    const { userId } = await EmailTokenService.consume(token, "reset_password");
    const user = await User.findByPk(userId);
    if (!user) throw createHttpError.NotFound("User not found.");
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
  }

  public static async changePassword(
    user: User,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (!user.passwordHash) {
      throw createHttpError.BadRequest("Account has no password.");
    }
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) {
      throw createHttpError.BadRequest("Current password is incorrect.");
    }
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
  }

  public static async verifyEmail(token: string): Promise<void> {
    await ensureDb();
    const { userId } = await EmailTokenService.consume(token, "verify_email");
    const user = await User.findByPk(userId);
    if (!user) throw createHttpError.NotFound("User not found.");
    if (!user.emailVerifiedAt) {
      await user.update({ emailVerifiedAt: new Date() });
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
