const Member = require('../models/Member');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../middleware/errorHandler');

function memberController(memberRepository, auditService, borrowRecordRepository) {
  return {
    /** POST /api/members — create a new library member. */
    create: asyncHandler(async (req, res) => {
      const { memberId, name, email = '', role } = req.body;

      const existing = await memberRepository.findByMemberId(memberId);
      if (existing) {
        throw new ApiError(409, `Member ID ${memberId} already exists`);
      }

      const member = await memberRepository.create({ memberId, name, email, role });

      await auditService.record('MEMBER_CREATED', {
        memberId: member._id,
        message: `Member ${member.name} (${member.memberId}, ${member.role}) registered`,
      });

      res.status(201).json({ success: true, data: member });
    }),

    /** GET /api/members?q=&role= — list / search members. */
    list: asyncHandler(async (req, res) => {
      const members = await memberRepository.findAll({
        q: req.query.q || '',
        role: req.query.role || '',
      });
      res.json({ success: true, count: members.length, data: members });
    }),

    /** GET /api/members/:id — one member by MongoDB _id. */
    getById: asyncHandler(async (req, res) => {
      const member = await memberRepository.findById(req.params.id);
      if (!member) throw new ApiError(404, 'Member not found');
      res.json({ success: true, data: member });
    }),

    /** GET /api/members/:id/borrowings — borrowing history of one member. */
    borrowings: asyncHandler(async (req, res) => {
      const member = await memberRepository.findById(req.params.id);
      if (!member) throw new ApiError(404, 'Member not found');
      const records = await borrowRecordRepository.findActiveByMember(member._id);
      res.json({ success: true, count: records.length, data: records });
    }),
  };
}

module.exports = memberController;
module.exports.ROLES = Member.ROLES;
