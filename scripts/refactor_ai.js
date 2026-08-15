const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, 'src/controllers/ai.controller.ts');
let content = fs.readFileSync(controllerPath, 'utf8');

// 1. Add imports for security and tasks
content = `import { sanitizePrompt } from '../services/security';\nimport { getDailyTaskStats } from '../services/tasks';\n` + content;

// Remove aiRouter stuff
content = content.replace(/export const aiRouter = Router\(\);\n\naiRouter\.use\(requireAuth\);\n/, '');
content = content.replace(/aiRouter\.use\('\/recommendations', recommendationsRouter\);\n/, '');

// Convert routes to exported handlers
content = content.replace(/aiRouter\.post\('\/mentor', asyncHandler\(async \(req, res\) => \{/g, 'export const handleMentor = asyncHandler(async (req, res) => {');
content = content.replace(/aiRouter\.post\('\/daily-briefing', asyncHandler\(async \(req, res\) => \{/g, 'export const handleDailyBriefing = asyncHandler(async (req, res) => {');
content = content.replace(/aiRouter\.post\('\/weekly-report', asyncHandler\(async \(req, res\) => \{/g, 'export const handleWeeklyReport = asyncHandler(async (req, res) => {');
content = content.replace(/aiRouter\.post\('\/goal-breakdown', asyncHandler\(async \(req, res\) => \{/g, 'export const handleGoalBreakdown = asyncHandler(async (req, res) => {');
content = content.replace(/aiRouter\.post\('\/reflection-feedback', asyncHandler\(async \(req, res\) => \{/g, 'export const handleReflectionFeedback = asyncHandler(async (req, res) => {');
content = content.replace(/aiRouter\.post\('\/budget-discipline', asyncHandler\(async \(req, res\) => \{/g, 'export const handleBudgetDiscipline = asyncHandler(async (req, res) => {');
content = content.replace(/aiRouter\.post\('\/interventions', asyncHandler\(async \(req, res\) => \{/g, 'export const handleInterventions = asyncHandler(async (req, res) => {');
content = content.replace(/aiRouter\.post\('\/security-advice', asyncHandler\(async \(req, res\) => \{/g, 'export const handleSecurityAdvice = asyncHandler(async (req, res) => {');
content = content.replace(/aiRouter\.post\('\/cortex', asyncHandler\(async \(req, res\) => \{/g, 'export const handleCortex = asyncHandler(async (req, res) => {');
content = content.replace(/aiRouter\.post\('\/proof-review', asyncHandler\(async \(req, res\) => \{/g, 'export const handleProofReview = asyncHandler(async (req, res) => {');
content = content.replace(/aiRouter\.post\('\/reward', asyncHandler\(async \(req, res\) => \{/g, 'export const handleReward = asyncHandler(async (req, res) => {');
content = content.replace(/aiRouter\.get\('\/subscription', asyncHandler\(async \(req, res\) => \{/g, 'export const handleGetSubscription = asyncHandler(async (req, res) => {');
content = content.replace(/aiRouter\.post\('\/subscription\/checkout', asyncHandler\(async \(req, res\) => \{/g, 'export const handleSubscriptionCheckout = asyncHandler(async (req, res) => {');
content = content.replace(/aiRouter\.post\('\/subscription\/portal', asyncHandler\(async \(req, res\) => \{/g, 'export const handleSubscriptionPortal = asyncHandler(async (req, res) => {');

// 2. Add withTimeout helper
const withTimeoutCode = `\nconst withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Operation timed out')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};\n\n`;
content = content.replace(/(const requireUser = \(req: \{ user\?: \{ uid: string \} \}\) => \{)/, withTimeoutCode + '$1');

// 3. Apply withTimeout to generateGeminiText
content = content.replace(/await generateGeminiText\(\{/g, 'await withTimeout(generateGeminiText({');
content = content.replace(/(prompt: [^}]+)(?=\n\s*\}\);)/g, '$1\n  }), 15000)');

// 4. Overwrite clientContext in Mentor
content = content.replace(/const safeClientContext = rawCtx \? \{([\s\S]*?)\} : undefined;/g, 
  `const stats = await getDailyTaskStats(userId);\n  const safeClientContext = rawCtx ? {\n    ...rawCtx,\n    pendingTasks: stats.pendingTasks,\n    completedTasks: stats.completedTasks,\n    completionRate: stats.completionRate,\n    activeGoalCount: Math.min(Math.max(0, rawCtx.activeGoalCount ?? 0), 100),\n    topGoalProgress: rawCtx.topGoalProgress !== undefined ? Math.min(Math.max(0, rawCtx.topGoalProgress), 100) : undefined,\n    currentScores: rawCtx.currentScores ? {\n      discipline: Math.min(Math.max(0, rawCtx.currentScores.discipline), 100),\n      productivity: Math.min(Math.max(0, rawCtx.currentScores.productivity), 100),\n      consistency: Math.min(Math.max(0, rawCtx.currentScores.consistency), 100),\n    } : undefined,\n  } : undefined;`);

// 5. Sanitize prompts in endpoints that take user input
content = content.replace(/const input = typeof req\.body\?\.input === 'string' \? req\.body\.input\.slice\(0, 1000\) : undefined;/g, 
  `const input = sanitizePrompt(typeof req.body?.input === 'string' ? req.body.input.slice(0, 1000) : undefined);`);
content = content.replace(/const input = z\.object\(\{ input: z\.string\(\)\.min\(1\)\.max\(2000\) \}\)\.parse\(req\.body\)\.input;/g, 
  `const input = sanitizePrompt(z.object({ input: z.string().min(1).max(2000) }).parse(req.body).input);`);
content = content.replace(/const body = mentorSchema\.parse\(req\.body\);/g, 
  `const body = mentorSchema.parse(req.body);\n  body.message = sanitizePrompt(body.message);`);

// 6. Fix silent DB failures
content = content.replace(/await _persistProofResult\(userId, body\.taskId, result\)\.catch\(\(\) => null\);/g, 
  `try { await _persistProofResult(userId, body.taskId, result); } catch (err) { logger.error('failed_to_persist_proof_result', { error: err }); }`);
content = content.replace(/await _persistProofResult\(userId, body\.taskId, parsed\)\.catch\(\(\) => null\);/g, 
  `try { await _persistProofResult(userId, body.taskId, parsed); } catch (err) { logger.error('failed_to_persist_proof_result', { error: err }); }`);

fs.writeFileSync(controllerPath, content);
console.log('Refactored ai.controller.ts');
