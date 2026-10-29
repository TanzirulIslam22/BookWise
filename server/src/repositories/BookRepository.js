const Book = require('../models/Book');
const escapeRegex = require('../utils/escapeRegex');

class BookRepository {
  constructor(model = Book) {
    this.model = model;
  }

  async create(data) {
    return this.model.create(data);
  }

  async findAll({ q = '' } = {}) {
    const filter = {};
    if (q) {
      const pattern = escapeRegex(q);
      filter.$or = [
        { title: { $regex: pattern, $options: 'i' } },
        { author: { $regex: pattern, $options: 'i' } },
        { isbn: { $regex: pattern, $options: 'i' } },
      ];
    }
    return this.model.find(filter).sort({ title: 1 });
  }

  async findById(id) {
    return this.model.findById(id);
  }

  /**
   * Decrements available copies only when a copy is free.
   * Uses an atomic conditional update so two concurrent issues cannot both
   * take the last copy. Returns null when no copy is available.
   */
  async decrementAvailable(id) {
    return this.model.findOneAndUpdate(
      { _id: id, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );
  }

  /** Increments available copies but never above totalCopies. */
  async incrementAvailable(id) {
    const book = await this.model.findById(id);
    if (!book) return null;
    if (book.availableCopies >= book.totalCopies) {
      return book;
    }
    return this.model.findByIdAndUpdate(
      id,
      { $inc: { availableCopies: 1 } },
      { new: true }
    );
  }
}

module.exports = BookRepository;
