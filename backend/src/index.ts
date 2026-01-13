import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config/index.js';
import { initializeDatabase } from './database/schema.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

async function main() {
  // Validate configuration
  validateConfig();

  // Initialize database
  initializeDatabase();

  // Create Express app
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
      );
    });
    next();
  });

  // API routes
  app.use('/api', routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Start server
  app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🏠 Careify Document Intelligence Backend                 ║
║                                                              ║
║     Server running on http://localhost:${config.port}                ║
║     Environment: ${config.nodeEnv.padEnd(41)}║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
