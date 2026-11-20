import { createHash, randomBytes } from "node:crypto";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import createHttpError from "http-errors";
import { open, seal } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import type { User } from "@/models/User";

export const recoveryTokenMinLength = 10;

export default class TwoFactorService {
  public static generateSecret(email: string) {
    const secret = generateSecret();
    const otpAuthUrl = generateURI({
      label: email,
      issuer: process.env.TOTP_ISSUER || "CityCatalyst Identity",
      secret,
    });
    return { secret, otpAuthUrl };
  }

  public static async qrDataUrl(otpAuthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpAuthUrl);
  }

  public static async verifyTotp(
    token: string,
    secret: string,
  ): Promise<boolean> {
    try {
      const result = await verify({ token, secret });
      return result.valid;
    } catch (error) {
      logger.error({ err: String(error) }, "Failed to verify 2FA token");
      return false;
    }
  }

  public static async generateRecoveryCodes() {
    const recoveryCodes: string[] = [];
    const hashedCodes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const rawCode = randomBytes(5).toString("hex");
      const code = `${rawCode.slice(0, 5)}-${rawCode.slice(5)}`;
      recoveryCodes.push(code);
      hashedCodes.push(createHash("sha256").update(code).digest("hex"));
    }
    return { recoveryCodes, hashedCodes };
  }

  public static readSecret(user: User): string | null {
    if (!user.twoFactorSecret) return null;
    try {
      return open(user.twoFactorSecret, user.twoFactorSecretKeyVersion);
    } catch (error) {
      logger.error({ err: String(error) }, "Failed to open 2FA secret");
      throw createHttpError.InternalServerError("Configuration error");
    }
  }

  public static sealSecret(plaintext: string): {
    sealed: string;
    keyVersion: number;
  } {
    return seal(plaintext);
  }

  public static async verifyRecoveryCode(
    user: User,
    recoveryCode: string,
  ): Promise<boolean> {
    let code = recoveryCode.toLowerCase();
    if (!code.includes("-") && code.length === 10) {
      code = `${code.slice(0, 5)}-${code.slice(5)}`;
    }
    const hash = createHash("sha256").update(code).digest("hex");
    const hashes = [...(user.twoFactorRecoveryHashes ?? [])];
    const index = hashes.indexOf(hash);
    if (index === -1) return false;
    hashes.splice(index, 1);
    user.twoFactorRecoveryHashes = hashes;
    user.changed("twoFactorRecoveryHashes", true);
    await user.save();
    return true;
  }
}
