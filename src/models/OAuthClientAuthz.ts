import { DataTypes, Model, Optional, Sequelize } from "sequelize";

/** A user's consent for a client. The row's existence is the grant. */
export interface OAuthClientAuthzAttributes {
  clientId: string;
  userId: string;
  lastUsed?: Date | null;
  created?: Date;
}

export type OAuthClientAuthzCreationAttributes = Optional<
  OAuthClientAuthzAttributes,
  "lastUsed" | "created"
>;

export class OAuthClientAuthz
  extends Model<OAuthClientAuthzAttributes, OAuthClientAuthzCreationAttributes>
  implements OAuthClientAuthzAttributes
{
  declare clientId: string;
  declare userId: string;
  declare lastUsed: Date | null;
  declare created: Date;

  static initModel(sequelize: Sequelize): typeof OAuthClientAuthz {
    return OAuthClientAuthz.init(
      {
        clientId: {
          type: DataTypes.STRING(64),
          allowNull: false,
          primaryKey: true,
          field: "client_id",
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          field: "user_id",
        },
        lastUsed: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "last_used",
        },
        created: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "OAuthClientAuthz",
        schema: "public",
        timestamps: false,
      },
    );
  }
}
