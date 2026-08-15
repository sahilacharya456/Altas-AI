import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { startMetricsPersistence } from './services/metrics';

app.listen(env.port, () => {
  logger.info('server.start', { port: env.port, nodeEnv: env.nodeEnv });
  startMetricsPersistence();
});
