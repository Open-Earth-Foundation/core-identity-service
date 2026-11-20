import { NextResponse } from "next/server";
import { CSRF_COOKIE, issueCsrf } from "@/lib/csrf";

/** Issues a fresh CSRF cookie + token for browser forms. */
export async function GET() {
  const { token, cookieValue } = issueCsrf();
  const res = NextResponse.json({ csrfToken: token });
  res.cookies.set(CSRF_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return res;
}
