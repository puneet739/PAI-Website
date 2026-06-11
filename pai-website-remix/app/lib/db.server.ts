import mysql from 'mysql2/promise';

// Parse DATABASE_URL or use individual environment variables
function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    // Parse DATABASE_URL format: mysql://user:password@host:port/database
    try {
      const url = new URL(databaseUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port || '3306'),
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      };
    } catch (error) {
      console.error('Failed to parse DATABASE_URL:', error);
      // Fall through to individual env vars
    }
  }
  
  // Fallback to individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || process.env.MYSQL_USER || 'pai_user',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || 'pai_password',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'pai_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };
}

// Database connection configuration
const dbConfig = getDatabaseConfig();

// Create connection pool
let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Execute a query
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows as T[];
  } catch (err: any) {
    // Stale pooled connection — destroy it and retry once with a fresh one
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET' || err.code === 'EPIPE') {
      connection.destroy();
      const fresh = await pool.getConnection();
      try {
        const [rows] = await fresh.execute(sql, params);
        return rows as T[];
      } finally {
        fresh.release();
      }
    }
    throw err;
  } finally {
    try { connection.release(); } catch { /* already destroyed */ }
  }
}

// Get a single row
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Close the pool (useful for cleanup)
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
