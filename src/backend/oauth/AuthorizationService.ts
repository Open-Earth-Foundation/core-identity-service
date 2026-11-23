import createHttpError from "http-errors";
import { OAuthClient } from "@/models/OAuthClient";
import AuthorizationCodeService from "./AuthorizationCodeService";
import ClientService from "./ClientService";
import { hasActiveGrant, recordGrant } from "./grants";

export const ALLOWED_SCOPES = ["openid", "read", "write"];

/** The query (or JSON body) fields of an authorization request. */
export type AuthorizeInput = Record<string, string | undefined | null>;

/** An authorization request that passed validation. */
export interface AuthorizeRequest {
  client: OAuthClient;
  redirectUri: string;
  scope: string;
  state?: string;
  codeChallenge: string;
  nonce?: string;
  prompt?: string;
}

/** Where to send the browser next. Always an absolute or root-relative URL. */
export interface AuthorizeDecision {
  redirectUrl: string;
}

/** Appends OAuth response parameters to a redirect URI, keeping its own query. */
function withParams(
  redirectUri: string,
  params: Record<string, string | undefined>,
): string {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return url.toString();
}

/** Redirect to the client with an OAuth error (RFC 6749 section 4.1.2.1). */
export function errorRedirect(
  redirectUri: string,
  state: string | undefined,
  error: string,
  description: string,
): string {
  return withParams(redirectUri, {
    error,
    error_description: description,
    state,
  });
}

/**
 * Authorization endpoint logic: checks the request, then decides whether to
 * send the user to log in, to the consent screen, or back to the client with a
 * code.
 */
export default class AuthorizationService {
  /**
   * Checks an authorization request.
   *
   * A bad `client_id` or `redirect_uri` is never redirected to (RFC 6749
   * section 4.1.2.1: the URI cannot be trusted), so it throws a 400. Every other
   * problem is returned as a redirect back to the client with an `error`.
   *
   * @returns the request, or `{ redirectUrl }` when it must be answered with an error.
   */
  public static async validateAuthorizeRequest(
    input: AuthorizeInput,
  ): Promise<AuthorizeRequest | AuthorizeDecision> {
    // The URI must match one the client registered, exactly.
    const clientId = input.client_id;
    const redirectUri = input.redirect_uri;
    if (!clientId || !redirectUri) {
      throw createHttpError.BadRequest(
        "client_id and redirect_uri are required.",
      );
    }
    const client = await ClientService.findClientByRedirectUri(
      clientId,
      redirectUri,
    );
    if (!client) {
      throw createHttpError.BadRequest(
        "Unknown client_id or unregistered redirect_uri.",
      );
    }

    // From here on the redirect URI is trusted, so errors go back to the client.
    const state = input.state || undefined;
    const fail = (error: string, description: string): AuthorizeDecision => ({
      redirectUrl: errorRedirect(redirectUri, state, error, description),
    });

    if (input.response_type !== "code") {
      return fail("unsupported_response_type", "Valid response_type: code");
    }

    // PKCE with S256 is required for every client. S256 is the base64url of a
    // SHA-256 hash, always 43 characters.
    if (
      input.code_challenge_method !== "S256" ||
      !/^[A-Za-z0-9_-]{43}$/.test(input.code_challenge ?? "")
    ) {
      return fail(
        "invalid_request",
        "PKCE required: send code_challenge and code_challenge_method=S256",
      );
    }

    const scopes = (input.scope ?? "").split(" ").filter(Boolean);
    if (
      scopes.length === 0 ||
      scopes.some((scope) => !ALLOWED_SCOPES.includes(scope))
    ) {
      return fail(
        "invalid_scope",
        `Valid scopes: ${ALLOWED_SCOPES.join(", ")}`,
      );
    }

    if (input.nonce && input.nonce.length > 255) {
      return fail("invalid_request", "nonce is too long");
    }

    return {
      client,
      redirectUri,
      scope: scopes.join(" "),
      state,
      codeChallenge: input.code_challenge!,
      nonce: input.nonce || undefined,
      prompt: input.prompt || undefined,
    };
  }

  /**
   * Decides what happens to a valid request.
   *
   * - No session: go to the login page and come back, or with `prompt=none`
   *   answer `login_required`.
   * - Session, and the client is first party or the user already agreed: issue
   *   a code.
   * - Session, but the user has not agreed yet: show the consent page, or with
   *   `prompt=none` answer `consent_required`.
   *
   * @param userId the signed-in user, or null without a session
   * @param returnTo root-relative URL of this same request, for the login page
   * @param consentQuery the request's query string, passed on to the consent page
   */
  public static async decide(
    request: AuthorizeRequest,
    userId: string | null,
    returnTo: string,
    consentQuery: string,
  ): Promise<AuthorizeDecision> {
    const silent = request.prompt === "none";

    if (!userId) {
      if (silent) {
        return {
          redirectUrl: errorRedirect(
            request.redirectUri,
            request.state,
            "login_required",
            "The user is not signed in",
          ),
        };
      }
      return {
        redirectUrl: `/login/?returnTo=${encodeURIComponent(returnTo)}`,
      };
    }

    const consented = await hasActiveGrant(request.client.clientId, userId);
    if (request.client.firstParty || consented) {
      return AuthorizationService.issueCode(request, userId);
    }

    if (silent) {
      return {
        redirectUrl: errorRedirect(
          request.redirectUri,
          request.state,
          "consent_required",
          "The user has not authorized this client",
        ),
      };
    }
    return { redirectUrl: `/consent/?${consentQuery}` };
  }

  /**
   * Records the user's consent, issues a code and returns the redirect to the
   * client. The grant row is written for first-party clients too, because
   * refresh and introspection check that it exists.
   */
  public static async issueCode(
    request: AuthorizeRequest,
    userId: string,
  ): Promise<AuthorizeDecision> {
    await recordGrant(request.client.clientId, userId);

    const code = await AuthorizationCodeService.issue({
      clientId: request.client.clientId,
      userId,
      redirectUri: request.redirectUri,
      codeChallenge: request.codeChallenge,
      scope: request.scope,
      nonce: request.nonce,
    });
    return {
      redirectUrl: withParams(request.redirectUri, {
        code,
        state: request.state,
      }),
    };
  }
}
