const { asyncHandler } = require('../middleware/errorHandler');

function auditController(auditService) {
  return {
    /** GET /api/audits?eventType=&limit= — recent activity history. */
    list: asyncHandler(async (req, res) => {
      const events = await auditService.list({
        eventType: req.query.eventType || '',
        limit: req.query.limit || 100,
      });
      res.json({ success: true, count: events.length, data: events });
    }),
  };
}

module.exports = auditController;
