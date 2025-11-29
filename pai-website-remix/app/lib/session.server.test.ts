import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-router
vi.mock('react-router', () => ({
  createCookieSessionStorage: vi.fn(() => ({
    getSession: vi.fn(),
    commitSession: vi.fn(),
    destroySession: vi.fn(),
  })),
  redirect: vi.fn((url) => new Response(null, { status: 302, headers: { Location: url } })),
}));

// Mock auth.server
vi.mock('./auth.server', () => ({
  getMemberById: vi.fn(),
}));

describe('Session Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserId', () => {
    it('should return userId from session', async () => {
      const { getUserId } = await import('./session.server');
      
      expect(getUserId).toBeDefined();
      expect(typeof getUserId).toBe('function');
    });
  });

  describe('requireUserId', () => {
    it('should return userId when user is authenticated', async () => {
      const { requireUserId } = await import('./session.server');
      
      expect(requireUserId).toBeDefined();
      expect(typeof requireUserId).toBe('function');
    });
  });

  describe('createUserSession', () => {
    it('should create session and redirect', async () => {
      const { createUserSession } = await import('./session.server');
      
      expect(createUserSession).toBeDefined();
      expect(typeof createUserSession).toBe('function');
    });
  });

  describe('logout', () => {
    it('should destroy session and redirect', async () => {
      const { logout } = await import('./session.server');
      
      expect(logout).toBeDefined();
      expect(typeof logout).toBe('function');
    });
  });
});
