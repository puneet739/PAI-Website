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

function makeUpdateMemberRequest(fields: Record<string, string | string[]>) {
  const formData = new URLSearchParams();
  formData.append('_action', 'updateMember');
  formData.append('userId', '2');
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(key, v));
    } else {
      formData.append(key, value);
    }
  }
  return new Request('http://localhost/manage-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });
}

const baseFields = {
  name: 'John Pilot',
  email: 'john@example.com',
  phone: '+919876543210',
  membershipType: 'individual',
  membershipStatus: 'active',
  totalFlights: '10',
  totalFlightHours: '20',
};

describe('Manage Users - direct pilot rating edit resyncs rating_valid_until', () => {
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

  it('should recompute rating_valid_until when the admin changes the pilot rating (bug: this used to be skipped)', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 2, pilot_rating: 'P4', rating_valid_until: '2099-12-31' }]); // existing
    mockQuery.mockResolvedValueOnce({}); // UPDATE members
    mockQuery.mockResolvedValueOnce({}); // audit log insert

    const { action } = await import('./manage-users');
    const request = makeUpdateMemberRequest({ ...baseFields, pilotRating: ['P9'] });

    await action({ request, params: {}, context: {} } as any);

    const updateCall = mockQuery.mock.calls[1];
    expect(updateCall[0]).toContain('rating_valid_until = COALESCE(?, rating_valid_until)');
    // UPDATE params are positional: [..., pilot_rating(11), rating_valid_until(12), total_flights(13), total_flight_hours(14), userId(15)]
    const params = updateCall[1];
    const newRatingValidUntil = params[12];
    expect(newRatingValidUntil).toBe('2027-08-11');
    expect(newRatingValidUntil).not.toBe('2099-12-31');
  });

  it('should leave rating_valid_until untouched (pass null so COALESCE keeps it) when the rating is unchanged', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 2, pilot_rating: 'P9', rating_valid_until: '2027-08-07' }]); // existing, same rating
    mockQuery.mockResolvedValueOnce({}); // UPDATE members

    const { action } = await import('./manage-users');
    const request = makeUpdateMemberRequest({ ...baseFields, pilotRating: ['P9'] });

    await action({ request, params: {}, context: {} } as any);

    const updateCall = mockQuery.mock.calls[1];
    const params = updateCall[1];
    const newRatingValidUntil = params[12];
    expect(newRatingValidUntil).toBeNull();
  });

  it('should set rating_valid_until to the 2099 placeholder when switching to a permanent rating', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 2, pilot_rating: 'P9', rating_valid_until: '2027-08-07' }]);
    mockQuery.mockResolvedValueOnce({});
    mockQuery.mockResolvedValueOnce({}); // audit log

    const { action } = await import('./manage-users');
    const request = makeUpdateMemberRequest({ ...baseFields, pilotRating: ['P4'] });

    await action({ request, params: {}, context: {} } as any);

    const updateCall = mockQuery.mock.calls[1];
    const params = updateCall[1];
    const newRatingValidUntil = params[12];
    expect(newRatingValidUntil).toBe('2099-12-31');
  });

  it('should let a manually-entered Rating Valid Until date override the auto-resync, even when the rating also changed', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 2, pilot_rating: 'P4', rating_valid_until: '2099-12-31' }]); // existing
    mockQuery.mockResolvedValueOnce({}); // UPDATE members
    mockQuery.mockResolvedValueOnce({}); // audit log insert

    const { action } = await import('./manage-users');
    const request = makeUpdateMemberRequest({
      ...baseFields,
      pilotRating: ['P9'],
      ratingValidUntil: '2030-01-15',
    });

    await action({ request, params: {}, context: {} } as any);

    const updateCall = mockQuery.mock.calls[1];
    const params = updateCall[1];
    const newRatingValidUntil = params[12];
    // Manual override wins over the auto-computed 1-year resync
    expect(newRatingValidUntil).toBe('2030-01-15');
  });
});
