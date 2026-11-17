import { DataTypes, Model, Optional, Sequelize } from "sequelize";

/**
 * Public half of a signing key, published as the JWKS. The private key is not
 * stored here. It comes from env or a secrets manager.
 */
export interface SigningKeyAttributes {
  kid: string;
  algorithm: string;
  /** PEM-encoded public key. */
  publicKey: string;
  /** "active" signs new tokens. "retired" is published until old tokens expire. */
  status: "active" | "retired";
  created?: Date;
  retiredAt?: Date | null;
}

export type SigningKeyCreationAttributes = Optional<
  SigningKeyAttributes,
  "algorithm" | "status" | "created" | "retiredAt"
>;

export class SigningKey
  extends Model<SigningKeyAttributes, SigningKeyCreationAttributes>
  implements SigningKeyAttributes
{
  declare kid: string;
  declare algorithm: string;
  declare publicKey: string;
  declare status: "active" | "retired";
  declare created: Date;
  declare retiredAt: Date | null;

  static initModel(sequelize: Sequelize): typeof SigningKey {
    return SigningKey.init(
      {
        kid: {
          type: DataTypes.STRING(64),
          allowNull: false,
          primaryKey: true,
        },
        algorithm: {
          type: DataTypes.STRING(16),
          allowNull: false,
          defaultValue: "RS256",
        },
        publicKey: {
          type: DataTypes.TEXT,
          allowNull: false,
          field: "public_key",
        },
        status: {
          type: DataTypes.STRING(16),
          allowNull: false,
          defaultValue: "active",
        },
        created: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        retiredAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "retired_at",
        },
      },
      {
        sequelize,
        tableName: "SigningKey",
        schema: "public",
        timestamps: false,
      },
    );
  }
}
