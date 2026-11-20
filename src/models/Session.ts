import { DataTypes, Model, Optional, Sequelize } from "sequelize";

/** Browser OP session. Only the SHA-256 of the cookie value is stored. */
export interface SessionAttributes {
  sessionHash: string;
  userId: string;
  amr: string;
  authTime: Date;
  lastSeenAt: Date;
  expires: Date;
  revokedAt?: Date | null;
  created?: Date;
}

export type SessionCreationAttributes = Optional<
  SessionAttributes,
  "revokedAt" | "created"
>;

export class Session
  extends Model<SessionAttributes, SessionCreationAttributes>
  implements SessionAttributes
{
  declare sessionHash: string;
  declare userId: string;
  declare amr: string;
  declare authTime: Date;
  declare lastSeenAt: Date;
  declare expires: Date;
  declare revokedAt: Date | null;
  declare created: Date;

  static initModel(sequelize: Sequelize): typeof Session {
    return Session.init(
      {
        sessionHash: {
          type: DataTypes.STRING(64),
          allowNull: false,
          primaryKey: true,
          field: "session_hash",
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "user_id",
        },
        amr: { type: DataTypes.STRING(64), allowNull: false },
        authTime: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "auth_time",
        },
        lastSeenAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "last_seen_at",
        },
        expires: { type: DataTypes.DATE, allowNull: false },
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
        tableName: "Session",
        schema: "public",
        timestamps: false,
      },
    );
  }
}
