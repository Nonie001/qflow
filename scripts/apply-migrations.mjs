import { readFileSync } from "node:fs";
import pg from "pg";

const connectionString = process.env.QFLOW_MIGRATION_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set QFLOW_MIGRATION_URL or DATABASE_URL before running migrations.");
  process.exit(1);
}

const client = new pg.Client({ connectionString, connectionTimeoutMillis: 10_000 });
let inTransaction = false;
try {
  await client.connect();
  await client.query("begin");
  inTransaction = true;
  for (const name of ["001_initial.sql", "002_api.sql"]) {
    const sql = readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8");
    await client.query(sql);
    console.log(`Applied ${name}`);
  }
  await client.query("commit");
  inTransaction = false;
  console.log("Supabase migrations complete");
} catch (error) {
  if (inTransaction) await client.query("rollback").catch(() => {});
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
