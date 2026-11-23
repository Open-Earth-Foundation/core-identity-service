/**
 * Where OAuth tokens come from and who they are for.
 *
 * - `OAUTH_ISSUER`: the `iss` of every token and the `issuer` in the discovery
 *   document. Default: `PUBLIC_ORIGIN`, then the request origin.
 * - `OAUTH_AUDIENCE`: the `aud` of access tokens. It names the API the token is
 *   for. Default: the issuer's own origin (same fallback as above).
 *
 * Issuing and checking tokens both read them here, so what is signed and what
 * is verified cannot drift apart.
 */

/** This server's own address, used when no explicit value is configured. */
function ownOrigin(req: Request): string {
  const configured = process.env.PUBLIC_ORIGIN;
  // Trailing slashes would double up in the endpoint URLs built from this.
  return (configured || new URL(req.url).origin).replace(/\/+$/, "");
}

export function getOAuthIssuer(req: Request): string {
  return (process.env.OAUTH_ISSUER || ownOrigin(req)).replace(/\/+$/, "");
}

export function getOAuthAudience(req: Request): string {
  return process.env.OAUTH_AUDIENCE || ownOrigin(req);
}
