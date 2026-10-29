/**
 * Unit tests for the BorrowFacade (Facade pattern) using Jest mocks.
 *
 * The repository, fine service and audit service are ALL mocked, so these
 * tests never touch MongoDB. They verify that the facade coordinates the
 * workflow correctly and that audit events are recorded exactly once per
 * successful operation.
 */
const BorrowFacade = require('../../src/facades/BorrowFacade');
const ApiError = require('../../src/utils/ApiError');

function buildFacade(overrides = {}) {
  const member = overrides.member || {
    _id: 'member-1',
    memberId: 'CSE-2203001',
    name: 'Tanvir',
    role: 'Student',
  };
  const book = overrides.book || {
    _id: 'book-1',
    isbn: '111',
    title: 'Clean Code',
    totalCopies: 2,
    availableCopies: 1,
  };

  const memberRepository = {
    findById: jest.fn().mockResolvedValue(member),
    findByMemberId: jest.fn().mockResolvedValue(null),
    ...overrides.memberRepositoryOverrides,
  };
  const bookRepository = {
    findById: jest.fn().mockResolvedValue(book),
    decrementAvailable: jest.fn().mockResolvedValue(book),
    incrementAvailable: jest.fn().mockResolvedValue(book),
    ...overrides.bookRepositoryOverrides,
  };
  const borrowRecordRepository = {
    create: jest.fn().mockResolvedValue({
      _id: 'record-1',
      memberId: 'member-1',
      bookId: 'book-1',
      status: 'active',
      dueDate: new Date('2026-01-25T00:00:00Z'),
      fineAmount: 0,
    }),
    findById: jest.fn().mockResolvedValue(
      overrides.record || {
        _id: 'record-1',
        memberId: 'member-1',
        bookId: 'book-1',
        status: 'active',
        dueDate: new Date('2026-01-10T00:00:00Z'),
        fineAmount: 0,
      }
    ),
    countActiveByMember: jest.fn().mockResolvedValue(0),
    markReturned: jest.fn().mockImplementation((id, returnedAt, fineAmount) =>
      Promise.resolve({
        _id: id,
        status: 'returned',
        returnedAt,
        fineAmount,
      })
    ),
    ...overrides.borrowRecordRepositoryOverrides,
  };
  const fineService = {
    computeOverdueDays: jest.fn().mockReturnValue(5),
    calculateFine: jest.fn().mockReturnValue(50),
    ...overrides.fineServiceOverrides,
  };
  const auditService = {
    record: jest.fn().mockResolvedValue({}),
    ...overrides.auditServiceOverrides,
  };

  const facade = new BorrowFacade({
    memberRepository,
    bookRepository,
    borrowRecordRepository,
    fineService,
    auditService,
    loanPeriodDays: 14,
    now: () => new Date('2026-01-11T00:00:00Z'),
  });

  return { facade, memberRepository, bookRepository, borrowRecordRepository, fineService, auditService };
}

describe('BorrowFacade.issueBook', () => {
  test('issues a book and records a BOOK_ISSUED audit event', async () => {
    const { facade, bookRepository, borrowRecordRepository, auditService } = buildFacade();

    const result = await facade.issueBook('member-1', 'book-1');

    expect(bookRepository.decrementAvailable).toHaveBeenCalledWith('book-1');
    expect(borrowRecordRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active', fineAmount: 0 })
    );
    expect(auditService.record).toHaveBeenCalledTimes(1);
    expect(auditService.record).toHaveBeenCalledWith(
      'BOOK_ISSUED',
      expect.objectContaining({ borrowRecordId: 'record-1' })
    );
    expect(result.message).toContain('Due date');
  });

  test('throws 404 when the member does not exist', async () => {
    const { facade, bookRepository, auditService } = buildFacade({
      memberRepositoryOverrides: { findById: jest.fn().mockResolvedValue(null) },
    });

    await expect(facade.issueBook('nope', 'book-1')).rejects.toThrow(ApiError);
    await expect(facade.issueBook('nope', 'book-1')).rejects.toThrow('Member not found');
    expect(bookRepository.decrementAvailable).not.toHaveBeenCalled();
    expect(auditService.record).not.toHaveBeenCalled();
  });

  test('throws 404 when the book does not exist', async () => {
    const { facade, auditService } = buildFacade({
      bookRepositoryOverrides: {
        decrementAvailable: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(facade.issueBook('member-1', 'ghost')).rejects.toThrow('Book not found');
    expect(auditService.record).not.toHaveBeenCalled();
  });

  test('throws 409 when no copies are available', async () => {
    const { facade, auditService } = buildFacade({
      bookRepositoryOverrides: {
        decrementAvailable: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue({ _id: 'book-1', availableCopies: 0 }),
      },
    });

    await expect(facade.issueBook('member-1', 'book-1')).rejects.toThrow(
      'No copies of this book are currently available'
    );
    expect(auditService.record).not.toHaveBeenCalled();
  });

  test('throws 409 when the borrow limit is reached', async () => {
    const { facade, bookRepository } = buildFacade({
      borrowRecordRepositoryOverrides: { countActiveByMember: jest.fn().mockResolvedValue(3) },
    });

    await expect(facade.issueBook('member-1', 'book-1')).rejects.toThrow(
      'Borrowing limit reached (3 books)'
    );
    expect(bookRepository.decrementAvailable).not.toHaveBeenCalled();
  });

  test('throws 403 for the Librarian role (may not borrow)', async () => {
    const { facade } = buildFacade({
      member: { _id: 'm2', name: 'Lib', role: 'Librarian' },
    });

    await expect(facade.issueBook('m2', 'book-1')).rejects.toThrow('not allowed to borrow');
  });
});

describe('BorrowFacade.returnBook', () => {
  test('returns a book, calculates the fine and records three audit events when overdue', async () => {
    const { facade, bookRepository, auditService } = buildFacade();

    const result = await facade.returnBook('record-1');

    expect(result.overdueDays).toBe(5);
    expect(result.fineAmount).toBe(50);
    expect(bookRepository.incrementAvailable).toHaveBeenCalledWith('book-1');
    expect(auditService.record).toHaveBeenCalledWith(
      'BOOK_RETURNED',
      expect.objectContaining({ borrowRecordId: 'record-1' })
    );
    expect(auditService.record).toHaveBeenCalledWith(
      'OVERDUE_DETECTED',
      expect.anything()
    );
    expect(auditService.record).toHaveBeenCalledWith(
      'FINE_CALCULATED',
      expect.objectContaining({ message: expect.stringContaining('50 BDT') })
    );
  });

  test('records only BOOK_RETURNED when returned on time', async () => {
    const { facade, auditService, fineService } = buildFacade({
      fineServiceOverrides: {
        computeOverdueDays: jest.fn().mockReturnValue(0),
        calculateFine: jest.fn().mockReturnValue(0),
      },
    });

    const result = await facade.returnBook('record-1');

    expect(result.fineAmount).toBe(0);
    expect(result.message).toContain('No fine');
    expect(auditService.record).toHaveBeenCalledTimes(1);
    expect(auditService.record).toHaveBeenCalledWith(
      'BOOK_RETURNED',
      expect.anything()
    );
  });

  test('throws 404 for an unknown record', async () => {
    const { facade } = buildFacade({
      borrowRecordRepositoryOverrides: { findById: jest.fn().mockResolvedValue(null) },
    });

    await expect(facade.returnBook('ghost')).rejects.toThrow('Borrowing record not found');
  });

  test('throws 409 when the book was already returned', async () => {
    const { facade } = buildFacade({
      record: {
        _id: 'record-1',
        memberId: 'member-1',
        bookId: 'book-1',
        status: 'returned',
        dueDate: new Date('2026-01-10T00:00:00Z'),
        fineAmount: 0,
      },
    });

    await expect(facade.returnBook('record-1')).rejects.toThrow('already been returned');
  });
});
