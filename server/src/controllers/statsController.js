const { asyncHandler } = require('../middleware/errorHandler');

function statsController({
  memberRepository,
  bookRepository,
  borrowRecordRepository,
  fineService,
}) {
  return {
    /** GET /api/stats — small dashboard statistics. */
    overview: asyncHandler(async (req, res) => {
      const now = new Date();
      const [members, books, activeRecords, overdueRecords, returnedRecords] =
        await Promise.all([
          memberRepository.findAll(),
          bookRepository.findAll(),
          borrowRecordRepository.findAll({ status: 'active' }),
          borrowRecordRepository.findOverdue(now),
          borrowRecordRepository.findAll({ status: 'returned' }),
        ]);

      const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
      const availableCopies = books.reduce((sum, b) => sum + b.availableCopies, 0);
      const totalFines = returnedRecords.reduce((sum, r) => sum + (r.fineAmount || 0), 0);

      let overdueFineEstimate = 0;
      for (const record of overdueRecords) {
        const member = await memberRepository.findById(record.memberId);
        if (!member) continue;
        const days = fineService.computeOverdueDays(record.dueDate, now);
        overdueFineEstimate += fineService.calculateFine(member.role, days);
      }

      res.json({
        success: true,
        data: {
          totalMembers: members.length,
          totalBooks: books.length,
          totalCopies,
          availableCopies,
          activeBorrows: activeRecords.length,
          overdueCount: overdueRecords.length,
          overdueFineEstimate,
          totalFinesCollected: totalFines,
        },
      });
    }),
  };
}

module.exports = statsController;
