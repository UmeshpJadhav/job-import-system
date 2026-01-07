const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        index: true 
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
        type: String 
    },
    sourceUrl: {
        type: String,
        required: true,
        unique: true 
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
