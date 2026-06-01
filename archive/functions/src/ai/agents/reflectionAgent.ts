import { runAIGateway } from '../gateway';

export const runReflectionAgent = (userId: string, input: string) =>
    runAIGateway({ userId, agent: 'reflection', input });
