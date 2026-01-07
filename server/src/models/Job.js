const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        index: true // Basic search
    },
    company: {
        type: String,
        default: 'Unknown'
    },
    location: {
        type: String,
    },
    description: {
        type: String,
    },
    type: {
        type: String // Full-time, Contract, etc.
    },
    sourceUrl: {
        type: String,
        required: true,
        unique: true // CRITICAL: Ensures no duplicates, enables efficient upsert
    },
    postedDate: {
        type: Date,
        default: Date.now
    },
    salary: {
        type: String
    },
    categories: [String],
    importedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

JobSchema.index({ postedDate: -1 });

module.exports = mongoose.model('Job', JobSchema);
