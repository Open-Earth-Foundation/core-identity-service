import { DataTypes, Model, Optional, Sequelize } from "sequelize";

/** A registered OAuth 2.0 / OIDC client. */
export interface OAuthClientAttributes {
  clientId: string;
  redirectURI: string;
  created?: Date;
  lastUpdated?: Date;
}

export type OAuthClientCreationAttributes = Optional<
  OAuthClientAttributes,
  "created" | "lastUpdated"
>;

export class OAuthClient
  extends Model<OAuthClientAttributes, OAuthClientCreationAttributes>
  implements OAuthClientAttributes
{
  declare clientId: string;
  declare redirectURI: string;
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
          unique: true,
          field: "redirect_uri",
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
