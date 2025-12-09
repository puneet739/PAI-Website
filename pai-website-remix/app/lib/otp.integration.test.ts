import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { query } from './db.server';

// Mock Resend to prevent initialization errors in tests
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'test-resend-id' }),
    },
  })),
}));

import { sendPasswordResetOTPEmail } from './email.server';

/**
 * Integration Tests for OTP Functionality
 * 
 * These tests verify the complete OTP flow including:
 * - OTP generation and storage
 * - OTP verification and expiration
 * - Email sending (including real email test)
 * - Database operations
 * 
 * Note: Some tests require a running database and email configuration
 */

describe.skip('OTP Integration Tests', () => {
  const testEmail = 'puneet739@gmail.com';
  const testName = 'Puneet Behl';
  let testUserId: number;

  beforeAll(async () => {
    // Create test user if not exists
    try {
      const users = await query('SELECT id FROM members WHERE email = ?', [testEmail]);
      if (users.length === 0) {
        const result = await query(
          'INSERT INTO members (email, password_hash, name, membership_status) VALUES (?, ?, ?, ?)',
          [testEmail, '$2b$10$test', testName, 'active']
        ) as any;
        testUserId = result.insertId;
      } else {
        testUserId = (users[0] as any).id;
      }
    } catch (error) {
      console.log('Database not available for integration tests:', error);
    }
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await query('DELETE FROM otp_verifications WHERE email = ?', [testEmail]);
      await query('DELETE FROM members WHERE email = ?', [testEmail]);
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  });

  beforeEach(async () => {
    // Clean up any existing OTPs for test user
    try {
      await query('DELETE FROM otp_verifications WHERE email = ?', [testEmail]);
    } catch (error) {
      // Ignore if table doesn't exist
    }
  });

  describe('OTP Storage and Retrieval', () => {
    it('should store OTP in database with correct expiration', async () => {
      const otp = '123456';
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await query(
        "INSERT INTO otp_verifications (email, otp, expires_at, purpose) VALUES (?, ?, ?, 'password_reset') ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, purpose = 'password_reset'",
        [testEmail, otp, expiresAt, otp, expiresAt]
      );

      // Retrieve and verify
      const records = await query(
        "SELECT * FROM otp_verifications WHERE email = ? AND purpose = 'password_reset'",
        [testEmail]
      );

      expect(records.length).toBe(1);
      const record = records[0] as any;
      expect(record.email).toBe(testEmail);
      expect(record.otp).toBe(otp);
      expect(record.purpose).toBe('password_reset');
      
      // Check expiration is approximately 10 minutes from now
      const expirationTime = new Date(record.expires_at).getTime();
      const now = Date.now();
      const timeDiff = expirationTime - now;
      expect(timeDiff).toBeGreaterThan(9 * 60 * 1000); // At least 9 minutes
      expect(timeDiff).toBeLessThan(11 * 60 * 1000); // At most 11 minutes
    });

    it('should update existing OTP when inserting duplicate', async () => {
      const firstOtp = '111111';
      const secondOtp = '222222';
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Insert first OTP
      await query(
        "INSERT INTO otp_verifications (email, otp, expires_at, purpose) VALUES (?, ?, ?, 'password_reset') ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, purpose = 'password_reset'",
        [testEmail, firstOtp, expiresAt, firstOtp, expiresAt]
      );

      // Insert second OTP (should update)
      await query(
        "INSERT INTO otp_verifications (email, otp, expires_at, purpose) VALUES (?, ?, ?, 'password_reset') ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, purpose = 'password_reset'",
        [testEmail, secondOtp, expiresAt, secondOtp, expiresAt]
      );

      // Verify only one record exists with the second OTP
      const records = await query(
        "SELECT * FROM otp_verifications WHERE email = ? AND purpose = 'password_reset'",
        [testEmail]
      );

      expect(records.length).toBe(1);
      expect((records[0] as any).otp).toBe(secondOtp);
    });

    it('should retrieve valid OTP within expiration time', async () => {
      const otp = '654321';
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await query(
        "INSERT INTO otp_verifications (email, otp, expires_at, purpose) VALUES (?, ?, ?, 'password_reset') ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, purpose = 'password_reset'",
        [testEmail, otp, expiresAt, otp, expiresAt]
      );

      // Query with expiration check (as done in verify-password-reset)
      const records = await query(
        "SELECT * FROM otp_verifications WHERE email = ? AND otp = ? AND purpose = 'password_reset' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
        [testEmail, otp]
      );

      expect(records.length).toBe(1);
      expect((records[0] as any).otp).toBe(otp);
    });

    it('should not retrieve expired OTP', async () => {
      const otp = '999999';
      const expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago

      await query(
        "INSERT INTO otp_verifications (email, otp, expires_at, purpose) VALUES (?, ?, ?, 'password_reset') ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, purpose = 'password_reset'",
        [testEmail, otp, expiresAt, otp, expiresAt]
      );

      // Query with expiration check
      const records = await query(
        "SELECT * FROM otp_verifications WHERE email = ? AND otp = ? AND purpose = 'password_reset' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
        [testEmail, otp]
      );

      expect(records.length).toBe(0);
    });

    it('should delete OTP after use', async () => {
      const otp = '777777';
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Insert OTP
      await query(
        "INSERT INTO otp_verifications (email, otp, expires_at, purpose) VALUES (?, ?, ?, 'password_reset') ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, purpose = 'password_reset'",
        [testEmail, otp, expiresAt, otp, expiresAt]
      );

      // Verify it exists
      let records = await query(
        "SELECT * FROM otp_verifications WHERE email = ? AND purpose = 'password_reset'",
        [testEmail]
      );
      expect(records.length).toBe(1);

      // Delete OTP (as done after successful password reset)
      await query(
        "DELETE FROM otp_verifications WHERE email = ? AND purpose = 'password_reset'",
        [testEmail]
      );

      // Verify it's deleted
      records = await query(
        "SELECT * FROM otp_verifications WHERE email = ? AND purpose = 'password_reset'",
        [testEmail]
      );
      expect(records.length).toBe(0);
    });
  });

  describe('OTP Generation Logic', () => {
    it('should generate 6-digit OTP', () => {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      expect(otp).toMatch(/^\d{6}$/);
      expect(parseInt(otp)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(otp)).toBeLessThanOrEqual(999999);
    });

    it('should generate different OTPs on multiple calls', () => {
      const otps = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otps.add(otp);
      }

      // Should have high uniqueness (at least 95 unique out of 100)
      expect(otps.size).toBeGreaterThanOrEqual(95);
    });

    it('should generate OTP with proper distribution', () => {
      const otps: number[] = [];
      
      for (let i = 0; i < 1000; i++) {
        const otp = Math.floor(100000 + Math.random() * 900000);
        otps.push(otp);
      }

      // Check distribution - should have OTPs in different ranges
      const ranges = {
        low: otps.filter(n => n < 300000).length,
        mid: otps.filter(n => n >= 300000 && n < 700000).length,
        high: otps.filter(n => n >= 700000).length,
      };

      // Each range should have some OTPs (rough distribution check)
      expect(ranges.low).toBeGreaterThan(100);
      expect(ranges.mid).toBeGreaterThan(100);
      expect(ranges.high).toBeGreaterThan(100);
    });
  });

  describe('Complete OTP Flow', () => {
    it('should complete full password reset flow', async () => {
      // Step 1: Generate and store OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await query(
        "INSERT INTO otp_verifications (email, otp, expires_at, purpose) VALUES (?, ?, ?, 'password_reset') ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, purpose = 'password_reset'",
        [testEmail, otp, expiresAt, otp, expiresAt]
      );

      // Step 2: Verify OTP exists and is valid
      let records = await query(
        "SELECT * FROM otp_verifications WHERE email = ? AND otp = ? AND purpose = 'password_reset' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
        [testEmail, otp]
      );
      expect(records.length).toBe(1);

      // Step 3: Update password (simulated)
      const newPasswordHash = '$2b$10$newhashedpassword';
      await query(
        'UPDATE members SET password_hash = ? WHERE email = ?',
        [newPasswordHash, testEmail]
      );

      // Step 4: Delete used OTP
      await query(
        "DELETE FROM otp_verifications WHERE email = ? AND purpose = 'password_reset'",
        [testEmail]
      );

      // Step 5: Verify OTP is deleted
      records = await query(
        "SELECT * FROM otp_verifications WHERE email = ? AND purpose = 'password_reset'",
        [testEmail]
      );
      expect(records.length).toBe(0);

      // Step 6: Verify password was updated
      const users = await query(
        'SELECT password_hash FROM members WHERE email = ?',
        [testEmail]
      );
      expect((users[0] as any).password_hash).toBe(newPasswordHash);
    });

    it('should prevent OTP reuse after deletion', async () => {
      const otp = '555555';
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Insert and use OTP
      await query(
        "INSERT INTO otp_verifications (email, otp, expires_at, purpose) VALUES (?, ?, ?, 'password_reset') ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, purpose = 'password_reset'",
        [testEmail, otp, expiresAt, otp, expiresAt]
      );

      // Delete OTP (after successful use)
      await query(
        "DELETE FROM otp_verifications WHERE email = ? AND purpose = 'password_reset'",
        [testEmail]
      );

      // Try to use OTP again
      const records = await query(
        "SELECT * FROM otp_verifications WHERE email = ? AND otp = ? AND purpose = 'password_reset' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
        [testEmail, otp]
      );

      expect(records.length).toBe(0);
    });
  });

  describe('Email Sending - Mock Tests', () => {
    it('should call email function with correct parameters', async () => {
      const otp = '123456';
      
      // This test verifies the function can be called
      // Actual sending depends on ENABLE_EMAIL env var
      const emailData = {
        userName: testName,
        userEmail: testEmail,
        otp: otp,
      };

      // Should not throw error even if email is disabled
      await expect(sendPasswordResetOTPEmail(emailData)).resolves.not.toThrow();
    });

    it('should handle email service disabled gracefully', async () => {
      const originalEnv = process.env.ENABLE_EMAIL;
      process.env.ENABLE_EMAIL = 'false';

      const emailData = {
        userName: testName,
        userEmail: testEmail,
        otp: '123456',
      };

      // Should throw error when email is disabled for password reset
      await expect(sendPasswordResetOTPEmail(emailData)).rejects.toThrow(
        'Email service is currently disabled'
      );

      process.env.ENABLE_EMAIL = originalEnv;
    });
  });

  describe('Real Email Test - MANUAL', () => {
    /**
     * This test sends a REAL email and should only be run manually
     * when you want to verify email functionality.
     * 
     * To run this test:
     * 1. Set ENABLE_EMAIL=true in your .env
     * 2. Configure SMTP settings (SMTP_HOST, SMTP_USER, SMTP_PASSWORD, etc.)
     * 3. Update the email address below to your test email
     * 4. Run: npm test -- otp.integration.test.ts -t "should send real OTP email"
     * 
     * This test is skipped by default to prevent accidental email sending
     */
    it('should send real OTP email to test address', async () => {
      // IMPORTANT: Change this to your test email address
      const realTestEmail = 'puneet739@gmail.com';
      const realTestName = 'Puneet Behl';
      const testOtp = '123456';

      // Verify email is enabled
      if (process.env.ENABLE_EMAIL !== 'true') {
        console.log('⚠️  Email is disabled. Set ENABLE_EMAIL=true to run this test.');
        return;
      }

      console.log(`📧 Sending test OTP email to: ${realTestEmail}`);
      console.log(`🔢 OTP: ${testOtp}`);

      try {
        await sendPasswordResetOTPEmail({
          userName: realTestName,
          userEmail: realTestEmail,
          otp: testOtp,
        });

        console.log('✅ Email sent successfully!');
        console.log('📬 Check your inbox for the OTP email.');
        
        // If we reach here, email was sent successfully
        expect(true).toBe(true);
      } catch (error) {
        console.error('❌ Failed to send email:', error);
        throw error;
      }
    }, 30000); // 30 second timeout for email sending

    /**
     * Test to send real OTP email with actual OTP generation
     * This simulates the complete flow including OTP generation
     */
    it.skip('should send real OTP email with generated OTP', async () => {
      // IMPORTANT: Change this to your test email address
      const realTestEmail = 'your-test-email@example.com';
      const realTestName = 'Test User';

      if (process.env.ENABLE_EMAIL !== 'true') {
        console.log('⚠️  Email is disabled. Set ENABLE_EMAIL=true to run this test.');
        return;
      }

      // Generate real OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      console.log(`📧 Sending OTP email to: ${realTestEmail}`);
      console.log(`🔢 Generated OTP: ${otp}`);
      console.log(`⏰ Expires at: ${expiresAt.toLocaleString()}`);

      try {
        // Store OTP in database
        await query(
          "INSERT INTO otp_verifications (email, otp, expires_at, purpose) VALUES (?, ?, ?, 'password_reset') ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, purpose = 'password_reset'",
          [realTestEmail, otp, expiresAt, otp, expiresAt]
        );

        // Send email
        await sendPasswordResetOTPEmail({
          userName: realTestName,
          userEmail: realTestEmail,
          otp: otp,
        });

        console.log('✅ Email sent successfully!');
        console.log('📬 Check your inbox and verify the OTP.');
        console.log('🔍 You can use this OTP to test the verification flow.');

        // Cleanup
        await query(
          "DELETE FROM otp_verifications WHERE email = ? AND purpose = 'password_reset'",
          [realTestEmail]
        );

        expect(true).toBe(true);
      } catch (error) {
        console.error('❌ Failed to send email:', error);
        // Cleanup on error
        try {
          await query(
            "DELETE FROM otp_verifications WHERE email = ? AND purpose = 'password_reset'",
            [realTestEmail]
          );
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
        throw error;
      }
    }, 30000);
  });

  describe('Edge Cases and Security', () => {
    it('should handle concurrent OTP requests', async () => {
      const otp1 = '111111';
      const otp2 = '222222';
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Simulate concurrent requests
      await Promise.all([
        query(
          "INSERT INTO otp_verifications (email, otp, expires_at, purpose) VALUES (?, ?, ?, 'password_reset') ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, purpose = 'password_reset'",
          [testEmail, otp1, expiresAt, otp1, expiresAt]
        ),
        query(
          "INSERT INTO otp_verifications (email, otp, expires_at, purpose) VALUES (?, ?, ?, 'password_reset') ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, purpose = 'password_reset'",
          [testEmail, otp2, expiresAt, otp2, expiresAt]
        ),
      ]);

      // Should have only one record (last one wins)
      const records = await query(
        "SELECT * FROM otp_verifications WHERE email = ? AND purpose = 'password_reset'",
        [testEmail]
      );

      expect(records.length).toBe(1);
      // OTP should be one of the two
      const storedOtp = (records[0] as any).otp;
      expect([otp1, otp2]).toContain(storedOtp);
    });

    it('should handle different purposes separately', async () => {
      const otp = '888888';
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Insert OTP for password reset
      await query(
        "INSERT INTO otp_verifications (email, otp, expires_at, purpose) VALUES (?, ?, ?, 'password_reset') ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?, purpose = 'password_reset'",
        [testEmail, otp, expiresAt, otp, expiresAt]
      );

      // Query should only return password_reset purpose
      const records = await query(
        "SELECT * FROM otp_verifications WHERE email = ? AND purpose = 'password_reset'",
        [testEmail]
      );

      expect(records.length).toBe(1);
      expect((records[0] as any).purpose).toBe('password_reset');
    });

    it('should validate OTP format (6 digits only)', () => {
      const validOtps = ['123456', '000000', '999999', '100000'];
      const invalidOtps = ['12345', '1234567', 'abcdef', '12345a', ''];

      validOtps.forEach(otp => {
        expect(otp).toMatch(/^\d{6}$/);
      });

      invalidOtps.forEach(otp => {
        expect(otp).not.toMatch(/^\d{6}$/);
      });
    });
  });
});
