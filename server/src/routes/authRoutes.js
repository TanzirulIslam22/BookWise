const express = require('express');

function authRoutes(controller) {
  const router = express.Router();
  router.post('/login', controller.login);
  return router;
}

module.exports = authRoutes;
