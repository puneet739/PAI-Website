import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
const mockQuery = vi.fn();
const mockSendPasswordResetOTPEmail = vi.fn();

vi.mock('~/lib/db.server', () => ({
  query: (...args: any[]) => mockQuery(...args),
}));

vi.mock('~/lib/email.server', () => ({
  sendPasswordResetOTPEmail: (...args: any[]) => mockSendPasswordResetOTPEmail(...args),
}));

describe('Forgot Password - OTP Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OTP Generation and Storage', () => {
    it('should generate a 6-digit OTP', async () => {
      // Mock user exists
      mockQuery.mockResolvedValueOnce([
        { id: 1, name: 'Test User', email: 'test@example.com' }
      ]);
      // Mock OTP insert
      mockQuery.mockResolvedValueOnce({});
      mockSendPasswordResetOTPEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./forgot-password');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');

      const request = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Verify OTP was stored
      expect(mockQuery).toHaveBeenCalledTimes(2);
      
      // Check the OTP insert call
      const otpInsertCall = mockQuery.mock.calls[1];
      expect(otpInsertCall[0]).toContain('INSERT INTO otp_verifications');
      
      // Verify OTP is 6 digits
      const otp = otpInsertCall[1][1]; // Second parameter in the array
      expect(otp).toMatch(/^\d{6}$/);
      expect(parseInt(otp)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(otp)).toBeLessThanOrEqual(999999);
    });

    it('should set OTP expiration to 10 minutes', async () => {
      mockQuery.mockResolvedValueOnce([
        { id: 1, name: 'Test User', email: 'test@example.com' }
      ]);
      mockQuery.mockResolvedValueOnce({});
      mockSendPasswordResetOTPEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./forgot-password');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');

      const request = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const beforeTime = Date.now();
      await action({ request, params: {}, context: {} } as any);
      const afterTime = Date.now();

      const otpInsertCall = mockQuery.mock.calls[1];
      const expiresAt = otpInsertCall[1][2]; // Third parameter

      // Verify expiration is approximately 10 minutes from now
      const expirationTime = new Date(expiresAt).getTime();
      const expectedMin = beforeTime + (10 * 60 * 1000);
      const expectedMax = afterTime + (10 * 60 * 1000);

      expect(expirationTime).toBeGreaterThanOrEqual(expectedMin);
      expect(expirationTime).toBeLessThanOrEqual(expectedMax);
    });

    it('should store OTP with correct purpose', async () => {
      mockQuery.mockResolvedValueOnce([
        { id: 1, name: 'Test User', email: 'test@example.com' }
      ]);
      mockQuery.mockResolvedValueOnce({});
      mockSendPasswordResetOTPEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./forgot-password');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');

      const request = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      const otpInsertCall = mockQuery.mock.calls[1];
      expect(otpInsertCall[0]).toContain("purpose = 'password_reset'");
    });

    it('should update existing OTP if one already exists (ON DUPLICATE KEY UPDATE)', async () => {
      mockQuery.mockResolvedValueOnce([
        { id: 1, name: 'Test User', email: 'test@example.com' }
      ]);
      mockQuery.mockResolvedValueOnce({});
      mockSendPasswordResetOTPEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./forgot-password');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');

      const request = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      const otpInsertCall = mockQuery.mock.calls[1];
      expect(otpInsertCall[0]).toContain('ON DUPLICATE KEY UPDATE');
    });
  });

  describe('Email Validation', () => {
    it('should return error if email is missing', async () => {
      const { action } = await import('./forgot-password');
      
      const formData = new URLSearchParams();

      const request = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Email is required' });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should return error if email is empty string', async () => {
      const { action } = await import('./forgot-password');
      
      const formData = new URLSearchParams();
      formData.append('email', '');

      const request = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Email is required' });
    });

    it('should return error if user does not exist', async () => {
      mockQuery.mockResolvedValueOnce([]); // No user found

      const { action } = await import('./forgot-password');
      
      const formData = new URLSearchParams();
      formData.append('email', 'nonexistent@example.com');

      const request = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'No account found with this email address' });
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('Email Sending', () => {
    it('should send OTP email with correct parameters', async () => {
      mockQuery.mockResolvedValueOnce([
        { id: 1, name: 'John Doe', email: 'john@example.com' }
      ]);
      mockQuery.mockResolvedValueOnce({});
      mockSendPasswordResetOTPEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./forgot-password');
      
      const formData = new URLSearchParams();
      formData.append('email', 'john@example.com');

      const request = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      expect(mockSendPasswordResetOTPEmail).toHaveBeenCalledTimes(1);
      
      const emailParams = mockSendPasswordResetOTPEmail.mock.calls[0][0];
      expect(emailParams.userName).toBe('John Doe');
      expect(emailParams.userEmail).toBe('john@example.com');
      expect(emailParams.otp).toMatch(/^\d{6}$/);
    });

    it('should redirect to verification page on success', async () => {
      mockQuery.mockResolvedValueOnce([
        { id: 1, name: 'Test User', email: 'test@example.com' }
      ]);
      mockQuery.mockResolvedValueOnce({});
      mockSendPasswordResetOTPEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./forgot-password');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');

      const request = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      // Check if it's a redirect response
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(302);
      expect((result as Response).headers.get('Location')).toBe('/verify-password-reset?email=test%40example.com');
    });
  });

  describe('OTP Uniqueness', () => {
    it('should generate different OTPs on multiple calls', async () => {
      const otps = new Set<string>();

      for (let i = 0; i < 10; i++) {
        mockQuery.mockResolvedValueOnce([
          { id: 1, name: 'Test User', email: 'test@example.com' }
        ]);
        mockQuery.mockResolvedValueOnce({});
        mockSendPasswordResetOTPEmail.mockResolvedValueOnce(undefined);

        vi.resetModules();
        const { action } = await import('./forgot-password');
        
        const formData = new URLSearchParams();
        formData.append('email', 'test@example.com');

        const request = new Request('http://localhost/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        await action({ request, params: {}, context: {} } as any);

        const otpInsertCall = mockQuery.mock.calls[1];
        const otp = otpInsertCall[1][1];
        otps.add(otp);

        vi.clearAllMocks();
      }

      // At least 8 out of 10 should be unique (allowing for rare collisions)
      expect(otps.size).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Async Email Sending - Non-Blocking Behavior', () => {
    it('should not await email sending and return immediately', async () => {
      mockQuery.mockResolvedValueOnce([
        { id: 1, name: 'Test User', email: 'test@example.com' }
      ]);
      mockQuery.mockResolvedValueOnce({});
      
      // Mock email to take a long time (simulating slow SMTP)
      let emailResolved = false;
      mockSendPasswordResetOTPEmail.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            emailResolved = true;
            resolve(undefined);
          }, 5000); // 5 second delay
        });
      });

      const { action } = await import('./forgot-password');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');

      const request = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const startTime = Date.now();
      const result = await action({ request, params: {}, context: {} } as any);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Action should complete in less than 1 second (not waiting for email)
      expect(duration).toBeLessThan(1000);
      
      // Email should NOT be resolved yet
      expect(emailResolved).toBe(false);
      
      // Should still redirect successfully
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(302);
    });

    it('should handle email failures gracefully without blocking user', async () => {
      mockQuery.mockResolvedValueOnce([
        { id: 1, name: 'Test User', email: 'test@example.com' }
      ]);
      mockQuery.mockResolvedValueOnce({});
      
      // Mock email to fail
      mockSendPasswordResetOTPEmail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const { action } = await import('./forgot-password');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');

      const request = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      // Should not throw error even if email fails
      const result = await action({ request, params: {}, context: {} } as any);

      // Should still redirect successfully
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(302);
      expect((result as Response).headers.get('Location')).toBe('/verify-password-reset?email=test%40example.com');
    });

    it('should call email function but not await it', async () => {
      mockQuery.mockResolvedValueOnce([
        { id: 1, name: 'Test User', email: 'test@example.com' }
      ]);
      mockQuery.mockResolvedValueOnce({});
      mockSendPasswordResetOTPEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./forgot-password');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');

      const request = new Request('http://localhost/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Email function should be called
      expect(mockSendPasswordResetOTPEmail).toHaveBeenCalledTimes(1);
      
      // But the action should complete before email promise resolves
      // This is verified by the timing test above
    });
  });
});
