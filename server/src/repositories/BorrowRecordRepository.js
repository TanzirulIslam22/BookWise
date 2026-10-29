const BorrowRecord = require('../models/BorrowRecord');

class BorrowRecordRepository {
  constructor(model = BorrowRecord) {
    this.model = model;
  }

  async create(data) {
    return this.model.create(data);
  }

  async findById(id) {
    return this.model.findById(id);
  }

  /** Counts the books a member currently has out. */
  async countActiveByMember(memberId) {
    return this.model.countDocuments({ memberId, status: 'active' });
  }

  async findActiveByMember(memberId) {
    return this.model.find({ memberId, status: 'active' }).sort({ borrowedAt: -1 });
  }

  async findAll({ status = '', populate = false } = {}) {
    const filter = {};
    if (status) filter.status = status;
    let query = this.model.find(filter).sort({ borrowedAt: -1 });
    if (populate) {
      // Resolve the logical references so the UI can show names/titles.
      query = query
        .populate('memberId', 'name memberId role')
        .populate('bookId', 'title isbn');
    }
    return query;
  }

  /** All active records whose due date has already passed. */
  async findOverdue(now = new Date()) {
    return this.model.find({ status: 'active', dueDate: { $lt: now } }).sort({ dueDate: 1 });
  }

  async markReturned(id, returnedAt, fineAmount) {
    return this.model.findByIdAndUpdate(
      id,
      { returnedAt, status: 'returned', fineAmount },
      { new: true, runValidators: true }
    );
  }
}

module.exports = BorrowRecordRepository;
