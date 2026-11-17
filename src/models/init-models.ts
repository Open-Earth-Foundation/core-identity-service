import type { Sequelize } from "sequelize";
import { AuthorizationCode } from "./AuthorizationCode";
import { OAuthClient } from "./OAuthClient";
import { OAuthClientAuthz } from "./OAuthClientAuthz";
import { OAuthClientI18N } from "./OAuthClientI18N";
import { RefreshToken } from "./RefreshToken";
import { SigningKey } from "./SigningKey";
import { User } from "./User";

export {
  AuthorizationCode,
  OAuthClient,
  OAuthClientAuthz,
  OAuthClientI18N,
  RefreshToken,
  SigningKey,
  User,
};

/** Registers every model on the connection and wires the associations. */
export function initModels(sequelize: Sequelize) {
  User.initModel(sequelize);
  OAuthClient.initModel(sequelize);
  OAuthClientI18N.initModel(sequelize);
  OAuthClientAuthz.initModel(sequelize);
  AuthorizationCode.initModel(sequelize);
  RefreshToken.initModel(sequelize);
  SigningKey.initModel(sequelize);

  // Deleting a client or a user removes its i18n text, grants, codes and tokens.
  // The database foreign keys do the deleting, so no onDelete is repeated here.
  OAuthClient.hasMany(OAuthClientI18N, { as: "i18n", foreignKey: "clientId" });
  OAuthClientI18N.belongsTo(OAuthClient, {
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

  return {
    AuthorizationCode,
    OAuthClient,
    OAuthClientAuthz,
    OAuthClientI18N,
    RefreshToken,
    SigningKey,
    User,
  };
}
