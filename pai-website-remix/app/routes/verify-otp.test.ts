import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSession = vi.fn();
const mockVerifyOTP = vi.fn();
const mockCreateMember = vi.fn();
const mockCreateUserSession = vi.fn();

vi.mock('~/lib/session.server', () => ({
  getSession: (...args: any[]) => mockGetSession(...args),
  createUserSession: (...args: any[]) => mockCreateUserSession(...args),
}));

vi.mock('~/lib/otp.server', () => ({
  verifyOTP: (...args: any[]) => mockVerifyOTP(...args),
}));

vi.mock('~/lib/auth.server', () => ({
  createMember: (...args: any[]) => mockCreateMember(...args),
}));

describe('Verify OTP Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loader', () => {
    it('should redirect to register if no email in session', async () => {
      mockGetSession.mockResolvedValue({
        get: vi.fn().mockReturnValue(null),
      });
      
      const { loader } = await import('./verify-otp');
      const request = new Request('http://localhost/verify-otp', {
        headers: { Cookie: '' },
      });
      
      const result = await loader({ request, params: {}, context: {} } as any);
      
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(302);
      expect((result as Response).headers.get('Location')).toBe('/register');
    });

    it('should return email if present in session', async () => {
      mockGetSession.mockResolvedValue({
        get: vi.fn().mockReturnValue('test@example.com'),
      });
      
      const { loader } = await import('./verify-otp');
      const request = new Request('http://localhost/verify-otp', {
        headers: { Cookie: '' },
      });
      
      const result = await loader({ request, params: {}, context: {} } as any);
      
      expect(result).toEqual({ email: 'test@example.com' });
    });
  });

  describe('Action', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        get: vi.fn().mockReturnValue('test@example.com'),
        unset: vi.fn(),
      });
    });

    it('should require OTP', async () => {
      const { action } = await import('./verify-otp');
      
      const formData = new URLSearchParams();
      formData.append('name', 'Test User');
      
      const request = new Request('http://localhost/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: '',
        },
        body: formData.toString(),
      });
      
      const result = await action({ request, params: {}, context: {} } as any);
      
      expect(result).toEqual({ error: 'OTP is required' });
    });

    it('should require name', async () => {
      const { action } = await import('./verify-otp');
      
      const formData = new URLSearchParams();
      formData.append('otp', '123456');
      
      const request = new Request('http://localhost/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: '',
        },
        body: formData.toString(),
      });
      
      const result = await action({ request, params: {}, context: {} } as any);
      
      expect(result).toEqual({ error: 'Name is required' });
    });

    it('should validate OTP format', async () => {
      const { action } = await import('./verify-otp');
      
      const formData = new URLSearchParams();
      formData.append('otp', '12345');
      formData.append('name', 'Test User');
      
      const request = new Request('http://localhost/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: '',
        },
        body: formData.toString(),
      });
      
      const result = await action({ request, params: {}, context: {} } as any);
      
      expect(result).toEqual({ error: 'OTP must be 6 digits' });
    });

    it('should reject invalid OTP', async () => {
      mockVerifyOTP.mockResolvedValue(false);
      
      const { action } = await import('./verify-otp');
      
      const formData = new URLSearchParams();
      formData.append('otp', '123456');
      formData.append('name', 'Test User');
      
      const request = new Request('http://localhost/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: '',
        },
        body: formData.toString(),
      });
      
      const result = await action({ request, params: {}, context: {} } as any);
      
      expect(result).toEqual({ error: 'Invalid or expired OTP. Please check the code or request a new one.' });
    });

    it('should create member and session for valid OTP', async () => {
      mockVerifyOTP.mockResolvedValue(true);
      mockCreateMember.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        role_name: 'member',
        role_id: 1,
      });
      mockCreateUserSession.mockResolvedValue(new Response(null, {
        status: 302,
        headers: { Location: '/dashboard' },
      }));
      
      const { action } = await import('./verify-otp');
      
      const formData = new URLSearchParams();
      formData.append('otp', '123456');
      formData.append('name', 'Test User');
      
      const request = new Request('http://localhost/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: '',
        },
        body: formData.toString(),
      });
      
      await action({ request, params: {}, context: {} } as any);
      
      expect(mockVerifyOTP).toHaveBeenCalledWith('test@example.com', '123456', 'email_verification');
      expect(mockCreateMember).toHaveBeenCalledWith('test@example.com', '123456', 'Test User');
      expect(mockCreateUserSession).toHaveBeenCalled();
    });
  });
});
