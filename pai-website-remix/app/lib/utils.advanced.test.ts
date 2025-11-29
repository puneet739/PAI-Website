import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  getMembershipBadgeColor,
  getStatusBadgeColor,
  isValidEmail,
  isValidPhone,
} from './utils';

describe('Utils - Advanced Tests', () => {
  describe('formatCurrency - Edge Cases', () => {
    it('should handle negative amounts', () => {
      expect(formatCurrency(-1000)).toBe('-₹1,000');
    });

    it('should handle very large amounts', () => {
      const result = formatCurrency(10000000);
      expect(result).toContain('₹');
      expect(result).toContain('1,00,00,000');
    });

    it('should handle fractional amounts correctly', () => {
      expect(formatCurrency(1234.99)).toBe('₹1,235');
      expect(formatCurrency(1234.01)).toBe('₹1,234');
    });
  });

  describe('formatDate - Edge Cases', () => {
    it('should handle different date formats', () => {
      const date1 = formatDate('2024-01-01');
      const date2 = formatDate(new Date('2024-01-01'));
      
      expect(date1).toMatch(/1.*Jan.*2024/);
      expect(date2).toMatch(/1.*Jan.*2024/);
    });

    it('should handle leap year dates', () => {
      const leapDay = formatDate('2024-02-29');
      expect(leapDay).toMatch(/29.*Feb.*2024/);
    });

    it('should handle end of year dates', () => {
      const endOfYear = formatDate('2024-12-31');
      expect(endOfYear).toMatch(/31.*Dec.*2024/);
    });
  });

  describe('getMembershipBadgeColor - All Cases', () => {
    it('should handle all membership types', () => {
      expect(getMembershipBadgeColor('instructor')).toContain('purple');
      expect(getMembershipBadgeColor('premium')).toContain('blue');
      expect(getMembershipBadgeColor('basic')).toContain('gray');
    });

    it('should handle case sensitivity', () => {
      expect(getMembershipBadgeColor('INSTRUCTOR')).toContain('gray');
      expect(getMembershipBadgeColor('Premium')).toContain('gray');
    });

    it('should return default for empty string', () => {
      expect(getMembershipBadgeColor('')).toContain('gray');
    });

    it('should include dark mode classes', () => {
      const result = getMembershipBadgeColor('premium');
      expect(result).toContain('dark:');
    });
  });

  describe('getStatusBadgeColor - All Cases', () => {
    it('should handle all status types', () => {
      expect(getStatusBadgeColor('active')).toContain('green');
      expect(getStatusBadgeColor('pending')).toContain('yellow');
      expect(getStatusBadgeColor('inactive')).toContain('gray');
      expect(getStatusBadgeColor('approved')).toContain('green');
      expect(getStatusBadgeColor('rejected')).toContain('red');
    });

    it('should return default for unknown status', () => {
      expect(getStatusBadgeColor('processing')).toContain('gray');
    });

    it('should include dark mode classes', () => {
      const result = getStatusBadgeColor('active');
      expect(result).toContain('dark:');
    });
  });

  describe('isValidEmail - Comprehensive Tests', () => {
    it('should validate various valid email formats', () => {
      const validEmails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user_name@example.com',
        'user123@example.com',
        'user@subdomain.example.com',
        'user@example.co.in',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject various invalid email formats', () => {
      const invalidEmails = [
        'plaintext',
        '@example.com',
        'user@',
        'user @example.com',
        '',
        ' ',
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('isValidPhone - Comprehensive Tests', () => {
    it('should validate various valid phone formats', () => {
      const validPhones = [
        '9876543210',
        '+919876543210',
        '919876543210',
        '+91 9876543210',
        '91-9876543210',
        '987-654-3210',
        '987 654 3210',
        '+91-987-654-3210',
      ];

      validPhones.forEach(phone => {
        expect(isValidPhone(phone)).toBe(true);
      });
    });

    it('should reject various invalid phone formats', () => {
      const invalidPhones = [
        '123',
        '12345',
        'abcdefghij',
        '123abc4567',
        '',
        ' ',
        '+++123456789',
        '12-34-56',
      ];

      invalidPhones.forEach(phone => {
        expect(isValidPhone(phone)).toBe(false);
      });
    });

    it('should handle international format', () => {
      expect(isValidPhone('+919876543210')).toBe(true);
      expect(isValidPhone('+1234567890123')).toBe(true);
    });
  });
});
