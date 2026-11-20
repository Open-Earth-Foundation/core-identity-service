import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import AuthService from "@/backend/AuthService";
import SessionService from "@/backend/SessionService";
import { apiHandler } from "@/lib/api";
import { CSRF_COOKIE, assertCsrf } from "@/lib/csrf";
import { changePasswordRequest } from "@/lib/validation";

export const POST = apiHandler(async (req) => {
  const body = changePasswordRequest.parse(await req.json());
  const jar = await cookies();
  assertCsrf(jar.get(CSRF_COOKIE)?.value, body.csrfToken);

  const { user } = await SessionService.requireUser();
  await AuthService.changePassword(
    user,
    body.currentPassword,
    body.newPassword,
  );
  return NextResponse.json({ success: true });
});
