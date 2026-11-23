const DOCUMENTATION_URL =
  "https://github.com/Open-Earth-Foundation/core-identity-service";

/**
 * OpenID Connect Discovery 1.0 document, also valid as RFC 8414 authorization
 * server metadata. Served at /.well-known/openid-configuration and at
 * /.well-known/oauth-authorization-server.
 *
 * Endpoint URLs end in a slash because `trailingSlash` is on in next.config.mjs.
 * Advertising the final URL spares clients a redirect.
 */
export function buildDiscoveryDocument(issuer: string) {
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize/`,
    token_endpoint: `${issuer}/oauth/token/`,
    userinfo_endpoint: `${issuer}/oauth/userinfo/`,
    revocation_endpoint: `${issuer}/oauth/revoke/`,
    introspection_endpoint: `${issuer}/oauth/introspect/`,
    jwks_uri: `${issuer}/.well-known/jwks.json/`,
    scopes_supported: ["openid", "read", "write"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    // Public clients (no secret, protected by PKCE) and confidential clients
    // (HTTP Basic).
    token_endpoint_auth_methods_supported: ["none", "client_secret_basic"],
    revocation_endpoint_auth_methods_supported: ["none", "client_secret_basic"],
    // Only registered resource servers may introspect.
    introspection_endpoint_auth_methods_supported: ["client_secret_basic"],
    code_challenge_methods_supported: ["S256"],
    claims_supported: [
      "sub",
      "iss",
      "aud",
      "exp",
      "iat",
      "nonce",
      "amr",
      "email",
      "name",
      "org_ids",
    ],
    service_documentation: DOCUMENTATION_URL,
    ui_locales_supported: ["en"],
  };
}
