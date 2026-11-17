import { DataTypes, Model, Optional, Sequelize } from "sequelize";

/** Display name and description of a client, per language. */
export interface OAuthClientI18NAttributes {
  clientId: string;
  /** ISO 639-1 two-letter code. */
  language: string;
  name: string;
  description?: string | null;
  created?: Date;
  lastUpdated?: Date;
}

export type OAuthClientI18NCreationAttributes = Optional<
  OAuthClientI18NAttributes,
  "description" | "created" | "lastUpdated"
>;

export class OAuthClientI18N
  extends Model<OAuthClientI18NAttributes, OAuthClientI18NCreationAttributes>
  implements OAuthClientI18NAttributes
{
  declare clientId: string;
  declare language: string;
  declare name: string;
  declare description: string | null;
  declare created: Date;
  declare lastUpdated: Date;

  static initModel(sequelize: Sequelize): typeof OAuthClientI18N {
    return OAuthClientI18N.init(
      {
        clientId: {
          type: DataTypes.STRING(64),
          allowNull: false,
          primaryKey: true,
          field: "client_id",
        },
        language: {
          type: DataTypes.STRING(2),
          allowNull: false,
          primaryKey: true,
        },
        name: { type: DataTypes.STRING(64), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize,
        tableName: "OAuthClientI18N",
        schema: "public",
        timestamps: true,
        createdAt: "created",
        updatedAt: "lastUpdated",
        underscored: true,
      },
    );
  }
}
