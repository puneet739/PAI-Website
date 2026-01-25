import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockQuery = vi.fn();
const mockGetMemberById = vi.fn();
const mockRequireUserId = vi.fn();
const mockSendInsuranceRequestEmail = vi.fn();

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
  sendInsuranceRequestEmail: (...args: any[]) => mockSendInsuranceRequestEmail(...args),
}));

describe('Insurance Request - Async Email Sending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(1);
    mockGetMemberById.mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      phone: '+919876543210',
      date_of_birth: '1990-01-01',
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
      mockSendInsuranceRequestEmail.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            emailResolved = true;
            resolve(undefined);
          }, 5000); // 5 second delay
        });
      });

      const { action } = await import('./insurance');
      
      const formData = new URLSearchParams();
      formData.append('_action', 'request_insurance');
      formData.append('insurancePlan', 'premium');
      formData.append('phone', '+919876543210');
      formData.append('email', 'test@example.com');
      formData.append('dateOfBirth', '1990-01-01');
      formData.append('nominee', 'Jane Doe (Spouse)');
      formData.append('comments', 'Need comprehensive coverage');

      const request = new Request('http://localhost/insurance', {
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
      expect((result as Response).headers.get('Location')).toBe('/dashboard?insurance=requested');
    });

    it('should handle email failures gracefully without blocking user', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 123 });
      
      // Mock email to fail
      mockSendInsuranceRequestEmail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const { action } = await import('./insurance');
      
      const formData = new URLSearchParams();
      formData.append('_action', 'request_insurance');
      formData.append('insurancePlan', 'basic');
      formData.append('phone', '+919876543210');
      formData.append('email', 'test@example.com');
      formData.append('dateOfBirth', '1990-01-01');
      formData.append('nominee', 'Jane Doe (Spouse)');
      formData.append('comments', 'Basic coverage needed');

      const request = new Request('http://localhost/insurance', {
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
      expect((result as Response).headers.get('Location')).toBe('/dashboard?insurance=requested');
    });

    it('should call email function with correct parameters', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 456 });
      mockSendInsuranceRequestEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./insurance');
      
      const formData = new URLSearchParams();
      formData.append('_action', 'request_insurance');
      formData.append('insurancePlan', 'comprehensive');
      formData.append('phone', '+919876543210');
      formData.append('email', 'john@example.com');
      formData.append('dateOfBirth', '1990-01-01');
      formData.append('nominee', 'Jane Doe (Spouse)');
      formData.append('comments', 'International coverage');

      const request = new Request('http://localhost/insurance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Email function should be called with correct data
      expect(mockSendInsuranceRequestEmail).toHaveBeenCalledTimes(1);
      const emailParams = mockSendInsuranceRequestEmail.mock.calls[0][0];
      expect(emailParams.userName).toBe('Test User');
      expect(emailParams.userEmail).toBe('john@example.com');
      expect(emailParams.phone).toBe('+919876543210');
      expect(emailParams.dateOfBirth).toBeDefined();
      expect(emailParams.nominee).toBe('Jane Doe (Spouse)');
      expect(emailParams.insurancePlan).toBe('Comprehensive');
      expect(emailParams.coverage).toBe('₹40 Lakh');
      expect(emailParams.premium).toBe('₹12,219');
      expect(emailParams.comments).toBe('International coverage');
      expect(emailParams.requestId).toBe(456);
    });

    it('should store request in database before triggering email', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 789 });
      mockSendInsuranceRequestEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./insurance');
      
      const formData = new URLSearchParams();
      formData.append('_action', 'request_insurance');
      formData.append('insurancePlan', 'premium');
      formData.append('phone', '+919876543210');
      formData.append('email', 'test@example.com');
      formData.append('dateOfBirth', '1990-01-01');
      formData.append('nominee', 'Jane Doe (Spouse)');
      formData.append('comments', 'Test');

      const request = new Request('http://localhost/insurance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Database should be called before email
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockSendInsuranceRequestEmail).toHaveBeenCalledTimes(1);
      
      // Verify insert query was called
      const insertCall = mockQuery.mock.calls[1];
      expect(insertCall[0]).toContain('INSERT INTO member_requests');
    });
  });

  describe('Validation', () => {
    it('should validate required insurance plan', async () => {
      const { action } = await import('./insurance');
      
      const formData = new URLSearchParams();
      formData.append('_action', 'request_insurance');
      formData.append('insurancePlan', '');
      formData.append('phone', '+919876543210');
      formData.append('email', 'test@example.com');

      const request = new Request('http://localhost/insurance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Please select an insurance plan' });
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockSendInsuranceRequestEmail).not.toHaveBeenCalled();
    });

    it('should validate required date of birth', async () => {
      const { action } = await import('./insurance');
      
      const formData = new URLSearchParams();
      formData.append('_action', 'request_insurance');
      formData.append('insurancePlan', 'basic');
      formData.append('phone', '+919876543210');
      formData.append('email', 'test@example.com');
      formData.append('dateOfBirth', '');

      const request = new Request('http://localhost/insurance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Date of Birth is required' });
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockSendInsuranceRequestEmail).not.toHaveBeenCalled();
    });

    it('should prevent duplicate pending requests', async () => {
      // Mock existing pending request
      mockQuery.mockResolvedValueOnce([{ id: 1 }]);

      const { action } = await import('./insurance');
      
      const formData = new URLSearchParams();
      formData.append('_action', 'request_insurance');
      formData.append('insurancePlan', 'basic');
      formData.append('phone', '+919876543210');
      formData.append('email', 'test@example.com');
      formData.append('dateOfBirth', '1990-01-01');
      formData.append('nominee', 'Jane Doe (Spouse)');

      const request = new Request('http://localhost/insurance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'You already have a pending insurance request' });
      expect(mockSendInsuranceRequestEmail).not.toHaveBeenCalled();
    });
  });

  describe('Insurance Plan Details', () => {
    it('should correctly map basic plan details', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 100 });
      mockSendInsuranceRequestEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./insurance');
      
      const formData = new URLSearchParams();
      formData.append('_action', 'request_insurance');
      formData.append('insurancePlan', 'basic');
      formData.append('phone', '+919876543210');
      formData.append('email', 'test@example.com');
      formData.append('dateOfBirth', '1990-01-01');
      formData.append('nominee', 'Jane Doe (Spouse)');

      const request = new Request('http://localhost/insurance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      const emailParams = mockSendInsuranceRequestEmail.mock.calls[0][0];
      expect(emailParams.coverage).toBe('₹5 Lakh');
      expect(emailParams.premium).toBe('₹2,631');
    });
  });
});
