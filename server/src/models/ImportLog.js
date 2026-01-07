const mongoose = require('mongoose');

const ImportLogSchema = new mongoose.Schema({
    runId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    importName: {
        type: String,
        default: 'General Import'
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    metrics: {
        totalFetched: { type: Number, default: 0 },
        totalImported: { type: Number, default: 0 },
        newJobs: { type: Number, default: 0 },
        updatedJobs: { type: Number, default: 0 },
        failedJobs: { type: Number, default: 0 }
    },
    failureLogs: [{
        message: String,
        timestamp: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('ImportLog', ImportLogSchema, 'import_logs');
