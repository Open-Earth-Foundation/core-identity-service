import { DataTypes, Model, Sequelize } from "sequelize";

/**
 * Login attempts for one email in the current window. `emailKey` is the
 * SHA-256 of the lowercased address so the table never stores emails.
 */
export interface LoginRateLimitAttributes {
  emailKey: string;
  windowStartedAt: Date;
  attemptCount: number;
}

export class LoginRateLimit
  extends Model<LoginRateLimitAttributes>
  implements LoginRateLimitAttributes
{
  declare emailKey: string;
  declare windowStartedAt: Date;
  declare attemptCount: number;

  static initModel(sequelize: Sequelize): typeof LoginRateLimit {
    return LoginRateLimit.init(
      {
        emailKey: {
          type: DataTypes.STRING(64),
          allowNull: false,
          primaryKey: true,
          field: "email_key",
        },
        windowStartedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "window_started_at",
        },
        attemptCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: "attempt_count",
        },
      },
      {
        sequelize,
        tableName: "LoginRateLimit",
        schema: "public",
        timestamps: false,
      },
    );
  }
}
