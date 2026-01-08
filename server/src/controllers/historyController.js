const ImportLog = require('../models/ImportLog');
const { triggerImport } = require('../queue/producer');

const FEED_URLS = require('../config/feeds');

const getHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = {};
        if (status) query.status = status;

        const logs = await ImportLog.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await ImportLog.countDocuments(query);

        res.json({
            logs,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const triggerJob = async (req, res) => {
    try {
        let urls = FEED_URLS;
        if (req.body && req.body.url) {
            urls = [req.body.url];
        } else if (req.body && Array.isArray(req.body.urls) && req.body.urls.length > 0) {
            urls = req.body.urls;
        }

        const activeJob = await ImportLog.findOne({ status: { $in: ['pending', 'processing'] } });
        if (activeJob) {
            return res.status(409).json({ message: 'An import is already in progress.' });
        }
        const lastJob = await ImportLog.findOne().sort({ createdAt: -1 });
        if (lastJob) {
            const timeDiff = Date.now() - new Date(lastJob.createdAt).getTime();
            const MIN_INTERVAL = 2 * 60 * 1000;
            if (timeDiff < MIN_INTERVAL) {
                const remainingSec = Math.ceil((MIN_INTERVAL - timeDiff) / 1000);
                return res.status(429).json({ message: `Please wait ${remainingSec}s before triggering again.` });
            }
        }
        const jobs = [];
        for (const url of urls) {
            const runId = await triggerImport(url, url);
            jobs.push({ runId, importName: url });
        }

        res.json({ message: `Triggered ${jobs.length} imports`, jobs, count: jobs.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getHistory, triggerJob };
