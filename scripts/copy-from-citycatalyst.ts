/**
 * Copies users (with credentials and 2FA data) and OAuth clients and grants
 * from the CityCatalyst database into the identity database.
 *
 *   npm run db:copy-from-citycatalyst            # dry run, writes nothing
 *   npm run db:copy-from-citycatalyst -- --apply # writes
 *
 * Safety:
 * - CityCatalyst is read in a READ ONLY transaction, so this script cannot
 *   change it.
 * - Dry run is the default. It runs the same inserts and then rolls back, so
 *   the counts are what an apply would do.
 * - UUIDs are kept, so `User.user_id` stays the OpenID `sub`.
 * - Existing rows in the identity database are never overwritten. A password
 *   changed here after the first copy is kept on later runs.
 * - `--apply` commits only if every source row ends up in the identity
 *   database. Otherwise everything is rolled back and the script exits 1.
 *   The usual cause is an email that already belongs to a different user.
 * - Output has counts and user ids only. No emails, hashes or secrets.
 *
 * Back up the identity database before running with --apply on a shared one.
 */
import "dotenv/config";
import { Client } from "pg";

const APPLY = process.argv.includes("--apply");
const CHUNK_SIZE = 500;

type Row = Record<string, unknown>;

interface TableSpec {
  table: string;
  /** Columns written to the identity database, in order. */
  columns: string[];
  /** Columns that identify a row. */
  key: string[];
  /** SELECT list for CityCatalyst. Normalizes nulls the identity schema forbids. */
  select: string;
}

// Parents first, so foreign keys in the identity database are satisfied.
const TABLES: TableSpec[] = [
  {
    table: "User",
    columns: [
      "user_id",
      "email",
      "name",
      "password_hash",
      "two_factor_enabled",
      "two_factor_secret",
      "two_factor_recovery_hashes",
      "last_active_at",
      "anonymized_at",
      "created",
      "last_updated",
    ],
    key: ["user_id"],
    select: `user_id, email, name, password_hash,
      COALESCE(two_factor_enabled, false) AS two_factor_enabled,
      two_factor_secret,
      COALESCE(two_factor_recovery_hashes, ARRAY[]::text[]) AS two_factor_recovery_hashes,
      last_active_at, anonymized_at, created, last_updated`,
  },
  {
    table: "OAuthClient",
    columns: ["client_id", "redirect_uri", "created", "last_updated"],
    key: ["client_id"],
    select: "client_id, redirect_uri, created, last_updated",
  },
  {
    table: "OAuthClientI18N",
    columns: [
      "client_id",
      "language",
      "name",
      "description",
      "created",
      "last_updated",
    ],
    key: ["client_id", "language"],
    select: "client_id, language, name, description, created, last_updated",
  },
  {
    table: "OAuthClientAuthz",
    columns: ["client_id", "user_id", "last_used", "created"],
    key: ["client_id", "user_id"],
    select: "client_id, user_id, last_used, created",
  },
];

/** Builds a client from `<PREFIX>_HOST`, `_PORT`, `_NAME`, `_USER`, `_PASSWORD`, `_USE_SSL`. */
function connect(prefix: "DATABASE" | "CITYCATALYST_DATABASE"): Client {
  const host = process.env[`${prefix}_HOST`];
  const database = process.env[`${prefix}_NAME`];
  const user = process.env[`${prefix}_USER`];
  if (!host || !database || !user) {
    throw new Error(
      `Set ${prefix}_HOST, ${prefix}_NAME and ${prefix}_USER (see env.example).`,
    );
  }
  return new Client({
    host,
    port: Number(process.env[`${prefix}_PORT`] || 5432),
    database,
    user,
    password: process.env[`${prefix}_PASSWORD`] || undefined,
    ssl:
      process.env[`${prefix}_USE_SSL`] === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });
}

/** Inserts rows in chunks and returns how many were new. Conflicts are skipped. */
async function insertRows(
  target: Client,
  spec: TableSpec,
  rows: Row[],
): Promise<number> {
  const columnList = spec.columns.map((c) => `"${c}"`).join(", ");
  let inserted = 0;

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const params: unknown[] = [];
    const tuples = chunk.map((row) => {
      const placeholders = spec.columns.map((column) => {
        params.push(row[column]);
        return `$${params.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });
    const result = await target.query(
      `INSERT INTO "${spec.table}" (${columnList}) VALUES ${tuples.join(", ")} ON CONFLICT DO NOTHING`,
      params,
    );
    inserted += result.rowCount ?? 0;
  }
  return inserted;
}

/** Returns the keys of source rows that are not in the identity database. */
async function findMissing(
  target: Client,
  spec: TableSpec,
  rows: Row[],
): Promise<string[]> {
  const keyColumns = spec.key.map((c) => `"${c}"`).join(", ");
  const { rows: present } = await target.query(
    `SELECT ${keyColumns} FROM "${spec.table}"`,
  );
  const toKey = (row: Row) => spec.key.map((c) => String(row[c])).join("|");
  const have = new Set(present.map(toKey));
  return rows.map(toKey).filter((key) => !have.has(key));
}

async function main() {
  const source = connect("CITYCATALYST_DATABASE");
  const target = connect("DATABASE");

  // Refuse to run if both ends are the same database.
  const sameDatabase = ["HOST", "PORT", "NAME"].every(
    (part) =>
      (process.env[`DATABASE_${part}`] ?? "") ===
      (process.env[`CITYCATALYST_DATABASE_${part}`] ?? ""),
  );
  if (sameDatabase) {
    throw new Error(
      "CITYCATALYST_DATABASE_* and DATABASE_* point at the same database.",
    );
  }

  console.log(
    APPLY ? "Mode: APPLY (will commit)" : "Mode: DRY RUN (nothing is written)",
  );

  await source.connect();
  await target.connect();
  // READ ONLY: the database itself rejects any write from this connection.
  await source.query("BEGIN READ ONLY");
  await target.query("BEGIN");

  let allCopied = true;
  try {
    for (const spec of TABLES) {
      const { rows } = await source.query(
        `SELECT ${spec.select} FROM "${spec.table}"`,
      );
      const inserted = await insertRows(target, spec, rows);
      const missing = await findMissing(target, spec, rows);
      const alreadyPresent = rows.length - inserted - missing.length;

      console.log(
        `${spec.table}: source ${rows.length}, ${APPLY ? "inserted" : "would insert"} ${inserted}, already present ${alreadyPresent}, not copied ${missing.length}`,
      );
      if (missing.length > 0) {
        allCopied = false;
        // Keys are ids, not emails, so this is safe to print.
        console.log(
          `  not copied (${spec.key.join(", ")}): ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? ", ..." : ""}`,
        );
      }
    }

    if (APPLY && allCopied) {
      await target.query("COMMIT");
      console.log("Committed.");
    } else {
      await target.query("ROLLBACK");
      console.log(
        allCopied
          ? "Rolled back (dry run). Run with --apply to write."
          : "Rolled back. Some rows could not be copied. Fix the cause above and run again.",
      );
    }
  } catch (err) {
    await target.query("ROLLBACK");
    throw err;
  } finally {
    await source.query("ROLLBACK");
    await source.end();
    await target.end();
  }

  if (!allCopied) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Copy failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
