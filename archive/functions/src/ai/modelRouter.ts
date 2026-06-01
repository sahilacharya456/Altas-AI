import { generateGeminiText, hasGeminiApiKey, logger } from '../shared';

export type ModelProvider = 'gemini' | 'openai' | 'offline';

export interface ModelRequest {
    provider?: ModelProvider;
    prompt: string;
    systemInstruction: string;
    maxOutputTokens?: number;
    temperature?: number;
    responseMimeType?: string;
}

export interface ModelResponse {
    provider: ModelProvider;
    text: string;
    offline: boolean;
}

export async function routeModelRequest(request: ModelRequest): Promise<ModelResponse> {
    const provider = request.provider ?? (hasGeminiApiKey ? 'gemini' : 'offline');

    if (provider === 'openai') {
        logger.warn('OpenAI provider requested but not configured; using offline fallback');
        return { provider: 'offline', text: '', offline: true };
    }

    if (provider === 'offline') {
        return { provider: 'offline', text: '', offline: true };
    }

    try {
        const text = await generateGeminiText({
            contents: request.prompt,
            systemInstruction: request.systemInstruction,
            maxOutputTokens: request.maxOutputTokens,
            temperature: request.temperature,
            responseMimeType: request.responseMimeType,
        });
        return { provider: 'gemini', text, offline: false };
    } catch (error) {
        logger.warn('Gemini request failed; using offline fallback', {
            error: error instanceof Error ? error.message : String(error),
        });
        return { provider: 'offline', text: '', offline: true };
    }
}
