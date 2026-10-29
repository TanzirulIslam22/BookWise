const express = require('express');

function auditRoutes(controller) {
  const router = express.Router();
  router.get('/', controller.list);
  return router;
}

module.exports = auditRoutes;
