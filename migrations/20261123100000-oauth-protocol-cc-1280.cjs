"use strict";

/**
 * CC-1280: OAuth protocol core.
 *
 * - OAuthClient gets a secret hash (confidential clients) and a first_party flag
 *   (skips the consent screen).
 * - Clients can register several redirect URIs, kept in OAuthClientRedirectUri.
 *   The old OAuthClient.redirect_uri column stays for now as a copy of the first
 *   URI, but it is no longer unique.
 * - AuthorizationCode gets a family_id. It is the refresh-token family the code
 *   starts, so a replayed code can revoke the tokens it already produced.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("OAuthClient", "client_secret_hash", {
      // Hex SHA-256 of the secret. Null means a public client (PKCE only).
      type: Sequelize.CHAR(64),
      allowNull: true,
    });
    await queryInterface.addColumn("OAuthClient", "first_party", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // The column was created with `unique: true`, which Postgres names
    // <table>_<column>_key. IF EXISTS keeps this safe on databases where the
    // constraint was already dropped.
    await queryInterface.sequelize.query(
      `ALTER TABLE "OAuthClient" DROP CONSTRAINT IF EXISTS "OAuthClient_redirect_uri_key"`,
    );

    await queryInterface.createTable("OAuthClientRedirectUri", {
      client_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
        references: { model: "OAuthClient", key: "client_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      redirect_uri: {
        type: Sequelize.STRING(2048),
        allowNull: false,
      },
    });
    await queryInterface.addConstraint("OAuthClientRedirectUri", {
      fields: ["client_id", "redirect_uri"],
      type: "primary key",
      name: "OAuthClientRedirectUri_pkey",
    });

    // Every existing client keeps working: its single URI becomes a row.
    await queryInterface.sequelize.query(
      `INSERT INTO "OAuthClientRedirectUri" (client_id, redirect_uri)
       SELECT client_id, redirect_uri FROM "OAuthClient"
       ON CONFLICT DO NOTHING`,
    );

    await queryInterface.addColumn("AuthorizationCode", "family_id", {
      // Filled when the code is issued. Null only for rows from before CC-1280.
      type: Sequelize.UUID,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("AuthorizationCode", "family_id");
    await queryInterface.removeConstraint(
      "OAuthClientRedirectUri",
      "OAuthClientRedirectUri_pkey",
    );
    await queryInterface.dropTable("OAuthClientRedirectUri");
    await queryInterface.addConstraint("OAuthClient", {
      fields: ["redirect_uri"],
      type: "unique",
      name: "OAuthClient_redirect_uri_key",
    });
    await queryInterface.removeColumn("OAuthClient", "first_party");
    await queryInterface.removeColumn("OAuthClient", "client_secret_hash");
  },
};
