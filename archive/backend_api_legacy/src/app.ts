import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, genAI, GEMINI_CONFIG } from './config/index.js';
import { errorHandler, apiLimiter, aiLimiter } from './middleware/index.js';
import { authRoutes } from './modules/auth/index.js';
import { taskRoutes } from './modules/tasks/index.js';
import { mentorRoutes } from './modules/mentor/index.js';
import { reflectionRoutes } from './modules/reflection/index.js';
import { analyticsRoutes } from './modules/analytics/index.js';

export const createApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());

  const corsOrigins = env.NODE_ENV === 'production'
    ? env.CORS_ORIGIN?.split(',').map((o: string) => o.trim()) || []
    : ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000', 'exp://'];

  app.use(cors({
    origin: corsOrigins,
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Rate limiting
  app.use('/api', apiLimiter);

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: env.API_VERSION,
      environment: env.NODE_ENV,
    });
  });

  if (env.NODE_ENV !== 'production') {
    // Development-only legacy chat probe. Production AI traffic must use
    // authenticated Firebase callable Functions; never expose paid AI keys or
    // trusted user context through a public mobile endpoint.
    app.post('/api/chat', aiLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { message, contextType } = req.body;
        if (!message || typeof message !== 'string') {
          res.status(400).json({
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: 'Message is required and must be a string',
            },
          });
          return;
        }

        console.log('[Legacy Dev AI] Processing development-only chat probe.');

        let instructions = `IDENTITY: You are ATLAS AI, a strict discipline mentor running inside the Atlas AI app.
Do not claim custom model training. If asked who made you, respond: "I am Atlas AI, configured by the Atlas product to help with discipline and execution."
Style: Concise, direct, and action-oriented.`;

        if (contextType) {
          instructions += `\n\nContext Type: ${String(contextType).substring(0, 80)}`;
        }

        const response = await genAI.models.generateContent({
          model: GEMINI_CONFIG.model,
          contents: message.substring(0, 2000),
          config: {
            systemInstruction: instructions,
            temperature: GEMINI_CONFIG.temperature,
            maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
          },
        });

        const reply = response.text?.trim() || 'No response generated from Gemini.';

        res.status(200).json({
          success: true,
          reply,
        });
      } catch (error) {
        console.error('[Legacy Dev AI] Error:', error);
        next(error);
      }
    });
  }

  // API Routes
  const apiPrefix = `/api/${env.API_VERSION}`;

  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/tasks`, taskRoutes);
  app.use(`${apiPrefix}/mentor`, mentorRoutes);
  app.use(`${apiPrefix}/reflection`, reflectionRoutes);
  app.use(`${apiPrefix}/analytics`, analyticsRoutes);

  // TODO: Add more routes as modules are created
  // app.use(`${apiPrefix}/goals`, goalRoutes);
  // app.use(`${apiPrefix}/health`, healthRoutes);
  // app.use(`${apiPrefix}/digital`, digitalRoutes);
  // app.use(`${apiPrefix}/career`, careerRoutes);
  // app.use(`${apiPrefix}/security`, securityRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};
