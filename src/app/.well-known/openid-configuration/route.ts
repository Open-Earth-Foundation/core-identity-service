import { NextResponse } from "next/server";
import { buildDiscoveryDocument } from "@/backend/oauth/discovery";
import { apiHandler } from "@/lib/api";
import { getOAuthIssuer } from "@/lib/oauth-config";

/**
 * OpenID Connect Discovery 1.0. Public, no authentication. Also served at
 * /.well-known/oauth-authorization-server (RFC 8414), which is the address MCP
 * clients look up.
 */
export const GET = apiHandler(async (req) => {
  return NextResponse.json(buildDiscoveryDocument(getOAuthIssuer(req)), {
    // The document only changes with a deployment, so a short cache is safe.
    headers: { "Cache-Control": "public, max-age=300" },
  });
});
