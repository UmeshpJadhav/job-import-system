const { Worker } = require('bullmq');
const connection = require('../config/redis');
const Job = require('../models/Job');
const ImportLog = require('../models/ImportLog');
const { fetchFeed } = require('../services/jobFetcher');

const worker = new Worker('import-queue', async (job) => {
    const { runId, urls } = job.data;
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

    for (const url of urls) {
        try {
            console.log(`Fetching: ${url}`);
            const fetchedJobs = await fetchFeed(url);
            metrics.totalFetched += fetchedJobs.length;

            // Batch Processing
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

                const result = await Job.bulkWrite(operations);

                metrics.newJobs += result.upsertedCount;
                metrics.updatedJobs += result.modifiedCount;
                metrics.totalImported += (result.upsertedCount + result.modifiedCount);

                // Report Progress
                const progress = Math.round(((i + BATCH_SIZE) / fetchedJobs.length) * 100);
                await job.updateProgress(Math.min(progress, 100)); // Ensure max 100
            }
        } catch (error) {
            console.error(`Failed to fetch/process ${url}:`, error);
            metrics.failedJobs++;
            failureLogs.push({
                message: error.message,
                timestamp: new Date()
            });
        }
        // Respect rate limits with a small delay between feeds
        await new Promise(resolve => setTimeout(resolve, 2000));
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
    concurrency: parseInt(process.env.JOB_CONCURRENCY || '5'),
    limiter: {
        max: 10,
        duration: 1000
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

