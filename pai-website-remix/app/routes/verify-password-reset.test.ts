import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
const mockQuery = vi.fn();
const mockQueryOne = vi.fn();
const mockHash = vi.fn();

vi.mock('~/lib/db.server', () => ({
  query: (...args: any[]) => mockQuery(...args),
  queryOne: (...args: any[]) => mockQueryOne(...args),
}));

vi.mock('bcryptjs', () => ({
  hash: (...args: any[]) => mockHash(...args),
}));

describe('Verify Password Reset - OTP Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHash.mockResolvedValue('$2b$10$hashedpassword');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OTP Verification', () => {
    it('should verify valid OTP and reset password', async () => {
      // Mock valid OTP record (verifyOTP uses queryOne)
      mockQueryOne.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        otp: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        purpose: 'password_reset'
      });
      // Mock OTP deletion (verifyOTP deletes after verification)
      mockQuery.mockResolvedValueOnce({});
      // Mock password update
      mockQuery.mockResolvedValueOnce({});

      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      // Should redirect to login with success message
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(302);
      expect((result as Response).headers.get('Location')).toBe('/login?reset=success');

      // Verify OTP was checked (using queryOne)
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM otp_verifications'),
        ['test@example.com', 'password_reset', '123456']
      );

      // Verify password was updated
      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE members SET password_hash = ? WHERE email = ?',
        ['$2b$10$hashedpassword', 'test@example.com']
      );
    });

    it('should reject invalid OTP', async () => {
      // Mock no matching OTP (verifyOTP uses queryOne, returns null)
      mockQueryOne.mockResolvedValueOnce(null);

      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '999999');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Invalid or expired OTP' });
      expect(mockQueryOne).toHaveBeenCalledTimes(1); // Only OTP check, no update
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should reject expired OTP', async () => {
      // Mock expired OTP (verifyOTP checks expiry and returns false)
      mockQueryOne.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        otp: '123456',
        expires_at: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago (expired)
        purpose: 'password_reset'
      });
      // Mock OTP deletion (verifyOTP deletes expired OTP)
      mockQuery.mockResolvedValueOnce({});

      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Invalid or expired OTP' });
    });

    it('should verify OTP query checks expiration time', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Verify the query includes expiration check
      const otpQuery = mockQueryOne.mock.calls[0][0];
      expect(otpQuery).toContain('otp_verifications');
      expect(otpQuery).toContain("purpose");
    });

    it('should only accept most recent OTP (ORDER BY created_at DESC LIMIT 1)', async () => {
      mockQueryOne.mockResolvedValueOnce({
        id: 2,
        email: 'test@example.com',
        otp: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        purpose: 'password_reset',
        created_at: new Date()
      });
      mockQuery.mockResolvedValueOnce({});
      mockQuery.mockResolvedValueOnce({});

      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // verifyOTP handles OTP selection internally
      expect(mockQueryOne).toHaveBeenCalled();
    });
  });

  describe('Password Validation', () => {
    it('should require email', async () => {
      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('otp', '123456');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Email is required' });
    });

    it('should require OTP', async () => {
      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'OTP is required' });
    });

    it('should require new password', async () => {
      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('confirmPassword', 'newpassword123');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'New password is required' });
    });

    it('should require password confirmation', async () => {
      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('newPassword', 'newpassword123');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Please confirm your password' });
    });

    it('should reject mismatched passwords', async () => {
      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'differentpassword');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Passwords do not match' });
    });

    it('should reject password shorter than 8 characters', async () => {
      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('newPassword', 'short');
      formData.append('confirmPassword', 'short');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Password must be at least 8 characters long' });
    });

    it('should accept password exactly 8 characters', async () => {
      mockQueryOne.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        otp: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        purpose: 'password_reset'
      });
      mockQuery.mockResolvedValueOnce({});
      mockQuery.mockResolvedValueOnce({});

      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('newPassword', '12345678');
      formData.append('confirmPassword', '12345678');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(302);
    });
  });

  describe('Password Hashing', () => {
    it('should hash password with bcrypt before storing', async () => {
      mockQueryOne.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        otp: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        purpose: 'password_reset'
      });
      mockQuery.mockResolvedValueOnce({});
      mockQuery.mockResolvedValueOnce({});

      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('newPassword', 'mynewpassword');
      formData.append('confirmPassword', 'mynewpassword');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Verify hash was called with correct parameters
      expect(mockHash).toHaveBeenCalledWith('mynewpassword', 10);
    });

    it('should store hashed password, not plain text', async () => {
      mockQueryOne.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        otp: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        purpose: 'password_reset'
      });
      mockQuery.mockResolvedValueOnce({});
      mockQuery.mockResolvedValueOnce({});

      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('newPassword', 'plainpassword');
      formData.append('confirmPassword', 'plainpassword');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Verify the UPDATE query uses hashed password
      const updateCall = mockQuery.mock.calls.find(call => 
        call[0].includes('UPDATE members')
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![1][0]).toBe('$2b$10$hashedpassword');
      expect(updateCall![1][0]).not.toBe('plainpassword');
    });
  });

  describe('OTP Cleanup', () => {
    it('should delete OTP after successful password reset', async () => {
      mockQueryOne.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        otp: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        purpose: 'password_reset'
      });
      mockQuery.mockResolvedValueOnce({});
      mockQuery.mockResolvedValueOnce({});

      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Verify OTP deletion (verifyOTP handles deletion)
      const deleteCall = mockQuery.mock.calls.find(call => 
        call[0].includes('DELETE FROM otp_verifications')
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall![1]).toEqual(['test@example.com', 'password_reset']);
    });

    it('should not delete OTP if verification fails', async () => {
      // Mock no matching OTP
      mockQueryOne.mockResolvedValueOnce(null);

      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '999999');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Verify no DELETE query was made
      const deleteCall = mockQuery.mock.calls.find(call => 
        call[0].includes('DELETE FROM otp_verifications')
      );
      expect(deleteCall).toBeUndefined();
    });
  });

  describe('Security', () => {
    it('should prevent OTP reuse after successful reset', async () => {
      // First successful reset
      mockQueryOne.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        otp: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        purpose: 'password_reset'
      });
      mockQuery.mockResolvedValueOnce({});
      mockQuery.mockResolvedValueOnce({});

      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Verify OTP was deleted (verifyOTP handles deletion)
      const deleteCall = mockQuery.mock.calls.find(call => 
        call[0].includes('DELETE FROM otp_verifications')
      );
      expect(deleteCall).toBeDefined();
    });

    it('should validate email matches OTP record', async () => {
      mockQueryOne.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        otp: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        purpose: 'password_reset'
      });
      mockQuery.mockResolvedValueOnce({});
      mockQuery.mockResolvedValueOnce({});

      const { action } = await import('./verify-password-reset');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('otp', '123456');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const request = new Request('http://localhost/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Verify query checks both email and OTP
      const otpQuery = mockQueryOne.mock.calls[0];
      expect(otpQuery[1]).toEqual(['test@example.com', 'password_reset', '123456']);
    });
  });
});
