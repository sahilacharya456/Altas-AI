import { getDocument, limit, orderBy, queryCollection } from '../firebase';
import type { AltasAIReport, ReportType } from '../../types/firestore';

const COLLECTION = 'reports';

export const listReports = async (userId: string, count = 20): Promise<AltasAIReport[]> => {
  const reports = await queryCollection<AltasAIReport>(COLLECTION, [
    orderBy('generatedAt', 'desc'),
    limit(count),
  ]);
  return reports.filter((report) => report.userId === userId);
};

export const listReportsByType = async (
  userId: string,
  type: ReportType,
  count = 10
): Promise<AltasAIReport[]> => {
  const reports = await queryCollection<AltasAIReport>(COLLECTION, [
    orderBy('generatedAt', 'desc'),
    limit(Math.max(count, 20)),
  ]);
  return reports.filter((report) => report.userId === userId && report.type === type).slice(0, count);
};

export const getLatestReport = async (
  userId: string,
  type: ReportType
): Promise<AltasAIReport | null> => {
  const reports = await listReportsByType(userId, type, 1);
  return reports[0] ?? null;
};

export const getReport = async (reportId: string): Promise<AltasAIReport | null> => {
  return getDocument<AltasAIReport>(`${COLLECTION}/${reportId}`);
};
