import { getRecommendedAction, riskLevelForScore } from './cortex';

describe('deterministic Cortex risk helpers', () => {
    test('maps risk scores to levels', () => {
        expect(riskLevelForScore(10)).toBe('low');
        expect(riskLevelForScore(30)).toBe('medium');
        expect(riskLevelForScore(55)).toBe('high');
        expect(riskLevelForScore(80)).toBe('critical');
    });

    test('prioritizes critical action over generic guidance', () => {
        expect(getRecommendedAction('critical', [])).toContain('Stop adding work');
    });

    test('recommends reflection when reflection is the reason', () => {
        expect(getRecommendedAction('medium', ['No reflection has been logged today.'])).toContain('reflection');
    });
});
