import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { recommendationsRouter } from './recommendations.routes';
import { mentorRouter } from './features/mentor.routes';
import { reportsRouter } from './features/reports.routes';
import { goalsRouter } from './features/goals.routes';
import { interventionsRouter } from './features/interventions.routes';
import { cortexRouter } from './features/cortex.routes';
import { proofRouter } from './features/proof.routes';
import { reflectionRouter } from './features/reflection.routes';
import { budgetRouter, securityRouter } from './features/budget-security.routes';
import { rewardsRouter, subscriptionRouter } from './features/rewards-subscription.routes';

export const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.use('/recommendations', recommendationsRouter);
aiRouter.use('/mentor', mentorRouter);
aiRouter.use('/reports', reportsRouter);
aiRouter.use('/goals', goalsRouter);
aiRouter.use('/interventions', interventionsRouter);
aiRouter.use('/cortex', cortexRouter);
aiRouter.use('/proof-review', proofRouter);
aiRouter.use('/reflection', reflectionRouter);
aiRouter.use('/budget', budgetRouter);
aiRouter.use('/security', securityRouter);
aiRouter.use('/reward', rewardsRouter);
aiRouter.use('/subscription', subscriptionRouter);