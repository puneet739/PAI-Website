/**
 * Application Configuration
 * Logs all environment variables at startup for debugging
 */

interface AppConfig {
  DATABASE_URL: string;
  MYSQL_DATABASE: string;
  MYSQL_USER: string;
  NODE_ENV: string;
  PORT: string;
  ENABLE_EMAIL: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
  FROM_EMAIL?: string;
  BASE_EMAIL?: string;
}

/**
 * Get all application configuration from environment variables
 */
export function getConfig(): AppConfig {
  return {
    DATABASE_URL: process.env.DATABASE_URL || "NOT_SET",
    MYSQL_DATABASE: process.env.MYSQL_DATABASE || "NOT_SET",
    MYSQL_USER: process.env.MYSQL_USER || "NOT_SET",
    NODE_ENV: process.env.NODE_ENV || "NOT_SET",
    PORT: process.env.PORT || "NOT_SET",
    ENABLE_EMAIL: process.env.ENABLE_EMAIL || "NOT_SET",
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    FROM_EMAIL: process.env.FROM_EMAIL,
    BASE_EMAIL: process.env.BASE_EMAIL,
  };
}

/**
 * Log configuration at application startup
 * Masks sensitive values for security
 */
export function logConfig(): void {
  const config = getConfig();
  
  console.log("\n" + "=".repeat(60));
  console.log("🚀 PAI APPLICATION CONFIGURATION");
  console.log("=".repeat(60));
  
  console.log("\n📊 Core Configuration:");
  console.log(`  NODE_ENV:       ${config.NODE_ENV}`);
  console.log(`  PORT:           ${config.PORT}`);
  
  console.log("\n🗄️  Database Configuration:");
  console.log(`  MYSQL_DATABASE: ${config.MYSQL_DATABASE}`);
  console.log(`  MYSQL_USER:     ${config.MYSQL_USER}`);
  console.log(`  DATABASE_URL:   ${maskDatabaseUrl(config.DATABASE_URL)}`);
  
  console.log("\n📧 Email Configuration:");
  console.log(`  ENABLE_EMAIL:   ${config.ENABLE_EMAIL} ${config.ENABLE_EMAIL === "true" ? "✅" : "❌"}`);
  
  if (config.ENABLE_EMAIL === "true") {
    console.log(`  SMTP_HOST:      ${config.SMTP_HOST || "NOT_SET"}`);
    console.log(`  SMTP_PORT:      ${config.SMTP_PORT || "NOT_SET"}`);
    console.log(`  SMTP_SECURE:    ${config.SMTP_SECURE || "NOT_SET"}`);
    console.log(`  SMTP_USER:      ${config.SMTP_USER || "NOT_SET"}`);
    console.log(`  FROM_EMAIL:     ${config.FROM_EMAIL || "NOT_SET"}`);
    console.log(`  BASE_EMAIL:     ${config.BASE_EMAIL || "NOT_SET"}`);
  } else {
    console.log(`  ⚠️  Email service is DISABLED`);
    console.log(`  💡 To enable: Set ENABLE_EMAIL=true in .env file`);
  }
  
  console.log("\n" + "=".repeat(60) + "\n");
}

/**
 * Mask sensitive parts of database URL
 */
function maskDatabaseUrl(url: string): string {
  if (url === "NOT_SET") return url;
  
  try {
    // Pattern: mysql://user:password@host:port/database
    const urlPattern = /^(mysql:\/\/)([^:]+):([^@]+)@(.+)$/;
    const match = url.match(urlPattern);
    
    if (match) {
      const [, protocol, user, , hostAndDb] = match;
      return `${protocol}${user}:****@${hostAndDb}`;
    }
    
    return url;
  } catch {
    return "INVALID_URL";
  }
}
