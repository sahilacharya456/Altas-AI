import type { RiskLevel } from '../../components/feedback';
import { ROUTES } from '../../constants/routes';

export type HomeRoutePath = (typeof ROUTES.MAIN)[keyof typeof ROUTES.MAIN];

export interface QuickModule {
  code: string;
  title: string;
  subtitle: string;
  path: HomeRoutePath;
}

export interface HomeCommandState {
  completionRate: number;
  remainingTasks: number;
  carriedCount: number;
  riskScore: number;
  riskLevel: RiskLevel;
  topPriority: string;
  riskReason: string;
  suggestedAction: string;
  warning: string;
  cortexInsight: string;
}
