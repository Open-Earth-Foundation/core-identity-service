import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import createHttpError from "http-errors";
import SessionService from "@/backend/SessionService";
import { apiHandler } from "@/lib/api";
import { CSRF_COOKIE, assertCsrf } from "@/lib/csrf";
import { verifyPassword } from "@/lib/password";

const bodySchema = z.object({
  password: z.string().min(1),
  csrfToken: z.string().optional(),
});

export const POST = apiHandler(async (req) => {
  const body = bodySchema.parse(await req.json());
  const jar = await cookies();
  assertCsrf(jar.get(CSRF_COOKIE)?.value, body.csrfToken);

  const { user } = await SessionService.requireUser();
  if (!user.passwordHash) {
    throw createHttpError.BadRequest("Account has no password.");
  }
  if (!(await verifyPassword(body.password, user.passwordHash))) {
    throw createHttpError.BadRequest("Invalid password.");
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = null;
  user.twoFactorSecretKeyVersion = null;
  user.twoFactorRecoveryHashes = [];
  await user.save();

  return NextResponse.json({ data: { success: true } });
});
