import { describe, it, expect } from 'vitest';
import { hasActiveMembership } from './membership';

describe('hasActiveMembership', () => {
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  it('should allow life members even without an end date', () => {
    expect(hasActiveMembership({ is_life_member: 1, active_until: null })).toBe(true);
  });

  it('should allow life members with a past end date', () => {
    expect(hasActiveMembership({ is_life_member: 1, active_until: past })).toBe(true);
  });

  it('should block members who never took a membership', () => {
    expect(hasActiveMembership({ is_life_member: 0, active_until: null })).toBe(false);
  });

  it('should block members whose membership has expired', () => {
    expect(hasActiveMembership({ is_life_member: 0, active_until: past })).toBe(false);
  });

  it('should allow members whose membership has not expired', () => {
    expect(hasActiveMembership({ is_life_member: 0, active_until: future })).toBe(true);
  });
});
