const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cart.controller');

router.get('/:userId', ctrl.getCart);
router.post('/:userId/items', ctrl.addItem);
router.put('/:userId/items/:productId', ctrl.updateItem);
router.delete('/:userId/items/:productId', ctrl.removeItem);
router.delete('/:userId', ctrl.clearCart);

module.exports = router;
