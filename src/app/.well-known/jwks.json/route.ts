import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api";
import { getPublicJwk } from "@/lib/oauth-signing";

/**
 * JSON Web Key Set (RFC 7517). Public, no authentication.
 *
 * Publishes the public half of the OAuth signing key, so relying parties and
 * resource servers can verify id_tokens and access tokens without a shared
 * secret. There is one key today. When keys are rotated, the retired key stays
 * in this list until the longest token signed with it has expired.
 */
export const GET = apiHandler(async () => {
  // Throws a 500 and logs why if OAUTH_SIGNING_KEY is missing or invalid.
  const jwk = getPublicJwk();

  return NextResponse.json(
    { keys: [jwk] },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
});
