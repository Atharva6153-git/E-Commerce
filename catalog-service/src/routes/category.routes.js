const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/category.controller');

router.get('/', ctrl.getAllCategories);
router.post('/', ctrl.createCategory);

module.exports = router;
