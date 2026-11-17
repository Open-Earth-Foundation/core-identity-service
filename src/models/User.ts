import { DataTypes, Model, Optional, Sequelize } from "sequelize";

/**
 * Identity user: credentials and two-factor data. `userId` is the OpenID `sub`
 * and equals `User.userId` in CityCatalyst. Profile data stays in CityCatalyst.
 */
export interface UserAttributes {
  userId: string;
  email?: string | null;
  name?: string | null;
  passwordHash?: string | null;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
  twoFactorRecoveryHashes: string[];
  lastActiveAt?: Date | null;
  anonymizedAt?: Date | null;
  created?: Date;
  lastUpdated?: Date;
}

export type UserCreationAttributes = Optional<
  UserAttributes,
  | "email"
  | "name"
  | "passwordHash"
  | "twoFactorEnabled"
  | "twoFactorSecret"
  | "twoFactorRecoveryHashes"
  | "lastActiveAt"
  | "anonymizedAt"
  | "created"
  | "lastUpdated"
>;

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare userId: string;
  declare email: string | null;
  declare name: string | null;
  declare passwordHash: string | null;
  declare twoFactorEnabled: boolean;
  declare twoFactorSecret: string | null;
  declare twoFactorRecoveryHashes: string[];
  declare lastActiveAt: Date | null;
  declare anonymizedAt: Date | null;
  declare created: Date;
  declare lastUpdated: Date;

  static initModel(sequelize: Sequelize): typeof User {
    return User.init(
      {
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          field: "user_id",
        },
        email: { type: DataTypes.STRING(255), allowNull: true },
        name: { type: DataTypes.STRING(255), allowNull: true },
        passwordHash: {
          type: DataTypes.CHAR(60),
          allowNull: true,
          field: "password_hash",
        },
        twoFactorEnabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: "two_factor_enabled",
        },
        twoFactorSecret: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "two_factor_secret",
        },
        twoFactorRecoveryHashes: {
          type: DataTypes.ARRAY(DataTypes.TEXT),
          allowNull: false,
          defaultValue: [],
          field: "two_factor_recovery_hashes",
        },
        lastActiveAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "last_active_at",
        },
        anonymizedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "anonymized_at",
        },
      },
      {
        sequelize,
        tableName: "User",
        schema: "public",
        timestamps: true,
        createdAt: "created",
        updatedAt: "lastUpdated",
        underscored: true,
      },
    );
  }
}
