import { NextResponse } from "next/server";
import ClientService from "@/backend/oauth/ClientService";
import SessionService from "@/backend/SessionService";
import { apiHandler } from "@/lib/api";
import { OAuthClientAuthz } from "@/models/OAuthClientAuthz";

/** Lists the apps the signed-in user has authorized. */
export const GET = apiHandler(async () => {
  const { userId } = await SessionService.requireUser();

  const grants = await OAuthClientAuthz.findAll({
    where: { userId },
    order: [["created", "ASC"]],
  });
  const clients = new Map(
    (await ClientService.list()).map((client) => [client.clientId, client]),
  );

  const data = grants.flatMap((grant) => {
    const client = clients.get(grant.clientId);
    if (!client) return [];
    return [
      {
        clientId: grant.clientId,
        name: client.name,
        description: client.description,
        firstParty: client.firstParty,
        lastUsed: grant.lastUsed,
        created: grant.created,
      },
    ];
  });
  return NextResponse.json({ data });
});
