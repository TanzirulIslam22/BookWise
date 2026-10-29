const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    isbn: {
      type: String,
      required: [true, 'isbn is required'],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      minlength: [1, 'title is required'],
      maxlength: [200, 'title must be at most 200 characters'],
    },
    author: {
      type: String,
      required: [true, 'author is required'],
      trim: true,
      maxlength: [120, 'author must be at most 120 characters'],
    },
    totalCopies: {
      type: Number,
      required: [true, 'totalCopies is required'],
      min: [1, 'totalCopies must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'totalCopies must be a whole number',
      },
    },
    availableCopies: {
      type: Number,
      required: true,
      min: [0, 'availableCopies cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'availableCopies must be a whole number',
      },
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Business rule: available copies can never exceed total copies.
bookSchema.pre('save', function ensureStockBounds(next) {
  if (this.availableCopies > this.totalCopies) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

bookSchema.index({ title: 'text', author: 'text' });

module.exports = mongoose.model('Book', bookSchema);
