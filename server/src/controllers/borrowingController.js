const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../middleware/errorHandler');

function borrowingController(borrowFacade, borrowRecordRepository) {
  return {
    /** POST /api/borrowings/issue — issue a book (Facade handles the workflow). */
    issue: asyncHandler(async (req, res) => {
      const { memberId, bookId } = req.body;
      if (!memberId || !bookId) {
        throw new ApiError(400, 'memberId and bookId are required');
      }
      const result = await borrowFacade.issueBook(memberId, bookId);
      res.status(201).json({ success: true, message: result.message, data: result.record });
    }),

    /** POST /api/borrowings/return/:id — return an issued book. */
    returnBook: asyncHandler(async (req, res) => {
      const result = await borrowFacade.returnBook(req.params.id);
      res.json({ success: true, message: result.message, data: result.record, fineAmount: result.fineAmount, overdueDays: result.overdueDays });
    }),

    /** GET /api/borrowings?status=active|returned — list borrowing records. */
    list: asyncHandler(async (req, res) => {
      const { status = '' } = req.query;
      if (status && !['active', 'returned'].includes(status)) {
        throw new ApiError(400, "status must be 'active' or 'returned'");
      }
      const records = await borrowRecordRepository.findAll({ status, populate: true });
      res.json({ success: true, count: records.length, data: records });
    }),

    /** GET /api/borrowings/:id — one borrowing record. */
    getById: asyncHandler(async (req, res) => {
      const record = await borrowRecordRepository.findById(req.params.id);
      if (!record) throw new ApiError(404, 'Borrowing record not found');
      res.json({ success: true, data: record });
    }),
  };
}

module.exports = borrowingController;
