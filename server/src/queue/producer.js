const { Queue } = require('bullmq');
const connection = require('../config/redis');
const { v4: uuidv4 } = require('uuid');
const ImportLog = require('../models/ImportLog');

const importQueue = new Queue('feed-import-queue', { connection });

const triggerImport = async (url, name) => {
    const runId = uuidv4();
    await ImportLog.create({
        runId,
        status: 'pending',
        importName: name || url, 
        metrics: { totalFetched: 0, totalImported: 0, newJobs: 0, updatedJobs: 0, failedJobs: 0 }
    });

    try {
        await importQueue.add('import-job', {
            runId,
            url 
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            removeOnComplete: true,
            removeOnFail: 100
        });
    } catch (error) {
        console.error(`Failed to enqueue job for ${url}:`, error);
        await ImportLog.updateOne({ runId }, {
            status: 'failed',
            endTime: new Date(),
            failureLogs: [{ message: `Enqueue Error: ${error.message}`, timestamp: new Date() }]
        });
        throw error;
    }

    return runId;
};

module.exports = { importQueue, triggerImport };
