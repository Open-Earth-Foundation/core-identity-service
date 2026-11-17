import { DataTypes, Model, Optional, Sequelize } from "sequelize";

/**
 * Opaque refresh token, stored as a SHA-256 hash. Tokens belong to a family
 * that starts at the code exchange. Each use marks the token used and issues
 * the next one. Presenting a used token again revokes the whole family.
 */
export interface RefreshTokenAttributes {
  tokenHash: string;
  familyId: string;
  clientId: string;
  userId: string;
  scope: string;
  expires: Date;
  usedAt?: Date | null;
  revokedAt?: Date | null;
  created?: Date;
}

export type RefreshTokenCreationAttributes = Optional<
  RefreshTokenAttributes,
  "usedAt" | "revokedAt" | "created"
>;

export class RefreshToken
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes
{
  declare tokenHash: string;
  declare familyId: string;
  declare clientId: string;
  declare userId: string;
  declare scope: string;
  declare expires: Date;
  declare usedAt: Date | null;
  declare revokedAt: Date | null;
  declare created: Date;

  static initModel(sequelize: Sequelize): typeof RefreshToken {
    return RefreshToken.init(
      {
        tokenHash: {
          type: DataTypes.STRING(64),
          allowNull: false,
          primaryKey: true,
          field: "token_hash",
        },
        familyId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "family_id",
        },
        clientId: {
          type: DataTypes.STRING(64),
          allowNull: false,
          field: "client_id",
        },
        userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
        scope: { type: DataTypes.TEXT, allowNull: false },
        expires: { type: DataTypes.DATE, allowNull: false },
        usedAt: { type: DataTypes.DATE, allowNull: true, field: "used_at" },
        revokedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "revoked_at",
        },
        created: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "RefreshToken",
        schema: "public",
        timestamps: false,
      },
    );
  }
}
