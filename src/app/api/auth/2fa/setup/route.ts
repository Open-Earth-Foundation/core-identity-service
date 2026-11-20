import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import createHttpError from "http-errors";
import SessionService from "@/backend/SessionService";
import TwoFactorService from "@/backend/TwoFactorService";
import { apiHandler } from "@/lib/api";
import { CSRF_COOKIE, assertCsrf } from "@/lib/csrf";

export const POST = apiHandler(async (req) => {
  const body = (await req.json().catch(() => ({}))) as { csrfToken?: string };
  const jar = await cookies();
  assertCsrf(jar.get(CSRF_COOKIE)?.value, body.csrfToken);

  const { user } = await SessionService.requireUser();
  if (!user.email) {
    throw createHttpError.BadRequest("User has no email address.");
  }
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    throw createHttpError.BadRequest(
      "2FA is already configured; disable it first.",
    );
  }

  const { secret, otpAuthUrl } = TwoFactorService.generateSecret(user.email);
  const { sealed, keyVersion } = TwoFactorService.sealSecret(secret);
  user.twoFactorSecret = sealed;
  user.twoFactorSecretKeyVersion = keyVersion;
  user.twoFactorEnabled = false;
  await user.save();

  const qrCodeDataUrl = await TwoFactorService.qrDataUrl(otpAuthUrl);
  return NextResponse.json({ data: { success: true, qrCodeDataUrl } });
});
