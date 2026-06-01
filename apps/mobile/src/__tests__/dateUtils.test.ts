// @ts-expect-error — define __DEV__ for test environment
globalThis.__DEV__ = true;

import { convertToDate, isSameDay, formatDate, isPast, isFuture } from '../utils/dateUtils';

describe('dateUtils', () => {
  describe('convertToDate', () => {
    it('returns Date object as-is', () => {
      const d = new Date(2026, 5, 1);
      expect(convertToDate(d)).toBe(d);
    });

    it('converts Firestore Timestamp-like object', () => {
      const timestamp = { toDate: () => new Date(2026, 5, 1) };
      const result = convertToDate(timestamp);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(5);
    });

    it('converts ISO string', () => {
      const result = convertToDate('2026-06-01T12:00:00.000Z');
      expect(result.getFullYear()).toBe(2026);
    });

    it('converts numeric timestamp', () => {
      const ts = new Date(2026, 5, 1).getTime();
      const result = convertToDate(ts);
      expect(result.getFullYear()).toBe(2026);
    });

    it('falls back to current date for invalid input', () => {
      const before = Date.now();
      const result = convertToDate(null);
      const after = Date.now();
      expect(result.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.getTime()).toBeLessThanOrEqual(after);
    });

    it('falls back for undefined', () => {
      const result = convertToDate(undefined);
      expect(result instanceof Date).toBe(true);
    });
  });

  describe('isSameDay', () => {
    it('returns true for same date', () => {
      const a = new Date(2026, 5, 1, 10, 0);
      const b = new Date(2026, 5, 1, 22, 30);
      expect(isSameDay(a, b)).toBe(true);
    });

    it('returns false for different dates', () => {
      const a = new Date(2026, 5, 1);
      const b = new Date(2026, 5, 2);
      expect(isSameDay(a, b)).toBe(false);
    });

    it('returns false for different months', () => {
      const a = new Date(2026, 4, 1);
      const b = new Date(2026, 5, 1);
      expect(isSameDay(a, b)).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('returns YYYY-MM-DD format', () => {
      // Use a UTC date to avoid timezone shift issues
      const d = new Date('2026-06-15T12:00:00Z');
      expect(formatDate(d)).toBe('2026-06-15');
    });

    it('pads single digit months and days', () => {
      const d = new Date('2026-01-05T12:00:00Z');
      expect(formatDate(d)).toBe('2026-01-05');
    });
  });

  describe('isPast', () => {
    it('returns true for past dates', () => {
      expect(isPast(new Date(2020, 0, 1))).toBe(true);
    });

    it('returns false for future dates', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(isPast(future)).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('returns true for future dates', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(isFuture(future)).toBe(true);
    });

    it('returns false for past dates', () => {
      expect(isFuture(new Date(2020, 0, 1))).toBe(false);
    });
  });
});
