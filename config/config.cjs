// Database config for sequelize-cli. The same env vars are used by the app
// (see src/models/index.ts). This is the identity database, not CityCatalyst's.
require("dotenv/config");

const useSSL = process.env.DATABASE_USE_SSL === "true";

const base = {
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD || null,
  database: process.env.DATABASE_NAME,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5432,
  dialect: "postgres",
  logging: false,
  dialectOptions: useSSL
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
