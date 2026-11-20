"use strict";

/**
 * CC-1279: OP sessions, email tokens, login rate limits, and email_verified_at.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("User", "email_verified_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("User", "two_factor_secret_key_version", {
      // Which IDENTITY_ENCRYPTION_KEY version sealed two_factor_secret.
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.createTable("Session", {
      session_hash: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "User", key: "user_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      // Space-separated authentication methods, e.g. "pwd" or "pwd otp".
      amr: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      auth_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      last_seen_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      expires: {
        type: Sequelize.DATE,
        allowNull: false,
      },
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
    await queryInterface.addIndex("Session", ["user_id"], {
      name: "Session_user_id_idx",
    });
    await queryInterface.addIndex("Session", ["expires"], {
      name: "Session_expires_idx",
    });

    await queryInterface.createTable("EmailToken", {
      token_hash: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "User", key: "user_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      purpose: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      expires: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    await queryInterface.addIndex("EmailToken", ["user_id", "purpose"], {
      name: "EmailToken_user_purpose_idx",
    });

    // One row per email. Attempts reset when the window starts.
    await queryInterface.createTable("LoginRateLimit", {
      email_key: {
        // SHA-256 of the lowercased email so the table never stores addresses.
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false,
      },
      window_started_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      attempt_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("LoginRateLimit");
    await queryInterface.dropTable("EmailToken");
    await queryInterface.dropTable("Session");
    await queryInterface.removeColumn("User", "two_factor_secret_key_version");
    await queryInterface.removeColumn("User", "email_verified_at");
  },
};
