import { runAIGateway } from '../gateway';

export const runCommandAgent = (userId: string, input: string) =>
    runAIGateway({ userId, agent: 'command', input });
