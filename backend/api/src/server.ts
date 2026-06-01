import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

app.listen(env.port, () => {
  logger.info('server.start', { port: env.port, nodeEnv: env.nodeEnv });
});
