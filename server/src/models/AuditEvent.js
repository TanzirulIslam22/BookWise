const mongoose = require('mongoose');

const EVENT_TYPES = [
  'MEMBER_CREATED',
  'BOOK_ADDED',
  'BOOK_ISSUED',
  'BOOK_RETURNED',
  'FINE_CALCULATED',
  'OVERDUE_DETECTED',
];

const auditEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: { values: EVENT_TYPES, message: 'unknown eventType' },
      required: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    borrowRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BorrowRecord',
      default: null,
    },
    message: {
      type: String,
      required: [true, 'message is required'],
      maxlength: [300, 'message must be at most 300 characters'],
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

auditEventSchema.index({ createdAt: -1 });
auditEventSchema.index({ eventType: 1 });

module.exports = mongoose.model('AuditEvent', auditEventSchema);
module.exports.EVENT_TYPES = EVENT_TYPES;
