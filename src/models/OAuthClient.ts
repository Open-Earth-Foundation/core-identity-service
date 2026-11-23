import { DataTypes, Model, Optional, Sequelize } from "sequelize";

/** A registered OAuth 2.0 / OIDC client. */
export interface OAuthClientAttributes {
  clientId: string;
  /**
   * Copy of the first registered redirect URI. The source of truth is
   * OAuthClientRedirectUri. This column goes away in a later migration.
   */
  redirectURI: string;
  /** Hex SHA-256 of the client secret. Null for a public client (PKCE only). */
  clientSecretHash?: string | null;
  /** First-party clients skip the consent screen. */
  firstParty: boolean;
  created?: Date;
  lastUpdated?: Date;
}

export type OAuthClientCreationAttributes = Optional<
  OAuthClientAttributes,
  "clientSecretHash" | "firstParty" | "created" | "lastUpdated"
>;

export class OAuthClient
  extends Model<OAuthClientAttributes, OAuthClientCreationAttributes>
  implements OAuthClientAttributes
{
  declare clientId: string;
  declare redirectURI: string;
  declare clientSecretHash: string | null;
  declare firstParty: boolean;
  declare created: Date;
  declare lastUpdated: Date;

  static initModel(sequelize: Sequelize): typeof OAuthClient {
    return OAuthClient.init(
      {
        clientId: {
          type: DataTypes.STRING(64),
          allowNull: false,
          primaryKey: true,
          field: "client_id",
        },
        redirectURI: {
          type: DataTypes.STRING(2048),
          allowNull: false,
          field: "redirect_uri",
        },
        clientSecretHash: {
          type: DataTypes.CHAR(64),
          allowNull: true,
          field: "client_secret_hash",
        },
        firstParty: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: "first_party",
        },
      },
      {
        sequelize,
        tableName: "OAuthClient",
        schema: "public",
        timestamps: true,
        createdAt: "created",
        updatedAt: "lastUpdated",
        underscored: true,
      },
    );
  }
}
