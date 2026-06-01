import { db, logger, safeParseJSON } from '../shared';
import { retrieveSafeMemory } from './memory';
import { buildPrompt } from './promptEngine';
import { applySafetyFilter } from './safety';
import { routeModelRequest, type ModelProvider } from './modelRouter';
import { type AgentOutput, type AgentType, fallbackForAgent, validateAgentOutput } from './schemas';

export interface AIGatewayRequest<T extends AgentType> {
    userId: string;
    agent: T;
    input: string;
    provider?: ModelProvider;
}

export interface AIGatewayResponse<T extends AgentType> {
    output: AgentOutput<T>;
    provider: ModelProvider;
    offline: boolean;
    warnings: string[];
}

export async function runAIGateway<T extends AgentType>(
    request: AIGatewayRequest<T>
): Promise<AIGatewayResponse<T>> {
    const filtered = applySafetyFilter(request.input);
    const memory = await retrieveSafeMemory(request.userId);
    const prompt = buildPrompt(request.agent, filtered.safeInput, memory);

    const model = await routeModelRequest({
        provider: request.provider,
        prompt: prompt.prompt,
        systemInstruction: prompt.systemInstruction,
        maxOutputTokens: request.agent === 'report' ? 900 : 500,
        temperature: request.agent === 'mentor' ? 0.7 : 0.4,
        responseMimeType: 'application/json',
    });

    let output: AgentOutput<T>;
    if (model.offline || !model.text) {
        output = fallbackForAgent(request.agent);
    } else {
        const parsed = await safeParseJSON<unknown>(model.text, fallbackForAgent(request.agent), request.userId, `aiGateway_${request.agent}`);
        output = validateAgentOutput(request.agent, parsed);
    }

    await db.collection(`users/${request.userId}/aiGatewayLogs`).add({
        agent: request.agent,
        provider: model.provider,
        offline: model.offline,
        warningCount: filtered.warnings.length,
        createdAt: new Date(),
    }).catch((error) => logger.warn('Failed to write AI gateway metadata', { userId: request.userId, error }));

    return {
        output,
        provider: model.provider,
        offline: model.offline,
        warnings: filtered.warnings,
    };
}
