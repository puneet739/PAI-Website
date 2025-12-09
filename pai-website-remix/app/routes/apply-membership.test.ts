import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockQuery = vi.fn();
const mockGetMemberById = vi.fn();
const mockRequireUserId = vi.fn();
const mockSendMembershipRequestEmail = vi.fn();

vi.mock('~/lib/db.server', () => ({
  query: (...args: any[]) => mockQuery(...args),
}));

vi.mock('~/lib/auth.server', () => ({
  getMemberById: (...args: any[]) => mockGetMemberById(...args),
}));

vi.mock('~/lib/session.server', () => ({
  requireUserId: (...args: any[]) => mockRequireUserId(...args),
}));

vi.mock('~/lib/email.server', () => ({
  sendMembershipRequestEmail: (...args: any[]) => mockSendMembershipRequestEmail(...args),
}));

describe('Apply Membership - Async Email Sending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(1);
    mockGetMemberById.mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      pilot_rating: 'P1',
      membership_type: 'regular',
    });
  });

  describe('Non-Blocking Email Behavior', () => {
    it('should not await email sending and return immediately', async () => {
      // Mock no existing pending request
      mockQuery.mockResolvedValueOnce([]);
      // Mock successful insert
      mockQuery.mockResolvedValueOnce({ insertId: 123 });
      
      // Mock email to take a long time (simulating slow SMTP)
      let emailResolved = false;
      mockSendMembershipRequestEmail.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            emailResolved = true;
            resolve(undefined);
          }, 5000); // 5 second delay
        });
      });

      const { action } = await import('./apply-membership');
      
      const formData = new URLSearchParams();
      formData.append('name', 'Test User');
      formData.append('email', 'test@example.com');
      formData.append('phone', '+919876543210');
      formData.append('details', 'Test application details');

      const request = new Request('http://localhost/apply-membership', {
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
      
      // Should redirect successfully
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(302);
      expect((result as Response).headers.get('Location')).toBe('/dashboard?application=success');
    });

    it('should handle email failures gracefully without blocking user', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 123 });
      
      // Mock email to fail
      mockSendMembershipRequestEmail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const { action } = await import('./apply-membership');
      
      const formData = new URLSearchParams();
      formData.append('name', 'Test User');
      formData.append('email', 'test@example.com');
      formData.append('phone', '+919876543210');
      formData.append('details', 'Test application details');

      const request = new Request('http://localhost/apply-membership', {
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
      expect((result as Response).headers.get('Location')).toBe('/dashboard?application=success');
    });

    it('should call email function with correct parameters', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 456 });
      mockSendMembershipRequestEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./apply-membership');
      
      const formData = new URLSearchParams();
      formData.append('name', 'John Doe');
      formData.append('email', 'john@example.com');
      formData.append('phone', '+919876543210');
      formData.append('details', 'Experienced pilot');

      const request = new Request('http://localhost/apply-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Email function should be called with correct data
      expect(mockSendMembershipRequestEmail).toHaveBeenCalledTimes(1);
      const emailParams = mockSendMembershipRequestEmail.mock.calls[0][0];
      expect(emailParams.userName).toBe('John Doe');
      expect(emailParams.userEmail).toBe('john@example.com');
      expect(emailParams.phone).toBe('+919876543210');
      expect(emailParams.details).toBe('Experienced pilot');
      expect(emailParams.currentRating).toBe('P1');
      expect(emailParams.requestId).toBe(456);
    });

    it('should store request in database before triggering email', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 789 });
      mockSendMembershipRequestEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./apply-membership');
      
      const formData = new URLSearchParams();
      formData.append('name', 'Test User');
      formData.append('email', 'test@example.com');
      formData.append('phone', '+919876543210');
      formData.append('details', 'Test details');

      const request = new Request('http://localhost/apply-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Database should be called before email
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockSendMembershipRequestEmail).toHaveBeenCalledTimes(1);
      
      // Verify insert query was called
      const insertCall = mockQuery.mock.calls[1];
      expect(insertCall[0]).toContain('INSERT INTO member_requests');
    });
  });

  describe('Validation', () => {
    it('should validate required fields before processing', async () => {
      const { action } = await import('./apply-membership');
      
      const formData = new URLSearchParams();
      formData.append('name', '');
      formData.append('email', 'test@example.com');
      formData.append('phone', '+919876543210');
      formData.append('details', 'Test');

      const request = new Request('http://localhost/apply-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Name is required' });
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockSendMembershipRequestEmail).not.toHaveBeenCalled();
    });

    it('should prevent duplicate pending requests', async () => {
      // Mock existing pending request
      mockQuery.mockResolvedValueOnce([{ id: 1 }]);

      const { action } = await import('./apply-membership');
      
      const formData = new URLSearchParams();
      formData.append('name', 'Test User');
      formData.append('email', 'test@example.com');
      formData.append('phone', '+919876543210');
      formData.append('details', 'Test');

      const request = new Request('http://localhost/apply-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'You already have a pending membership application' });
      expect(mockSendMembershipRequestEmail).not.toHaveBeenCalled();
    });
  });
});
