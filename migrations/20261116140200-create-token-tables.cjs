"use strict";

/**
 * Authorization codes, refresh tokens and signing-key metadata.
 *
 * Shapes follow the token design in docs/core-identity-v0-extraction-plan.md:
 * opaque single-use codes (60 seconds), opaque hashed refresh tokens that
 * rotate on every use, and RS256 signing keys. The protocol code that uses
 * these tables arrives with CC-1275, CC-1277 and CC-1280. Adjust the columns
 * there if the implementation needs it.
 *
 * Secrets are never stored in the clear: codes and refresh tokens are kept as
 * SHA-256 hashes, and the private signing key is not in the database at all.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Opaque, single-use authorization code. Bound to the client, redirect URI,
    // PKCE challenge and user that requested it.
    await queryInterface.createTable("AuthorizationCode", {
      code_hash: {
        // Hex SHA-256 of the code handed to the client.
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false,
      },
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
      redirect_uri: {
        type: Sequelize.STRING(2048),
        allowNull: false,
      },
      code_challenge: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      code_challenge_method: {
        type: Sequelize.STRING(8),
        allowNull: false,
        defaultValue: "S256",
      },
      scope: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      // Echoed into the id_token when the client sent one.
      nonce: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      expires: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      // Set when the code is exchanged. A second exchange attempt is a replay.
      consumed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    // Lets a cleanup job find expired codes.
    await queryInterface.addIndex("AuthorizationCode", ["expires"], {
      name: "AuthorizationCode_expires_idx",
    });

    // Refresh tokens belong to a family that starts at the original code
    // exchange. Each use marks the token used and issues the next one in the
    // same family. Presenting a used token again revokes the whole family.
    await queryInterface.createTable("RefreshToken", {
      token_hash: {
        // Hex SHA-256 of the opaque token handed to the client.
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false,
      },
      family_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
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
      scope: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      expires: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      // Set when this token was exchanged for the next one.
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Set on every token in the family when it is revoked.
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    await queryInterface.addIndex("RefreshToken", ["family_id"], {
      name: "RefreshToken_family_id_idx",
    });
    await queryInterface.addIndex("RefreshToken", ["user_id"], {
      name: "RefreshToken_user_id_idx",
    });

    // Public half of each signing key, published as the JWKS. The private key
    // is read from env or a secrets manager and is never stored here.
    await queryInterface.createTable("SigningKey", {
      kid: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false,
      },
      algorithm: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: "RS256",
      },
      // PEM-encoded public key.
      public_key: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      // "active" signs new tokens. "retired" is still published so tokens
      // signed before a rotation keep verifying until they expire.
      status: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: "active",
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      retired_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
    await queryInterface.sequelize.query(
      `ALTER TABLE "SigningKey" ADD CONSTRAINT "SigningKey_status_check" CHECK (status IN ('active', 'retired'))`,
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("SigningKey");
    await queryInterface.dropTable("RefreshToken");
    await queryInterface.dropTable("AuthorizationCode");
  },
};
