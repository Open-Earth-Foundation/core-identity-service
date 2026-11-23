import createHttpError from "http-errors";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateResourceServer } from "@/backend/oauth/ClientAuthentication";
import { readForm } from "@/backend/oauth/form";
import { hasActiveGrant } from "@/backend/oauth/grants";
import RefreshTokenService from "@/backend/oauth/RefreshTokenService";
import { apiHandler } from "@/lib/api";
import { getOAuthAudience, getOAuthIssuer } from "@/lib/oauth-config";
import { verifyAccessToken } from "@/lib/oauth-signing";

const introspectionRequest = z.object({
  token: z.string().min(1, "token is required"),
});

/** The answer for anything that is not a valid token. It says nothing else. */
const INACTIVE = { active: false } as const;

/**
 * Token introspection (RFC 7662). Tells a registered resource server whether an
 * access or refresh token is still good. Resource servers authenticate with
 * HTTP Basic and are listed in `OAUTH_RESOURCE_SERVERS`.
 */
export const POST = apiHandler(async (req) => {
  authenticateResourceServer(req);
  const { token } = introspectionRequest.parse(await readForm(req));

  // An access token is a JWT (three parts with dots). A refresh token is a
  // plain random string.
  const result =
    token.split(".").length === 3
      ? await introspectAccessToken(token, req)
      : await introspectRefreshToken(token);

  return NextResponse.json(result, {
    // The answer is about one user's token. Intermediaries must not store it.
    headers: { "Cache-Control": "no-store" },
  });
});

async function introspectAccessToken(token: string, req: Request) {
  let claims;
  try {
    claims = verifyAccessToken(token, {
      issuer: getOAuthIssuer(req),
      audience: getOAuthAudience(req),
    });
  } catch (error) {
    // An invalid token is an answer, not an error. A misconfigured key is.
    if (createHttpError.isHttpError(error) && error.statusCode === 401) {
      return INACTIVE;
    }
    throw error;
  }

  const clientId = claims.client_id as string | undefined;
  if (!clientId || !claims.sub) return INACTIVE;

  // Reads only: asking about a token must not count as the app being used.
  if (!(await hasActiveGrant(clientId, claims.sub))) return INACTIVE;

  return {
    active: true,
    scope: claims.scope as string | undefined,
    client_id: clientId,
    sub: claims.sub,
    token_type: "Bearer",
    iss: claims.iss,
    aud: claims.aud,
    exp: claims.exp,
    iat: claims.iat,
  };
}

async function introspectRefreshToken(token: string) {
  const row = await RefreshTokenService.findActive(token);
  if (!row) return INACTIVE;

  return {
    active: true,
    scope: row.scope,
    client_id: row.clientId,
    sub: row.userId,
    exp: Math.floor(row.expires.getTime() / 1000),
    iat: Math.floor(row.created.getTime() / 1000),
  };
}
