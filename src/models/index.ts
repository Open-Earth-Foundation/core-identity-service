import { Sequelize } from "sequelize";
import pg from "pg";
import { initModels } from "./init-models";

type Models = ReturnType<typeof initModels>;

/**
 * Connection to the identity database. Call `db.initialize()` once before
 * using `db.models`. The `DATABASE_*` variables are documented in env.example.
 */
export const db: {
  initialized: boolean;
  sequelize: Sequelize | null;
  models: Models | null;
  initialize: () => Promise<void>;
  close: () => Promise<void>;
} = {
  initialized: false,
  sequelize: null,
  models: null,
  initialize,
  close,
};

async function initialize() {
  if (db.initialized) return;

  const useSSL = process.env.DATABASE_USE_SSL === "true";
  const sequelize = new Sequelize({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5432,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    dialect: "postgres",
    dialectModule: pg,
    logging: false,
    dialectOptions: useSSL
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  });

  db.models = initModels(sequelize);
  db.sequelize = sequelize;
  db.initialized = true;
}

async function close() {
  if (!db.sequelize) return;
  await db.sequelize.close();
  db.sequelize = null;
  db.models = null;
  db.initialized = false;
}
