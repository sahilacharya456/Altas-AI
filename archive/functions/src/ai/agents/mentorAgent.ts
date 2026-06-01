import { runAIGateway } from '../gateway';

export const runMentorAgent = (userId: string, input: string) =>
    runAIGateway({ userId, agent: 'mentor', input });
