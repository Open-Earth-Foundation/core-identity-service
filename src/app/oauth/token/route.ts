import createHttpError from "http-errors";
import { NextResponse } from "next/server";
import { z } from "zod";
import AuthorizationCodeService from "@/backend/oauth/AuthorizationCodeService";
import { authenticateClient } from "@/backend/oauth/ClientAuthentication";
import ClientService from "@/backend/oauth/ClientService";
import { readForm } from "@/backend/oauth/form";
import IdentityClaimsService from "@/backend/oauth/IdentityClaimsService";
import RefreshTokenService from "@/backend/oauth/RefreshTokenService";
import { apiHandler } from "@/lib/api";
import { getOAuthAudience, getOAuthIssuer } from "@/lib/oauth-config";
import {
  getOAuthSigningKey,
  OAuthTokenType,
  signOAuthToken,
} from "@/lib/oauth-signing";

// Short, so that revoking an app or deleting a user takes hold quickly. A client
// that wants to keep going uses its refresh token.
const ACCESS_TOKEN_EXPIRY = 15 * 60;
const ID_TOKEN_EXPIRY = 15 * 60;

const authorizationCodeRequest = z.object({
  grant_type: z.literal("authorization_code"),
  code: z.string().min(1, "code is required"),
  redirect_uri: z.string().min(1, "redirect_uri is required"),
  client_id: z.string().optional(),
  code_verifier: z.string().min(1, "code_verifier is required"),
});

const refreshTokenRequest = z.object({
  grant_type: z.literal("refresh_token"),
  refresh_token: z.string().min(1, "refresh_token is required"),
  // A public client names itself here. A confidential client uses HTTP Basic.
  client_id: z.string().optional(),
  scope: z.string().optional(),
});

/** Token endpoint (RFC 6749 section 3.2): code or refresh token in, tokens out. */
export const POST = apiHandler(async (req) => {
  // Fails with a 500 if OAUTH_SIGNING_KEY is missing or invalid. Checked here
  // so a configuration problem is not reported to the client as a bad code.
  getOAuthSigningKey();

  const form = await readForm(req);

  switch (form.grant_type) {
    case "authorization_code":
      return handleAuthorizationCode(req, authorizationCodeRequest.parse(form));
    case "refresh_token":
      return handleRefreshToken(req, refreshTokenRequest.parse(form));
    default:
      throw createHttpError.BadRequest(
        "Only 'authorization_code' or 'refresh_token' grant_type allowed",
      );
  }
});

async function handleAuthorizationCode(
  req: Request,
  body: z.infer<typeof authorizationCodeRequest>,
) {
  // A confidential client must prove who it is. A public client has PKCE.
  const client = await authenticateClient(req, body.client_id);

  if (
    !(await ClientService.findClientByRedirectUri(
      client.clientId,
      body.redirect_uri,
    ))
  ) {
    throw createHttpError.BadRequest("redirect_uri mismatch");
  }

  // Checks expiry, single use, client, redirect URI and PKCE. The code is spent
  // by this call, so it cannot be tried a second time.
  const grant = await AuthorizationCodeService.redeem({
    code: body.code,
    clientId: client.clientId,
    redirectUri: body.redirect_uri,
    codeVerifier: body.code_verifier,
  });

  const issuer = getOAuthIssuer(req);
  const scope = grant.scope;

  const accessToken = signOAuthToken(
    OAuthTokenType.Access,
    { client_id: client.clientId, scope },
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer,
      audience: getOAuthAudience(req),
      subject: grant.userId,
    },
  );

  // Starts the refresh-token family the code reserved. Each refresh replaces
  // the token with the next one.
  const refresh = await RefreshTokenService.issue({
    clientId: client.clientId,
    userId: grant.userId,
    scope,
    familyId: grant.familyId ?? undefined,
  });

  const response: Record<string, unknown> = {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_EXPIRY,
    refresh_token: refresh.token,
    scope,
  };

  // OpenID Connect: only requests with the `openid` scope get an id_token.
  if (scope.split(" ").includes("openid")) {
    response.id_token = await issueIdToken({
      userId: grant.userId,
      clientId: client.clientId,
      nonce: grant.nonce,
      issuer,
    });
  }

  return tokenResponse(response);
}

/**
 * Builds the id_token (OpenID Connect Core section 2). It is meant for the
 * client, not for calling APIs: `aud` is the client id, not this server.
 */
async function issueIdToken(params: {
  userId: string;
  clientId: string;
  nonce: string | null;
  issuer: string;
}): Promise<string> {
  const [claims, amr] = await Promise.all([
    IdentityClaimsService.forUser(params.userId),
    IdentityClaimsService.authenticationMethods(params.userId),
  ]);
  // `sub` is set through the signing options below.
  const { sub, ...identity } = claims;

  return signOAuthToken(
    OAuthTokenType.Id,
    {
      ...identity,
      amr,
      // Echoed unchanged so the client can tie the token to its own request.
      ...(params.nonce ? { nonce: params.nonce } : {}),
    },
    {
      expiresIn: ID_TOKEN_EXPIRY,
      issuer: params.issuer,
      audience: params.clientId,
      subject: sub,
    },
  );
}

/**
 * The refresh_token grant. Exchanges a refresh token for a new access token and
 * the next refresh token (rotation). The old refresh token stops working.
 */
async function handleRefreshToken(
  req: Request,
  body: z.infer<typeof refreshTokenRequest>,
) {
  // Who is asking. A refresh token only works for the client it was issued to.
  const client = await authenticateClient(req, body.client_id);

  // Throws if the token is unknown, expired or revoked, if the app was revoked,
  // or if the token was used before (which revokes its family).
  const rotated = await RefreshTokenService.rotate({
    token: body.refresh_token,
    clientId: client.clientId,
  });

  const accessToken = signOAuthToken(
    OAuthTokenType.Access,
    { client_id: rotated.clientId, scope: rotated.scope },
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: getOAuthIssuer(req),
      audience: getOAuthAudience(req),
      subject: rotated.userId,
    },
  );

  return tokenResponse({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_EXPIRY,
    refresh_token: rotated.token,
    scope: rotated.scope,
  });
}

/** Token responses must not be cached (RFC 6749 section 5.1). */
function tokenResponse(body: Record<string, unknown>): NextResponse {
  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
  });
}
