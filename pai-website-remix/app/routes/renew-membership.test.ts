import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockQuery = vi.fn();
const mockGetMemberById = vi.fn();
const mockRequireUserId = vi.fn();
const mockSendMembershipRenewalEmail = vi.fn();

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
  sendMembershipRenewalEmail: (...args: any[]) => mockSendMembershipRenewalEmail(...args),
}));

describe('Renew Membership - Async Email Sending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(1);
    mockGetMemberById.mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      phone: '+919876543210',
      pilot_rating: 'P2',
      active_until: '2024-01-01',
      membership_type: 'individual',
      membership_id: 'PAI-MEM-00001',
      is_life_member: 0,
      life_membership_number: null,
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
      mockSendMembershipRenewalEmail.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            emailResolved = true;
            resolve(undefined);
          }, 5000); // 5 second delay
        });
      });

      const { action } = await import('./renew-membership');
      
      const formData = new URLSearchParams();
      formData.append('renewal_type', 'annual');
      formData.append('years', '1');
      formData.append('membership_type', 'individual');
      formData.append('step', 'confirm');

      const request = new Request('http://localhost/renew-membership', {
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
      
      // The result should indicate that the request was submitted successfully
      expect(result).toMatchObject({ submitted: true, requestId: 123, years: 1, amount: 500 });
    });

    it('should handle email failures gracefully without blocking user', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 123 });
      
      // Mock email to fail
      mockSendMembershipRenewalEmail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const { action } = await import('./renew-membership');
      
      const formData = new URLSearchParams();
      formData.append('renewal_type', 'annual');
      formData.append('years', '1');
      formData.append('membership_type', 'individual');
      formData.append('step', 'confirm');

      const request = new Request('http://localhost/renew-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      // Should not throw error even if email fails
      const result = await action({ request, params: {}, context: {} } as any);

      // The result should still indicate that the request was submitted successfully
      expect(result).toMatchObject({ submitted: true, requestId: 123, years: 1, amount: 500 });
    });

    it('should call email function with correct parameters', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 456 });
      mockSendMembershipRenewalEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./renew-membership');
      
      const formData = new URLSearchParams();
      formData.append('renewal_type', 'annual');
      formData.append('years', '1');
      formData.append('membership_type', 'individual');
      formData.append('step', 'confirm');

      const request = new Request('http://localhost/renew-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Verify that the email function was called with correct parameters
      // userName changes from 'John Doe' to 'Test User' - the new action reads userName from member.name (the mock), not from the form. The form no longer has a name field.
      // userEmail changes from 'john@example.com' to 'test@example.com' - same reason, comes from member.email now.
      // details line is removed - the new action auto-generates the details string ("Renewal for 1 year(s) - ₹500"). There's no details field in the form anymore.
      // renewalDurationYears: 1 is added - new field passed to the email function so the admin email shows how many years were chosen.
      // renewalAmount: 500 is added - new field so the admin email shows the expected payment amount.
      expect(mockSendMembershipRenewalEmail).toHaveBeenCalledTimes(1);
      const emailParams = mockSendMembershipRenewalEmail.mock.calls[0][0];
      expect(emailParams.userName).toBe('Test User');
      expect(emailParams.userEmail).toBe('test@example.com');
      expect(emailParams.phone).toBe('+919876543210');
      expect(emailParams.currentRating).toBe('P2');
      expect(emailParams.expiryDate).toBe('2024-01-01');
      expect(emailParams.requestId).toBe(456);
      expect(emailParams.renewalDurationYears).toBe(1);
      expect(emailParams.renewalAmount).toBe(500);
    });

    it('should store request in database before triggering email', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 789 });
      mockSendMembershipRenewalEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./renew-membership');
      
      const formData = new URLSearchParams();
      formData.append('renewal_type', 'annual');
      formData.append('years', '1');
      formData.append('membership_type', 'individual');
      formData.append('step', 'confirm');

      const request = new Request('http://localhost/renew-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      // Database should be called before email
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockSendMembershipRenewalEmail).toHaveBeenCalledTimes(1);
      
      // Verify insert query was called
      const insertCall = mockQuery.mock.calls[1];
      expect(insertCall[0]).toContain('INSERT INTO member_requests');
      expect(insertCall[0]).toContain('membership_renewal');
    });
  });

  describe('Review Step (no DB write yet)', () => {
    it('should not insert or email on the review step', async () => {
      mockQuery.mockResolvedValueOnce([]); // duplicate check only

      const { action } = await import('./renew-membership');

      const formData = new URLSearchParams();
      formData.append('renewal_type', 'annual');
      formData.append('years', '2');
      formData.append('membership_type', 'individual');
      // no step field -> defaults to "review"

      const request = new Request('http://localhost/renew-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toMatchObject({ showPayment: true, years: 2 });
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockSendMembershipRenewalEmail).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should validate required fields', async () => {
      const { action } = await import('./renew-membership');
      
      const formData = new URLSearchParams();
      formData.append('renewal_type', 'annual');
      formData.append('years', '5');  // invalid - only 1/2/3 are valid
      formData.append('membership_type', 'individual');

      const request = new Request('http://localhost/renew-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      mockQuery.mockResolvedValueOnce([]);
      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Please select a valid duration (1, 2, or 3 years).' });
      expect(mockQuery).toHaveBeenCalledTimes(1); // Only the initial check for existing pending requests
      expect(mockSendMembershipRenewalEmail).not.toHaveBeenCalled();
    });

    it('should prevent duplicate pending renewal requests', async () => {
      // Mock existing pending request
      mockQuery.mockResolvedValueOnce([{ id: 1 }]);

      const { action } = await import('./renew-membership');
      
      const formData = new URLSearchParams();
      formData.append('renewal_type', 'annual');
      formData.append('years', '1');
      formData.append('membership_type', 'individual');

      const request = new Request('http://localhost/renew-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'You already have a pending renewal request. Please wait for admin approval.' });
      expect(mockSendMembershipRenewalEmail).not.toHaveBeenCalled();
    });
  });

  describe('Details Handling', () => {
    it('should use default details if not provided', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 100 });
      mockSendMembershipRenewalEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./renew-membership');
      
      const formData = new URLSearchParams();
      formData.append('renewal_type', 'annual');
      formData.append('years', '1');
      formData.append('membership_type', 'individual');
      formData.append('step', 'confirm');
      // No details field

      const request = new Request('http://localhost/renew-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      await action({ request, params: {}, context: {} } as any);

      const emailParams = mockSendMembershipRenewalEmail.mock.calls[0][0];
      expect(emailParams.details).toBe('Renewal for 1 year(s) — ₹500');
    });
  });
});
