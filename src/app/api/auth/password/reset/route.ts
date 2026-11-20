import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import AuthService from "@/backend/AuthService";
import { apiHandler } from "@/lib/api";
import { CSRF_COOKIE, assertCsrf } from "@/lib/csrf";
import { resetPasswordRequest } from "@/lib/validation";

export const POST = apiHandler(async (req) => {
  const body = resetPasswordRequest.parse(await req.json());
  const jar = await cookies();
  assertCsrf(jar.get(CSRF_COOKIE)?.value, body.csrfToken);

  await AuthService.resetPassword(body.token, body.newPassword);
  return NextResponse.json({});
});
