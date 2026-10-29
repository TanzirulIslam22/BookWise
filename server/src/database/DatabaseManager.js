/**
 * DatabaseManager — Singleton (Creational design pattern).
 *
 * The application must reuse ONE shared MongoDB connection manager instead of
 * opening a new connection for every incoming HTTP request. `getInstance()`
 * always returns the same instance, so every module that needs the database
 * talks through the same object.
 *
 * Note: the MongoDB Node driver already performs connection pooling internally.
 * The Singleton here guarantees a single *manager* (one place that owns the
 * connection lifecycle), not a single physical socket and not an automatic
 * performance boost.
 */
const mongoose = require('mongoose');

class DatabaseManager {
  static instance = null;

  constructor() {
    this.connection = null;
    this.uri = null;
  }

  /** Returns the one shared instance of DatabaseManager. */
  static getInstance() {
    if (DatabaseManager.instance === null) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Connects to MongoDB once and reuses the existing connection afterwards.
   * Throws a descriptive error when the connection cannot be established.
   */
  async connect(uri) {
    if (!uri) {
      throw new Error('DatabaseManager.connect requires a MongoDB URI');
    }
    const state = mongoose.connection.readyState;
    // 1 === connected, 2 === connecting
    if (state === 1 || state === 2) {
      this.connection = mongoose.connection;
      return this.connection;
    }
    try {
      this.uri = uri;
      this.connection = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      return this.connection;
    } catch (error) {
      throw new Error(`MongoDB connection failed: ${error.message}`);
    }
  }

  /** Closes the shared connection (used in tests and graceful shutdown). */
  async disconnect() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    this.connection = null;
  }

  /** Returns the current connection state (0 = disconnected). */
  getState() {
    return mongoose.connection.readyState;
  }
}

module.exports = DatabaseManager;
