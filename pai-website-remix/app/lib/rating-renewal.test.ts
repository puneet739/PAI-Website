import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRatingRenewalRate, getRatingRenewalPrice, calculateNewExpiry } from './constants';

describe('Rating Renewal - Pricing', () => {
  describe('getRatingRenewalRate', () => {
    it('should return 0 for permanent ratings (no renewal needed)', () => {
      expect(getRatingRenewalRate('P1')).toBe(0);
      expect(getRatingRenewalRate('P6')).toBe(0);
      expect(getRatingRenewalRate('PPG4')).toBe(0);
      expect(getRatingRenewalRate('SCHOOL')).toBe(0);
      expect(getRatingRenewalRate('CLUB')).toBe(0);
    });

    it('should return 1000 for the 1000/yr annual ratings', () => {
      expect(getRatingRenewalRate('P7')).toBe(1000);
      expect(getRatingRenewalRate('P8')).toBe(1000);
      expect(getRatingRenewalRate('P9')).toBe(1000);
      expect(getRatingRenewalRate('P10')).toBe(1000);
      expect(getRatingRenewalRate('PPG5')).toBe(1000);
      expect(getRatingRenewalRate('PPG6')).toBe(1000);
      expect(getRatingRenewalRate('PPG7')).toBe(1000);
    });

    it('should return 0 for null, undefined, or empty', () => {
      expect(getRatingRenewalRate(null)).toBe(0);
      expect(getRatingRenewalRate(undefined)).toBe(0);
      expect(getRatingRenewalRate('')).toBe(0);
    });

    it('should return 0 for an unknown rating', () => {
      expect(getRatingRenewalRate('UNKNOWN')).toBe(0);
    });

    it('should pick the highest-priced rating when a member holds several (CSV)', () => {
      // P1 is permanent (0), P9 is 1000/yr -> highest wins
      expect(getRatingRenewalRate('P1,P9')).toBe(1000);
      // SCHOOL is permanent (0), P9 is 1000/yr -> highest wins
      expect(getRatingRenewalRate('P9,SCHOOL')).toBe(1000);
    });

    it('should handle CSV with spaces the same way getRatingLabel does', () => {
      expect(getRatingRenewalRate('P1, P9')).toBe(1000);
      expect(getRatingRenewalRate('P9 , SCHOOL')).toBe(1000);
    });

    it('should return 0 if every held rating is permanent', () => {
      expect(getRatingRenewalRate('P1,P2,P6')).toBe(0);
      expect(getRatingRenewalRate('SCHOOL,CLUB')).toBe(0);
    });
  });

  describe('getRatingRenewalPrice', () => {
    it('should multiply the annual rate by the number of years', () => {
      expect(getRatingRenewalPrice('P9', 1)).toBe(1000);
      expect(getRatingRenewalPrice('P9', 2)).toBe(2000);
      expect(getRatingRenewalPrice('P9', 3)).toBe(3000);
    });

    it('should use the highest-priced rating for multi-rating members', () => {
      expect(getRatingRenewalPrice('P9,SCHOOL', 2)).toBe(2000);
    });

    it('should be 0 for permanent ratings regardless of years', () => {
      expect(getRatingRenewalPrice('P1', 3)).toBe(0);
    });
  });
});

describe('Rating Renewal - Expiry Date Math', () => {
  // calculateNewExpiry is shared with membership renewal but this is what
  // renew-rating.tsx and the admin approval branch both call, so pin down
  // the exact behaviour that caused the 2100/2101/2102 bug.
  const REAL_DATE = Date;

  function freezeToday(isoDate: string) {
    // calculateNewExpiry reads Date.now() and shifts by IST offset itself,
    // so freeze Date.now() to the UTC instant that corresponds to that date at IST midday.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${isoDate}T06:30:00.000Z`));
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should extend from the existing expiry date when it is still in the future', () => {
    freezeToday('2026-08-11');
    // Currently valid until 2027-08-07 (still ahead of today) -> extend from that date
    expect(calculateNewExpiry('2027-08-07', 1)).toBe('2028-08-07');
    expect(calculateNewExpiry('2027-08-07', 2)).toBe('2029-08-07');
    expect(calculateNewExpiry('2027-08-07', 3)).toBe('2030-08-07');
  });

  it('should extend from today when the existing expiry has already passed', () => {
    freezeToday('2026-08-11');
    // Expired 20 days ago -> base date should be today, not the stale expiry
    expect(calculateNewExpiry('2026-07-22', 1)).toBe('2027-08-11');
  });

  it('should extend from today when there is no prior expiry (first-time renewal)', () => {
    freezeToday('2026-08-11');
    expect(calculateNewExpiry(null, 1)).toBe('2027-08-11');
    expect(calculateNewExpiry(undefined, 2)).toBe('2028-08-11');
  });

  it('regression: must never collapse to a 2099-anchored date for an annual rating', () => {
    // This is the exact bug the user found: a member on a 1000/yr rating
    // was showing 2100/2101/2102 because rating_valid_until had been left
    // at the permanent-rating backfill value (2099-12-31) instead of a
    // real near-term date before renewal math ran on it.
    freezeToday('2026-08-11');
    const newExpiry = calculateNewExpiry('2027-08-07', 1);
    expect(newExpiry.startsWith('2100')).toBe(false);
    expect(newExpiry).toBe('2028-08-07');
  });
});
