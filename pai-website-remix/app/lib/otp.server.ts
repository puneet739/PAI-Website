import { query, queryOne } from "./db.server";

interface OTPVerification {
  id: number;
  email: string;
  otp: string;
  expires_at: Date;
  purpose: "password_reset" | "email_verification" | "two_factor";
  created_at: Date;
}

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP in database for a specific purpose
 * Uses ON DUPLICATE KEY UPDATE to replace existing OTP for same email+purpose
 */
export async function storeOTP(
  email: string,
  otp: string,
  purpose: "password_reset" | "email_verification" | "two_factor",
  expiryMinutes: number = 10
): Promise<void> {
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await query(
    `INSERT INTO otp_verifications (email, otp, expires_at, purpose) 
     VALUES (?, ?, ?, ?) 
     ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, created_at = CURRENT_TIMESTAMP`,
    [email, otp, expiresAt, purpose, otp, expiresAt]
  );
}

/**
 * Verify OTP for a specific email and purpose
 * Returns true if OTP is valid and not expired
 * Deletes the OTP after successful verification
 */
export async function verifyOTP(
  email: string,
  otp: string,
  purpose: "password_reset" | "email_verification" | "two_factor"
): Promise<boolean> {
  const record = await queryOne<OTPVerification>(
    `SELECT * FROM otp_verifications 
     WHERE email = ? AND purpose = ? AND otp = ?`,
    [email, purpose, otp]
  );

  if (!record) {
    return false;
  }

  // Check if OTP has expired
  const now = new Date();
  const expiresAt = new Date(record.expires_at);
  
  if (now > expiresAt) {
    // Delete expired OTP
    await deleteOTP(email, purpose);
    return false;
  }

  // OTP is valid - delete it so it can't be reused
  await deleteOTP(email, purpose);
  return true;
}

/**
 * Delete OTP for a specific email and purpose
 */
export async function deleteOTP(
  email: string,
  purpose: "password_reset" | "email_verification" | "two_factor"
): Promise<void> {
  await query(
    `DELETE FROM otp_verifications WHERE email = ? AND purpose = ?`,
    [email, purpose]
  );
}

/**
 * Clean up expired OTPs from database
 * Should be called periodically (e.g., via cron job)
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  const result = await query(
    `DELETE FROM otp_verifications WHERE expires_at < NOW()`
  );
  
  return (result as any).affectedRows || 0;
}
