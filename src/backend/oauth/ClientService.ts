import createHttpError from "http-errors";
import { randomToken } from "@/lib/crypto";
import { OAuthClient } from "@/models/OAuthClient";
import { OAuthClientI18N } from "@/models/OAuthClientI18N";
import { OAuthClientRedirectUri } from "@/models/OAuthClientRedirectUri";
import { hashSecret } from "./ClientAuthentication";

/** Language code (ISO 639-1) to text. */
export type LangMap = Record<string, string>;

/** A client as the admin API and the consent page show it. Never has a secret. */
export interface ClientDto {
  clientId: string;
  redirectUris: string[];
  firstParty: boolean;
  /** True when the client has a secret and must authenticate with it. */
  confidential: boolean;
  name: LangMap;
  description: LangMap;
}

export interface CreateClientParams {
  redirectUris: string[];
  name: LangMap;
  description?: LangMap;
  /** Plain secret. Stored as a hash. Leave out for a public (PKCE-only) client. */
  secret?: string;
  firstParty?: boolean;
}

type ClientWithRelations = OAuthClient & {
  i18n?: OAuthClientI18N[];
  redirectUris?: OAuthClientRedirectUri[];
};

/** Loads clients with their text and URIs, in one query. */
const INCLUDE_RELATIONS = [
  { model: OAuthClientI18N, as: "i18n", required: false },
  { model: OAuthClientRedirectUri, as: "redirectUris", required: false },
];

function toDto(client: ClientWithRelations): ClientDto {
  const name: LangMap = {};
  const description: LangMap = {};
  for (const row of client.i18n ?? []) {
    name[row.language] = row.name;
    if (row.description) description[row.language] = row.description;
  }
  return {
    clientId: client.clientId,
    redirectUris: (client.redirectUris ?? [])
      .map((row) => row.redirectURI)
      .sort(),
    firstParty: client.firstParty,
    confidential: Boolean(client.clientSecretHash),
    name,
    description,
  };
}

/** Registration and lookup of OAuth clients. */
export default class ClientService {
  public static async list(): Promise<ClientDto[]> {
    const clients = await OAuthClient.findAll({
      include: INCLUDE_RELATIONS,
      order: [["created", "ASC"]],
    });
    return clients.map((client) => toDto(client as ClientWithRelations));
  }

  /** @returns the client, or null when the id is unknown. */
  public static async get(clientId: string): Promise<ClientDto | null> {
    const client = await OAuthClient.findByPk(clientId, {
      include: INCLUDE_RELATIONS,
    });
    return client ? toDto(client as ClientWithRelations) : null;
  }

  public static async create(params: CreateClientParams): Promise<ClientDto> {
    if (params.redirectUris.length === 0) {
      throw createHttpError.BadRequest("At least one redirect URI is required.");
    }
    const redirectUris = [...new Set(params.redirectUris)];
    const clientId = randomToken(24);

    // Client, text and URIs are written together or not at all.
    await OAuthClient.sequelize!.transaction(async (transaction) => {
      await OAuthClient.create(
        {
          clientId,
          // Copy of the first URI for the legacy column. See the CC-1280
          // migration. OAuthClientRedirectUri is the source of truth.
          redirectURI: redirectUris[0],
          clientSecretHash: params.secret ? hashSecret(params.secret) : null,
          firstParty: params.firstParty ?? false,
        },
        { transaction },
      );
      await OAuthClientRedirectUri.bulkCreate(
        redirectUris.map((redirectURI) => ({ clientId, redirectURI })),
        { transaction },
      );
      for (const [language, name] of Object.entries(params.name)) {
        await OAuthClientI18N.create(
          {
            clientId,
            language,
            name,
            description: params.description?.[language] ?? null,
          },
          { transaction },
        );
      }
    });

    return (await ClientService.get(clientId))!;
  }

  /**
   * Deletes a client. Its text, redirect URIs, grants, codes and refresh tokens
   * go with it (ON DELETE CASCADE).
   * @returns false when the id is unknown.
   */
  public static async delete(clientId: string): Promise<boolean> {
    const deleted = await OAuthClient.destroy({ where: { clientId } });
    return deleted > 0;
  }

  /**
   * The client with this id, but only when `redirectUri` is one of its
   * registered URIs. Matching is exact (OAuth 2.0 Security BCP).
   * @returns null for an unknown client or an unregistered URI.
   */
  public static async findClientByRedirectUri(
    clientId: string,
    redirectUri: string,
  ): Promise<OAuthClient | null> {
    const registered = await OAuthClientRedirectUri.findOne({
      where: { clientId, redirectURI: redirectUri },
    });
    if (!registered) return null;
    return OAuthClient.findByPk(clientId);
  }
}
