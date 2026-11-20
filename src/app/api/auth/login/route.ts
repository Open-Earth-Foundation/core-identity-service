import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import AuthService from "@/backend/AuthService";
import SessionService, { SESSION_COOKIE } from "@/backend/SessionService";
import { apiHandler } from "@/lib/api";
import { CSRF_COOKIE, assertCsrf } from "@/lib/csrf";
import { loginRequest } from "@/lib/validation";

export const POST = apiHandler(async (req) => {
  const body = loginRequest.parse(await req.json());
  const jar = await cookies();
  assertCsrf(jar.get(CSRF_COOKIE)?.value, body.csrfToken);

  const { cookieValue, expires } = await AuthService.login({
    email: body.email,
    password: body.password,
    securityToken: body.securityToken,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    SESSION_COOKIE,
    cookieValue,
    SessionService.cookieOptions(expires),
  );
  return res;
});
