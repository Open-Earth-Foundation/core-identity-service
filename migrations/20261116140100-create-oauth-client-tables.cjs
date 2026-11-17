"use strict";

/**
 * OAuth clients, their display text, and each user's consent per client.
 * Same shape as CityCatalyst today, so rows copy across unchanged. Multiple
 * redirect URIs and confidential clients come later (CC-1280).
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("OAuthClient", {
      client_id: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false,
      },
      redirect_uri: {
        // 2048 characters, like Google or AWS.
        type: Sequelize.STRING(2048),
        allowNull: false,
        unique: true,
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      last_updated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("OAuthClientI18N", {
      client_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
        references: { model: "OAuthClient", key: "client_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      // ISO 639-1 two-letter language code.
      language: {
        type: Sequelize.STRING(2),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      last_updated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
    await queryInterface.addConstraint("OAuthClientI18N", {
      fields: ["client_id", "language"],
      type: "primary key",
      name: "OAuthClientI18N_pkey",
    });

    // A row means the user granted the client access. Deleting the row, the
    // client or the user removes the grant.
    await queryInterface.createTable("OAuthClientAuthz", {
      client_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
        references: { model: "OAuthClient", key: "client_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "User", key: "user_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      last_used: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    await queryInterface.addConstraint("OAuthClientAuthz", {
      fields: ["client_id", "user_id"],
      type: "primary key",
      name: "pk_oauthclientauthz_client_user",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("OAuthClientAuthz");
    await queryInterface.removeConstraint(
      "OAuthClientI18N",
      "OAuthClientI18N_pkey",
    );
    await queryInterface.dropTable("OAuthClientI18N");
    await queryInterface.dropTable("OAuthClient");
  },
};
