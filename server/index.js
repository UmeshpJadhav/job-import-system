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
        const FEED_URLS = require('./src/config/feeds');

        setInterval(async () => {
            console.log('[Cron] Triggering scheduled import...');
            for (const url of FEED_URLS) {
                try {
                    await triggerImport(url, url);
                } catch (err) {
                    console.error(`[Cron] Failed to trigger ${url}:`, err.message);
                }
            }
        }, ONE_HOUR);
    });

    const io = require('socket.io')(server, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    const worker = require('./src/queue/worker');

    worker.on('active', (job) => {
        console.log(`[Socket] Job ${job.id} active`);
        io.emit('import-update', { type: 'started', runId: job.data.runId, importName: job.data.url });
    });

    worker.on('progress', (job, progress) => {
        io.emit('import-update', { type: 'progress', runId: job.data.runId, progress });
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
