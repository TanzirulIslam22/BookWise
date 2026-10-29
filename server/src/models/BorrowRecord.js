const mongoose = require('mongoose');

const BORROW_STATUS = ['active', 'returned'];

const borrowRecordSchema = new mongoose.Schema(
  {
    // Stored as plain strings so records survive even if a member or book
    // document is deleted, and so the reference is obvious in MongoDB terms
    // (logical reference, not a relational foreign key).
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'memberId is required'],
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'bookId is required'],
    },
    borrowedAt: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'dueDate is required'],
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: { values: BORROW_STATUS, message: 'status must be active or returned' },
      default: 'active',
      required: true,
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: [0, 'fineAmount cannot be negative'],
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

borrowRecordSchema.index({ memberId: 1, status: 1 });
borrowRecordSchema.index({ bookId: 1, status: 1 });
borrowRecordSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('BorrowRecord', borrowRecordSchema);
module.exports.BORROW_STATUS = BORROW_STATUS;
