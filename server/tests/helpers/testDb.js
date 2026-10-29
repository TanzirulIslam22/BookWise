const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const DatabaseManager = require('../../src/database/DatabaseManager');

/**
 * Starts an isolated in-memory MongoDB for integration tests so they can
 * never touch development or production data. If the environment already
 * provides MONGODB_URI_TEST, that URI is used instead (e.g. a CI service).
 */
async function setupTestDb() {
  let memoryServer = null;
  let uri = process.env.MONGODB_URI_TEST;

  if (!uri) {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('smart_library_test');
  }

  const db = DatabaseManager.getInstance();
  await db.connect(uri);
  return {
    async cleanup() {
      // Drop everything between test files for full isolation.
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.db.dropDatabase();
      }
      await db.disconnect();
      if (memoryServer) {
        await memoryServer.stop();
      }
    },
  };
}

module.exports = { setupTestDb };
