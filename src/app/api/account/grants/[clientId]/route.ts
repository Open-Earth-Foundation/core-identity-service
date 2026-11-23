import createHttpError from "http-errors";
import { NextResponse } from "next/server";
import ClientService from "@/backend/oauth/ClientService";
import RefreshTokenService from "@/backend/oauth/RefreshTokenService";
import SessionService from "@/backend/SessionService";
import { apiHandler } from "@/lib/api";
import { OAuthClientAuthz } from "@/models/OAuthClientAuthz";

/** The signed-in user's grant for one app. */
export const GET = apiHandler(async (_req, ctx) => {
  const { userId } = await SessionService.requireUser();
  const { clientId } = await ctx.params;

  const grant = await OAuthClientAuthz.findOne({ where: { userId, clientId } });
  const client = grant ? await ClientService.get(clientId) : null;
  if (!grant || !client) {
    throw createHttpError.NotFound("No authorization for that client");
  }

  return NextResponse.json({
    data: {
      clientId,
      name: client.name,
      description: client.description,
      firstParty: client.firstParty,
      lastUsed: grant.lastUsed,
      created: grant.created,
    },
  });
});

/** Removes the app: revokes its refresh tokens and deletes the grant. */
export const DELETE = apiHandler(async (_req, ctx) => {
  const { userId } = await SessionService.requireUser();
  const { clientId } = await ctx.params;

  const grant = await OAuthClientAuthz.findOne({ where: { userId, clientId } });
  if (!grant) {
    throw createHttpError.NotFound("No authorization for that client");
  }

  // Refresh tokens first: they are what would let the app get new access tokens.
  // Without this, authorizing the app again later would revive the old ones.
  await RefreshTokenService.revokeForGrant(clientId, userId);
  await grant.destroy();

  return new NextResponse(null, { status: 204 });
});
