const express = require('express');
const router = express.Router();
const { getHistory, triggerJob } = require('../controllers/historyController');

router.get('/history', getHistory);
router.post('/import/trigger', triggerJob);

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

module.exports = router;
