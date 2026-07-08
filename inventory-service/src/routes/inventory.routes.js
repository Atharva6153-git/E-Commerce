const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventory.controller');

// Admin/setup
router.post('/stock', ctrl.initStock);
router.get('/stock/:productId', ctrl.getStock);

// Saga endpoints (called by Order Service)
router.post('/reserve', ctrl.reserve);
router.post('/confirm', ctrl.confirm);
router.post('/release', ctrl.release);

module.exports = router;
