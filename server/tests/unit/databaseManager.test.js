const DatabaseManager = require('../../src/database/DatabaseManager');

describe('DatabaseManager (Singleton pattern)', () => {
  afterEach(() => {
    // Reset the singleton between test files without touching a real DB.
    DatabaseManager.instance = null;
  });

  test('getInstance always returns the same object', () => {
    const first = DatabaseManager.getInstance();
    const second = DatabaseManager.getInstance();
    expect(first).toBe(second);
    expect(DatabaseManager.instance).toBe(first);
  });

  test('separate instances cannot be constructed through getInstance after reset', () => {
    const a = DatabaseManager.getInstance();
    const b = DatabaseManager.getInstance();
    expect(a.constructor).toBe(b.constructor);
  });

  test('connect without a URI throws a clear error', async () => {
    const db = DatabaseManager.getInstance();
    await expect(db.connect('')).rejects.toThrow('requires a MongoDB URI');
  });
});
