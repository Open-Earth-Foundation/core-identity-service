import { cookies } from "next/headers";
import createHttpError from "http-errors";
import { NextResponse } from "next/server";
import { z } from "zod";
import AuthorizationService from "@/backend/oauth/AuthorizationService";
import ClientService from "@/backend/oauth/ClientService";
import SessionService from "@/backend/SessionService";
import { apiHandler } from "@/lib/api";
import { CSRF_COOKIE, assertCsrf } from "@/lib/csrf";

const consentRequest = z.object({
  csrfToken: z.string().optional(),
  client_id: z.string().min(1),
  redirect_uri: z.string().min(1),
  scope: z.string().min(1),
  state: z.string().optional(),
  code_challenge: z.string().min(1),
  nonce: z.string().optional(),
});

/**
 * What the consent page shows: the app's name and description. Requires a
 * session (the page sends the user to log in on a 401). The redirect URI must
 * be registered, so the page only redirects to a URI that is known to be safe.
 */
export const GET = apiHandler(async (req) => {
  await SessionService.requireUser();

  const params = new URL(req.url).searchParams;
  const clientId = params.get("client_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  if (
    !(await ClientService.findClientByRedirectUri(clientId, redirectUri))
  ) {
    throw createHttpError.BadRequest(
      "Unknown client_id or unregistered redirect_uri.",
    );
  }

  const client = (await ClientService.get(clientId))!;
  return NextResponse.json({
    data: { name: client.name, description: client.description },
  });
});

/**
 * The user approved an app on the consent page. Records the grant, issues an
 * authorization code and returns where to send the browser. The request is
 * checked again from scratch, because the browser could send anything.
 */
export const POST = apiHandler(async (req) => {
  const { userId } = await SessionService.requireUser();

  const body = consentRequest.parse(await req.json());
  const jar = await cookies();
  assertCsrf(jar.get(CSRF_COOKIE)?.value, body.csrfToken);

  const validated = await AuthorizationService.validateAuthorizeRequest({
    client_id: body.client_id,
    redirect_uri: body.redirect_uri,
    scope: body.scope,
    state: body.state,
    code_challenge: body.code_challenge,
    nonce: body.nonce,
    // The consent page is only reached through a request that already passed
    // these two checks at /oauth/authorize.
    response_type: "code",
    code_challenge_method: "S256",
  });
  if ("redirectUrl" in validated) {
    return NextResponse.json({ redirectUrl: validated.redirectUrl });
  }

  const { redirectUrl } = await AuthorizationService.issueCode(
    validated,
    userId,
  );
  return NextResponse.json(
    { redirectUrl },
    { headers: { "Cache-Control": "no-store" } },
  );
});
