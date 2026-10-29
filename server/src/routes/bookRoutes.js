const express = require('express');
const validateBody = require('../middleware/validate');

function bookRoutes(controller) {
  const router = express.Router();

  router.post(
    '/',
    validateBody({
      isbn: 'required,string',
      title: 'required,string',
      author: 'required,string',
      totalCopies: 'required,positiveInt',
    }),
    controller.create
  );
  router.get('/', controller.list);
  router.get('/:id', controller.getById);

  return router;
}

module.exports = bookRoutes;
