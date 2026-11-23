import { DataTypes, Model, Sequelize } from "sequelize";

/**
 * One registered redirect URI of a client. A client may have several. The
 * authorization request must match one of them exactly.
 */
export interface OAuthClientRedirectUriAttributes {
  clientId: string;
  redirectURI: string;
}

export class OAuthClientRedirectUri
  extends Model<OAuthClientRedirectUriAttributes>
  implements OAuthClientRedirectUriAttributes
{
  declare clientId: string;
  declare redirectURI: string;

  static initModel(sequelize: Sequelize): typeof OAuthClientRedirectUri {
    return OAuthClientRedirectUri.init(
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
          primaryKey: true,
          field: "redirect_uri",
        },
      },
      {
        sequelize,
        tableName: "OAuthClientRedirectUri",
        schema: "public",
        timestamps: false,
      },
    );
  }
}
