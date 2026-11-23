import createHttpError from "http-errors";
import { NextResponse } from "next/server";
import IdentityClaimsService from "@/backend/oauth/IdentityClaimsService";
import { apiHandler } from "@/lib/api";
import { getOAuthAudience, getOAuthIssuer } from "@/lib/oauth-config";
import { verifyAccessToken } from "@/lib/oauth-signing";

/**
 * OpenID Connect UserInfo endpoint. GET and POST are both required (OpenID
 * Connect Core section 5.3). The Bearer access token must carry the `openid`
 * scope. A browser cookie is not accepted.
 */
const handler = apiHandler(async (req) => {
  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i);
  if (!bearer) {
    throw createHttpError.Unauthorized("Bearer access token required");
  }

  const token = verifyAccessToken(bearer[1], {
    issuer: getOAuthIssuer(req),
    audience: getOAuthAudience(req),
  });
  const scopes = String(token.scope ?? "").split(" ");
  if (!scopes.includes("openid")) {
    throw createHttpError.Unauthorized("The token has no openid scope");
  }

  const claims = await IdentityClaimsService.forUser(token.sub!);
  return NextResponse.json(claims, {
    // Profile data of one user. Intermediaries must not store it.
    headers: { "Cache-Control": "no-store" },
  });
});

export const GET = handler;
export const POST = handler;
