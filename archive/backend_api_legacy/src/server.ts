import { createApp } from './app.js';
import { env, connectDatabase } from './config/index.js';
import { handleUncaughtException, handleUnhandledRejection } from './middleware/index.js';
import mongoose from 'mongoose';

handleUncaughtException();

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log([
        'ATLAS AI Backend API online',
        `Environment: ${env.NODE_ENV}`,
        `Port: ${env.PORT}`,
        `API Version: ${env.API_VERSION}`,
        `Health: http://localhost:${env.PORT}/health`,
        `API: http://localhost:${env.PORT}/api/${env.API_VERSION}`,
      ].join('\n'));
    });

    handleUnhandledRejection(server);

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        console.log('HTTP server closed');

        try {
          await mongoose.connection.close();
          console.log('MongoDB connection closed');
        } catch (err) {
          console.error('Error closing MongoDB connection:', err);
        }

        process.exit(0);
      });

      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
