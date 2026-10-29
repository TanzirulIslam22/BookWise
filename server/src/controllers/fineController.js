const { asyncHandler } = require('../middleware/errorHandler');

function fineController(borrowFacade, fineService, borrowRecordRepository, memberRepository) {
  return {
    /** GET /api/fines/overdue — all overdue active records with live fines. */
    overdue: asyncHandler(async (req, res) => {
      const now = new Date();
      const records = await borrowRecordRepository.findOverdue(now);
      const rows = [];
      for (const record of records) {
        const member = await memberRepository.findById(record.memberId);
        const overdueDays = fineService.computeOverdueDays(record.dueDate, now);
        const fineAmount = member ? fineService.calculateFine(member.role, overdueDays) : 0;
        rows.push({
          borrowRecordId: record._id,
          memberId: record.memberId,
          memberName: member ? member.name : 'Unknown',
          role: member ? member.role : 'Unknown',
          dueDate: record.dueDate,
          overdueDays,
          fineAmount,
        });
      }
      res.json({ success: true, count: rows.length, data: rows });
    }),

    /** GET /api/fines/preview/:borrowRecordId — fine for one record. */
    preview: asyncHandler(async (req, res) => {
      const preview = await borrowFacade.previewFine(req.params.borrowRecordId);
      res.json({ success: true, data: preview });
    }),
  };
}

module.exports = fineController;
