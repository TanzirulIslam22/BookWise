const express = require('express');
const validateBody = require('../middleware/validate');

function memberRoutes(controller) {
  const router = express.Router();

  router.post(
    '/',
    validateBody({
      memberId: 'required,string',
      name: 'required,string',
      role: 'required,role',
      email: 'email',
    }),
    controller.create
  );
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.get('/:id/borrowings', controller.borrowings);

  return router;
}

module.exports = memberRoutes;
