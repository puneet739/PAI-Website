import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  getMembershipBadgeColor,
  getStatusBadgeColor,
  isValidEmail,
  isValidPhone,
} from './utils';

describe('Utils - formatCurrency', () => {
  it('should format amount in Indian Rupees', () => {
    expect(formatCurrency(1000)).toBe('₹1,000');
    expect(formatCurrency(100000)).toBe('₹1,00,000');
    expect(formatCurrency(5000000)).toBe('₹50,00,000');
  });

  it('should handle zero amount', () => {
    expect(formatCurrency(0)).toBe('₹0');
  });

  it('should handle decimal amounts by rounding', () => {
    expect(formatCurrency(1234.56)).toBe('₹1,235');
  });
});

describe('Utils - formatDate', () => {
  it('should format date string in Indian locale', () => {
    const date = '2024-12-25';
    const formatted = formatDate(date);
    expect(formatted).toMatch(/25.*Dec.*2024/);
  });

  it('should format Date object', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date);
    expect(formatted).toMatch(/15.*Jan.*2024/);
  });
});

describe('Utils - getMembershipBadgeColor', () => {
  it('should return purple classes for instructor', () => {
    const result = getMembershipBadgeColor('instructor');
    expect(result).toContain('purple');
  });

  it('should return blue classes for premium', () => {
    const result = getMembershipBadgeColor('premium');
    expect(result).toContain('blue');
  });

  it('should return gray classes for basic', () => {
    const result = getMembershipBadgeColor('basic');
    expect(result).toContain('gray');
  });

  it('should return default gray classes for unknown type', () => {
    const result = getMembershipBadgeColor('unknown');
    expect(result).toContain('gray');
  });
});

describe('Utils - getStatusBadgeColor', () => {
  it('should return green classes for active status', () => {
    const result = getStatusBadgeColor('active');
    expect(result).toContain('green');
  });

  it('should return yellow classes for pending status', () => {
    const result = getStatusBadgeColor('pending');
    expect(result).toContain('yellow');
  });

  it('should return red classes for rejected status', () => {
    const result = getStatusBadgeColor('rejected');
    expect(result).toContain('red');
  });

  it('should return gray classes for unknown status', () => {
    const result = getStatusBadgeColor('unknown');
    expect(result).toContain('gray');
  });
});

describe('Utils - isValidEmail', () => {
  it('should validate correct email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.in')).toBe(true);
    expect(isValidEmail('admin@pgaoi.org')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test @example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('Utils - isValidPhone', () => {
  it('should validate correct phone numbers', () => {
    expect(isValidPhone('9876543210')).toBe(true);
    expect(isValidPhone('+919876543210')).toBe(true);
    expect(isValidPhone('91-9876543210')).toBe(true);
    expect(isValidPhone('+91 98765 43210')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('abcdefghij')).toBe(false);
    expect(isValidPhone('')).toBe(false);
    expect(isValidPhone('12345')).toBe(false);
  });

  it('should handle phone numbers with spaces and dashes', () => {
    expect(isValidPhone('987-654-3210')).toBe(true);
    expect(isValidPhone('987 654 3210')).toBe(true);
  });
});
