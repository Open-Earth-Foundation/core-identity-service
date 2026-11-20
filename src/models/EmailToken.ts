import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export type EmailTokenPurpose = "verify_email" | "reset_password";

/** Single-use email verification or password-reset token (hash only). */
export interface EmailTokenAttributes {
  tokenHash: string;
  userId: string;
  purpose: EmailTokenPurpose;
  expires: Date;
  usedAt?: Date | null;
  created?: Date;
}

export type EmailTokenCreationAttributes = Optional<
  EmailTokenAttributes,
  "usedAt" | "created"
>;

export class EmailToken
  extends Model<EmailTokenAttributes, EmailTokenCreationAttributes>
  implements EmailTokenAttributes
{
  declare tokenHash: string;
  declare userId: string;
  declare purpose: EmailTokenPurpose;
  declare expires: Date;
  declare usedAt: Date | null;
  declare created: Date;

  static initModel(sequelize: Sequelize): typeof EmailToken {
    return EmailToken.init(
      {
        tokenHash: {
          type: DataTypes.STRING(64),
          allowNull: false,
          primaryKey: true,
          field: "token_hash",
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "user_id",
        },
        purpose: { type: DataTypes.STRING(32), allowNull: false },
        expires: { type: DataTypes.DATE, allowNull: false },
        usedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "used_at",
        },
        created: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "EmailToken",
        schema: "public",
        timestamps: false,
      },
    );
  }
}
