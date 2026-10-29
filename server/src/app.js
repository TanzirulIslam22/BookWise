const express = require('express');
const cors = require('cors');
const path = require('path');

const MemberRepository = require('./repositories/MemberRepository');
const BookRepository = require('./repositories/BookRepository');
const BorrowRecordRepository = require('./repositories/BorrowRecordRepository');
const AuditEventRepository = require('./repositories/AuditEventRepository');
const FineService = require('./services/FineService');
const AuditService = require('./services/AuditService');
const BorrowFacade = require('./facades/BorrowFacade');
const buildSwagger = require('./config/swagger');
const { errorHandler } = require('./middleware/errorHandler');
const config = require('./config/config');

const memberControllerFactory = require('./controllers/memberController');
const bookControllerFactory = require('./controllers/bookController');
const borrowingControllerFactory = require('./controllers/borrowingController');
const fineControllerFactory = require('./controllers/fineController');
const auditControllerFactory = require('./controllers/auditController');
const statsControllerFactory = require('./controllers/statsController');
const authControllerFactory = require('./controllers/authController');

const memberRoutes = require('./routes/memberRoutes');
const bookRoutes = require('./routes/bookRoutes');
const borrowingRoutes = require('./routes/borrowingRoutes');
const fineRoutes = require('./routes/fineRoutes');
const auditRoutes = require('./routes/auditRoutes');
const authRoutes = require('./routes/authRoutes');

/**
 * createApp() builds the Express application with all dependencies wired
 * together (repositories -> services -> facade -> controllers -> routes).
 * Tests can pass overrides through the `overrides` argument.
 */
function createApp(overrides = {}) {
  const app = express();

  const memberRepository = overrides.memberRepository || new MemberRepository();
  const bookRepository = overrides.bookRepository || new BookRepository();
  const borrowRecordRepository =
    overrides.borrowRecordRepository || new BorrowRecordRepository();
  const auditEventRepository = overrides.auditEventRepository || new AuditEventRepository();
  const fineService = overrides.fineService || new FineService();
  const auditService = overrides.auditService || new AuditService(auditEventRepository);
  const borrowFacade =
    overrides.borrowFacade ||
    new BorrowFacade({
      memberRepository,
      bookRepository,
      borrowRecordRepository,
      fineService,
      auditService,
      loanPeriodDays: config.loanPeriodDays,
    });

  // Expose repositories for controllers that need several collaborators.
  app.locals.memberRepository = memberRepository;
  app.locals.bookRepository = bookRepository;
  app.locals.borrowRecordRepository = borrowRecordRepository;
  app.locals.auditEventRepository = auditEventRepository;
  app.locals.fineService = fineService;
  app.locals.auditService = auditService;
  app.locals.borrowFacade = borrowFacade;

  app.use(cors({ origin: config.clientOrigin.split(',') }));
  app.use(express.json());

  // Request logger (simple, useful during the demo).
  app.use((req, res, next) => {
    if (config.env !== 'test') {
      console.log(`${req.method} ${req.originalUrl}`);
    }
    next();
  });

  const swagger = buildSwagger();
  app.use('/api-docs', swagger.middleware, swagger.setup);
  app.get('/api/openapi.json', (req, res) => res.json(swagger.spec));

  app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', env: config.env });
  });

  app.use(
    '/api/members',
    memberRoutes(
      memberControllerFactory(memberRepository, auditService, borrowRecordRepository)
    )
  );
  app.use('/api/books', bookRoutes(bookControllerFactory(bookRepository, auditService)));
  app.use(
    '/api/borrowings',
    borrowingRoutes(borrowingControllerFactory(borrowFacade, borrowRecordRepository))
  );
  app.use(
    '/api/fines',
    fineRoutes(fineControllerFactory(borrowFacade, fineService, borrowRecordRepository, memberRepository))
  );
  app.use('/api/audits', auditRoutes(auditControllerFactory(auditService)));
  app.use('/api/auth', authRoutes(authControllerFactory()));
  const statsController = statsControllerFactory({
    memberRepository,
    bookRepository,
    borrowRecordRepository,
    fineService,
  });
  app.get('/api/stats', statsController.overview);

  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
