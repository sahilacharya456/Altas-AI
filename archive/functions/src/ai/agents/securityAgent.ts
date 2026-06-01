import { runAIGateway } from '../gateway';

export const runSecurityAgent = (userId: string, input: string) =>
    runAIGateway({ userId, agent: 'security', input });
