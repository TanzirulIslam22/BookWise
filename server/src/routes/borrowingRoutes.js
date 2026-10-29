const express = require('express');

function borrowingRoutes(controller) {
  const router = express.Router();

  router.post('/issue', controller.issue);
  router.post('/return/:id', controller.returnBook);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);

  return router;
}

module.exports = borrowingRoutes;
