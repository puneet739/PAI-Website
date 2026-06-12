/**
 * Run this once to apply any pending DB migrations.
 * Usage: npx tsx scripts/migrate.ts
 */
import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;

function getConfig() {
  if (DB_URL) {
    const url = new URL(DB_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || "3306"),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
    };
  }
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "pai_user",
    password: process.env.DB_PASSWORD || "pai_password",
    database: process.env.DB_NAME || "pai_db",
  };
}

async function columnExists(conn: mysql.Connection, table: string, column: string, database: string): Promise<boolean> {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [database, table, column]
  ) as any;
  return rows[0].cnt > 0;
}

async function run() {
  const config = getConfig();
  const conn = await mysql.createConnection(config);
  console.log("✅ Connected to database\n");

  const db = config.database;

  // Migration 08: renewal columns on member_requests
  const col1 = await columnExists(conn, "member_requests", "renewal_duration_years", db);
  const col2 = await columnExists(conn, "member_requests", "renewal_amount", db);

  try {
    if (!col1 && !col2) {
      await conn.execute(
        `ALTER TABLE member_requests
          ADD COLUMN renewal_duration_years TINYINT DEFAULT 1,
          ADD COLUMN renewal_amount DECIMAL(10,2) DEFAULT NULL`
      );
      console.log("✅ Applied: Add renewal_duration_years + renewal_amount to member_requests");
    } else if (!col1) {
      await conn.execute(`ALTER TABLE member_requests ADD COLUMN renewal_duration_years TINYINT DEFAULT 1`);
      console.log("✅ Applied: Add renewal_duration_years to member_requests");
    } else if (!col2) {
      await conn.execute(`ALTER TABLE member_requests ADD COLUMN renewal_amount DECIMAL(10,2) DEFAULT NULL`);
      console.log("✅ Applied: Add renewal_amount to member_requests");
    } else {
      console.log("⏭  Already applied: renewal_duration_years + renewal_amount already exist");
    }
  } catch (err: any) {
    console.error("❌ Failed (migration 08):", err.message);
  }

  // Migration 09: renewal_membership_type for membership upgrade support
  const col3 = await columnExists(conn, "member_requests", "renewal_membership_type", db);
  try {
    if (!col3) {
      await conn.execute(
        `ALTER TABLE member_requests ADD COLUMN renewal_membership_type VARCHAR(50) DEFAULT NULL`
      );
      console.log("✅ Applied: Add renewal_membership_type to member_requests");
    } else {
      console.log("⏭  Already applied: renewal_membership_type already exists");
    }
  } catch (err: any) {
    console.error("❌ Failed (migration 09):", err.message);
  }

  await conn.end();
  console.log("\nDone.");
}

run().catch((err) => {
  console.error("Cannot connect to database:", err.message);
  console.error("\nMake sure your database is running (Docker or MySQL).");
  process.exit(1);
});
