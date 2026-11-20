import { NextResponse } from "next/server";
import AuthService from "@/backend/AuthService";
import { apiHandler } from "@/lib/api";
import { verifyEmailRequest } from "@/lib/validation";

export const GET = apiHandler(async (req) => {
  const token = new URL(req.url).searchParams.get("token") || "";
  const body = verifyEmailRequest.parse({ token });
  await AuthService.verifyEmail(body.token);
  return NextResponse.json({ ok: true });
});

export const POST = apiHandler(async (req) => {
  const body = verifyEmailRequest.parse(await req.json());
  await AuthService.verifyEmail(body.token);
  return NextResponse.json({ ok: true });
});
