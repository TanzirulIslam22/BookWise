const mongoose = require('mongoose');

const ROLES = ['Student', 'Faculty', 'Librarian'];

const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: [true, 'memberId is required'],
      unique: true,
      trim: true,
      minlength: [3, 'memberId must be at least 3 characters'],
      maxlength: [20, 'memberId must be at most 20 characters'],
    },
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
      minlength: [2, 'name must be at least 2 characters'],
      maxlength: [80, 'name must be at most 80 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email must be a valid address'],
    },
    role: {
      type: String,
      enum: { values: ROLES, message: 'role must be Student, Faculty or Librarian' },
      required: [true, 'role is required'],
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

memberSchema.index({ name: 1 });
memberSchema.index({ role: 1 });

module.exports = mongoose.model('Member', memberSchema);
module.exports.ROLES = ROLES;
