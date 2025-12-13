import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockGetUserId = vi.fn();
const mockVerifyLogin = vi.fn();
const mockCreateUserSession = vi.fn();

vi.mock('~/lib/session.server', () => ({
  getUserId: (...args: any[]) => mockGetUserId(...args),
  createUserSession: (...args: any[]) => mockCreateUserSession(...args),
}));

vi.mock('~/lib/auth.server', () => ({
  verifyLogin: (...args: any[]) => mockVerifyLogin(...args),
}));

describe('Login Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.IS_DEMO_SITE;
  });

  describe('Loader', () => {
    it('should redirect to dashboard if user is already logged in', async () => {
      mockGetUserId.mockResolvedValue(1);
      
      const { loader } = await import('./login');
      const request = new Request('http://localhost/login');
      
      const result = await loader({ request, params: {}, context: {} } as any);
      
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(302);
      expect((result as Response).headers.get('Location')).toBe('/dashboard');
    });

    it('should show login page if user is not logged in', async () => {
      mockGetUserId.mockResolvedValue(null);
      
      const { loader } = await import('./login');
      const request = new Request('http://localhost/login');
      
      const result = await loader({ request, params: {}, context: {} } as any);
      
      expect(result).toEqual({ resetSuccess: false, isDemoSite: false });
    });

    it('should detect password reset success from URL', async () => {
      mockGetUserId.mockResolvedValue(null);
      
      const { loader } = await import('./login');
      const request = new Request('http://localhost/login?reset=success');
      
      const result = await loader({ request, params: {}, context: {} } as any);
      
      expect(result).toEqual({ resetSuccess: true, isDemoSite: false });
    });

    it('should detect demo site mode', async () => {
      mockGetUserId.mockResolvedValue(null);
      process.env.IS_DEMO_SITE = 'true';
      
      const { loader } = await import('./login');
      const request = new Request('http://localhost/login');
      
      const result = await loader({ request, params: {}, context: {} } as any);
      
      expect(result).toEqual({ resetSuccess: false, isDemoSite: true });
    });
  });

  describe('Action', () => {
    it('should validate email and password are strings', async () => {
      const { action } = await import('./login');
      
      const formData = new URLSearchParams();
      // Don't append anything - missing fields will trigger validation
      
      const request = new Request('http://localhost/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      const result = await action({ request, params: {}, context: {} } as any);
      
      expect(result).toEqual({ error: 'Invalid form submission' });
    });

    it('should require email', async () => {
      const { action } = await import('./login');
      
      const formData = new URLSearchParams();
      formData.append('password', 'password123');
      
      const request = new Request('http://localhost/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      const result = await action({ request, params: {}, context: {} } as any);
      
      expect(result).toEqual({ error: 'Invalid form submission' });
    });

    it('should require password', async () => {
      const { action } = await import('./login');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      
      const request = new Request('http://localhost/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      const result = await action({ request, params: {}, context: {} } as any);
      
      expect(result).toEqual({ error: 'Invalid form submission' });
    });

    it('should return error for invalid credentials', async () => {
      mockVerifyLogin.mockResolvedValue(null);
      
      const { action } = await import('./login');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'wrongpassword');
      
      const request = new Request('http://localhost/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      const result = await action({ request, params: {}, context: {} } as any);
      
      expect(result).toEqual({ error: 'Invalid email or password' });
      expect(mockVerifyLogin).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    });

    it('should create session for valid credentials', async () => {
      const mockMember = {
        id: 1,
        email: 'test@example.com',
        role_name: 'USER',
        role_id: 1,
      };
      
      mockVerifyLogin.mockResolvedValue(mockMember);
      mockCreateUserSession.mockResolvedValue(new Response(null, {
        status: 302,
        headers: { Location: '/dashboard' },
      }));
      
      const { action } = await import('./login');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');
      
      const request = new Request('http://localhost/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      await action({ request, params: {}, context: {} } as any);
      
      expect(mockVerifyLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockCreateUserSession).toHaveBeenCalledWith(1, 'test@example.com', 'USER', 1, '/dashboard');
    });

    it('should handle member without role_name', async () => {
      const mockMember = {
        id: 1,
        email: 'test@example.com',
        role_id: 1,
      };
      
      mockVerifyLogin.mockResolvedValue(mockMember);
      mockCreateUserSession.mockResolvedValue(new Response(null, {
        status: 302,
        headers: { Location: '/dashboard' },
      }));
      
      const { action } = await import('./login');
      
      const formData = new URLSearchParams();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');
      
      const request = new Request('http://localhost/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      await action({ request, params: {}, context: {} } as any);
      
      expect(mockCreateUserSession).toHaveBeenCalledWith(1, 'test@example.com', 'USER', 1, '/dashboard');
    });
  });
});
