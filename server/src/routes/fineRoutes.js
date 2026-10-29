const express = require('express');

function fineRoutes(controller) {
  const router = express.Router();

  router.get('/overdue', controller.overdue);
  router.get('/preview/:borrowRecordId', controller.preview);

  return router;
}

module.exports = fineRoutes;
