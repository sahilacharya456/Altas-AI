import {
    fallbackDailyBriefing,
    fallbackWeeklyReport,
    validateAgentOutput,
} from './schemas';

describe('AI schema fallbacks', () => {
    test('falls back when command output is malformed', () => {
        expect(validateAgentOutput('command', { nope: true })).toEqual(fallbackDailyBriefing());
    });

    test('accepts valid weekly report shape', () => {
        const report = {
            summary: 'Strong week.',
            wins: ['Completed focus blocks'],
            risks: ['Carried work'],
            nextWeekActions: ['Plan top 3 only'],
        };

        expect(validateAgentOutput('report', report)).toEqual(report);
    });

    test('weekly fallback is explicit about offline mode', () => {
        expect(fallbackWeeklyReport().summary.toLowerCase()).toContain('fallback');
    });
});
