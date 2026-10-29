const ApiError = require('../utils/ApiError');

/** Borrowing limits per role (0 means the role may not borrow). */
const BORROW_LIMITS = {
  Student: 3,
  Faculty: 5,
  Librarian: 0,
};

/**
 * BorrowFacade — Facade (structural) design pattern.
 *
 * The Express controller calls one simple method:
 *     borrowFacade.issueBook(memberId, bookId)
 *     borrowFacade.returnBook(borrowRecordId)
 *
 * The facade coordinates the multi-step workflows (member lookup, book
 * availability, borrow-limit check, record creation, stock update, due-date
 * assignment, fine calculation on return, audit logging) so the controller
 * stays thin and the workflow is easy to follow and to test.
 *
 * It does NOT reimplement persistence or fine calculation: repositories and
 * FineService/AuditService do that work and are injected (so unit tests can
 * replace them with mocks).
 */
class BorrowFacade {
  constructor({
    memberRepository,
    bookRepository,
    borrowRecordRepository,
    fineService,
    auditService,
    loanPeriodDays = 14,
    borrowLimits = BORROW_LIMITS,
    now = () => new Date(),
  }) {
    this.memberRepository = memberRepository;
    this.bookRepository = bookRepository;
    this.borrowRecordRepository = borrowRecordRepository;
    this.fineService = fineService;
    this.auditService = auditService;
    this.loanPeriodDays = loanPeriodDays;
    this.borrowLimits = borrowLimits;
    this.now = now;
  }

  /**
   * Issues an available book to a valid member.
   * @returns {{ message: string, record: object }}
   */
  async issueBook(memberId, bookId) {
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

    const limit = this.borrowLimits[member.role];
    if (limit === undefined || limit <= 0) {
      throw new ApiError(403, `Role ${member.role} is not allowed to borrow books`);
    }

    const activeCount = await this.borrowRecordRepository.countActiveByMember(memberId);
    if (activeCount >= limit) {
      throw new ApiError(
        409,
        `Borrowing limit reached (${limit} books). Return a book before borrowing another.`
      );
    }

    const book = await this.bookRepository.decrementAvailable(bookId);
    if (!book) {
      const existing = await this.bookRepository.findById(bookId);
      if (!existing) {
        throw new ApiError(404, 'Book not found');
      }
      throw new ApiError(409, 'No copies of this book are currently available');
    }

    const borrowedAt = this.now();
    const dueDate = new Date(borrowedAt.getTime() + this.loanPeriodDays * 24 * 60 * 60 * 1000);

    const record = await this.borrowRecordRepository.create({
      memberId: member._id,
      bookId: book._id,
      borrowedAt,
      dueDate,
      status: 'active',
      fineAmount: 0,
    });

    await this.auditService.record('BOOK_ISSUED', {
      memberId: member._id,
      borrowRecordId: record._id,
      message: `"${book.title}" issued to ${member.name} (due ${dueDate.toISOString().slice(0, 10)})`,
    });

    return {
      message: `Book issued to ${member.name}. Due date: ${dueDate.toISOString().slice(0, 10)}`,
      record,
    };
  }

  /**
   * Returns an issued book, calculates any overdue fine and updates stock.
   * @returns {{ message: string, record: object, overdueDays: number, fineAmount: number }}
   */
  async returnBook(borrowRecordId) {
    const record = await this.borrowRecordRepository.findById(borrowRecordId);
    if (!record) {
      throw new ApiError(404, 'Borrowing record not found');
    }
    if (record.status === 'returned') {
      throw new ApiError(409, 'This book has already been returned');
    }

    const member = await this.memberRepository.findById(record.memberId);
    const book = await this.bookRepository.findById(record.bookId);
    if (!member || !book) {
      throw new ApiError(404, 'Member or book for this record no longer exists');
    }

    const returnedAt = this.now();
    const overdueDays = this.fineService.computeOverdueDays(record.dueDate, returnedAt);
    const fineAmount = this.fineService.calculateFine(member.role, overdueDays);

    const updated = await this.borrowRecordRepository.markReturned(
      record._id,
      returnedAt,
      fineAmount
    );
    await this.bookRepository.incrementAvailable(book._id);

    await this.auditService.record('BOOK_RETURNED', {
      memberId: member._id,
      borrowRecordId: record._id,
      message: `"${book.title}" returned by ${member.name} (${overdueDays} overdue day(s))`,
    });

    if (overdueDays > 0) {
      await this.auditService.record('OVERDUE_DETECTED', {
        memberId: member._id,
        borrowRecordId: record._id,
        message: `"${book.title}" was overdue by ${overdueDays} day(s)`,
      });
      await this.auditService.record('FINE_CALCULATED', {
        memberId: member._id,
        borrowRecordId: record._id,
        message: `Fine of ${fineAmount} BDT charged to ${member.name} for ${overdueDays} overdue day(s)`,
      });
    }

    return {
      message:
        overdueDays > 0
          ? `Book returned with ${overdueDays} overdue day(s). Fine: ${fineAmount} BDT`
          : 'Book returned on time. No fine.',
      record: updated,
      overdueDays,
      fineAmount,
    };
  }

  /** Live fine preview for one active record (no state change). */
  async previewFine(borrowRecordId) {
    const record = await this.borrowRecordRepository.findById(borrowRecordId);
    if (!record) {
      throw new ApiError(404, 'Borrowing record not found');
    }
    const member = await this.memberRepository.findById(record.memberId);
    if (!member) {
      throw new ApiError(404, 'Member not found');
    }
    const overdueDays =
      record.status === 'returned'
        ? this.fineService.computeOverdueDays(record.dueDate, record.returnedAt)
        : this.fineService.computeOverdueDays(record.dueDate, this.now());
    const fineAmount =
      record.status === 'returned'
        ? record.fineAmount
        : this.fineService.calculateFine(member.role, overdueDays);
    return {
      recordId: record._id,
      memberName: member.name,
      role: member.role,
      status: record.status,
      dueDate: record.dueDate,
      overdueDays,
      fineAmount,
    };
  }
}

module.exports = BorrowFacade;
module.exports.BORROW_LIMITS = BORROW_LIMITS;
