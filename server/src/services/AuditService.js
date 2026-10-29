/**
 * AuditService — records persistent audit events (Module 5) and produces the
 * short in-app message that the frontend shows to the user.
 */
class AuditService {
  constructor(auditEventRepository) {
    this.auditEventRepository = auditEventRepository;
  }

  /**
   * Persists one audit event and returns the stored document.
   * @param {string} eventType one of the allowed EVENT_TYPES
   * @param {object} details   { memberId, borrowRecordId, message }
   */
  async record(eventType, details = {}) {
    const { memberId = null, borrowRecordId = null, message = '' } = details;
    if (!message) {
      throw new Error('Audit event message is required');
    }
    return this.auditEventRepository.create({
      eventType,
      memberId,
      borrowRecordId,
      message,
    });
  }

  async list({ eventType = '', limit = 100 } = {}) {
    return this.auditEventRepository.findAll({ eventType, limit });
  }
}

module.exports = AuditService;
