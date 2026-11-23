import type { Sequelize } from "sequelize";
import { AuthorizationCode } from "./AuthorizationCode";
import { EmailToken } from "./EmailToken";
import { LoginRateLimit } from "./LoginRateLimit";
import { OAuthClient } from "./OAuthClient";
import { OAuthClientAuthz } from "./OAuthClientAuthz";
import { OAuthClientI18N } from "./OAuthClientI18N";
import { OAuthClientRedirectUri } from "./OAuthClientRedirectUri";
import { RefreshToken } from "./RefreshToken";
import { Session } from "./Session";
import { SigningKey } from "./SigningKey";
import { User } from "./User";

export {
  AuthorizationCode,
  EmailToken,
  LoginRateLimit,
  OAuthClient,
  OAuthClientAuthz,
  OAuthClientI18N,
  OAuthClientRedirectUri,
  RefreshToken,
  Session,
  SigningKey,
  User,
};

/** Registers every model on the connection and wires the associations. */
export function initModels(sequelize: Sequelize) {
  User.initModel(sequelize);
  OAuthClient.initModel(sequelize);
  OAuthClientI18N.initModel(sequelize);
  OAuthClientRedirectUri.initModel(sequelize);
  OAuthClientAuthz.initModel(sequelize);
  AuthorizationCode.initModel(sequelize);
  RefreshToken.initModel(sequelize);
  SigningKey.initModel(sequelize);
  Session.initModel(sequelize);
  EmailToken.initModel(sequelize);
  LoginRateLimit.initModel(sequelize);

  // Deleting a client or a user removes its i18n text, grants, codes and tokens.
  // The database foreign keys do the deleting, so no onDelete is repeated here.
  OAuthClient.hasMany(OAuthClientI18N, { as: "i18n", foreignKey: "clientId" });
  OAuthClientI18N.belongsTo(OAuthClient, {
    as: "client",
    foreignKey: "clientId",
  });

  OAuthClient.hasMany(OAuthClientRedirectUri, {
    as: "redirectUris",
    foreignKey: "clientId",
  });
  OAuthClientRedirectUri.belongsTo(OAuthClient, {
    as: "client",
    foreignKey: "clientId",
  });

  OAuthClientAuthz.belongsTo(OAuthClient, {
    as: "client",
    foreignKey: "clientId",
  });
  OAuthClientAuthz.belongsTo(User, { as: "user", foreignKey: "userId" });

  AuthorizationCode.belongsTo(OAuthClient, {
    as: "client",
    foreignKey: "clientId",
  });
  AuthorizationCode.belongsTo(User, { as: "user", foreignKey: "userId" });

  RefreshToken.belongsTo(OAuthClient, { as: "client", foreignKey: "clientId" });
  RefreshToken.belongsTo(User, { as: "user", foreignKey: "userId" });

  Session.belongsTo(User, { as: "user", foreignKey: "userId" });
  EmailToken.belongsTo(User, { as: "user", foreignKey: "userId" });

  return {
    AuthorizationCode,
    EmailToken,
    LoginRateLimit,
    OAuthClient,
    OAuthClientAuthz,
    OAuthClientI18N,
    OAuthClientRedirectUri,
    RefreshToken,
    Session,
    SigningKey,
    User,
  };
}
