const express = require('express');
const router = express.Router();
const { getHistory, triggerJob } = require('../controllers/historyController');

router.get('/history', getHistory);
router.post('/import/trigger', triggerJob);

module.exports = router;
