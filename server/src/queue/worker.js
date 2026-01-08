const { Worker } = require('bullmq');
const connection = require('../config/redis');
const Job = require('../models/Job');
const ImportLog = require('../models/ImportLog');
const { fetchFeed } = require('../services/jobFetcher');

const worker = new Worker('feed-import-queue', async (job) => {
    const { runId, url } = job.data;
    console.log(`[Worker] Starting import run: ${runId}`);

    await ImportLog.updateOne({ runId }, { status: 'processing', startTime: new Date() });

    let metrics = {
        totalFetched: 0,
        totalImported: 0,
        newJobs: 0,
        updatedJobs: 0,
        failedJobs: 0
    };
    let failureLogs = [];
    try {
        console.log(`Fetching: ${url}`);
        const fetchedJobs = await fetchFeed(url);
        metrics.totalFetched += fetchedJobs.length;
        const BATCH_SIZE = parseInt(process.env.JOB_BATCH_SIZE || '500');
        for (let i = 0; i < fetchedJobs.length; i += BATCH_SIZE) {
            const batch = fetchedJobs.slice(i, i + BATCH_SIZE);
            const operations = batch.map(jobData => ({
                updateOne: {
                    filter: { sourceUrl: jobData.sourceUrl },
                    update: { $set: jobData },
                    upsert: true
                }
            }));
            try {
                const result = await Job.bulkWrite(operations, { ordered: false });
                metrics.newJobs += result.upsertedCount;
                metrics.updatedJobs += result.modifiedCount;
                metrics.totalImported += (result.upsertedCount + result.modifiedCount);
            } catch (bulkError) {
                if (bulkError.writeErrors) {
                    metrics.failedJobs += bulkError.writeErrors.length;
                    metrics.newJobs += bulkError.result.nUpserted;
                    metrics.updatedJobs += bulkError.result.nModified;
                    metrics.totalImported += (bulkError.result.nUpserted + bulkError.result.nModified);

                    bulkError.writeErrors.slice(0, 3).forEach(err => {
                        failureLogs.push({
                            message: `Batch Record Error: ${err.errmsg}`,
                            timestamp: new Date()
                        });
                    });
                } else {
                }
            }
            const progress = Math.round(((i + BATCH_SIZE) / fetchedJobs.length) * 100);
            await job.updateProgress(Math.min(progress, 100));
        }
    } catch (error) {
        console.error(`Failed to fetch/process ${url}:`, error);
        metrics.failedJobs++;
        failureLogs.push({
            message: error.message,
            timestamp: new Date()
        });
    }
    await ImportLog.updateOne({ runId }, {
        status: 'completed',
        metrics,
        failureLogs,
        endTime: new Date()
    });

    console.log(`[Worker] Completed run: ${runId}`);
    return metrics;

}, {
    connection,
    concurrency: parseInt(process.env.JOB_CONCURRENCY || '1'),
    limiter: {
        max: 1,
        duration: 2000
    }
});

worker.on('failed', async (job, err) => {
    console.error(`[Worker] Job ${job.id} failed`, err);
    const { runId } = job.data;
    await ImportLog.updateOne({ runId }, {
        status: 'failed',
        endTime: new Date(),
        $push: { failureLogs: { message: err.message } }
    });
});

module.exports = worker;

