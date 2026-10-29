/**
 * Demo data seeder.
 *
 * Wipes the four collections and recreates a realistic RUET library snapshot:
 *   - 1 librarian, 2 faculty, 6 students
 *   - 10 well-known CS books
 *   - Active borrows (some on time, some overdue — including a faculty
 *     overdue record that correctly shows a 0 BDT fine)
 *   - Returned borrows (on time and overdue, so "Fines Collected" has values)
 *   - Every event is written through the real AuditService / BorrowFacade,
 *     so the audit history and fine policy are demonstrated honestly.
 *
 * Usage:
 *   cd server && npm run seed           (seeds the database in .env — Atlas/local)
 *   cd server && npm run start:memory:seed   (temporary in-memory demo, no MongoDB needed)
 */
const { performance } = require('perf_hooks');

const Member = require('../src/models/Member');
const Book = require('../src/models/Book');
const BorrowRecord = require('../src/models/BorrowRecord');
const AuditEvent = require('../src/models/AuditEvent');
const MemberRepository = require('../src/repositories/MemberRepository');
const BookRepository = require('../src/repositories/BookRepository');
const BorrowRecordRepository = require('../src/repositories/BorrowRecordRepository');
const AuditEventRepository = require('../src/repositories/AuditEventRepository');
const FineService = require('../src/services/FineService');
const AuditService = require('../src/services/AuditService');
const BorrowFacade = require('../src/facades/BorrowFacade');

const DAY = 24 * 60 * 60 * 1000;

const MEMBERS = [
  { memberId: 'LIB-001', name: 'Rafiqul Islam', email: 'rafiq@ruet.ac.bd', role: 'Librarian' },
  { memberId: 'FAC-001', name: 'Dr. Nusrat Jahan', email: 'nusrat@ruet.ac.bd', role: 'Faculty' },
  { memberId: 'FAC-002', name: 'Dr. Mahmudul Hasan', email: 'mahmud@ruet.ac.bd', role: 'Faculty' },
  { memberId: 'CSE-2203001', name: 'Tanvir Ahmed', email: 'tanvir@ruet.ac.bd', role: 'Student' },
  { memberId: 'CSE-2203002', name: 'Sadia Rahman', email: 'sadia@ruet.ac.bd', role: 'Student' },
  { memberId: 'CSE-2203003', name: 'Imran Hossain', email: 'imran@ruet.ac.bd', role: 'Student' },
  { memberId: 'CSE-2203004', name: 'Farhana Akter', email: 'farhana@ruet.ac.bd', role: 'Student' },
  { memberId: 'CSE-2203005', name: 'Sabbir Khan', email: 'sabbir@ruet.ac.bd', role: 'Student' },
  { memberId: 'EEE-2203054', name: 'Nabila Chowdhury', email: 'nabila@ruet.ac.bd', role: 'Student' },
];

const BOOKS = [
  { isbn: '9780132350884', title: 'Clean Code', author: 'Robert C. Martin', totalCopies: 3 },
  { isbn: '9780201616224', title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', totalCopies: 2 },
  { isbn: '9780134685991', title: 'Effective Java', author: 'Joshua Bloch', totalCopies: 2 },
  { isbn: '9780201633610', title: 'Design Patterns', author: 'Gamma, Helm, Johnson & Vlissides', totalCopies: 2 },
  { isbn: '9780596007126', title: 'Head First Design Patterns', author: 'Freeman & Robson', totalCopies: 3 },
  { isbn: '9780131103627', title: 'The C Programming Language', author: 'Kernighan & Ritchie', totalCopies: 2 },
  { isbn: '9780262033848', title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest & Stein', totalCopies: 4 },
  { isbn: '9780133591620', title: 'Clean Architecture', author: 'Robert C. Martin', totalCopies: 2 },
  { isbn: '9780596517748', title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', totalCopies: 1 },
  { isbn: '9780134757599', title: 'Refactoring', author: 'Martin Fowler', totalCopies: 2 },
];

/**
 * Borrow scenarios. `issueDaysAgo` controls the due date (due = issue + 14):
 *   overdue days = issueDaysAgo - 14  (when issueDaysAgo > 14)
 * `returnDaysAgo` (optional) returns the book immediately — leave unset to
 * keep the record active.
 */
const SCENARIOS = [
  { member: 'CSE-2203001', book: '9780132350884', issueDaysAgo: 2, note: 'active, on time' },
  { member: 'CSE-2203002', book: '9780262033848', issueDaysAgo: 17, note: 'active, overdue 3 days -> 30 BDT live' },
  { member: 'CSE-2203003', book: '9780201633610', issueDaysAgo: 23, note: 'active, overdue 9 days -> 110 BDT live (heavy rule)' },
  { member: 'FAC-001', book: '9780134685991', issueDaysAgo: 24, note: 'faculty overdue 10 days -> 0 BDT (policy demo)' },
  { member: 'CSE-2203004', book: '9780596007126', issueDaysAgo: 5, returnDaysAgo: 0, note: 'returned on time -> 0 BDT fine' },
  { member: 'CSE-2203005', book: '9780131103627', issueDaysAgo: 19, returnDaysAgo: 0, note: 'returned overdue 5 days -> 50 BDT collected' },
  { member: 'EEE-2203054', book: '9780133591620', issueDaysAgo: 22, returnDaysAgo: 0, note: 'returned overdue 8 days -> 90 BDT collected' },
  { member: 'FAC-002', book: '9780201616224', issueDaysAgo: 4, note: 'active, on time' },
];

function facadeAt(now) {
  return new BorrowFacade({
    memberRepository: new MemberRepository(),
    bookRepository: new BookRepository(),
    borrowRecordRepository: new BorrowRecordRepository(),
    fineService: new FineService(),
    auditService: new AuditService(new AuditEventRepository()),
    loanPeriodDays: 14,
    now: () => now,
  });
}

async function seedDemoData({ wipe = true } = {}) {
  const started = performance.now();

  if (wipe) {
    await Promise.all([
      Member.deleteMany({}),
      Book.deleteMany({}),
      BorrowRecord.deleteMany({}),
      AuditEvent.deleteMany({}),
    ]);
  }

  const audit = new AuditService(new AuditEventRepository());
  const memberDocs = {};
  for (const data of MEMBERS) {
    const member = await Member.create(data);
    memberDocs[data.memberId] = member;
    await audit.record('MEMBER_CREATED', {
      memberId: member._id,
      message: `Member ${member.name} (${member.memberId}, ${member.role}) registered`,
    });
  }

  const bookDocs = {};
  for (const data of BOOKS) {
    const book = await Book.create({ ...data, availableCopies: data.totalCopies });
    bookDocs[data.isbn] = book;
    await audit.record('BOOK_ADDED', {
      message: `Book "${book.title}" by ${book.author} added (${data.totalCopies} copies)`,
    });
  }

  const now = Date.now();
  for (const s of SCENARIOS) {
    const member = memberDocs[s.member];
    const book = bookDocs[s.book];
    const issuedAt = new Date(now - s.issueDaysAgo * DAY);
    const issued = await facadeAt(issuedAt).issueBook(member._id, book._id);
    if (s.returnDaysAgo !== undefined) {
      await facadeAt(new Date(now - s.returnDaysAgo * DAY)).returnBook(issued.record._id);
    }
  }

  const [members, books, records, audits] = await Promise.all([
    Member.countDocuments(),
    Book.countDocuments(),
    BorrowRecord.countDocuments(),
    AuditEvent.countDocuments(),
  ]);
  const seconds = ((performance.now() - started) / 1000).toFixed(2);

  return {
    members,
    books,
    borrowRecords: records,
    auditEvents: audits,
    seconds,
  };
}

module.exports = { seedDemoData };

if (require.main === module) {
  const DatabaseManager = require('../src/database/DatabaseManager');
  const config = require('../src/config/config');

  (async () => {
    console.log(`Connecting to ${config.mongoUri.replace(/\/\/[^@]*@/, '//***@')} ...`);
    const db = DatabaseManager.getInstance();
    await db.connect(config.mongoUri);
    console.log('Seeding demo data (existing data will be wiped)...');
    const result = await seedDemoData();
    console.log(
      `Done in ${result.seconds}s — members: ${result.members}, books: ${result.books}, ` +
        `borrow records: ${result.borrowRecords}, audit events: ${result.auditEvents}`
    );
    console.log('Demo login: librarian / bookwise123 (change ADMIN_PASSWORD in .env)');
    await db.disconnect();
    process.exit(0);
  })().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
}
