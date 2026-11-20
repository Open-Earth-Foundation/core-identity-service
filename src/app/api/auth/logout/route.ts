import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import SessionService, { SESSION_COOKIE } from "@/backend/SessionService";
import { apiHandler } from "@/lib/api";
import { CSRF_COOKIE, assertCsrf } from "@/lib/csrf";

export const POST = apiHandler(async (req) => {
  const body = (await req.json().catch(() => ({}))) as { csrfToken?: string };
  const jar = await cookies();
  assertCsrf(jar.get(CSRF_COOKIE)?.value, body.csrfToken);

  const value = jar.get(SESSION_COOKIE)?.value;
  await SessionService.revokeByCookie(value);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    ...SessionService.cookieOptions(new Date(0)),
    maxAge: 0,
  });
  return res;
});
