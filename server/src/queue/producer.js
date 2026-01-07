const { Queue } = require('bullmq');
const connection = require('../config/redis');
const { v4: uuidv4 } = require('uuid');
const ImportLog = require('../models/ImportLog');

const importQueue = new Queue('import-queue', { connection });

const triggerImport = async (urls, name = 'General Import') => {
    const runId = uuidv4();

    await ImportLog.create({
        runId,
        status: 'pending',
        importName: name,
        metrics: { totalFetched: 0, totalImported: 0, newJobs: 0, updatedJobs: 0, failedJobs: 0 }
    });

    await importQueue.add('import-job', {
        runId,
        urls
    }, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: 100
    });

    return runId;
};

module.exports = { importQueue, triggerImport };
