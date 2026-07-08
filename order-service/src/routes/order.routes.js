const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/order.controller');

router.post('/checkout', ctrl.checkout);
router.post('/:orderId/complete', ctrl.completeOrder);
router.get('/user/:userId', ctrl.getUserOrders);
router.get('/:orderId', ctrl.getOrder);

module.exports = router;