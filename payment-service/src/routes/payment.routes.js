const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payment.controller');

router.post('/create-order', ctrl.createOrder);
router.post('/verify', ctrl.verifyPayment);
router.get('/:orderId', ctrl.getPaymentByOrderId);

module.exports = router;
