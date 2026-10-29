const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../middleware/errorHandler');

function bookController(bookRepository, auditService) {
  return {
    /** POST /api/books — add a book to the catalog. */
    create: asyncHandler(async (req, res) => {
      const { isbn, title, author, totalCopies } = req.body;
      const copies = Number(totalCopies);

      const existing = await bookRepository.findAll({ q: isbn });
      if (existing.some((b) => b.isbn === isbn)) {
        throw new ApiError(409, `A book with ISBN ${isbn} already exists`);
      }

      const book = await bookRepository.create({
        isbn,
        title,
        author,
        totalCopies: copies,
        availableCopies: copies,
      });

      await auditService.record('BOOK_ADDED', {
        message: `Book "${book.title}" by ${book.author} added (${copies} copies)`,
      });

      res.status(201).json({ success: true, data: book });
    }),

    /** GET /api/books?q= — list / search catalog by title, author or ISBN. */
    list: asyncHandler(async (req, res) => {
      const books = await bookRepository.findAll({ q: req.query.q || '' });
      res.json({ success: true, count: books.length, data: books });
    }),

    /** GET /api/books/:id — book details. */
    getById: asyncHandler(async (req, res) => {
      const book = await bookRepository.findById(req.params.id);
      if (!book) throw new ApiError(404, 'Book not found');
      res.json({ success: true, data: book });
    }),
  };
}

module.exports = bookController;
