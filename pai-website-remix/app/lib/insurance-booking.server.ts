import { query, queryOne } from "~/lib/db.server";
import { buildCarePortalUrl } from "~/lib/care-portal";

const FAILURE_THRESHOLD = 5;
const AUTO_DISABLE_HOURS = 24;
const RECOVERY_CHECK_THROTTLE_MS = 15 * 60 * 1000;
const CHECK_TIMEOUT_MS = 8000;
const DUMMY_MOBILE = "9999999999";
const DUMMY_EMAIL = "healthcheck@pgaoi.org";

export interface InsuranceBookingConfig {
  id: number;
  direct_booking_enabled: number;
  consecutive_failures: number;
  auto_disabled_until: string | null;
  last_recovery_check_at: string | null;
  updated_by: number | null;
  updated_at: string;
}

export interface InsuranceBookingEvent {
  id: number;
  event_type: "auto_disabled" | "auto_recovered" | "admin_enabled" | "admin_disabled";
  actor_id: number | null;
  note: string | null;
  created_at: string;
}

export async function getInsuranceBookingConfig(): Promise<InsuranceBookingConfig> {
  const config = await queryOne<InsuranceBookingConfig>(
    "SELECT * FROM insurance_booking_config WHERE id = 1"
  );
  return config!;
}

export function isCurrentlyAutoDisabled(config: InsuranceBookingConfig): boolean {
  return !!config.auto_disabled_until && new Date(config.auto_disabled_until).getTime() > Date.now();
}

export function isDirectBookingEnabled(config: InsuranceBookingConfig): boolean {
  return !!config.direct_booking_enabled && !isCurrentlyAutoDisabled(config);
}

async function pingCarePortal(): Promise<boolean> {
  const testUrl = buildCarePortalUrl(DUMMY_MOBILE, DUMMY_EMAIL);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const response = await fetch(testUrl, { method: "GET", signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function recordCareCheckResult(success: boolean): Promise<void> {
  const config = await getInsuranceBookingConfig();

  if (success) {
    if (config.consecutive_failures > 0 || config.auto_disabled_until) {
      const wasAutoDisabled = isCurrentlyAutoDisabled(config);
      await query(
        "UPDATE insurance_booking_config SET consecutive_failures = 0, auto_disabled_until = NULL WHERE id = 1"
      );
      if (wasAutoDisabled) {
        await query(
          "INSERT INTO insurance_booking_events (event_type, note) VALUES ('auto_recovered', 'CARE portal check succeeded')"
        );
      }
    }
    return;
  }

  const newFailureCount = config.consecutive_failures + 1;
  if (newFailureCount >= FAILURE_THRESHOLD && !isCurrentlyAutoDisabled(config)) {
    await query(
      `UPDATE insurance_booking_config
       SET consecutive_failures = ?, auto_disabled_until = DATE_ADD(NOW(), INTERVAL ${AUTO_DISABLE_HOURS} HOUR)
       WHERE id = 1`,
      [newFailureCount]
    );
    await query(
      "INSERT INTO insurance_booking_events (event_type, note) VALUES ('auto_disabled', ?)",
      [`${newFailureCount} consecutive check failures`]
    );
  } else {
    await query(
      "UPDATE insurance_booking_config SET consecutive_failures = ? WHERE id = 1",
      [newFailureCount]
    );
  }
}

export async function checkCarePortalAndRecord(): Promise<void> {
  const success = await pingCarePortal();
  await recordCareCheckResult(success);
}

export async function runRecoveryCheckIfDue(
  config: InsuranceBookingConfig
): Promise<InsuranceBookingConfig> {
  if (!isCurrentlyAutoDisabled(config)) return config;

  const lastCheck = config.last_recovery_check_at
    ? new Date(config.last_recovery_check_at).getTime()
    : 0;
  if (Date.now() - lastCheck < RECOVERY_CHECK_THROTTLE_MS) return config;

  await query("UPDATE insurance_booking_config SET last_recovery_check_at = NOW() WHERE id = 1");
  await checkCarePortalAndRecord();
  return getInsuranceBookingConfig();
}

export async function setDirectBookingEnabled(enabled: boolean, adminId: number): Promise<void> {
  await query(
    `UPDATE insurance_booking_config
     SET direct_booking_enabled = ?, auto_disabled_until = NULL, consecutive_failures = 0, updated_by = ?
     WHERE id = 1`,
    [enabled, adminId]
  );
  await query(
    "INSERT INTO insurance_booking_events (event_type, actor_id) VALUES (?, ?)",
    [enabled ? "admin_enabled" : "admin_disabled", adminId]
  );
}

export async function getRecentInsuranceBookingEvents(limit = 20): Promise<InsuranceBookingEvent[]> {
  return query<InsuranceBookingEvent>(
    `SELECT ibe.*, m.name as actor_name
     FROM insurance_booking_events ibe
     LEFT JOIN members m ON ibe.actor_id = m.id
     ORDER BY ibe.created_at DESC
     LIMIT ${limit}`
  );
}
