import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import createHttpError from "http-errors";
import SessionService from "@/backend/SessionService";
import TwoFactorService from "@/backend/TwoFactorService";
import { apiHandler } from "@/lib/api";
import { CSRF_COOKIE, assertCsrf } from "@/lib/csrf";
import { twoFactorCodeRequest } from "@/lib/validation";

export const POST = apiHandler(async (req) => {
  const body = twoFactorCodeRequest.parse(await req.json());
  const jar = await cookies();
  assertCsrf(jar.get(CSRF_COOKIE)?.value, body.csrfToken);

  const { user } = await SessionService.requireUser();
  if (!user.twoFactorSecret) {
    throw createHttpError.BadRequest("2FA setup is not initialized.");
  }
  if (user.twoFactorEnabled) {
    throw createHttpError.BadRequest("2FA is already enabled.");
  }

  const secret = TwoFactorService.readSecret(user);
  if (!secret || !(await TwoFactorService.verifyTotp(body.token, secret))) {
    throw createHttpError.BadRequest("Invalid authenticator code.");
  }

  const { recoveryCodes, hashedCodes } =
    await TwoFactorService.generateRecoveryCodes();
  user.twoFactorEnabled = true;
  user.twoFactorRecoveryHashes = hashedCodes;
  await user.save();

  return NextResponse.json({
    data: { success: true, recoveryCodes },
  });
});
