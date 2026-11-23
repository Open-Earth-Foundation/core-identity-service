import { NextResponse } from "next/server";
import AuthorizationService from "@/backend/oauth/AuthorizationService";
import SessionService from "@/backend/SessionService";
import { apiHandler } from "@/lib/api";
import { getOAuthIssuer } from "@/lib/oauth-config";

/**
 * OAuth 2.0 authorization endpoint (RFC 6749 section 3.1, PKCE, OIDC Core).
 *
 * Browser only. It reads the OP session cookie and answers with a redirect:
 * to the login page, to the consent page, or back to the client with a code or
 * an error.
 */
export const GET = apiHandler(async (req) => {
  const url = new URL(req.url);
  const input = Object.fromEntries(url.searchParams);

  const validated = await AuthorizationService.validateAuthorizeRequest(input);
  if ("redirectUrl" in validated) {
    return redirectTo(req, validated.redirectUrl);
  }

  const session = await SessionService.current();
  const decision = await AuthorizationService.decide(
    validated,
    session?.userId ?? null,
    // Root-relative, so the login page can only send the user back here.
    `${url.pathname}${url.search}`,
    url.searchParams.toString(),
  );
  return redirectTo(req, decision.redirectUrl);
});

/** 302 to an absolute URL, or to a root-relative path on this origin. */
function redirectTo(req: Request, target: string): Response {
  // Relative targets resolve against the public origin, not the internal host
  // the request may have arrived on behind a proxy.
  const base = `${getOAuthIssuer(req)}/`;
  const response = NextResponse.redirect(new URL(target, base), 302);
  // The answer depends on the cookie and carries a one-time code.
  response.headers.set("Cache-Control", "no-store");
  return response;
}
