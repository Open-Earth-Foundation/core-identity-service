import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import AuthService from "@/backend/AuthService";
import { apiHandler } from "@/lib/api";
import { CSRF_COOKIE, assertCsrf } from "@/lib/csrf";
import { registerRequest } from "@/lib/validation";

export const POST = apiHandler(async (req) => {
  const body = registerRequest.parse(await req.json());
  const jar = await cookies();
  assertCsrf(jar.get(CSRF_COOKIE)?.value, body.csrfToken);

  const user = await AuthService.register({
    name: body.name,
    email: body.email,
    password: body.password,
  });

  return NextResponse.json({ user });
});
