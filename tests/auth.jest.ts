import { beforeAll, afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";
import { db } from "@/models";
import { User } from "@/models/User";
import { EmailToken } from "@/models/EmailToken";
import { Session } from "@/models/Session";
import { LoginRateLimit } from "@/models/LoginRateLimit";
import AuthService from "@/backend/AuthService";
import EmailTokenService from "@/backend/EmailTokenService";
import MailService, { mailSink } from "@/backend/MailService";
import RateLimitService from "@/backend/RateLimitService";
import SessionService from "@/backend/SessionService";
import TwoFactorService from "@/backend/TwoFactorService";
import { assertPasswordPolicy, hashPassword } from "@/lib/password";
import { sha256Hex } from "@/lib/crypto";

const hasDbCredentials = Boolean(
  process.env.DATABASE_NAME && process.env.DATABASE_USER,
);

const describeDb = hasDbCredentials ? describe : describe.skip;

describe("password policy (no DB)", () => {
  it("rejects passwords longer than 72 bytes", () => {
    expect(() => assertPasswordPolicy("Aa1" + "x".repeat(80))).toThrow(
      /at most 72 bytes/,
    );
  });
});

describeDb("AuthService characterization (CC-1279)", () => {
  const suffix = randomUUID().slice(0, 8);
  const email = `auth-${suffix}@example.com`;
  let userId = "";

  beforeAll(async () => {
    await db.initialize();
  });

  afterAll(async () => {
    if (userId) {
      await EmailToken.destroy({ where: { userId } });
      await Session.destroy({ where: { userId } });
      await User.destroy({ where: { userId } });
    }
    await LoginRateLimit.destroy({
      where: { emailKey: sha256Hex(email) },
    });
    await db.close();
  });

  beforeEach(() => {
    MailService.clearSink();
  });

  it("registers a user, stores a hashed password, and sends a verify email", async () => {
    const created = await AuthService.register({
      name: "Auth Tester",
      email,
      password: "Secret1a",
    });
    userId = created.userId;

    const user = await User.findByPk(userId);
    expect(user).not.toBeNull();
    expect(user!.passwordHash).toHaveLength(60);
    expect(user!.emailVerifiedAt).toBeNull();
    expect(mailSink.length).toBe(1);
    expect(mailSink[0].subject).toMatch(/verify/i);
  });

  it("rejects a duplicate email", async () => {
    await expect(
      AuthService.register({
        name: "Other",
        email,
        password: "Secret1a",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("rejects passwords longer than 72 bytes via register", async () => {
    await expect(
      AuthService.register({
        name: "Long",
        email: `long-${suffix}@example.com`,
        password: "Aa1" + "x".repeat(80),
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("verifies email with a single-use token", async () => {
    const token = await EmailTokenService.issue(userId, "verify_email");
    await AuthService.verifyEmail(token);
    const user = await User.findByPk(userId);
    expect(user!.emailVerifiedAt).not.toBeNull();
    await expect(AuthService.verifyEmail(token)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("logs in and creates a session; anonymized and passwordless users cannot", async () => {
    const session = await AuthService.login({
      email,
      password: "Secret1a",
    });
    expect(session.cookieValue).toBeTruthy();
    expect(session.amr).toBe("pwd");

    const resolved = await SessionService.resolve(session.cookieValue);
    expect(resolved?.userId).toBe(userId);

    const user = await User.findByPk(userId);
    const previousHash = user!.passwordHash;
    await user!.update({ passwordHash: null });
    await expect(
      AuthService.login({ email, password: "Secret1a" }),
    ).rejects.toMatchObject({ statusCode: 401 });
    await user!.update({ passwordHash: previousHash, anonymizedAt: new Date() });
    await expect(
      AuthService.login({ email, password: "Secret1a" }),
    ).rejects.toMatchObject({ statusCode: 401 });
    await user!.update({ anonymizedAt: null });
  });

  it("rate-limits after 5 attempts in the window", async () => {
    const limitedEmail = `limit-${suffix}@example.com`;
    await User.create({
      userId: randomUUID(),
      email: limitedEmail,
      name: "Limited",
      passwordHash: await hashPassword("Secret1a"),
    });

    for (let i = 0; i < 5; i++) {
      await expect(
        AuthService.login({ email: limitedEmail, password: "Wrong1a" }),
      ).rejects.toMatchObject({ statusCode: 401 });
    }
    await expect(
      AuthService.login({ email: limitedEmail, password: "Wrong1a" }),
    ).rejects.toMatchObject({ statusCode: 429 });

    await RateLimitService.clear(limitedEmail);
    await User.destroy({ where: { email: limitedEmail } });
  });

  it("resets password with a single-use email token", async () => {
    await AuthService.forgotPassword(email);
    expect(mailSink.length).toBe(1);
    const match = mailSink[0].text?.match(/token=([^&\s]+)/);
    expect(match).toBeTruthy();
    const token = decodeURIComponent(match![1]);

    await AuthService.resetPassword(token, "NewSecret1a");
    await expect(
      AuthService.login({ email, password: "Secret1a" }),
    ).rejects.toMatchObject({ statusCode: 401 });

    const session = await AuthService.login({
      email,
      password: "NewSecret1a",
    });
    expect(session.cookieValue).toBeTruthy();

    await expect(AuthService.resetPassword(token, "Another1a")).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("changes password when the current password is correct", async () => {
    const user = await User.findByPk(userId);
    await AuthService.changePassword(user!, "NewSecret1a", "Changed1a");
    await AuthService.login({ email, password: "Changed1a" });
  });

  it("sets up, enables, and disables 2FA with sealed secrets", async () => {
    const user = await User.findByPk(userId);
    const { secret } = TwoFactorService.generateSecret(email);
    const { sealed, keyVersion } = TwoFactorService.sealSecret(secret);
    user!.twoFactorSecret = sealed;
    user!.twoFactorSecretKeyVersion = keyVersion;
    user!.twoFactorEnabled = false;
    await user!.save();

    // Force-enable with a recovery code path for the test (TOTP time-based is flaky).
    const { recoveryCodes, hashedCodes } =
      await TwoFactorService.generateRecoveryCodes();
    user!.twoFactorEnabled = true;
    user!.twoFactorRecoveryHashes = hashedCodes;
    await user!.save();

    const opened = TwoFactorService.readSecret(user!);
    expect(opened).toBe(secret);

    const session = await AuthService.login({
      email,
      password: "Changed1a",
      securityToken: recoveryCodes[0],
    });
    expect(session.amr).toBe("pwd otp");

    // Recovery code is single-use.
    await expect(
      AuthService.login({
        email,
        password: "Changed1a",
        securityToken: recoveryCodes[0],
      }),
    ).rejects.toMatchObject({ statusCode: 401 });

    user!.twoFactorEnabled = false;
    user!.twoFactorSecret = null;
    user!.twoFactorSecretKeyVersion = null;
    user!.twoFactorRecoveryHashes = [];
    await user!.save();
  });

  it("revokes a session cookie", async () => {
    const { cookieValue } = await AuthService.login({
      email,
      password: "Changed1a",
    });
    await SessionService.revokeByCookie(cookieValue);
    expect(await SessionService.resolve(cookieValue)).toBeNull();
  });
});
