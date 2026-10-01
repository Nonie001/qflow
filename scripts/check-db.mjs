import pg from "pg";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL && !(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.error("Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or DATABASE_URL, to .env.local.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  const response = await fetch(new URL("/rest/v1/rpc/qflow_action", process.env.SUPABASE_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_action: "monitor_data", p_args: {} }),
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Supabase API check failed:", result?.code || response.status,
      result?.code === "PGRST202" ? "Run 001_initial.sql and 002_api.sql" : result?.message);
    process.exitCode = 1;
  } else {
    const counterResponse = await fetch(new URL("/rest/v1/rpc/qflow_counter_action", process.env.SUPABASE_URL), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ p_action: "check", p_args: {} }),
      signal: AbortSignal.timeout(15_000),
    });
    const counterCheck = await counterResponse.json().catch(() => null);
    if (!counterResponse.ok || counterCheck !== true) {
      console.error("Counter service setup missing: run supabase/migrations/003_counter_services.sql");
      process.exitCode = 1;
    }
    const servicesResponse = await fetch(new URL("/rest/v1/rpc/qflow_action", process.env.SUPABASE_URL), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ p_action: "services", p_args: {} }),
      signal: AbortSignal.timeout(15_000),
    });
    const services = await servicesResponse.json().catch(() => null);
    if (!servicesResponse.ok || !Array.isArray(services)) {
      console.error("Supabase services check failed:", services?.message || servicesResponse.status);
      process.exitCode = 1;
    } else if (!process.exitCode) {
      console.log("Supabase API connection OK", {
        services: services.length, counters: result.counters?.length, queues: result.queues?.length,
      });
    }
  }
} else {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 10_000 });
  try {
    const tables = ["services", "counters", "queues", "push_subscriptions", "notifications", "login_attempts"];
    for (const table of tables) {
      const result = await pool.query("select to_regclass($1) as table_name", [`public.${table}`]);
      if (!result.rows[0].table_name) throw new Error(`Missing table ${table}; run supabase/migrations/001_initial.sql`);
    }
    const column = await pool.query("select 1 from information_schema.columns where table_schema = 'public' and table_name = 'counters' and column_name = 'service_ids'");
    if (!column.rowCount) throw new Error("Missing counter service setup; run 003_counter_services.sql");
    const { rows } = await pool.query(`select
      (select count(*)::int from public.services) as services,
      (select count(*)::int from public.counters) as counters,
      (select count(*)::int from public.queues) as queues`);
    console.log("Supabase connection OK", rows[0]);
  } catch (error) {
    console.error("Supabase check failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
