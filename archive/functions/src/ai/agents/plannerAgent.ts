import { runAIGateway } from '../gateway';

export const runPlannerAgent = (userId: string, input: string) =>
    runAIGateway({ userId, agent: 'planner', input });
