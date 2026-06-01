import { routeModelRequest } from './modelRouter';

describe('model router fallback behavior', () => {
    test('uses offline fallback when offline provider is requested', async () => {
        const response = await routeModelRequest({
            provider: 'offline',
            prompt: 'test',
            systemInstruction: 'test',
        });

        expect(response).toEqual({ provider: 'offline', text: '', offline: true });
    });

    test('does not call OpenAI placeholder provider', async () => {
        const response = await routeModelRequest({
            provider: 'openai',
            prompt: 'test',
            systemInstruction: 'test',
        });

        expect(response.provider).toBe('offline');
        expect(response.offline).toBe(true);
    });
});
