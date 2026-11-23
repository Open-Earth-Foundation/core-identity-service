import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateClient } from "@/backend/oauth/ClientAuthentication";
import { readForm } from "@/backend/oauth/form";
import RefreshTokenService from "@/backend/oauth/RefreshTokenService";
import { apiHandler } from "@/lib/api";

const revocationRequest = z.object({
  token: z.string().min(1, "token is required"),
  client_id: z.string().optional(),
});

/**
 * Token revocation (RFC 7009). Revokes a refresh token and every other token of
 * its family. The answer is 200 even for an unknown token, so it reveals
 * nothing. Access tokens cannot be revoked one by one. They expire after 15
 * minutes and cannot be renewed once the refresh token is gone.
 */
export const POST = apiHandler(async (req) => {
  const body = revocationRequest.parse(await readForm(req));
  const client = await authenticateClient(req, body.client_id);

  await RefreshTokenService.revokeByToken(body.token, client.clientId);

  return new NextResponse(null, { status: 200 });
});
