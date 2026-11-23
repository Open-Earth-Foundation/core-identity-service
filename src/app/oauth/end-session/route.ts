import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import ClientService from "@/backend/oauth/ClientService";
import SessionService, { SESSION_COOKIE } from "@/backend/SessionService";
import { apiHandler } from "@/lib/api";
import { getOAuthIssuer } from "@/lib/oauth-config";

/**
 * OIDC RP-Initiated Logout 1.0 (end_session_endpoint).
 *
 * Clears the OP session cookie. When `post_logout_redirect_uri` is registered
 * for `client_id`, the browser is sent there; otherwise to /login/.
 * `id_token_hint` is accepted but not required for v0.
 */
export const GET = apiHandler(async (req) => {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("client_id") ?? undefined;
  const postLogout = url.searchParams.get("post_logout_redirect_uri") ?? undefined;

  const jar = await cookies();
  const sessionValue = jar.get(SESSION_COOKIE)?.value;
  await SessionService.revokeByCookie(sessionValue);

  const issuer = getOAuthIssuer(req);
  let target = `${issuer}/login/`;

  if (clientId && postLogout) {
    const client = await ClientService.findClientByRedirectUri(
      clientId,
      postLogout,
    );
    if (client) {
      target = postLogout;
    }
  }

  const response = NextResponse.redirect(new URL(target), 302);
  response.cookies.set(SESSION_COOKIE, "", {
    ...SessionService.cookieOptions(new Date(0)),
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
});
