const AuditEvent = require('../models/AuditEvent');

class AuditEventRepository {
  constructor(model = AuditEvent) {
    this.model = model;
  }

  async create(data) {
    return this.model.create(data);
  }

  async findAll({ eventType = '', limit = 100 } = {}) {
    const filter = {};
    if (eventType) filter.eventType = eventType;
    return this.model.find(filter).sort({ createdAt: -1 }).limit(Number(limit) || 100);
  }
}

module.exports = AuditEventRepository;
