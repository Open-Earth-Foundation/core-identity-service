import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

// NODE_ENV is typed read-only; cast for the test harness.
(process.env as { NODE_ENV?: string }).NODE_ENV = "test";
process.env.IDENTITY_ENCRYPTION_KEY =
  process.env.IDENTITY_ENCRYPTION_KEY ||
  Buffer.alloc(32, 7).toString("base64");
process.env.PUBLIC_ORIGIN =
  process.env.PUBLIC_ORIGIN || "http://localhost:3000";
process.env.CSRF_SECRET = process.env.CSRF_SECRET || "test-csrf-secret";
