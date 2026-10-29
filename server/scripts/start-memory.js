/**
 * Demo server backed by an in-memory MongoDB (mongodb-memory-server).
 *
 * Purpose: let the application run on a machine with NO local MongoDB
 * installation (demo, Selenium E2E, classroom presentation). Data is lost
 * when the process stops, so this is NOT a replacement for the real
 * development database configured through MONGODB_URI.
 *
 * Usage: npm run start:memory
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const DatabaseManager = require('../src/database/DatabaseManager');
const createApp = require('../src/app');
const config = require('../src/config/config');

async function main() {
  const memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri('smart_library_demo');
  console.log(`In-memory MongoDB started at ${uri} (data is temporary!)`);

  const db = DatabaseManager.getInstance();
  await db.connect(uri);

  if (process.env.SEED_DEMO === '1') {
    console.log('SEED_DEMO=1 — loading demo data...');
    const { seedDemoData } = require('./seed');
    const result = await seedDemoData();
    console.log(
      `Demo data loaded: ${result.members} members, ${result.books} books, ` +
        `${result.borrowRecords} borrow records, ${result.auditEvents} audit events`
    );
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`Demo API on http://localhost:${config.port}`);
    console.log(`Swagger UI: http://localhost:${config.port}/api-docs`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await db.disconnect();
      await memoryServer.stop();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start demo server:', err.message);
  process.exit(1);
});
