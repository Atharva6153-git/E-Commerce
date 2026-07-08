const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/product.controller');

router.get('/', ctrl.getAllProducts);
router.get('/:id', ctrl.getProductById);
router.post('/', ctrl.createProduct);
router.put('/:id', ctrl.updateProduct);
router.delete('/:id', ctrl.deleteProduct);

module.exports = router;
