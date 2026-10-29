const request = require('supertest');
const { setupTestDb } = require('../helpers/testDb');
const createApp = require('../../src/app');
const Member = require('../../src/models/Member');
const Book = require('../../src/models/Book');
const BorrowRecord = require('../../src/models/BorrowRecord');

jest.setTimeout(120000);

let dbHandle;
let app;
let memberId;
let bookId;

async function createTestMember(suffix = '001', role = 'Student') {
  const res = await request(app).post('/api/members').send({
    memberId: `CSE-2203${suffix}`,
    name: `Member ${suffix}`,
    email: `member${suffix}@ruet.ac.bd`,
    role,
  });
  return res;
}

async function createTestBook(isbn = '9780134685991', copies = 2) {
  const res = await request(app).post('/api/books').send({
    isbn,
    title: 'The Pragmatic Programmer',
    author: 'Hunt and Thomas',
    totalCopies: copies,
  });
  return res;
}

beforeAll(async () => {
  dbHandle = await setupTestDb();
  app = createApp();
});

afterAll(async () => {
  await dbHandle.cleanup();
});

afterEach(async () => {
  // Full isolation between tests.
  await Promise.all([
    Member.deleteMany({}),
    Book.deleteMany({}),
    BorrowRecord.deleteMany({}),
    require('../../src/models/AuditEvent').deleteMany({}),
  ]);
});

describe('Auth — librarian login gate', () => {
  test('accepts the configured credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'librarian', password: 'bookwise123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ username: 'librarian', role: 'Librarian' });
  });

  test('rejects a wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'librarian', password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid');
  });

  test('rejects an unknown username with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'intruder', password: 'bookwise123' });
    expect(res.status).toBe(401);
  });

  test('rejects missing fields with 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'librarian' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('required');
  });
});

describe('Health and API docs', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data || res.body).toBeTruthy();
    expect(res.body.success).toBe(true);
  });

  test('GET /api/openapi.json returns the OpenAPI spec', async () => {
    const res = await request(app).get('/api/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.paths['/api/members']).toBeDefined();
    expect(res.body.paths['/api/borrowings/issue']).toBeDefined();
    expect(res.body.paths['/api/auth/login']).toBeDefined();
  });

  test('unknown routes return 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Module 1 — Member management', () => {
  test('creates a member and writes an audit event', async () => {
    const res = await createTestMember();
    expect(res.status).toBe(201);
    expect(res.body.data.memberId).toBe('CSE-2203001');
    memberId = res.body.data._id;

    const audits = await request(app).get('/api/audits?eventType=MEMBER_CREATED');
    expect(audits.body.count).toBe(1);
    expect(audits.body.data[0].message).toContain('registered');
  });

  test('rejects a duplicate memberId with 409', async () => {
    await createTestMember();
    const dup = await createTestMember();
    expect(dup.status).toBe(409);
    expect(dup.body.message).toContain('already exists');
  });

  test('rejects missing fields with 400', async () => {
    const res = await request(app).post('/api/members').send({ name: 'No ID' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('memberId is required');
    expect(res.body.message).toContain('role is required');
  });

  test('rejects an invalid role with 400', async () => {
    const res = await request(app)
      .post('/api/members')
      .send({ memberId: 'X-1', name: 'X', role: 'Robot' });
    expect(res.status).toBe(400);
  });

  test('searches members by name fragment', async () => {
    await createTestMember('001');
    await createTestMember('002');
    const res = await request(app).get('/api/members?q=Member%20001');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  test('filters members by role', async () => {
    await createTestMember('001', 'Student');
    await createTestMember('002', 'Faculty');
    const res = await request(app).get('/api/members?role=Faculty');
    expect(res.body.count).toBe(1);
  });

  test('search tolerates regular-expression special characters', async () => {
    await createTestMember('001');
    // "(" or "*" used to make the $regex filter invalid -> HTTP 500.
    for (const q of ['(', ')', '*', '+', '[', 'C++', 'a.b']) {
      const res = await request(app).get(`/api/members?q=${encodeURIComponent(q)}`);
      expect(res.status).toBe(200);
    }
  });
});

describe('Module 2 — Book catalog', () => {
  test('adds a book with availableCopies equal to totalCopies', async () => {
    const res = await createTestBook();
    expect(res.status).toBe(201);
    expect(res.body.data.availableCopies).toBe(2);
    bookId = res.body.data._id;
  });

  test('rejects a duplicate ISBN with 409', async () => {
    await createTestBook();
    const dup = await createTestBook();
    expect(dup.status).toBe(409);
  });

  test('rejects totalCopies < 1 with 400', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({ isbn: '222', title: 'T', author: 'A', totalCopies: 0 });
    expect(res.status).toBe(400);
  });

  test('searches by title, author and ISBN', async () => {
    await createTestBook('9780134685991');
    await request(app).post('/api/books').send({
      isbn: '9780201616224',
      title: 'The Pragmatic Programmer',
      author: 'Hunt',
      totalCopies: 1,
    });
    const byAuthor = await request(app).get('/api/books?q=Thomas');
    expect(byAuthor.body.count).toBe(1);
    const byIsbn = await request(app).get('/api/books?q=9780201616224');
    expect(byIsbn.body.count).toBe(1);
    const byTitle = await request(app).get('/api/books?q=Pragmatic');
    expect(byTitle.body.count).toBe(2);
  });

  test('returns 404 for an unknown book id', async () => {
    const res = await request(app).get('/api/books/0123456789abcdef01234567');
    expect(res.status).toBe(404);
  });

  test('search tolerates regular-expression special characters', async () => {
    await createTestBook();
    for (const q of ['(', ')', '*', '+', '[', 'C++', '978-0(1)']) {
      const res = await request(app).get(`/api/books?q=${encodeURIComponent(q)}`);
      expect(res.status).toBe(200);
    }
  });
});

describe('Module 3 — Borrow and return', () => {
  test('issues a book, reduces availability and writes an audit event', async () => {
    memberId = (await createTestMember('001')).body.data._id;
    bookId = (await createTestBook('9780134685991', 2)).body.data._id;

    const res = await request(app)
      .post('/api/borrowings/issue')
      .send({ memberId, bookId });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('Due date');

    const book = await request(app).get(`/api/books/${bookId}`);
    expect(book.body.data.availableCopies).toBe(1);

    const audits = await request(app).get('/api/audits?eventType=BOOK_ISSUED');
    expect(audits.body.count).toBe(1);
  });

  test('rejects issuing a book with 0 available copies', async () => {
    memberId = (await createTestMember('001')).body.data._id;
    bookId = (await createTestBook('9780134685991', 1)).body.data._id;

    await request(app).post('/api/borrowings/issue').send({ memberId, bookId });
    const second = await request(app)
      .post('/api/borrowings/issue')
      .send({ memberId, bookId });
    expect(second.status).toBe(409);
    expect(second.body.message).toContain('No copies');
  });

  test('rejects issuing to an unknown member with 404', async () => {
    bookId = (await createTestBook()).body.data._id;
    const res = await request(app)
      .post('/api/borrowings/issue')
      .send({ memberId: '0123456789abcdef01234567', bookId });
    expect(res.status).toBe(404);
  });

  test('enforces the student borrowing limit of 3', async () => {
    memberId = (await createTestMember('001')).body.data._id;
    for (let i = 1; i <= 4; i += 1) {
      const book = await createTestBook(`978000000000${i}`, 1);
      const res = await request(app)
        .post('/api/borrowings/issue')
        .send({ memberId, bookId: book.body.data._id });
      if (i < 4) expect(res.status).toBe(201);
      else expect(res.status).toBe(409);
    }
  });

  test('returns a book on time with zero fine and restores availability', async () => {
    memberId = (await createTestMember('001')).body.data._id;
    bookId = (await createTestBook()).body.data._id;
    const issued = await request(app)
      .post('/api/borrowings/issue')
      .send({ memberId, bookId });
    const recordId = issued.body.data._id;

    const res = await request(app).post(`/api/borrowings/return/${recordId}`);
    expect(res.status).toBe(200);
    expect(res.body.fineAmount).toBe(0);
    expect(res.body.overdueDays).toBe(0);
    expect(res.body.message).toContain('No fine');

    const book = await request(app).get(`/api/books/${bookId}`);
    expect(book.body.data.availableCopies).toBe(2);

    const audits = await request(app).get('/api/audits?eventType=BOOK_RETURNED');
    expect(audits.body.count).toBe(1);
  });

  test('calculates an overdue fine of 50 BDT for a student overdue by 5 days', async () => {
    memberId = (await createTestMember('001')).body.data._id;
    bookId = (await createTestBook()).body.data._id;
    const issued = await request(app)
      .post('/api/borrowings/issue')
      .send({ memberId, bookId });
    const recordId = issued.body.data._id;

    // Simulate the due date being 5 days in the past.
    await BorrowRecord.updateOne(
      { _id: recordId },
      { $set: { dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } }
    );

    const res = await request(app).post(`/api/borrowings/return/${recordId}`);
    expect(res.status).toBe(200);
    expect(res.body.overdueDays).toBe(5);
    expect(res.body.fineAmount).toBe(50);

    const fineAudits = await request(app).get('/api/audits?eventType=FINE_CALCULATED');
    expect(fineAudits.body.count).toBe(1);
    expect(fineAudits.body.data[0].message).toContain('50 BDT');
  });

  test('charges zero fine for faculty overdue by many days', async () => {
    memberId = (await createTestMember('010', 'Faculty')).body.data._id;
    bookId = (await createTestBook()).body.data._id;
    const issued = await request(app)
      .post('/api/borrowings/issue')
      .send({ memberId, bookId });
    const recordId = issued.body.data._id;

    await BorrowRecord.updateOne(
      { _id: recordId },
      { $set: { dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) } }
    );

    const res = await request(app).post(`/api/borrowings/return/${recordId}`);
    expect(res.body.fineAmount).toBe(0);
  });

  test('applies the heavy-overdue rule on day eight (90 BDT)', async () => {
    memberId = (await createTestMember('001')).body.data._id;
    bookId = (await createTestBook()).body.data._id;
    const issued = await request(app)
      .post('/api/borrowings/issue')
      .send({ memberId, bookId });
    const recordId = issued.body.data._id;

    await BorrowRecord.updateOne(
      { _id: recordId },
      { $set: { dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) } }
    );

    const res = await request(app).post(`/api/borrowings/return/${recordId}`);
    expect(res.body.overdueDays).toBe(8);
    expect(res.body.fineAmount).toBe(90);
  });

  test('rejects returning the same record twice', async () => {
    memberId = (await createTestMember('001')).body.data._id;
    bookId = (await createTestBook()).body.data._id;
    const issued = await request(app)
      .post('/api/borrowings/issue')
      .send({ memberId, bookId });
    const recordId = issued.body.data._id;

    await request(app).post(`/api/borrowings/return/${recordId}`);
    const again = await request(app).post(`/api/borrowings/return/${recordId}`);
    expect(again.status).toBe(409);
  });

  test('lists active and returned records separately', async () => {
    memberId = (await createTestMember('001')).body.data._id;
    bookId = (await createTestBook('9781111111111')).body.data._id;
    const issued = await request(app)
      .post('/api/borrowings/issue')
      .send({ memberId, bookId });

    const active = await request(app).get('/api/borrowings?status=active');
    expect(active.body.count).toBe(1);

    await request(app).post(`/api/borrowings/return/${issued.body.data._id}`);
    const returned = await request(app).get('/api/borrowings?status=returned');
    expect(returned.body.count).toBe(1);
    const activeAfter = await request(app).get('/api/borrowings?status=active');
    expect(activeAfter.body.count).toBe(0);
  });
});

describe('Module 4 — Fine information endpoints', () => {
  test('GET /api/fines/overdue shows live fines and disappears after return', async () => {
    memberId = (await createTestMember('001')).body.data._id;
    bookId = (await createTestBook()).body.data._id;
    const issued = await request(app)
      .post('/api/borrowings/issue')
      .send({ memberId, bookId });
    const recordId = issued.body.data._id;

    await BorrowRecord.updateOne(
      { _id: recordId },
      { $set: { dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } }
    );

    const overdue = await request(app).get('/api/fines/overdue');
    expect(overdue.body.count).toBe(1);
    expect(overdue.body.data[0].overdueDays).toBe(3);
    expect(overdue.body.data[0].fineAmount).toBe(30);

    await request(app).post(`/api/borrowings/return/${recordId}`);
    const after = await request(app).get('/api/fines/overdue');
    expect(after.body.count).toBe(0);
  });

  test('GET /api/fines/preview returns live fine without changing state', async () => {
    memberId = (await createTestMember('001')).body.data._id;
    bookId = (await createTestBook()).body.data._id;
    const issued = await request(app)
      .post('/api/borrowings/issue')
      .send({ memberId, bookId });
    const recordId = issued.body.data._id;

    await BorrowRecord.updateOne(
      { _id: recordId },
      { $set: { dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } }
    );

    const preview = await request(app).get(`/api/fines/preview/${recordId}`);
    expect(preview.status).toBe(200);
    expect(preview.body.data.overdueDays).toBe(2);
    expect(preview.body.data.fineAmount).toBe(20);

    const record = await BorrowRecord.findById(recordId);
    expect(record.status).toBe('active');
  });
});

describe('Module 5 — Audit and stats', () => {
  test('audit history lists events newest first', async () => {
    await createTestMember('001');
    await createTestBook();
    const res = await request(app).get('/api/audits');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.data[0].eventType).toBe('BOOK_ADDED');
  });

  test('GET /api/stats returns dashboard numbers', async () => {
    memberId = (await createTestMember('001')).body.data._id;
    bookId = (await createTestBook('9782222222222', 3)).body.data._id;
    await request(app).post('/api/borrowings/issue').send({ memberId, bookId });

    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      totalMembers: 1,
      totalBooks: 1,
      totalCopies: 3,
      availableCopies: 2,
      activeBorrows: 1,
    });
  });
});
