const ImportLog = require('../models/ImportLog');
const { triggerImport } = require('../queue/producer');

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
        const urls = [
            'https://jobicy.com/?feed=job_feed',
            'https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time',
            'https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france',
            'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia',
            'https://jobicy.com/?feed=job_feed&job_categories=data-science',
            'https://jobicy.com/?feed=job_feed&job_categories=copywriting',
            'https://jobicy.com/?feed=job_feed&job_categories=business',
            'https://jobicy.com/?feed=job_feed&job_categories=management',
            'https://www.higheredjobs.com/rss/articleFeed.cfm'
        ];

        // 1. Concurrency Check
        const activeJob = await ImportLog.findOne({ status: { $in: ['pending', 'processing'] } });
        if (activeJob) {
            return res.status(409).json({ message: 'An import is already in progress.' });
        }

        // 2. Rate Limiting (2 minutes)
        const lastJob = await ImportLog.findOne().sort({ createdAt: -1 });
        if (lastJob) {
            const timeDiff = Date.now() - new Date(lastJob.createdAt).getTime();
            const MIN_INTERVAL = 2 * 60 * 1000;
            if (timeDiff < MIN_INTERVAL) {
                const remainingSec = Math.ceil((MIN_INTERVAL - timeDiff) / 1000);
                return res.status(429).json({ message: `Please wait ${remainingSec}s before triggering again.` });
            }
        }

        const importName = urls[0];
        const runId = await triggerImport(urls, importName);
        res.json({ message: 'Import started', runId, importName });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getHistory, triggerJob };
