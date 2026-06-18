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
    
  // Migration 10: Add life member columns and migrate membership types
    const col4 = await columnExists(conn, "members", "is_life_member", db);
    const col5 = await columnExists(conn, "members", "life_membership_number", db);

    try {
      if (!col4) {
        await conn.execute(
          `ALTER TABLE members ADD COLUMN is_life_member TINYINT(1) NOT NULL DEFAULT 0`
        );
        console.log("Applied: Add is_life_member to members");
      } else {
        console.log("Already applied: is_life_member already exists");
      }

      if (!col5) {
        await conn.execute(
          `ALTER TABLE members ADD COLUMN life_membership_number INT NULL`
        );
        console.log("Applied: Add life_membership_number to members");
      } else {
        console.log("Already applied: life_membership_number already exists");
      }

      if (!col4 || !col5) {
        await conn.execute(`UPDATE members SET is_life_member = 1 WHERE membership_type = 'life'`);
        console.log("Applied: Flagged existing life members");

        await conn.execute(`
          UPDATE members m
          JOIN (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
            FROM members WHERE is_life_member = 1
          ) AS ranked ON m.id = ranked.id
          SET m.life_membership_number = ranked.rn
          WHERE m.is_life_member = 1
        `);
        console.log("Applied: Assigned life membership numbers");

        await conn.execute(
          `ALTER TABLE members MODIFY COLUMN membership_type
           ENUM('basic','premium','instructor','life','individual','school_club') DEFAULT 'individual'`
        );
        await conn.execute(
          `UPDATE members SET membership_type = 'individual' WHERE membership_type IN ('basic','premium','life')`
        );
        await conn.execute(
          `UPDATE members SET membership_type = 'school_club' WHERE membership_type = 'instructor'`
        );
        await conn.execute(
          `ALTER TABLE members MODIFY COLUMN membership_type ENUM('individual','school_club') DEFAULT 'individual'`
        );
        console.log("Applied: Migrated membership_type ENUM to individual/school_club");

        await conn.execute(
          `UPDATE member_requests SET renewal_membership_type = 'individual'
           WHERE renewal_membership_type IN ('basic','premium','life')`
        );
        await conn.execute(
          `UPDATE member_requests SET renewal_membership_type = 'school_club'
           WHERE renewal_membership_type = 'instructor'`
        );
        console.log("Applied: Migrated renewal_membership_type in member_requests");
      }
    } catch (err: any) {
      console.error("Failed (migration 10):", err.message);
    }
  await conn.end();
  console.log("\nDone.");
}

run().catch((err) => {
  console.error("Cannot connect to database:", err.message);
  console.error("\nMake sure your database is running (Docker or MySQL).");
  process.exit(1);
});
