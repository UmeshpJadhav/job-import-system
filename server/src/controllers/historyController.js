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

        const { name } = req.body || {};
        const importName = name || urls[0];
        const runId = await triggerImport(urls, importName);
        res.json({ message: 'Import started', runId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getHistory, triggerJob };
