"use strict";

/**
 * Identity user: credentials and two-factor data only.
 *
 * `user_id` is the OpenID `sub` and is the same UUID as `User.user_id` in
 * CityCatalyst, so CityCatalyst foreign keys keep working with no mapping
 * table. There are no foreign keys to CityCatalyst tables, because this is a
 * separate database.
 *
 * Profile data (title, picture, language, defaults) stays in CityCatalyst.
 * `name` is kept here because the id_token and userinfo carry it.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("User", {
      user_id: {
        // Supplied by the caller: copied from CityCatalyst or generated at sign-up.
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      // Login identifier. Nullable to match CityCatalyst, where some rows have
      // no email. Anonymized accounts get a placeholder address.
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      // bcrypt hash, always 60 characters.
      password_hash: {
        type: Sequelize.CHAR(60),
        allowNull: true,
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      two_factor_secret: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // SHA-256 hashes of single-use recovery codes.
      two_factor_recovery_hashes: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false,
        defaultValue: [],
      },
      // Set on each successful sign-in. The retention job uses it as the
      // inactivity clock.
      last_active_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Set when retention replaces identifying fields. The row stays.
      anonymized_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      last_updated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("User", ["email"], {
      name: "User_email_key",
      unique: true,
    });
    await queryInterface.addIndex("User", ["last_active_at"], {
      name: "User_last_active_at_idx",
    });
    await queryInterface.addIndex("User", ["anonymized_at"], {
      name: "User_anonymized_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("User");
  },
};
