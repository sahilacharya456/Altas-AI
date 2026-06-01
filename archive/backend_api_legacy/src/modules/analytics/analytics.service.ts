import { Types } from 'mongoose';
import { Task } from '../tasks/task.model.js';
import { Reflection } from '../reflection/reflection.model.js';
import { User } from '../users/user.model.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, format } from 'date-fns';

interface DailyStats {
    date: string;
    tasksCompleted: number;
    tasksMissed: number;
    tasksCarried: number;
    focusMinutes: number;
    productivity: number;
    discipline: number;
}

interface AnalyticsSummary {
    today: {
        tasksCompleted: number;
        tasksTotal: number;
        completionRate: number;
        focusMinutes: number;
    };
    thisWeek: {
        tasksCompleted: number;
        tasksTotal: number;
        completionRate: number;
        reflectionsCompleted: number;
        avgMood: number;
    };
    scores: {
        discipline: number;
        productivity: number;
        consistency: number;
        overall: number;
    };
    streak: {
        current: number;
        best: number;
        type: 'reflection' | 'tasks';
    };
    trends: {
        disciplineTrend: 'up' | 'down' | 'stable';
        productivityTrend: 'up' | 'down' | 'stable';
        weekOverWeekChange: number;
    };
}

export class AnalyticsService {
    // Get full analytics summary for dashboard
    async getSummary(userId: string): Promise<AnalyticsSummary> {
        const user = await User.findById(userId);
        if (!user) throw NotFoundError('User not found');

        const [todayStats, weekStats, streak, trends] = await Promise.all([
            this.getTodayStats(userId),
            this.getWeekStats(userId),
            this.calculateStreak(userId),
            this.calculateTrends(userId),
        ]);

        const scores = await this.calculateScores(userId);

        return {
            today: todayStats,
            thisWeek: weekStats,
            scores,
            streak,
            trends,
        };
    }

    // Get today's stats
    private async getTodayStats(userId: string): Promise<AnalyticsSummary['today']> {
        const today = new Date();
        const tasks = await Task.find({
            userId: new Types.ObjectId(userId),
            scheduledDate: { $gte: startOfDay(today), $lte: endOfDay(today) },
        }).lean();

        const completed = tasks.filter((t: { status: string }) => t.status === 'completed').length;
        const total = tasks.length;
        const focusMinutes = tasks
            .filter((t: { status: string }) => t.status === 'completed')
            .reduce((sum: number, t: { actualMinutes?: number; estimatedMinutes?: number }) =>
                sum + (t.actualMinutes || t.estimatedMinutes || 0), 0);

        return {
            tasksCompleted: completed,
            tasksTotal: total,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            focusMinutes,
        };
    }

    // Get this week's stats
    private async getWeekStats(userId: string): Promise<AnalyticsSummary['thisWeek']> {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        const [tasks, reflections] = await Promise.all([
            Task.find({
                userId: new Types.ObjectId(userId),
                scheduledDate: { $gte: weekStart, $lte: weekEnd },
            }).lean(),
            Reflection.find({
                userId: new Types.ObjectId(userId),
                date: { $gte: weekStart, $lte: weekEnd },
            }).lean(),
        ]);

        const completed = tasks.filter((t: { status: string }) => t.status === 'completed').length;
        const total = tasks.length;
        const avgMood = reflections.length > 0
            ? Math.round(reflections.reduce((sum: number, r: { mood: number }) => sum + r.mood, 0) / reflections.length * 10) / 10
            : 0;

        return {
            tasksCompleted: completed,
            tasksTotal: total,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            reflectionsCompleted: reflections.length,
            avgMood,
        };
    }

    // Calculate user scores
    private async calculateScores(userId: string): Promise<AnalyticsSummary['scores']> {
        const user = await User.findById(userId);
        if (!user) throw NotFoundError('User not found');

        const discipline = user.currentScores?.discipline || 50;
        const productivity = user.currentScores?.productivity || 50;
        const consistency = user.currentScores?.consistency || 50;
        const overall = Math.round((discipline + productivity + consistency) / 3);

        return { discipline, productivity, consistency, overall };
    }

    // Calculate streak
    private async calculateStreak(userId: string): Promise<AnalyticsSummary['streak']> {
        const reflections = await Reflection.find({
            userId: new Types.ObjectId(userId),
        })
            .sort({ date: -1 })
            .select('date')
            .lean();

        let current = 0;
        let currentDate = startOfDay(new Date());

        for (const reflection of reflections) {
            const reflectionDate = startOfDay(new Date(reflection.date));
            const expectedDate = startOfDay(subDays(currentDate, current));

            if (format(reflectionDate, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
                current++;
            } else if (current === 0 && format(reflectionDate, 'yyyy-MM-dd') === format(subDays(currentDate, 1), 'yyyy-MM-dd')) {
                current++;
                currentDate = subDays(currentDate, 1);
            } else {
                break;
            }
        }

        return {
            current,
            best: Math.max(current, 0), // TODO: Track all-time best
            type: 'reflection',
        };
    }

    // Calculate trends
    private async calculateTrends(userId: string): Promise<AnalyticsSummary['trends']> {
        const now = new Date();
        const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
        const lastWeekStart = subDays(thisWeekStart, 7);
        const lastWeekEnd = subDays(thisWeekStart, 1);

        const [thisWeekTasks, lastWeekTasks, recentReflections] = await Promise.all([
            Task.find({
                userId: new Types.ObjectId(userId),
                scheduledDate: { $gte: thisWeekStart, $lte: now },
            }).lean(),
            Task.find({
                userId: new Types.ObjectId(userId),
                scheduledDate: { $gte: lastWeekStart, $lte: lastWeekEnd },
            }).lean(),
            Reflection.find({
                userId: new Types.ObjectId(userId),
                date: { $gte: subDays(now, 14) },
            }).sort({ date: -1 }).lean(),
        ]);

        const thisWeekCompleted = thisWeekTasks.filter((t: { status: string }) => t.status === 'completed').length;
        const thisWeekTotal = thisWeekTasks.length;
        const lastWeekCompleted = lastWeekTasks.filter((t: { status: string }) => t.status === 'completed').length;
        const lastWeekTotal = lastWeekTasks.length;

        const thisWeekRate = thisWeekTotal > 0 ? thisWeekCompleted / thisWeekTotal : 0;
        const lastWeekRate = lastWeekTotal > 0 ? lastWeekCompleted / lastWeekTotal : 0;
        const weekOverWeekChange = Math.round((thisWeekRate - lastWeekRate) * 100);

        // Determine discipline trend from last 7 reflections
        const recentDiscipline = recentReflections
            .slice(0, 7)
            .map((r: { disciplineScore?: number }) => r.disciplineScore || 50);
        const oldDiscipline = recentReflections
            .slice(7, 14)
            .map((r: { disciplineScore?: number }) => r.disciplineScore || 50);

        const avgRecent = recentDiscipline.length > 0
            ? recentDiscipline.reduce((a: number, b: number) => a + b, 0) / recentDiscipline.length
            : 50;
        const avgOld = oldDiscipline.length > 0
            ? oldDiscipline.reduce((a: number, b: number) => a + b, 0) / oldDiscipline.length
            : 50;

        const disciplineTrend: 'up' | 'down' | 'stable' =
            avgRecent > avgOld + 5 ? 'up' : avgRecent < avgOld - 5 ? 'down' : 'stable';

        return {
            disciplineTrend,
            productivityTrend: weekOverWeekChange > 5 ? 'up' : weekOverWeekChange < -5 ? 'down' : 'stable',
            weekOverWeekChange,
        };
    }

    // Get daily breakdown for charts
    async getDailyBreakdown(userId: string, days = 30): Promise<DailyStats[]> {
        const now = new Date();
        const stats: DailyStats[] = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(now, i);
            const dayStart = startOfDay(date);
            const dayEnd = endOfDay(date);

            const [tasks, reflection] = await Promise.all([
                Task.find({
                    userId: new Types.ObjectId(userId),
                    scheduledDate: { $gte: dayStart, $lte: dayEnd },
                }).lean(),
                Reflection.findOne({
                    userId: new Types.ObjectId(userId),
                    date: { $gte: dayStart, $lte: dayEnd },
                }).lean(),
            ]);

            const completed = tasks.filter((t: { status: string }) => t.status === 'completed').length;
            const missed = tasks.filter((t: { status: string }) => t.status === 'pending' || t.status === 'in_progress').length;
            const carried = tasks.filter((t: { isCarried?: boolean }) => t.isCarried).length;
            const focusMinutes = tasks
                .filter((t: { status: string }) => t.status === 'completed')
                .reduce((sum: number, t: { actualMinutes?: number; estimatedMinutes?: number }) =>
                    sum + (t.actualMinutes || t.estimatedMinutes || 0), 0);

            stats.push({
                date: format(date, 'yyyy-MM-dd'),
                tasksCompleted: completed,
                tasksMissed: missed,
                tasksCarried: carried,
                focusMinutes,
                productivity: reflection?.productivityScore || 0,
                discipline: reflection?.disciplineScore || 0,
            });
        }

        return stats;
    }
}

export const analyticsService = new AnalyticsService();
