require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const apiRoutes = require('./src/routes/api');
const { triggerImport } = require('./src/queue/producer');

const startServer = async () => {
    await connectDB();

    const app = express();

    app.use((req, res, next) => {
        console.log(`[Request] ${req.method} ${req.url}`);
        next();
    });

    app.use(cors());
    app.use(express.json());

    app.use('/api', apiRoutes);

    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);

        const ONE_HOUR = 60 * 60 * 1000;
        setInterval(() => {
            console.log('[Cron] Triggering scheduled import...');
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
            triggerImport(urls).catch(err => console.error(err));
        }, ONE_HOUR);
    });

    // Socket.IO Setup
    const io = require('socket.io')(server, {
        cors: {
            origin: "*", // Allow all origins for simplicity
            methods: ["GET", "POST"]
        }
    });

    const worker = require('./src/queue/worker');

    worker.on('active', (job) => {
        console.log(`[Socket] Job ${job.id} active`);
        io.emit('import-update', { type: 'started', runId: job.data.runId });
    });

    worker.on('completed', (job, result) => {
        console.log(`[Socket] Job ${job.id} completed`);
        io.emit('import-update', { type: 'completed', runId: job.data.runId, metrics: result });
    });

    worker.on('failed', (job, err) => {
        console.log(`[Socket] Job ${job.id} failed`);
        io.emit('import-update', { type: 'failed', runId: job.data.runId, error: err.message });
    });
};

startServer();
