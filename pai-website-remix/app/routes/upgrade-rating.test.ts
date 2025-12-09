import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockQuery = vi.fn();
const mockGetMemberById = vi.fn();
const mockRequireUserId = vi.fn();
const mockSendRatingUpgradeRequestEmail = vi.fn();

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
  sendRatingUpgradeRequestEmail: (...args: any[]) => mockSendRatingUpgradeRequestEmail(...args),
}));

describe('Upgrade Rating - Async Email Sending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(1);
    mockGetMemberById.mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      phone: '+919876543210',
      pilot_rating: 'P2',
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
      mockSendRatingUpgradeRequestEmail.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            emailResolved = true;
            resolve(undefined);
          }, 5000); // 5 second delay
        });
      });

      const { action } = await import('./upgrade-rating');
      
      const formData = new URLSearchParams();
      formData.append('requestedRating', 'P3');
      formData.append('name', 'Test User');
      formData.append('email', 'test@example.com');
      formData.append('phone', '+919876543210');
      formData.append('details', 'Completed 100+ flights, ready for P3');

      const request = new Request('http://localhost/upgrade-rating', {
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
      expect((result as Response).headers.get('Location')).toBe('/dashboard?rating=requested');
    });

    it('should handle email failures gracefully without blocking user', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 123 });
      
      // Mock email to fail
      mockSendRatingUpgradeRequestEmail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const { action } = await import('./upgrade-rating');
      
      const formData = new URLSearchParams();
      formData.append('requestedRating', 'P4');
      formData.append('name', 'Test User');
      formData.append('email', 'test@example.com');
      formData.append('phone', '+919876543210');
      formData.append('details', 'Advanced XC pilot');

      const request = new Request('http://localhost/upgrade-rating', {
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
      expect((result as Response).headers.get('Location')).toBe('/dashboard?rating=requested');
    });

    it('should call email function with correct parameters', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 456 });
      mockSendRatingUpgradeRequestEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./upgrade-rating');
      
      const formData = new URLSearchParams();
      formData.append('requestedRating', 'P3');
      formData.append('name', 'John Doe');
      formData.append('email', 'john@example.com');
      formData.append('phone', '+919876543210');
      formData.append('details', '150 flights, 50 hours airtime');

      const request = new Request('http://localhost/upgrade-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Email function should be called with correct data
      expect(mockSendRatingUpgradeRequestEmail).toHaveBeenCalledTimes(1);
      const emailParams = mockSendRatingUpgradeRequestEmail.mock.calls[0][0];
      expect(emailParams.userName).toBe('John Doe');
      expect(emailParams.userEmail).toBe('john@example.com');
      expect(emailParams.phone).toBe('+919876543210');
      expect(emailParams.currentRating).toBe('P2');
      expect(emailParams.requestedRating).toBe('P3');
      expect(emailParams.details).toBe('150 flights, 50 hours airtime');
      expect(emailParams.requestId).toBe(456);
    });

    it('should store request in database before triggering email', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 789 });
      mockSendRatingUpgradeRequestEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./upgrade-rating');
      
      const formData = new URLSearchParams();
      formData.append('requestedRating', 'P3');
      formData.append('name', 'Test User');
      formData.append('email', 'test@example.com');
      formData.append('phone', '+919876543210');
      formData.append('details', 'Ready for upgrade');

      const request = new Request('http://localhost/upgrade-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Database should be called before email
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockSendRatingUpgradeRequestEmail).toHaveBeenCalledTimes(1);
      
      // Verify insert query was called
      const insertCall = mockQuery.mock.calls[1];
      expect(insertCall[0]).toContain('INSERT INTO member_requests');
      expect(insertCall[0]).toContain('rating_upgrade');
    });
  });

  describe('Validation', () => {
    it('should validate required rating field', async () => {
      const { action } = await import('./upgrade-rating');
      
      const formData = new URLSearchParams();
      formData.append('requestedRating', '');
      formData.append('name', 'Test User');
      formData.append('email', 'test@example.com');
      formData.append('phone', '+919876543210');
      formData.append('details', 'Test');

      const request = new Request('http://localhost/upgrade-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Please select a rating' });
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockSendRatingUpgradeRequestEmail).not.toHaveBeenCalled();
    });

    it('should validate required details field', async () => {
      const { action } = await import('./upgrade-rating');
      
      const formData = new URLSearchParams();
      formData.append('requestedRating', 'P3');
      formData.append('name', 'Test User');
      formData.append('email', 'test@example.com');
      formData.append('phone', '+919876543210');
      formData.append('details', '');

      const request = new Request('http://localhost/upgrade-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Details are required' });
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockSendRatingUpgradeRequestEmail).not.toHaveBeenCalled();
    });

    it('should prevent duplicate pending upgrade requests', async () => {
      // Mock existing pending request
      mockQuery.mockResolvedValueOnce([{ id: 1 }]);

      const { action } = await import('./upgrade-rating');
      
      const formData = new URLSearchParams();
      formData.append('requestedRating', 'P3');
      formData.append('name', 'Test User');
      formData.append('email', 'test@example.com');
      formData.append('phone', '+919876543210');
      formData.append('details', 'Ready for upgrade');

      const request = new Request('http://localhost/upgrade-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'You already have a pending rating upgrade request' });
      expect(mockSendRatingUpgradeRequestEmail).not.toHaveBeenCalled();
    });
  });

  describe('Rating Progression', () => {
    it('should handle different rating upgrade paths', async () => {
      const ratings = ['P1', 'P2', 'P3', 'P4', 'P5'];
      
      for (const rating of ratings) {
        vi.clearAllMocks();
        mockQuery.mockResolvedValueOnce([]);
        mockQuery.mockResolvedValueOnce({ insertId: 100 });
        mockSendRatingUpgradeRequestEmail.mockResolvedValueOnce(undefined);

        const { action } = await import('./upgrade-rating');
        
        const formData = new URLSearchParams();
        formData.append('requestedRating', rating);
        formData.append('name', 'Test User');
        formData.append('email', 'test@example.com');
        formData.append('phone', '+919876543210');
        formData.append('details', `Upgrading to ${rating}`);

        const request = new Request('http://localhost/upgrade-rating', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        const result = await action({ request, params: {}, context: {} } as any);

        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(302);
        
        const emailParams = mockSendRatingUpgradeRequestEmail.mock.calls[0][0];
        expect(emailParams.requestedRating).toBe(rating);
      }
    });
  });
});
