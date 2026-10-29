const config = require('./config/config');
const DatabaseManager = require('./database/DatabaseManager');
const createApp = require('./app');

/**
 * server.js — application entry point.
 * Connects to MongoDB through the Singleton DatabaseManager, then starts
 * Express. There is exactly one shared connection manager for the process.
 */
async function start() {
  try {
    const db = DatabaseManager.getInstance();
    await db.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const app = createApp();
    const server = app.listen(config.port, () => {
      console.log(`Smart Library API listening on http://localhost:${config.port}`);
      console.log(`Swagger UI available at http://localhost:${config.port}/api-docs`);
    });

    const shutdown = async () => {
      console.log('Shutting down...');
      server.close(async () => {
        await db.disconnect();
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
