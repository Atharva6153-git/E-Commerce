const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/product.controller');
const { cacheAside } = require('../middleware/cache');

router.get('/', cacheAside('products'), ctrl.getAllProducts);
router.get('/:id', cacheAside('products'), ctrl.getProductById);
router.post('/', ctrl.createProduct);
router.put('/:id', ctrl.updateProduct);
router.delete('/:id', ctrl.deleteProduct);

module.exports = router;
