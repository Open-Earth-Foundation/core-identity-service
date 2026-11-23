import { DataTypes, Model, Optional, Sequelize } from "sequelize";

/**
 * Opaque single-use authorization code. Only the SHA-256 hash of the code is
 * stored. It is bound to the client, redirect URI, PKCE challenge and user.
 */
export interface AuthorizationCodeAttributes {
  codeHash: string;
  clientId: string;
  userId: string;
  redirectURI: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  nonce?: string | null;
  expires: Date;
  /** Set when the code is exchanged. A second exchange is a replay. */
  consumedAt?: Date | null;
  /** Refresh-token family this code starts. Set when the code is issued. */
  familyId?: string | null;
  created?: Date;
}

export type AuthorizationCodeCreationAttributes = Optional<
  AuthorizationCodeAttributes,
  "codeChallengeMethod" | "nonce" | "consumedAt" | "familyId" | "created"
>;

export class AuthorizationCode
  extends Model<
    AuthorizationCodeAttributes,
    AuthorizationCodeCreationAttributes
  >
  implements AuthorizationCodeAttributes
{
  declare codeHash: string;
  declare clientId: string;
  declare userId: string;
  declare redirectURI: string;
  declare codeChallenge: string;
  declare codeChallengeMethod: string;
  declare scope: string;
  declare nonce: string | null;
  declare expires: Date;
  declare consumedAt: Date | null;
  declare familyId: string | null;
  declare created: Date;

  static initModel(sequelize: Sequelize): typeof AuthorizationCode {
    return AuthorizationCode.init(
      {
        codeHash: {
          type: DataTypes.STRING(64),
          allowNull: false,
          primaryKey: true,
          field: "code_hash",
        },
        clientId: {
          type: DataTypes.STRING(64),
          allowNull: false,
          field: "client_id",
        },
        userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
        redirectURI: {
          type: DataTypes.STRING(2048),
          allowNull: false,
          field: "redirect_uri",
        },
        codeChallenge: {
          type: DataTypes.STRING(128),
          allowNull: false,
          field: "code_challenge",
        },
        codeChallengeMethod: {
          type: DataTypes.STRING(8),
          allowNull: false,
          defaultValue: "S256",
          field: "code_challenge_method",
        },
        scope: { type: DataTypes.TEXT, allowNull: false },
        nonce: { type: DataTypes.STRING(255), allowNull: true },
        expires: { type: DataTypes.DATE, allowNull: false },
        consumedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "consumed_at",
        },
        familyId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: "family_id",
        },
        created: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "AuthorizationCode",
        schema: "public",
        timestamps: false,
      },
    );
  }
}
