import { getTaskOverloadSeverity } from './interventionEngine';

describe('intervention rule helpers', () => {
    test('uses medium severity for normal overload', () => {
        expect(getTaskOverloadSeverity(7)).toBe('medium');
    });

    test('uses high severity for extreme overload', () => {
        expect(getTaskOverloadSeverity(10)).toBe('high');
    });
});
