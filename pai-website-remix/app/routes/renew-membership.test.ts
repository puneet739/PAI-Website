import { describe, it, expect, vi, beforeEach } from 'vitest';

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

const baseMember = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  phone: '+919876543210',
  pilot_rating: 'P2',
  active_until: '2024-01-01',
  membership_type: 'individual',
  is_life_member: 0,
  membership_status: 'active',
  membership_id: 'PAI-MEM-00001',
};

function makeRequest(fields: Record<string, string> = {}) {
  const formData = new URLSearchParams({ years: '1', ...fields });
  return new Request('http://localhost/renew-membership', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });
}

describe('Renew Membership Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(1);
    mockGetMemberById.mockResolvedValue({ ...baseMember });
  });

  describe('Non-Blocking Email Behavior', () => {
    it('should not await email sending and return immediately', async () => {
      mockQuery.mockResolvedValueOnce([]); // no pending request
      mockQuery.mockResolvedValueOnce({ insertId: 123 }); // insert

      let emailResolved = false;
      mockSendMembershipRenewalEmail.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => { emailResolved = true; resolve(undefined); }, 5000))
      );

      const { action } = await import('./renew-membership');
      const startTime = Date.now();
      const result = await action({ request: makeRequest({ years: '1' }), params: {}, context: {} } as any);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
      expect(emailResolved).toBe(false);
      expect(result).toHaveProperty('submitted', true);
    });

    it('should handle email failures gracefully without blocking user', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 123 });
      mockSendMembershipRenewalEmail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const { action } = await import('./renew-membership');
      const result = await action({ request: makeRequest(), params: {}, context: {} } as any);

      expect(result).toHaveProperty('submitted', true);
    });

    it('should call email function with correct parameters', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 456 });
      mockSendMembershipRenewalEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./renew-membership');
      await action({ request: makeRequest({ years: '2' }), params: {}, context: {} } as any);

      expect(mockSendMembershipRenewalEmail).toHaveBeenCalledTimes(1);
      const params = mockSendMembershipRenewalEmail.mock.calls[0][0];
      expect(params.userName).toBe('Test User');
      expect(params.userEmail).toBe('test@example.com');
      expect(params.requestId).toBe(456);
      expect(params.renewalDurationYears).toBe(2);
      expect(params.renewalAmount).toBe(1000); // individual: 500 * 2
    });

    it('should store request in database before triggering email', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 789 });
      mockSendMembershipRenewalEmail.mockResolvedValueOnce(undefined);

      const { action } = await import('./renew-membership');
      await action({ request: makeRequest(), params: {}, context: {} } as any);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      const insertCall = mockQuery.mock.calls[1];
      expect(insertCall[0]).toContain('INSERT INTO member_requests');
      expect(insertCall[0]).toContain('membership_renewal');
    });
  });

  describe('Duration Pricing', () => {
    it('should return correct amount for 1 year individual', async () => {
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 1 });

      const { action } = await import('./renew-membership');
      const result = await action({ request: makeRequest({ years: '1' }), params: {}, context: {} } as any) as any;

      expect(result.years).toBe(1);
      expect(result.amount).toBe(500);
    });

    it('should return correct amount for 3 years school_club', async () => {
      mockGetMemberById.mockResolvedValueOnce({ ...baseMember, membership_type: 'school_club' });
      mockQuery.mockResolvedValueOnce([]);
      mockQuery.mockResolvedValueOnce({ insertId: 2 });

      const { action } = await import('./renew-membership');
      const result = await action({ request: makeRequest({ years: '3' }), params: {}, context: {} } as any) as any;

      expect(result.years).toBe(3);
      expect(result.amount).toBe(6000); // school_club: 2000 * 3
    });
  });

  describe('Validation', () => {
    it('should reject invalid duration', async () => {
      mockQuery.mockResolvedValueOnce([]); // no pending request (duplicate check runs before year validation)

      const { action } = await import('./renew-membership');
      const result = await action({ request: makeRequest({ years: '5' }), params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Please select a valid duration (1, 2, or 3 years).' });
    });

    it('should prevent duplicate pending renewal requests', async () => {
      mockQuery.mockResolvedValueOnce([{ id: 1 }]); // existing pending

      const { action } = await import('./renew-membership');
      const result = await action({ request: makeRequest(), params: {}, context: {} } as any);

      expect(result).toHaveProperty('error');
      expect((result as any).error).toContain('pending renewal request');
      expect(mockSendMembershipRenewalEmail).not.toHaveBeenCalled();
    });
  });
});
