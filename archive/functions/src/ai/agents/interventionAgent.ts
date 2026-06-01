import { runAIGateway } from '../gateway';

export const runInterventionAgent = (userId: string, input: string) =>
    runAIGateway({ userId, agent: 'intervention', input });
