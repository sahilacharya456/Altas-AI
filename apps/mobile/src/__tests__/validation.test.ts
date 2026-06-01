import {
  validateTask,
  validateEmail,
  validatePassword,
  sanitizeString,
} from '../utils/validation';

describe('validation utilities', () => {
  describe('validateTask', () => {
    const validTask = {
      title: 'Complete the project',
      status: 'pending',
      priority: 'high',
      estimatedMinutes: 60,
    };

    it('accepts valid task data', () => {
      expect(() => validateTask(validTask)).not.toThrow();
    });

    it('rejects empty title', () => {
      expect(() => validateTask({ ...validTask, title: '' })).toThrow();
    });

    it('rejects missing title', () => {
      const { title, ...noTitle } = validTask;
      expect(() => validateTask(noTitle)).toThrow();
    });

    it('rejects invalid priority', () => {
      expect(() => validateTask({ ...validTask, priority: 'extreme' })).toThrow();
    });

    it('rejects invalid status', () => {
      expect(() => validateTask({ ...validTask, status: 'unknown' })).toThrow();
    });

    it('rejects negative estimatedMinutes', () => {
      expect(() => validateTask({ ...validTask, estimatedMinutes: -5 })).toThrow();
    });

    it('accepts task without optional fields', () => {
      expect(() => validateTask({ title: 'Simple task' })).not.toThrow();
    });
  });

  describe('validateEmail', () => {
    it('accepts valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.name+tag@domain.org')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('@missing.local')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('accepts strong passwords', () => {
      expect(validatePassword('StrongP4ss')).toEqual({ valid: true });
      expect(validatePassword('MyP4ssword')).toEqual({ valid: true });
    });

    it('rejects short passwords', () => {
      const result = validatePassword('Ab1');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('8 characters');
    });

    it('rejects passwords without uppercase', () => {
      const result = validatePassword('alllower1');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('uppercase');
    });

    it('rejects passwords without lowercase', () => {
      const result = validatePassword('ALLUPPER1');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('lowercase');
    });

    it('rejects passwords without number', () => {
      const result = validatePassword('NoNumbers');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('number');
    });
  });

  describe('sanitizeString', () => {
    it('escapes HTML angle brackets', () => {
      const result = sanitizeString('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('escapes quotes', () => {
      const result = sanitizeString('"hello" & \'world\'');
      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
    });

    it('preserves normal text', () => {
      expect(sanitizeString('Hello world')).toBe('Hello world');
    });

    it('handles empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });
  });
});
