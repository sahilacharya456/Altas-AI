import { runAIGateway } from '../gateway';

export const runFinanceAgent = (userId: string, input: string) =>
    runAIGateway({ userId, agent: 'finance', input });
