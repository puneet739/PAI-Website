import { describe, it, expect } from 'vitest';
import { PILOT_RATINGS, getRatingLabel, getRatingDescription } from './constants';

describe('Constants', () => {
  describe('PILOT_RATINGS', () => {
    it('should contain all pilot ratings', () => {
      expect(PILOT_RATINGS).toHaveLength(6);
      expect(PILOT_RATINGS[0].value).toBe('P1');
      expect(PILOT_RATINGS[5].value).toBe('P6');
    });

    it('should have correct structure for each rating', () => {
      PILOT_RATINGS.forEach(rating => {
        expect(rating).toHaveProperty('value');
        expect(rating).toHaveProperty('label');
        expect(rating).toHaveProperty('description');
        expect(typeof rating.value).toBe('string');
        expect(typeof rating.label).toBe('string');
        expect(typeof rating.description).toBe('string');
      });
    });
  });

  describe('getRatingLabel', () => {
    it('should return label for single valid rating', () => {
      expect(getRatingLabel('P1')).toBe('P1 - Beginner Pilot');
      expect(getRatingLabel('P2')).toBe('P2 - Novice Pilot');
      expect(getRatingLabel('P3')).toBe('P3 - Intermediate Pilot');
      expect(getRatingLabel('P4')).toBe('P4 - Advanced Pilot');
      expect(getRatingLabel('P5')).toBe('P5 - Master Pilot');
      expect(getRatingLabel('P6')).toBe('P6 - Special Pilot');
    });

    it('should return N/A for null or undefined', () => {
      expect(getRatingLabel(null)).toBe('N/A');
      expect(getRatingLabel(undefined)).toBe('N/A');
    });

    it('should return value itself for unknown rating', () => {
      expect(getRatingLabel('P99')).toBe('P99');
      expect(getRatingLabel('UNKNOWN')).toBe('UNKNOWN');
    });

    it('should handle CSV (comma-separated values)', () => {
      expect(getRatingLabel('P1,P2')).toBe('P1 - Beginner Pilot, P2 - Novice Pilot');
      expect(getRatingLabel('P1,P2,P3')).toBe('P1 - Beginner Pilot, P2 - Novice Pilot, P3 - Intermediate Pilot');
    });

    it('should handle CSV with spaces', () => {
      expect(getRatingLabel('P1, P2, P3')).toBe('P1 - Beginner Pilot, P2 - Novice Pilot, P3 - Intermediate Pilot');
      expect(getRatingLabel('P1 , P2 , P3')).toBe('P1 - Beginner Pilot, P2 - Novice Pilot, P3 - Intermediate Pilot');
    });

    it('should handle CSV with unknown ratings', () => {
      expect(getRatingLabel('P1,UNKNOWN,P3')).toBe('P1 - Beginner Pilot, UNKNOWN, P3 - Intermediate Pilot');
    });

    it('should handle empty string in CSV', () => {
      expect(getRatingLabel('P1,,P3')).toBe('P1 - Beginner Pilot, , P3 - Intermediate Pilot');
    });
  });

  describe('getRatingDescription', () => {
    it('should return description for valid rating', () => {
      expect(getRatingDescription('P1')).toBe('Basic paragliding knowledge');
      expect(getRatingDescription('P2')).toBe('Intermediate flying techniques');
      expect(getRatingDescription('P3')).toBe('Advanced maneuvers');
      expect(getRatingDescription('P4')).toBe('Expert level XC flying');
      expect(getRatingDescription('P5')).toBe('Professional competition level');
      expect(getRatingDescription('P6')).toBe('Special competition level');
    });

    it('should return empty string for null or undefined', () => {
      expect(getRatingDescription(null)).toBe('');
      expect(getRatingDescription(undefined)).toBe('');
    });

    it('should return empty string for unknown rating', () => {
      expect(getRatingDescription('P99')).toBe('');
      expect(getRatingDescription('UNKNOWN')).toBe('');
    });
  });
});
