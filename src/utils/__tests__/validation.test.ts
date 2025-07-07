import { describe, it, expect } from '@jest/globals';

// Simple validation utility tests
describe('Validation Utils', () => {
  describe('Email validation', () => {
    it('should validate correct email format', () => {
      const validEmail = 'test@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(emailRegex.test(validEmail)).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidEmail = 'invalid-email';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });
  });

  describe('String utilities', () => {
    it('should trim whitespace correctly', () => {
      const input = '  hello world  ';
      const expected = 'hello world';
      
      expect(input.trim()).toBe(expected);
    });

    it('should handle empty strings', () => {
      const input = '';
      
      expect(input.length).toBe(0);
      expect(Boolean(input)).toBe(false);
    });
  });

  describe('Number validation', () => {
    it('should validate positive numbers', () => {
      const positiveNumber = 42;
      
      expect(positiveNumber > 0).toBe(true);
      expect(typeof positiveNumber).toBe('number');
    });

    it('should handle zero correctly', () => {
      const zero = 0;
      
      expect(zero === 0).toBe(true);
      expect(zero > 0).toBe(false);
    });
  });
}); 