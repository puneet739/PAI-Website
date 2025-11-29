import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    })),
  },
}));

describe('Email Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set email enabled for tests
    process.env.ENABLE_EMAIL = 'true';
  });

  describe('sendMembershipRequestEmail', () => {
    it('should send email when enabled', async () => {
      const { sendMembershipRequestEmail } = await import('./email.server');
      
      const data = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        phone: '+919876543210',
        details: 'Test details',
        currentRating: 'P1',
        requestId: 1,
      };

      await expect(sendMembershipRequestEmail(data)).resolves.not.toThrow();
    });

    it('should skip email when disabled', async () => {
      process.env.ENABLE_EMAIL = 'false';
      
      // Re-import to get fresh module with new env
      vi.resetModules();
      const { sendMembershipRequestEmail } = await import('./email.server');
      
      const data = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        phone: '+919876543210',
        details: 'Test details',
        currentRating: 'P1',
        requestId: 1,
      };

      await expect(sendMembershipRequestEmail(data)).resolves.not.toThrow();
    });
  });

  describe('sendInsuranceRequestEmail', () => {
    it('should send insurance request email', async () => {
      const { sendInsuranceRequestEmail } = await import('./email.server');
      
      const data = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        phone: '+919876543210',
        insurancePlan: 'premium',
        coverage: 5000000,
        premium: 5000,
        comments: 'Test comments',
        requestId: 1,
      };

      await expect(sendInsuranceRequestEmail(data)).resolves.not.toThrow();
    });
  });

  describe('sendRatingUpgradeRequestEmail', () => {
    it('should send rating upgrade email', async () => {
      const { sendRatingUpgradeRequestEmail } = await import('./email.server');
      
      const data = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        phone: '+919876543210',
        currentRating: 'P2',
        requestedRating: 'P3',
        details: 'Test details',
        requestId: 1,
      };

      await expect(sendRatingUpgradeRequestEmail(data)).resolves.not.toThrow();
    });
  });

  describe('sendPasswordResetOTPEmail', () => {
    it('should throw error when email is disabled', async () => {
      process.env.ENABLE_EMAIL = 'false';
      
      vi.resetModules();
      const { sendPasswordResetOTPEmail } = await import('./email.server');
      
      const data = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        otp: '123456',
      };

      await expect(sendPasswordResetOTPEmail(data)).rejects.toThrow('Email service is currently disabled');
    });

    it('should send password reset OTP email when enabled', async () => {
      process.env.ENABLE_EMAIL = 'true';
      
      vi.resetModules();
      const { sendPasswordResetOTPEmail } = await import('./email.server');
      
      const data = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        otp: '123456',
      };

      await expect(sendPasswordResetOTPEmail(data)).resolves.not.toThrow();
    });
  });

  describe('sendMembershipRenewalEmail', () => {
    it('should send membership renewal email', async () => {
      const { sendMembershipRenewalEmail } = await import('./email.server');
      
      const data = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        phone: '+919876543210',
        details: 'Renewal request',
        currentRating: 'P3',
        expiryDate: '2024-12-31',
        requestId: 1,
      };

      await expect(sendMembershipRenewalEmail(data)).resolves.not.toThrow();
    });
  });
});
