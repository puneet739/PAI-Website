import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();
const mockGetMemberById = vi.fn();
const mockRequireUserId = vi.fn();

vi.mock('~/lib/db.server', () => ({
  query: (...args: any[]) => mockQuery(...args),
}));

vi.mock('~/lib/auth.server', () => ({
  getMemberById: (...args: any[]) => mockGetMemberById(...args),
}));

vi.mock('~/lib/session.server', () => ({
  requireUserId: (...args: any[]) => mockRequireUserId(...args),
}));

function makeRequest(fields: Record<string, string>) {
  const formData = new URLSearchParams(fields);
  return new Request('http://localhost/renew-rating', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });
}

describe('Renew Rating - action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUserId.mockResolvedValue(2);
  });

  describe('Permanent rating guard', () => {
    it('should block renewal for a member whose ratings are all permanent', async () => {
      mockGetMemberById.mockResolvedValue({
        id: 2,
        name: 'John Pilot',
        email: 'john@example.com',
        phone: '+919876543210',
        pilot_rating: 'P4',
        rating_valid_until: '2099-12-31',
        membership_id: 'PAI-MEM-00002',
      });

      const { action } = await import('./renew-rating');
      const request = makeRequest({ years: '1', step: 'review' });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Your current rating(s) do not require renewal.' });
      // No DB call should happen before the permanent-rating check even runs
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('Review step (no DB write yet)', () => {
    it('should return a payment preview without inserting a request', async () => {
      mockGetMemberById.mockResolvedValue({
        id: 2,
        name: 'John Pilot',
        email: 'john@example.com',
        phone: '+919876543210',
        pilot_rating: 'P9',
        rating_valid_until: '2027-08-07',
        membership_id: 'PAI-MEM-00002',
      });
      mockQuery.mockResolvedValueOnce([]); // duplicate-pending check only

      const { action } = await import('./renew-rating');
      const request = makeRequest({ years: '2' }); // no step -> defaults to review

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toMatchObject({ showPayment: true, years: 2, amount: 2000 });
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('Confirm step', () => {
    it('should insert a rating_renewal request with the highest-priced rating fee', async () => {
      mockGetMemberById.mockResolvedValue({
        id: 2,
        name: 'John Pilot',
        email: 'john@example.com',
        phone: '+919876543210',
        pilot_rating: 'P9,SCHOOL', // multi-rating: P9 (1000/yr) should win, SCHOOL is permanent (0)
        rating_valid_until: '2027-08-07',
        membership_id: 'PAI-MEM-00002',
      });
      mockQuery.mockResolvedValueOnce([]); // duplicate-pending check
      mockQuery.mockResolvedValueOnce({ insertId: 501 }); // insert

      const { action } = await import('./renew-rating');
      const request = makeRequest({ years: '1', step: 'confirm' });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toMatchObject({ submitted: true, requestId: 501, years: 1, amount: 1000 });

      const insertCall = mockQuery.mock.calls[1];
      expect(insertCall[0]).toContain('INSERT INTO member_requests');
      expect(insertCall[0]).toContain('rating_renewal');
      // current_rating stored should be the full CSV the member actually holds
      expect(insertCall[1]).toContain('P9,SCHOOL');
    });

    it('should reject a duration outside 1/2/3 years', async () => {
      mockGetMemberById.mockResolvedValue({
        id: 2,
        name: 'John Pilot',
        email: 'john@example.com',
        phone: '+919876543210',
        pilot_rating: 'P9',
        rating_valid_until: '2027-08-07',
        membership_id: 'PAI-MEM-00002',
      });
      mockQuery.mockResolvedValueOnce([]); // duplicate-pending check

      const { action } = await import('./renew-rating');
      const request = makeRequest({ years: '5', step: 'confirm' });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({ error: 'Please select a valid duration (1, 2, or 3 years).' });
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should block a second renewal while one is already pending', async () => {
      mockGetMemberById.mockResolvedValue({
        id: 2,
        name: 'John Pilot',
        email: 'john@example.com',
        phone: '+919876543210',
        pilot_rating: 'P9',
        rating_valid_until: '2027-08-07',
        membership_id: 'PAI-MEM-00002',
      });
      mockQuery.mockResolvedValueOnce([{ id: 77 }]); // an existing pending request

      const { action } = await import('./renew-rating');
      const request = makeRequest({ years: '1', step: 'confirm' });

      const result = await action({ request, params: {}, context: {} } as any);

      expect(result).toEqual({
        error: 'You already have a pending rating renewal request. Please wait for admin approval.',
      });
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });
});
