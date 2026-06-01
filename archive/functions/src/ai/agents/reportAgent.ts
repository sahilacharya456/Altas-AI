import { runAIGateway } from '../gateway';

export const runReportAgent = (userId: string, input: string) =>
    runAIGateway({ userId, agent: 'report', input });
