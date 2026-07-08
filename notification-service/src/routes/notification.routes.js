const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notification.controller');

router.post('/send', ctrl.send);
router.get('/:userId', ctrl.getByUser);
router.patch('/:id/read', ctrl.markRead);

module.exports = router;
