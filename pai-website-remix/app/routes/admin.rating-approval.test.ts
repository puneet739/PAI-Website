import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockQuery = vi.fn();
const mockGetMemberById = vi.fn();
const mockRequireAdminOrInstructor = vi.fn();

vi.mock('~/lib/db.server', () => ({
  query: (...args: any[]) => mockQuery(...args),
}));

vi.mock('~/lib/auth.server', () => ({
  getMemberById: (...args: any[]) => mockGetMemberById(...args),
}));

vi.mock('~/lib/rbac.server', () => ({
  requireAdminOrInstructor: (...args: any[]) => mockRequireAdminOrInstructor(...args),
}));

function makeApproveRequest(requestId: string) {
  const formData = new URLSearchParams({ requestId, action: 'approve' });
  return new Request('http://localhost/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });
}

describe('Admin approval - rating_upgrade resyncs rating_valid_until', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdminOrInstructor.mockResolvedValue({ userId: 1 });
    mockGetMemberById.mockResolvedValue({ id: 1, name: 'Admin User' });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-11T06:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should set rating_valid_until to a real near-term date when upgrading to an annual rating', async () => {
    // request lookup, then request-status update, then requested_rating lookup, before, after
    mockQuery.mockResolvedValueOnce([
      { member_id: 2, request_type: 'rating_upgrade', renewal_membership_type: null, renewal_duration_years: null },
    ]);
    mockQuery.mockResolvedValueOnce({}); // status update
    mockQuery.mockResolvedValueOnce([{ requested_rating: 'P9' }]); // ratingDetails
    mockQuery.mockResolvedValueOnce([{ pilot_rating: 'P4' }]); // before
    mockQuery.mockResolvedValueOnce({}); // UPDATE members
    mockQuery.mockResolvedValueOnce([{ pilot_rating: 'P9' }]); // after
    mockQuery.mockResolvedValueOnce({}); // audit log insert

    const { action } = await import('./admin');
    const result = await action({ request: makeApproveRequest('10'), params: {}, context: {} } as any);

    expect(result).toEqual({ success: true, message: 'Request approved successfully' });

    const updateMembersCall = mockQuery.mock.calls[4];
    expect(updateMembersCall[0]).toContain('UPDATE members SET pilot_rating');
    const [, newRatingValidUntil] = updateMembersCall[1];
    // Must be a real 2027 date one year out, never the 2099 permanent-rating placeholder
    expect(newRatingValidUntil).toBe('2027-08-11');
    expect(newRatingValidUntil.startsWith('2099')).toBe(false);
  });

  it('should set rating_valid_until to 2099-12-31 when upgrading to a permanent rating', async () => {
    mockQuery.mockResolvedValueOnce([
      { member_id: 2, request_type: 'rating_upgrade', renewal_membership_type: null, renewal_duration_years: null },
    ]);
    mockQuery.mockResolvedValueOnce({});
    mockQuery.mockResolvedValueOnce([{ requested_rating: 'P5' }]); // permanent
    mockQuery.mockResolvedValueOnce([{ pilot_rating: 'P4' }]);
    mockQuery.mockResolvedValueOnce({});
    mockQuery.mockResolvedValueOnce([{ pilot_rating: 'P5' }]);
    mockQuery.mockResolvedValueOnce({});

    const { action } = await import('./admin');
    await action({ request: makeApproveRequest('11'), params: {}, context: {} } as any);

    const updateMembersCall = mockQuery.mock.calls[4];
    const [, newRatingValidUntil] = updateMembersCall[1];
    expect(newRatingValidUntil).toBe('2099-12-31');
  });
});

describe('Admin approval - rating_renewal extends rating_valid_until', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdminOrInstructor.mockResolvedValue({ userId: 1 });
    mockGetMemberById.mockResolvedValue({ id: 1, name: 'Admin User' });
  });

  it('should extend from the greatest of today and the existing expiry, for the requested duration', async () => {
    mockQuery.mockResolvedValueOnce([
      { member_id: 2, request_type: 'rating_renewal', renewal_membership_type: null, renewal_duration_years: 2 },
    ]);
    mockQuery.mockResolvedValueOnce({}); // status update
    mockQuery.mockResolvedValueOnce([{ rating_valid_until: '2027-08-07' }]); // before
    mockQuery.mockResolvedValueOnce({}); // UPDATE members
    mockQuery.mockResolvedValueOnce([{ rating_valid_until: '2029-08-07' }]); // after
    mockQuery.mockResolvedValueOnce({}); // audit log

    const { action } = await import('./admin');
    const result = await action({ request: makeApproveRequest('20'), params: {}, context: {} } as any);

    expect(result).toEqual({ success: true, message: 'Request approved successfully' });

    const updateCall = mockQuery.mock.calls[3];
    expect(updateCall[0]).toContain('DATE_ADD(GREATEST(CURDATE(), COALESCE(rating_valid_until, CURDATE())), INTERVAL ? YEAR)');
    expect(updateCall[1]).toEqual([2, 2]); // [years, member_id]
  });

  it('should default to 1 year when renewal_duration_years is missing', async () => {
    mockQuery.mockResolvedValueOnce([
      { member_id: 2, request_type: 'rating_renewal', renewal_membership_type: null, renewal_duration_years: null },
    ]);
    mockQuery.mockResolvedValueOnce({});
    mockQuery.mockResolvedValueOnce([{ rating_valid_until: '2027-08-07' }]);
    mockQuery.mockResolvedValueOnce({});
    mockQuery.mockResolvedValueOnce([{ rating_valid_until: '2028-08-07' }]);
    mockQuery.mockResolvedValueOnce({});

    const { action } = await import('./admin');
    await action({ request: makeApproveRequest('21'), params: {}, context: {} } as any);

    const updateCall = mockQuery.mock.calls[3];
    expect(updateCall[1]).toEqual([1, 2]);
  });
});
