/**
 * MemberRepository — thin data-access wrapper around the Member model.
 * Keeping persistence in repositories lets services and facades be unit
 * tested with mocks (no real database needed).
 */
const Member = require('../models/Member');
const escapeRegex = require('../utils/escapeRegex');

class MemberRepository {
  constructor(model = Member) {
    this.model = model;
  }

  async create(data) {
    return this.model.create(data);
  }

  async findAll({ q = '', role = '' } = {}) {
    const filter = {};
    if (q) {
      const pattern = escapeRegex(q);
      filter.$or = [
        { name: { $regex: pattern, $options: 'i' } },
        { memberId: { $regex: pattern, $options: 'i' } },
        { email: { $regex: pattern, $options: 'i' } },
      ];
    }
    if (role) {
      filter.role = role;
    }
    return this.model.find(filter).sort({ createdAt: -1 });
  }

  async findById(id) {
    return this.model.findById(id);
  }

  async findByMemberId(memberId) {
    return this.model.findOne({ memberId });
  }
}

module.exports = MemberRepository;
